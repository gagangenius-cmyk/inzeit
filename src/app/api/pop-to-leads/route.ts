import { NextRequest, NextResponse } from 'next/server';
import { type CreationAttributes } from 'sequelize';
import { CrmcForumLeads } from '@/models/CrmcForumLeads';
import { checkForDuplicate } from '@/lib/duplicateLeadCheck';
import { logLeadRemark } from '@/lib/leadRemarks';
import { resolveLeadReferenceId } from '@/lib/leadReferenceResolver';
import { resolveBranchReference } from '@/lib/branchResolver';
import { checkRateLimit, recordFailedAttempt, getClientIp } from '@/lib/rateLimiter';

// Public, unauthenticated intake endpoint (called cross-origin from the
// marketing site) — throttle per source IP so it can't be used to flood the
// leads table, since there's no auth to rate-limit by user.
const INTAKE_RATE_LIMIT = { windowMs: 10 * 60 * 1000, maxAttempts: 20 };

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.POPTOLEAD_ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return json({
    success: true,
    endpoint: '/api/poptolead',
    method: 'POST',
    requiredFields: ['lastName or your-name', 'email or your-email', 'phone or phonetext-718'],
    acceptsSalesforcePayload: true,
    acceptsContactForm7Payload: true,
    optionalFields: {
      branch: 'Branch name, abbreviation, or city; defaults to Dubai when omitted',
      DestinationCountry: 'Matches crm_country_proces.name/id',
      ImmigrationType: 'Matches crm_service.name/id',
      LeadSource: 'Matches crm_source.name/id',
      ResidentCountry: 'Stored as nationality/address text',
    },
    storesReferenceIds: {
      country_interest: 'crm_country_proces.id',
      service_interest: 'crm_service.id',
      market_source: 'crm_source.id',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = `pop-to-leads:${getClientIp(request)}`;
    const rateLimit = checkRateLimit(rateLimitKey, INTAKE_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return json({ success: false, error: 'Too many submissions. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }
    recordFailedAttempt(rateLimitKey, INTAKE_RATE_LIMIT);

    const data = await request.json() as Record<string, unknown>;

    const fullName = readField(data, ['lastName', 'your-name', 'name', 'fullName']);
    const email = readField(data, ['email', 'your-email']);
    const phone = readField(data, ['phone', 'phonetext-718', 'mobile']);

    if (!fullName || !email || !phone) {
      return json(
        {
          success: false,
          error: 'Missing required lead fields',
          requiredFields: ['lastName or your-name', 'email or your-email', 'phone or phonetext-718'],
        },
        { status: 400 }
      );
    }

    const [fname, ...lastNameParts] = fullName.split(/\s+/);
    const lname = lastNameParts.join(' ') || fullName;
    const ageRange = readField(data, ['AgeRange', 'menu-359']);
    const immigrationType = readField(data, ['ImmigrationType', 'menu-55692']);
    const branchInput = readField(data, ['Branch', 'branch', 'menu-404']);
    const residentCountry = readField(data, ['ResidentCountry', 'residentCountry'], 'UAE');
    const utmSource = readField(data, ['UTMSource', 'utm_source'], 'Website Popup');
    const education = readField(data, ['Education', 'menu-35926']);
    const destinationCountry = readField(data, ['DestinationCountry', 'menu-3065']);
    const leadSource = readField(data, ['LeadSource', 'leadSource'], 'SEO Leads (English)');
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

    // Destination country text from the popup form isn't guaranteed to match a
    // crm_country_proces row (e.g. "Not specified") — a miss here shouldn't
    // block lead creation.
    try {
      countryInterestId = await resolveLeadReferenceId('country_interest', destinationCountry || null);
    } catch {
      countryInterestId = null;
    }

    try {
      marketSourceId = await resolveLeadReferenceId('market_source', leadSource || null);
    } catch (error) {
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid lead reference value',
          referenceTables: {
            market_source: 'crm_source',
          },
        },
        { status: 422 }
      );
    }

    // The immigration-type text the popup form sends doesn't have to match a
    // crm_service row exactly (e.g. "Canada PR" isn't a program name on file) —
    // unlike source, a miss here shouldn't block lead creation.
    try {
      serviceInterestId = await resolveLeadReferenceId('service_interest', immigrationType || null);
    } catch {
      serviceInterestId = null;
    }

    const duplicateCheck = await checkForDuplicate({ phone, email });

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
      enquiry: immigrationType || 'Website popup lead enquiry',
      convet: 'New',
      priority: 'Medium',
      regdate: now,
      regtime: time,
      last_updated: now.toISOString().slice(0, 10),
      last_updtd_time: time,
      stepComplete: 1,
      payType: null,
      // New leads enter unassigned; a FOE/Branch Manager/CEO assigns them afterward.
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
      campaign: utmSource,
      campaign_group: '',
      pa_fname: '',
      pa_lname: '',
      lead_remark: buildRemark({
        Source: utmSource,
        'Lead Source': leadSource,
        Branch: branchInput,
        'Resident Country': residentCountry,
        'Age Range': ageRange,
        Education: education,
        'Immigration Type': immigrationType,
        Destination: destinationCountry,
      }),
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

    // The Opportunity Flow's "Service Requirements" panel reads from
    // crm_remarks (not the lead row's own lead_remark column), so without this
    // a popup-form lead always showed up there with no activity at all.
    await logLeadRemark({
      leadId: lead.id,
      action: 'lead_created',
      remark: buildRemark({
        Source: utmSource,
        'Lead Source': leadSource,
        Branch: branchInput,
        'Service Interest': immigrationType,
        'Destination Country': destinationCountry,
        'Resident Country': residentCountry,
      }) || 'Lead created via website popup form.',
      actorRole: 'web_lead',
    });

    return json(
      {
        success: true,
        leadId: lead.id,
        assignedTo: null,
        branchId: branch.id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating popup-form lead:', error);
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
