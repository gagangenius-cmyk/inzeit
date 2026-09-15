import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isFoeOrBranchManagerOrCeo, isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { logLeadRemark } from '@/lib/leadRemarks';
import { resolveLeadReferenceId } from '@/lib/leadReferenceResolver';
import { resolveBranchReference } from '@/lib/branchResolver';
import { CrmcFollowUpReminders } from '@/models/CrmcFollowUpReminders';
import { ensureClientActualNameColumn } from '@/lib/ensureClientActualNameColumn';
import { isFinanceAndComplianceApproved, APPROVAL_REQUIRED_ERROR, CLIENT_STATUS_VALUES } from '@/lib/opportunityApprovalGate';
import { CACHE_TAGS, invalidateReportCaches } from '@/lib/reportCache';

let dbInitialized = false;

const ensureDBConnection = async () => {
  if (!dbInitialized) {
    await connectDB();
    dbInitialized = true;
  }
};

const editableFields = new Set([
  'fname',
  'mname',
  'lname',
  'email',
  'phone',
  'mobile',
  'whatsapp_number',
  'nationality',
  'address',
  'dob',
  'gender',
  'country_interest',
  'service_interest',
  'market_source',
  'appointment',
  'followup',
  'folowuptime',
  'followupstat',
  'priority',
  'status',
  'assignTo',
  'branch',
  'region',
  'payTotal',
  'discount',
  'paidYet',
  'payBalance',
  'lead_remark',
  'lead_quality',
  'area',
  'opportunity_status',
  'opportunity_stage',
  'salutation',
  'suffix',
  'state',
  'postal_code',
  'age',
  'utm_source',
  'utm_medium',
  'gclid',
  're_enquiry',
  're_enquiry_counter',
  'call_attempt_1',
  'call_back_attempts',
  'call_attempts_deadline',
  'watnot_bot',
  'roundrobin',
  'whatsapp',
  'id_number',
  'client_actual_name'
]);

const aliases: Record<string, string> = {
  firstName: 'fname',
  middleName: 'mname',
  lastName: 'lname',
  whatsappNumber: 'whatsapp_number',
  street: 'address',
  dateOfBirth: 'dob',
  genderIdentity: 'gender',
  countryInterest: 'country_interest',
  serviceInterest: 'service_interest',
  programCountry: 'country_interest',
  program: 'service_interest',
  leadSource: 'market_source',
  leadOwner: 'assignTo',
  branchId: 'branch',
  notes: 'lead_remark',
  leadQuality: 'lead_quality',
  city: 'area',
  country: 'nationality',
  prospectFollowUp: 'followup',
  postalCode: 'postal_code',
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  gclId: 'gclid',
  reEnquiry: 're_enquiry',
  reEnquiryCounter: 're_enquiry_counter',
  callAttempt1: 'call_attempt_1',
  callBackAttempts: 'call_back_attempts',
  callAttemptsDeadline: 'call_attempts_deadline',
  watnotBot: 'watnot_bot',
  passportNumber: 'id_number',
  clientActualName: 'client_actual_name'
};

const nullableUpdateFields = new Set([
  'dob',
  'appointment',
  'feeAgreeDate',
  'dueDate',
  'agreeDate',
  'renDate',
  'renExpiryDate',
  'next_followup_date',
  'conversion_date',
  'payType',
  'demdRemark',
  'renew_type',
  'opportunity_status',
  'conversion_reason',
  'lost_reason',
  'competitor',
  'budget_range',
  'timeline',
  'decision_maker',
  'decision_maker_title',
  'decision_maker_contact',
  'opportunity_notes',
  'tags',
  'salutation',
  'suffix',
  'state',
  'postal_code',
  'age',
  'utm_source',
  'utm_medium',
  'gclid',
  'call_attempt_1',
  'call_attempts_deadline',
  'assignTo',
]);

const dateOnlyFields = new Set([
  'dob',
  'appointment',
  'followup',
  'feeAgreeDate',
  'dueDate',
  'agreeDate',
  'renDate',
  'renExpiryDate',
  'next_followup_date',
  'conversion_date',
]);

// These come from <input type="datetime-local"> and need the full
// timestamp preserved (unlike dateOnlyFields above, which are backed by
// DATE columns and intentionally truncated).
const dateTimeFields = new Set([
  'call_attempt_1',
  'call_attempts_deadline',
]);

function normalizeLeadUpdateValue(key: string, value: unknown): unknown {
  if (value === '') {
    return nullableUpdateFields.has(key) ? null : '';
  }

  if (typeof value === 'string' && dateOnlyFields.has(key)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return nullableUpdateFields.has(key) ? null : value;
    }
    return date.toISOString().slice(0, 10);
  }

  if (typeof value === 'string' && dateTimeFields.has(key)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return nullableUpdateFields.has(key) ? null : value;
    }
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  return value;
}

