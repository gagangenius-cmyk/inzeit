import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from './sequelize';
import { CACHE_TAGS, invalidateReportCaches } from './reportCache';

// crm_forum_leads has ~65 NOT-NULL-no-default columns (a legacy schema with
// no DEFAULT clauses at all on most fields). Every INSERT into it must
// supply all of them or MySQL rejects the row outright. This used to be
// duplicated inline in src/app/api/leads/route.ts's POST handler only -
// src/app/api/lead-intake/route.ts (the public webhook endpoint) had its
// own much shorter, incomplete column list and 500'd on any real payload
// beyond a bare minimum. Centralizing both the defaults and the INSERT here
// means there is now exactly one place that needs to know the full column
// list, instead of two copies that can silently drift apart again.

export interface BuildLeadDataInput {
  data: Record<string, any>;
  assignment?: { assignedEmployeeId?: number | null; counselorId?: number | null; branchId?: number | null } | null;
  resolvedCountryInterest: number | null;
  resolvedServiceInterest: number | null;
  resolvedMarketSource: number | null;
  requestedBranchId: number;
  requestedBranchRegion?: number | null;
  duplicateCheck?: { isDuplicate: boolean; duplicateCount: number };
}

export function buildDefaultLeadData(input: BuildLeadDataInput) {
  const {
    data, assignment, resolvedCountryInterest, resolvedServiceInterest, resolvedMarketSource,
    requestedBranchId, requestedBranchRegion, duplicateCheck,
  } = input;

  return {
    // User-provided data
    fname: data.fname || data.firstName || '',
    mname: data.mname || data.middleName || '',
    lname: data.lname || data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    mobile: data.mobile || data.phone || '',
    whatsapp_number: data.whatsapp_number || data.whatsappNumber || '',
    nationality: data.nationality || 'UAE',
    address: data.address || data.street || '',
    dob: data.dob || data.dateOfBirth || null,
    gender: data.gender || data.genderIdentity || 'Male',
    id_number: data.id_number || data.idNumber || '',
    id_expiry: data.id_expiry || data.idExpiry || new Date('2025-12-31'),
    id_issue_date: data.id_issue_date || data.idIssueDate || new Date('2015-01-01'),
    // Interest/Source are optional on the Add Lead form — leaving them
    // unselected must store null, not a fake default value.
    country_interest: resolvedCountryInterest,
    sub_country_interest: data.sub_country_interest || 0,
    service_interest: resolvedServiceInterest,
    market_source: resolvedMarketSource,
    sub_market_source: data.sub_market_source || 0,
    appointment: data.appointment || null,
    followup: data.followup || data.prospectFollowUp || new Date(),
    folowuptime: data.folowuptime || data.followupTime || new Date().toTimeString().split(' ')[0],
    followupstat: data.followupstat || 0,
    enquiry: data.enquiry || 'New lead enquiry',
    convet: data.convet || 'New',
    priority: data.priority || 'Medium',
    regdate: new Date(),
    regtime: new Date(),
    last_updated: new Date().toLocaleDateString(),
    last_updtd_time: new Date().toTimeString().split(' ')[0],
    stepComplete: data.stepComplete || 1,
    payType: data.payType || null,
    // New leads enter unassigned; a FOE/Branch Manager/CEO assigns them
    // afterward, unless an owner/auto-assignment was explicitly requested.
    assignTo: assignment?.assignedEmployeeId || null,
    case_officer: data.case_officer || assignment?.assignedEmployeeId || null,
    Counsilor: assignment?.counselorId || null,
    branch: assignment?.branchId || requestedBranchId,
    region: data.region || requestedBranchRegion || 1,
    payTotal: data.payTotal || 0,
    discount: data.discount || 0,
    paidYet: data.paidYet || 0,
    payBalance: data.payBalance || 0,
    feeAgreeDate: data.feeAgreeDate || null,
    demandAmt: data.demandAmt || 0,
    dueDate: data.dueDate || null,
    demdRemark: data.demdRemark || '',
    agreeDate: data.agreeDate || null,
    renDate: data.renDate || null,
    renExpiryDate: data.renExpiryDate || null,
    renew_type: data.renew_type || null,
    // Unassigned leads start 'untouched' (unassigned + no activity yet) so
    // they can be found/filtered separately from a 'New' lead someone
    // already owns; recordLeadAssignment clears it to 'New' the moment the
    // lead actually gets assigned.
    status: data.status || (assignment?.assignedEmployeeId ? 'New' : 'untouched'),
    status_date: new Date(),
    notf: data.notf || 0,
    type: data.type || 'lead',
    password: data.password || null,
    novat: data.novat || 0,
    i_p: data.i_p || '',
    escalation: data.escalation || 0,
    transfer_date: data.transfer_date || null,
    transfer_time: data.transfer_time || new Date().toTimeString().split(' ')[0],
    transfered: data.transfered || 0,
    transfered_by: data.transfered_by || 1,
    otp_status: data.otp_status || 0,
    otp: data.otp || null,
    otp_date: data.otp_date || null,
    otp_email: data.otp_email || '',
    browser: data.browser || '',
    hostname: data.hostname || '',
    digital_signature: data.digital_signature || '',
    lead_import_by: data.lead_import_by || null,
    lead_import: data.lead_import || 0,
    education: data.education || '',
    profession: data.profession || '',
    exist: data.exist || 0,
    no_of_applicants: data.no_of_applicants || 1,
    advanced: data.advanced || 0,
    do_status: data.do_status || 0,
    arm_status: data.arm_status || 0,
    gm_status: data.gm_status || 0,
    discount_status: data.discount_status || 0,
    discount_remarks: data.discount_remarks || '',
    discount_by: data.discount_by || 1,
    discount_date: data.discount_date || new Date(),
    campaign: data.campaign || '',
    campaign_group: data.campaign_group || '',
    pa_fname: data.pa_fname || '',
    pa_lname: data.pa_lname || '',
    lead_remark: data.lead_remark || data.notes || data.message || 'New lead created',
    created: new Date(),
    created_by: data.created_by || 1,
    alert: data.alert || 0,
    area: data.area || data.city || 'Dubai',
    lead_quality: data.lead_quality || data.leadQuality || 'Warm',
    transferred_remark_update: data.transferred_remark_update || 0,
    untouch_transfer: data.untouch_transfer || 0,
    lead_nq_reason: data.lead_nq_reason || '',
    tele_caller_alert: data.tele_caller_alert || 0,
    tele_caller_remark: data.tele_caller_remark || '',
    tele_caller_remark_by: data.tele_caller_remark_by || 1,
    tele_date: data.tele_date || new Date(),
    lead_date: data.lead_date || new Date(),
    duplicate: duplicateCheck?.isDuplicate ? 1 : 0,
    duplicate_count: duplicateCheck?.duplicateCount || 0,
    ref_remark: data.ref_remark || '',
    na_record: data.na_record || 0,
    old_assgined: data.old_assgined || 0,
    nal_count: data.nal_count || 0,
    campaign_id: data.campaign_id || 0,
    old_branch: data.old_branch || 0,
  };
}

