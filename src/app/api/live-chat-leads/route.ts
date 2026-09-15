import { NextRequest, NextResponse } from 'next/server';
import { type CreationAttributes } from 'sequelize';
import { CrmcForumLeads } from '@/models/CrmcForumLeads';
import { checkForDuplicate } from '@/lib/duplicateLeadCheck';
import { logLeadRemark } from '@/lib/leadRemarks';
import { resolveLeadReferenceId } from '@/lib/leadReferenceResolver';
import { resolveBranchReference } from '@/lib/branchResolver';
import { checkRateLimit, recordFailedAttempt, getClientIp } from '@/lib/rateLimiter';

// Public, unauthenticated intake endpoint (called cross-origin from the
// marketing site/live chat widget) — throttle per source IP so it can't be
// used to flood the leads table, since there's no auth to rate-limit by user.
const INTAKE_RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxAttempts: 20 };

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.LIVE_CHAT_TO_LEADS_ALLOWED_ORIGIN || process.env.WEB_TO_LEADS_ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

const allowedLiveChatSources = ['Livechat - SEO', 'Livechat - Google Ads'] as const;

const json = (body: unknown, init?: ResponseInit) => (
  NextResponse.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers || {}),
    },
  })
);

const firstValue = (value: unknown): string => {
  if (Array.isArray(value)) return firstValue(value[0]);
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const readField = (data: Record<string, unknown>, keys: string[], fallback = ''): string => {
  for (const key of keys) {
    const value = firstValue(data[key]);
    if (value) return value;
  }

  return fallback;
};

const buildRemark = (parts: Record<string, string>) => (
  Object.entries(parts)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
);

const normalizeLiveChatSource = (source: string): typeof allowedLiveChatSources[number] | null => {
  const normalized = source.toLowerCase().replace(/[\s_-]+/g, ' ').trim();

  if (['livechat seo', 'live chat seo', 'seo'].includes(normalized)) return 'Livechat - SEO';
  if (['livechat google ads', 'live chat google ads', 'google ads', 'google'].includes(normalized)) {
    return 'Livechat - Google Ads';
  }

  return null;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return json({
    success: true,
    endpoint: '/api/live-chat-leads',
    method: 'POST',
    requiredFields: ['name or fullName', 'email', 'phone', 'source'],
    optionalFields: {
      branch: 'Branch name, abbreviation, or city; defaults to Dubai when omitted',
      DestinationCountry: 'Matches crm_country_proces.name/id',
      ImmigrationType: 'Matches crm_service.name/id',
      ResidentCountry: 'Stored as nationality/address text',
      chatId: 'Stored in lead remarks',
      transcript: 'Stored in lead remarks',
    },
    allowedSources: allowedLiveChatSources,
    storesReferenceIds: {
      country_interest: 'crm_country_proces.id',
      service_interest: 'crm_service.id',
      market_source: 'crm_source.id',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = `live-chat-leads:${getClientIp(request)}`;
    const rateLimit = checkRateLimit(rateLimitKey, INTAKE_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return json({ success: false, error: 'Too many submissions. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }
    recordFailedAttempt(rateLimitKey, INTAKE_RATE_LIMIT);

    const data = await request.json() as Record<string, unknown>;

    const fullName = readField(data, ['name', 'fullName', 'your-name', 'lastName']);
    const email = readField(data, ['email', 'your-email']);
    const phone = readField(data, ['phone', 'mobile', 'phonetext-718']);
    const sourceInput = readField(data, ['source', 'Source', 'LeadSource', 'leadSource']);
    const leadSource = normalizeLiveChatSource(sourceInput);

    if (!fullName || !email || !phone || !leadSource) {
      return json(
        {
          success: false,
          error: 'Missing or invalid live chat lead fields',
          requiredFields: ['name or fullName', 'email', 'phone', 'source'],
          allowedSources: allowedLiveChatSources,
        },
        { status: 400 }
      );
    }

    const [fname, ...lastNameParts] = fullName.split(/\s+/);
    const lname = lastNameParts.join(' ') || fullName;
    const ageRange = readField(data, ['AgeRange', 'ageRange', 'age']);
    const immigrationType = readField(data, ['ImmigrationType', 'immigrationType', 'service', 'Service']);
    const branchInput = readField(data, ['Branch', 'branch']);
    const residentCountry = readField(data, ['ResidentCountry', 'residentCountry', 'nationality'], 'UAE');
    const education = readField(data, ['Education', 'education']);
    const destinationCountry = readField(data, ['DestinationCountry', 'destinationCountry', 'countryInterest']);
    const chatId = readField(data, ['chatId', 'chat_id', 'conversationId', 'conversation_id']);
    const transcript = readField(data, ['transcript', 'chatTranscript', 'message', 'notes']);
    // Branch wins if the form sent one we recognize. Otherwise, prefer the
    // visitor's own resident country when it matches a branch we operate in
    // (Qatar/Kuwait/India each have exactly one) instead of silently dropping
    // a Qatar/Kuwait enquiry onto the Dubai team.
    const branch = await resolveBranchReference(branchInput, residentCountry, 'Dubai') || { id: 1, region: 1 };
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    let countryInterestId: number | null = null;
    let serviceInterestId: number | null = null;
    let marketSourceId: number | null = null;

    try {
      countryInterestId = await resolveLeadReferenceId('country_interest', destinationCountry || null);
      marketSourceId = await resolveLeadReferenceId('market_source', leadSource);
    } catch (error) {
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid lead reference value',
          referenceTables: {
            country_interest: 'crm_country_proces',
            market_source: 'crm_source',
          },
        },
        { status: 422 }
      );
    }

    // The immigration-type text the widget sends doesn't have to match a
    // crm_service row exactly (e.g. "Canada PR" isn't a program name on file) —
    // unlike country/source, a miss here shouldn't block lead creation since
    // the raw text is preserved in the lead remark below regardless.
    try {
      serviceInterestId = await resolveLeadReferenceId('service_interest', immigrationType || null);
    } catch {
      serviceInterestId = null;
    }

    const duplicateCheck = await checkForDuplicate({ phone, email });
    const leadRemark = buildRemark({
      Source: leadSource,
      Branch: branchInput,
      'Resident Country': residentCountry,
      'Age Range': ageRange,
      Education: education,
      'Immigration Type': immigrationType,
      Destination: destinationCountry,
      'Chat ID': chatId,
      Transcript: transcript,
    });

    const leadPayload = {
      fname: fname || fullName,
      mname: '',
      lname,
      email,
      phone,
      mobile: phone,
      nationality: residentCountry,
      address: residentCountry,
      dob: null,
      gender: '',
      id_number: '',
      id_expiry: now,
      id_issue_date: now,
      country_interest: countryInterestId,
      sub_country_interest: 0,
      service_interest: serviceInterestId,
      market_source: marketSourceId,
      sub_market_source: 0,
      appointment: null,
      followup: now,
      folowuptime: time,
      followupstat: 0,
      enquiry: immigrationType || 'Live chat lead enquiry',
      convet: 'New',
      priority: 'Medium',
      regdate: now,
      regtime: time,
      last_updated: now.toISOString().slice(0, 10),
      last_updtd_time: time,
      stepComplete: 1,
      payType: null,
      assignTo: null,
      case_officer: null,
      Counsilor: null,
      branch: branch.id,
      region: branch.region || 1,
      payTotal: 0,
      discount: 0,
      paidYet: 0,
      payBalance: 0,
      feeAgreeDate: null,
      demandAmt: 0,
      dueDate: null,
      demdRemark: null,
      agreeDate: null,
      renDate: null,
      renExpiryDate: null,
      renew_type: null,
      // Always unassigned (assignTo: null above) — 'untouched' so it's
      // findable separately from a 'New' lead someone already owns.
      status: 'untouched',
      status_date: now,
      notf: 0,
      type: 'lead',
      password: null,
      novat: 0,
      i_p: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
      escalation: null,
      transfer_date: null,
      transfer_time: time,
      transfered: 0,
      transfered_by: 1,
      otp_status: 0,
      otp: null,
      otp_date: null,
      otp_email: null,
      browser: request.headers.get('user-agent') || '',
      hostname: request.headers.get('host') || '',
      digital_signature: null,
      lead_import_by: null,
      lead_import: 0,
      education,
      profession: '',
      exist: 0,
      no_of_applicants: 1,
      advanced: 0,
      do_status: 0,
      arm_status: 0,
      gm_status: 0,
      discount_status: 0,
      discount_remarks: '',
      discount_by: 1,
      discount_date: now,
      campaign: leadSource,
      campaign_group: 'Live Chat',
      pa_fname: '',
      pa_lname: '',
      lead_remark: leadRemark || 'Lead created via live chat.',
      created: now,
      created_by: 1,
      alert: 0,
      area: branchInput,
      lead_quality: 'Warm',
      transferred_remark_update: 0,
      untouch_transfer: 0,
      lead_nq_reason: '',
      tele_caller_alert: 0,
      tele_caller_remark: '',
      tele_caller_remark_by: 1,
      tele_date: now,
      lead_date: now,
      duplicate: duplicateCheck.isDuplicate ? 1 : 0,
      duplicate_count: duplicateCheck.duplicateCount,
      ref_remark: '',
      na_record: 0,
      old_assgined: 0,
      nal_count: 0,
      campaign_id: 0,
      old_branch: 0,
      sf: 0,
    } as unknown as CreationAttributes<CrmcForumLeads>;

    const lead = await (CrmcForumLeads as any).create(leadPayload);

    await logLeadRemark({
      leadId: lead.id,
      action: 'lead_created',
      remark: leadRemark || 'Lead created via live chat.',
      actorRole: 'live_chat',
    });

    return json(
      {
        success: true,
        leadId: lead.id,
        assignedTo: null,
        branchId: branch.id,
        source: leadSource,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating live chat lead:', error);
    return json(
      {
        success: false,
        error: 'Internal server error',
        message,
      },
      { status: 500 }
    );
  }
}