function validateLeadUpdate(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const hasIdentityFields = 'firstName' in data || 'fname' in data || 'lastName' in data || 'lname' in data ||
    'gender' in data || 'genderIdentity' in data;

  if (hasIdentityFields) {
    const namePattern = /^[\p{L}][\p{L}\s.'-]*$/u;
    const firstName = String(data.firstName ?? data.fname ?? '').trim();
    const lastName = String(data.lastName ?? data.lname ?? '').trim();

    if (!namePattern.test(firstName)) errors.push('Enter a valid first name.');
    if (!namePattern.test(lastName)) errors.push('Enter a valid last name.');

    // Gender identity is intentionally optional here, same as
    // on creation (see migrations/20260709_nullable_interest_source_on_creation.sql) —
    // requiring them on every edit (this identity-field bundle is sent on
    // every save from the Edit Lead form) forced counselors to pick something
    // just to get past validation, defeating the point of leaving them null
    // until a real interest is known.

    if (data.dateOfBirth ?? data.dob) {
      const dob = new Date(String(data.dateOfBirth ?? data.dob));
      if (Number.isNaN(dob.getTime()) || dob > new Date()) errors.push('Date of birth must be a valid past date.');
    }
  }

  // Validated independently of the identity-field bundle above and only when
  // actually present in the request — a counselor's edit omits email/phone
  // entirely (contact info is Branch Manager/CEO only), and validating a
  // field that was never sent would incorrectly fail against ''.
  if ('email' in data) {
    const email = String(data.email ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
  }
  if ('phone' in data) {
    const phone = String(data.phone ?? '').replace(/\D/g, '');
    if (phone.length < 7 || phone.length > 15) errors.push('Enter a valid phone number with 7 to 15 digits.');
  }

  return errors;
}

const fetchLead = async (id: string) => {
  const rows = await sequelize.query(`
    SELECT
      l.*,
      e1.name as assigned_to_name,
      e2.name as counselor_name,
      b.branch as branch_name,
      b.name as branch_legal_name,
      b.ar_name as branch_name_ar,
      b.address as branch_address,
      b.email as branch_email,
      b.mobile as branch_mobile,
      b.license_number as branch_license_number,
      b.vat_gst_percent as branch_vat_gst_percent,
      b.abbrv as branch_abbrv,
      COALESCE(s.name, pt.type, l.service_interest) as service_interest_label,
      s.validity as program_validity,
      COALESCE(cp.name, l.country_interest) as country_interest_label,
      (SELECT a.agreementNumber FROM crm_opportunity_agreements a
       JOIN crm_opportunities o ON a.opportunityId = o.id
       WHERE o.leadId = l.id ORDER BY a.createdAt DESC LIMIT 1) AS agreement_number
    FROM crm_forum_leads l
    LEFT JOIN crm_employee e1 ON l.assignTo = e1.id
    LEFT JOIN crm_employee e2 ON l.Counsilor = e2.id
    LEFT JOIN crm_branch b ON l.branch = b.id
    LEFT JOIN crm_service s ON s.id = CAST(l.service_interest AS UNSIGNED)
    LEFT JOIN crm_program_type pt ON pt.id = CAST(l.service_interest AS UNSIGNED)
    LEFT JOIN crm_country_proces cp ON cp.id = CAST(l.country_interest AS UNSIGNED)
    WHERE l.id = ?
    LIMIT 1
  `, {
    replacements: [id],
    type: QueryTypes.SELECT
  });

  const lead = rows[0] as Record<string, unknown> | undefined;
  if (!lead) return null;

  return {
    ...lead,
    dmEmployeeByASSIGNTo: lead.assigned_to_name ? { id: lead.assignTo, name: lead.assigned_to_name } : null,
    dmEmployeeByCoUNSILOR: lead.counselor_name ? { id: lead.Counsilor, name: lead.counselor_name } : null,
    dmBranch: lead.branch_name ? {
      id: lead.branch,
      name: lead.branch_name,
      legalName: lead.branch_legal_name,
      nameAr: lead.branch_name_ar,
      address: lead.branch_address,
      email: lead.branch_email,
      mobile: lead.branch_mobile,
      licenseNumber: lead.branch_license_number,
      vatGstPercent: lead.branch_vat_gst_percent,
      abbrv: lead.branch_abbrv
    } : null
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDBConnection();
    const { id } = await params;
    const lead = await fetchLead(id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['leads.update', 'leads.create']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDBConnection();
    await ensureClientActualNameColumn();
    const { id } = await params;
    const data = await request.json();

    const validationErrors = validateLeadUpdate(data);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: 'Lead validation failed', errors: validationErrors }, { status: 422 });
    }

    // Assigning/reassigning a lead's owner is restricted to FOE, Branch
    // Manager, or CEO — everyone else with leads.update can still edit their
    // own lead's other fields, just not hand it to someone else. The Edit
    // Lead form posts this field as `leadOwner` (aliased to `assignTo` below),
    // not `assignTo`/`Counsilor` directly, so it must be checked here too or
    // this guard never fires for the form's actual requests.
    const touchesAssignment = data.assignTo !== undefined || data.Counsilor !== undefined || data.leadOwner !== undefined;
    if (touchesAssignment && !isFoeOrBranchManagerOrCeo(auth)) {
      return NextResponse.json({ error: 'Only FOE, Branch Manager, or CEO can assign leads' }, { status: 403 });
    }

    // Branch Manager/FOE may only hand a lead to someone in their own branch —
    // the assign-modal UI already filters its employee list to the caller's
    // branch, but that's client-side only. Enforce it here too so it can't be
    // bypassed by calling this endpoint directly with an out-of-branch employee id.
    if (touchesAssignment && !isCeo(auth)) {
      const targetEmployeeId = Number(data.assignTo ?? data.Counsilor ?? data.leadOwner);
      if (targetEmployeeId) {
        const [targetRow] = await sequelize.query<{ branch: number | null }>(
          'SELECT branch FROM crm_employee WHERE id = :id LIMIT 1',
          { replacements: { id: targetEmployeeId }, type: QueryTypes.SELECT }
        );
        const targetBranch = targetRow?.branch ?? null;
        if (Number(targetBranch) !== Number(auth.branch)) {
          return NextResponse.json({ error: 'You can only assign leads to employees in your own branch' }, { status: 403 });
        }
      }
    }

    // Once a lead is in the CRM, its contact details are locked to counselors -
    // only Branch Manager or CEO can change email/phone/WhatsApp number, to
    // prevent a lead's contact info from being altered after intake.
    const touchesContactInfo = data.email !== undefined || data.phone !== undefined
      || data.whatsappNumber !== undefined || data.mobile !== undefined;
    if (touchesContactInfo && !isBranchManagerOrCeo(auth)) {
      return NextResponse.json({ error: 'Only Branch Manager or CEO can change a lead\'s email, phone, or WhatsApp number' }, { status: 403 });
    }

    const existingLead = await fetchLead(id);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Branch Manager may update leads/clients in their own branch only; CEO
    // (and every other leads.update holder, e.g. a counselor on their own
    // lead) is unaffected by this check - it exists specifically to stop a
    // Branch Manager correcting/editing another branch's record, which today
    // nothing prevents.
    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const leadBranch = Number((existingLead as Record<string, unknown>).branch);
      if (leadBranch !== Number(auth.branch || 0)) {
        return NextResponse.json({ error: 'You can only update leads/clients in your own branch' }, { status: 403 });
      }
    }

    // Any of these values is enough, on its own, for CLIENT_STATUS_SQL (see
    // GET above) to treat this lead as a fully retained Client elsewhere in
    // the app — so setting them here must not be possible without the same
    // Accounts + Compliance sign-off the wizard's own "Close / Mark Won"
    // button already requires client-side. Ordinary edits (name, phone,
    // notes, etc.) are unaffected.
    const requestsClientStatus = typeof data.status === 'string' && CLIENT_STATUS_VALUES.has(data.status.toLowerCase());
    const requestsWonOpportunity = typeof data.opportunity_status === 'string' && data.opportunity_status.toLowerCase() === 'won';
    if (requestsClientStatus || requestsWonOpportunity) {
      const [linkedOpportunity] = await sequelize.query<{ id: number }>(
        'SELECT id FROM crm_opportunities WHERE leadId = :leadId ORDER BY id DESC LIMIT 1',
        { replacements: { leadId: id }, type: QueryTypes.SELECT },
      );
      const approved = await isFinanceAndComplianceApproved(linkedOpportunity?.id);
      if (!approved) {
        return NextResponse.json({ error: APPROVAL_REQUIRED_ERROR }, { status: 409 });
      }
    }

    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    for (const [rawKey, value] of Object.entries(data)) {
      const key = aliases[rawKey] || rawKey;
      if (key === 'id' || !editableFields.has(key) || value === undefined) continue;
      updateFields.push(`${key} = ?`);
      const normalizedValue = normalizeLeadUpdateValue(key, value);
      if (key === 'country_interest' || key === 'service_interest' || key === 'market_source') {
        try {
          updateValues.push(await resolveLeadReferenceId(key, normalizedValue));
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Invalid lead reference value' },
            { status: 422 }
          );
        }
      } else if (key === 'branch') {
        const branch = await resolveBranchReference(normalizedValue);
        if (!branch) {
          return NextResponse.json(
            { error: `No matching branch found for "${String(normalizedValue).trim()}"` },
            { status: 422 }
          );
        }
        updateValues.push(branch.id);
      } else {
        updateValues.push(normalizedValue);
      }
    }

    // The Edit Lead form's "Prospect Follow-Up" field posts one datetime-local
    // value as `prospectFollowUp` (aliased to `followup` above), but `followup`
    // is a DATE column - normalizeLeadUpdateValue already truncates it to a
    // date for that column, silently dropping the time. Split the same input
    // onto `folowuptime` (the paired TIME column) too, same as what the "Add
    // Follow-up" popup sends, so the time the user picked isn't lost.
    let followUpReminder: { date: string; time: string } | null = null;
    if (typeof data.prospectFollowUp === 'string' && data.prospectFollowUp.includes('T')) {
      const [datePart, timePart] = data.prospectFollowUp.split('T');
      if (datePart && timePart) {
        const timeWithSeconds = timePart.length === 5 ? `${timePart}:00` : timePart;
        updateFields.push('folowuptime = ?');
        updateValues.push(timeWithSeconds);
        followUpReminder = { date: datePart, time: timeWithSeconds };
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No editable lead fields provided' }, { status: 400 });
    }

    // Only stamp the transfer/assignment date when assignTo actually changes to a
    // different employee — re-saving the same assignee (e.g. from an unrelated
    // field edit) must not reset the "assigned since" date. The UI posts this as
    // `leadOwner` (see aliases above), so that must be checked too, not just the
    // raw `assignTo`/`Counsilor` field names.
    const incomingAssignTo = data.assignTo ?? data.leadOwner ?? data.Counsilor;
    let assignmentChange: { oldAssignTo: number | null; newAssignTo: number | null } | null = null;
    if (incomingAssignTo !== undefined) {
      const newAssignTo = incomingAssignTo === '' || incomingAssignTo === null ? null : Number(incomingAssignTo);
      const existingAssignTo = (existingLead as Record<string, unknown>).assignTo;
      const oldAssignTo = existingAssignTo !== null && existingAssignTo !== undefined
        ? Number(existingAssignTo as never)
        : null;
      if (newAssignTo !== oldAssignTo) {
        updateFields.push('transfer_date = ?', 'transfer_time = ?', 'transfered = ?', 'transfered_by = ?');
        updateValues.push(new Date(), new Date().toTimeString().split(' ')[0], 1, auth.id);
        assignmentChange = { oldAssignTo, newAssignTo };
      }
    }

    const incomingStatus = typeof data.status === 'string' ? data.status : undefined;
    const existingStatus = (existingLead as Record<string, unknown>).status as string | null;
    const statusChanged = incomingStatus !== undefined && incomingStatus !== existingStatus;

    // The Edit Lead form's "Notes" field posts as `notes` (aliased to
    // lead_remark above) and, until now, only ever overwrote that single
    // column - it never reached crm_forum_leads_remarks, which is what the
    // leads list's "latest remark" column and the View Lead remarks history
    // actually read from. Treat a genuine, changed Notes entry as a real
    // remark so it shows up in both places, same as the "Add Remark" popup.
    const incomingNotes = typeof data.notes === 'string' ? data.notes.trim() : undefined;
    const existingRemark = String((existingLead as Record<string, unknown>).lead_remark || '').trim();
    const notesChanged = incomingNotes !== undefined && incomingNotes !== '' && incomingNotes !== existingRemark;

    // crm_forum_leads.followup/folowuptime aren't read by the dashboard's
    // "Today's Follow-ups" widget or the View Lead popup's Follow-ups panel -
    // those both read crm_follow_up_reminders, which only ever got written by
    // the "Add Follow-up" popup. Create a reminder here too when the Edit Lead
    // form actually changes the follow-up date/time, so it surfaces there too.
    const existingFollowupDate = (existingLead as Record<string, unknown>).followup
      ? String((existingLead as Record<string, unknown>).followup).slice(0, 10)
      : null;
    const existingFollowupTime = (existingLead as Record<string, unknown>).folowuptime
      ? String((existingLead as Record<string, unknown>).folowuptime).slice(0, 8)
      : null;
    const followUpChanged = !!followUpReminder
      && (followUpReminder.date !== existingFollowupDate || followUpReminder.time !== existingFollowupTime);

    updateFields.push('last_updated = ?', 'last_updtd_time = ?');
    updateValues.push(new Date().toLocaleDateString(), new Date().toTimeString().split(' ')[0], id);

    await sequelize.query(`
      UPDATE crm_forum_leads
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, {
      replacements: updateValues,
      type: QueryTypes.UPDATE
    });

    // auth.name isn't encoded in the JWT (see generateToken in lib/auth.ts), so
    // it's always undefined on the decoded token — look the actor's name up.
    const [actorRow] = await sequelize.query<{ name: string }>(
      'SELECT name FROM crm_employee WHERE id = :id LIMIT 1',
      { replacements: { id: auth.id }, type: QueryTypes.SELECT }
    );
    const actorLabel = `${actorRow?.name || `Employee #${auth.id}`} (${auth.roleName || auth.type})`;

    if (notesChanged) {
      const now = new Date();
      await sequelize.query(
        `INSERT INTO crm_forum_leads_remarks (\`lead\`, \`date\`, remark, emp, created, \`status\`)
         VALUES (?, ?, ?, ?, ?, ?)`,
        {
          replacements: [id, now.toISOString().split('T')[0], incomingNotes, auth.id, now.toTimeString().split(' ')[0], 1],
          type: QueryTypes.INSERT
        }
      );
    }

    if (followUpChanged && followUpReminder) {
      const existingAssignTo = (existingLead as Record<string, unknown>).assignTo;
      const targetEmployeeId = Number(data.leadOwner ?? data.assignTo ?? existingAssignTo ?? auth.id);
      await CrmcFollowUpReminders.create({
        lead_id: Number(id),
        user_id: targetEmployeeId,
        reminder_date: new Date(`${followUpReminder.date}T${followUpReminder.time}`),
        message: incomingNotes || 'Prospect follow-up scheduled',
        priority: 'medium',
        status: 'pending',
      });
    }

    if (assignmentChange) {
      const { oldAssignTo, newAssignTo } = assignmentChange;
      const employeeIds = [oldAssignTo, newAssignTo].filter((v): v is number => v !== null);
      const employeeNames = employeeIds.length
        ? await sequelize.query<{ id: number; name: string }>(
            'SELECT id, name FROM crm_employee WHERE id IN (:ids)',
            { replacements: { ids: employeeIds }, type: QueryTypes.SELECT }
          )
        : [];
      const nameOf = (empId: number | null) =>
        empId === null ? 'Unassigned' : employeeNames.find((e) => e.id === empId)?.name || `Employee #${empId}`;

      await logLeadRemark({
        leadId: Number(id),
        action: 'lead_assigned',
        remark: `Lead assigned from ${nameOf(oldAssignTo)} to ${nameOf(newAssignTo)} by ${actorLabel}`,
        previousValue: nameOf(oldAssignTo),
        newValue: nameOf(newAssignTo),
        actorId: auth.id,
        actorRole: auth.roleName || auth.type,
      });
    }

    if (statusChanged) {
      // incomingNotes is whatever remark the caller sent alongside the status
      // change (the Leads page's status popup requires one) - include it here
      // so it's the crm_remarks/activity-log entry itself, not just a generic
      // "Status changed from X to Y" line with the actual explanation lost.
      await logLeadRemark({
        leadId: Number(id),
        action: 'status_changed',
        remark: `Status changed from ${existingStatus || 'New'} to ${incomingStatus} by ${actorLabel}${incomingNotes ? `: ${incomingNotes}` : ''}`,
        previousValue: existingStatus || 'New',
        newValue: incomingStatus || null,
        actorId: auth.id,
        actorRole: auth.roleName || auth.type,
      });
    }

    // Edits here (status/priority/payTotal/assignTo/...) all feed dashboard
    // and report aggregates - unlike recordLeadAssignment's assignment-only
    // paths, this PUT can change any editable field in one request, so
    // invalidate unconditionally rather than trying to detect exactly which
    // fields changed.
    invalidateReportCaches([CACHE_TAGS.leads]);

    const updatedLead = await fetchLead(id);
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request, ['leads.delete']);
  if (isAuthError(auth)) return auth;
  if (!isCeo(auth)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }
  try {
    await ensureDBConnection();
    const { id } = await params;

    const existingLead = await fetchLead(id);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await sequelize.query('DELETE FROM crm_forum_leads WHERE id = ?', {
      replacements: [id],
      type: QueryTypes.DELETE
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