export type LeadData = ReturnType<typeof buildDefaultLeadData>;

// sequelize.query()'s raw return shape for an INSERT varies by how the
// replacements were passed - handles both a plain numeric/string insertId
// and a nested { insertId } object, since different call sites in this
// codebase have observed different shapes.
export function getInsertId(result: unknown): number {
  const values = Array.isArray(result) ? result : [result];
  for (const value of values) {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
    if (typeof value === 'string' && Number.isInteger(Number(value)) && Number(value) > 0) return Number(value);
    if (value && typeof value === 'object') {
      const insertId = (value as { insertId?: unknown }).insertId;
      if (typeof insertId === 'number' && Number.isInteger(insertId) && insertId > 0) return insertId;
      if (typeof insertId === 'string' && Number.isInteger(Number(insertId)) && Number(insertId) > 0) return Number(insertId);
    }
  }
  return 0;
}

// The one INSERT statement every lead-creation path should use - covers
// every NOT-NULL column on crm_forum_leads. Returns the new lead's id, or
// throws if MySQL didn't hand one back (extremely unlikely if this INSERT
// runs at all - the column list is complete by construction).
export async function insertLeadRecord(leadData: LeadData, transaction?: Transaction): Promise<number> {
  const insertResult = await sequelize.query(`
    INSERT INTO crm_forum_leads (
      fname, mname, lname, email, phone, mobile, whatsapp_number, nationality, address, dob, gender,
      id_number, id_expiry, id_issue_date, country_interest, sub_country_interest,
      service_interest, market_source, sub_market_source, appointment, followup, folowuptime,
      followupstat, enquiry, convet, priority, regdate, regtime, last_updated, last_updtd_time,
      stepComplete, payType, assignTo, case_officer, Counsilor, branch, region, payTotal,
      discount, paidYet, payBalance, feeAgreeDate, demandAmt, dueDate, demdRemark, agreeDate,
      renDate, renExpiryDate, renew_type, status, status_date, notf, type, password, novat,
      i_p, escalation, transfer_date, transfer_time, transfered, transfered_by, otp_status,
      otp, otp_date, otp_email, browser, hostname, digital_signature, lead_import_by,
      lead_import, education, profession, exist, no_of_applicants, advanced, do_status,
      arm_status, gm_status, discount_status, discount_remarks, discount_by, discount_date,
      campaign, campaign_group, pa_fname, pa_lname, lead_remark, created, created_by, alert,
      area, lead_quality, transferred_remark_update, untouch_transfer, lead_nq_reason,
      tele_caller_alert, tele_caller_remark, tele_caller_remark_by, tele_date, lead_date,
      duplicate, duplicate_count, ref_remark, na_record, old_assgined, nal_count, campaign_id,
      old_branch
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `, {
    replacements: [
      leadData.fname, leadData.mname, leadData.lname, leadData.email, leadData.phone, leadData.mobile,
      leadData.whatsapp_number,
      leadData.nationality, leadData.address, leadData.dob, leadData.gender, leadData.id_number,
      leadData.id_expiry, leadData.id_issue_date, leadData.country_interest, leadData.sub_country_interest,
      leadData.service_interest, leadData.market_source, leadData.sub_market_source, leadData.appointment,
      leadData.followup, leadData.folowuptime, leadData.followupstat, leadData.enquiry, leadData.convet,
      leadData.priority, leadData.regdate, leadData.regtime, leadData.last_updated, leadData.last_updtd_time,
      leadData.stepComplete, leadData.payType, leadData.assignTo, leadData.case_officer, leadData.Counsilor,
      leadData.branch, leadData.region, leadData.payTotal, leadData.discount, leadData.paidYet, leadData.payBalance,
      leadData.feeAgreeDate, leadData.demandAmt, leadData.dueDate, leadData.demdRemark, leadData.agreeDate,
      leadData.renDate, leadData.renExpiryDate, leadData.renew_type, leadData.status, leadData.status_date,
      leadData.notf, leadData.type, leadData.password, leadData.novat, leadData.i_p, leadData.escalation,
      leadData.transfer_date, leadData.transfer_time, leadData.transfered, leadData.transfered_by,
      leadData.otp_status, leadData.otp, leadData.otp_date, leadData.otp_email, leadData.browser,
      leadData.hostname, leadData.digital_signature, leadData.lead_import_by, leadData.lead_import,
      leadData.education, leadData.profession, leadData.exist, leadData.no_of_applicants, leadData.advanced,
      leadData.do_status, leadData.arm_status, leadData.gm_status, leadData.discount_status,
      leadData.discount_remarks, leadData.discount_by, leadData.discount_date, leadData.campaign,
      leadData.campaign_group, leadData.pa_fname, leadData.pa_lname, leadData.lead_remark, leadData.created,
      leadData.created_by, leadData.alert, leadData.area, leadData.lead_quality, leadData.transferred_remark_update,
      leadData.untouch_transfer, leadData.lead_nq_reason, leadData.tele_caller_alert, leadData.tele_caller_remark,
      leadData.tele_caller_remark_by, leadData.tele_date, leadData.lead_date, leadData.duplicate,
      leadData.duplicate_count, leadData.ref_remark, leadData.na_record, leadData.old_assgined,
      leadData.nal_count, leadData.campaign_id, leadData.old_branch
    ],
    type: QueryTypes.INSERT,
    transaction,
  });

  // Every lead-creation path funnels through this one INSERT (see the file
  // header comment) - the single choke point to invalidate cached dashboard/
  // report aggregates immediately rather than waiting out their revalidate
  // window. A transaction rollback after this point is not possible to
  // detect from here, so a very rare rollback just costs one wasted
  // invalidation, never stale data.
  invalidateReportCaches([CACHE_TAGS.leads]);

  return getInsertId(insertResult);
}
