import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { resolveLeadReferenceId } from '@/lib/leadReferenceResolver';
import { checkForDuplicate, normalizePhone } from '@/lib/duplicateLeadCheck';
import { recordLeadAssignment } from '@/lib/leadRemarks';

const SAMPLE_ROWS = [
  {
    fname: 'John',
    lname: 'Doe',
    email: 'john.doe@example.com',
    mobile: '971500000000',
    education: "Bachelor's Degree",
    profession: 'Engineer',
    counselor: 'Jane Smith',
    market_source: 'Referral',
    campaign: 'Summer Promo',
    campaign_group: 'Digital',
    remarks: 'Interested in Canada PR',
    campaign_name: 'Canada PR Q3',
    regdate: '2026-01-15',
  },
];

export async function GET() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leads-bulk-upload-sample.xlsx"',
    },
  });
}

function getCell(row: Record<string, unknown>, names: string[]): string {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function excelDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getInsertId(result: unknown): number {
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

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['leads.bulk_upload']);
  if (isAuthError(auth)) return auth;
  const currentUser = auth;

  try {
    await connectDB();

    const body = await request.json();
    if (!body?.fileData) {
      return NextResponse.json({ error: 'Excel file data is required' }, { status: 400 });
    }

    let rows: Array<Record<string, unknown>>;
    try {
      const workbook = XLSX.read(body.fileData, { type: 'base64', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    } catch {
      return NextResponse.json({ error: 'Invalid Excel file format' }, { status: 400 });
    }

    const fallbackBranchId = Number(currentUser.branch || 0) || 1;
    const fallbackRegionId = Number(currentUser.region || 0) || 1;

    const created: Array<{ row: number; id: number }> = [];
    const errors: Array<{ row: number; error: string }> = [];
    const warnings: Array<{ row: number; warning: string }> = [];
    const skipped: Array<{ row: number; reason: string }> = [];
    // Duplicates already inserted from *this same file* aren't in the DB yet
    // when checkForDuplicate runs for a later row, so two rows in one upload
    // sharing an email/phone would otherwise both pass the DB-only check.
    const seenInBatch = new Set<string>();

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2; // header is row 1

      const fname = getCell(row, ['fname', 'Fname', 'First Name', 'firstName']);
      const lname = getCell(row, ['lname', 'Lname', 'Last Name', 'lastName']);
      const email = getCell(row, ['email', 'Email']);
      const mobile = getCell(row, ['mobile', 'Mobile']);

      if (!fname || !lname) {
        errors.push({ row: rowNumber, error: 'fname and lname are required' });
        continue;
      }
      if (!email && !mobile) {
        errors.push({ row: rowNumber, error: 'email or mobile is required' });
        continue;
      }

      try {
        const education = getCell(row, ['education', 'Education']);
        const profession = getCell(row, ['profession', 'Profession']);
        const counselorName = getCell(row, ['counselor', 'Counselor', 'counsellor', 'Counsellor']);
        const marketSourceName = getCell(row, ['market_source', 'market source', 'Market Source', 'marketSource']);
        const campaign = getCell(row, ['campaign', 'Campaign']);
        const campaignGroup = getCell(row, ['campaign_group', 'campaign group', 'Campaign Group']);
        const remarks = getCell(row, ['remarks', 'Remarks', 'lead_remark']);
        const campaignName = getCell(row, ['campaign_name', 'campaign name', 'Campaign Name']);
        const regDateRaw = row['regdate'] ?? row['Regdate'] ?? row['Registration Date'];

        // Counselor name -> crm_employee.id (assignTo), and that same employee's
        // own branch/region carried onto the lead - a lead assigned to a
        // counselor must sit in that counselor's branch, not the uploader's.
        // No match leaves the lead unassigned and falls back to the
        // uploading CEO's own branch/region rather than failing the row.
        let assignToId: number | null = null;
        let branchId = fallbackBranchId;
        let regionId = fallbackRegionId;
        if (counselorName) {
          const [employee] = await sequelize.query<{ id: number; branch: number | null; region: number | null }>(
            'SELECT id, branch, region FROM crm_employee WHERE LOWER(TRIM(name)) = LOWER(:name) LIMIT 1',
            { replacements: { name: counselorName }, type: QueryTypes.SELECT }
          );
          if (employee?.id) {
            assignToId = employee.id;
            branchId = Number(employee.branch || 0) || fallbackBranchId;
            regionId = Number(employee.region || 0) || fallbackRegionId;
          } else {
            warnings.push({ row: rowNumber, warning: `Counselor "${counselorName}" not found - lead left unassigned` });
          }
        }

        // Market source name -> crm_source.id (same resolver GET/POST /api/leads
        // uses for manual lead entry, including its known-alias table).
        let marketSourceId: number | null = null;
        if (marketSourceName) {
          try {
            marketSourceId = await resolveLeadReferenceId('market_source', marketSourceName);
          } catch {
            warnings.push({ row: rowNumber, warning: `Market source "${marketSourceName}" not found` });
          }
        }

        // Campaign name -> crm_campaigns.id
        let campaignId = 0;
        if (campaignName) {
          const [campaignRow] = await sequelize.query<{ id: number }>(
            'SELECT id FROM crm_campaigns WHERE LOWER(TRIM(campaign)) = LOWER(:name) LIMIT 1',
            { replacements: { name: campaignName }, type: QueryTypes.SELECT }
          );
          if (campaignRow?.id) campaignId = campaignRow.id;
          else warnings.push({ row: rowNumber, warning: `Campaign "${campaignName}" not found` });
        }

        // Reject rather than flag: a lead whose phone or email already exists
        // (in the DB, or earlier in this same file) doesn't get created at
        // all, so the CRM never ends up with two records for the same person.
        const batchKey = [normalizePhone(mobile), String(email || '').trim().toLowerCase()].filter(Boolean).join('|');
        if (batchKey && seenInBatch.has(batchKey)) {
          skipped.push({ row: rowNumber, reason: 'Duplicate of another row earlier in this file (same email/phone)' });
          continue;
        }
        const duplicateCheck = await checkForDuplicate({ phone: mobile, email });
        if (duplicateCheck.isDuplicate) {
          skipped.push({ row: rowNumber, reason: 'A lead with this email or phone already exists in the CRM' });
          continue;
        }
        if (batchKey) seenInBatch.add(batchKey);

        const regDate = excelDate(regDateRaw) || new Date();
        const now = new Date();

        const leadData = {
          fname,
          mname: '',
          lname,
          email,
          phone: mobile,
          mobile,
          whatsapp_number: '',
          nationality: '',
          address: '',
          dob: null as Date | null,
          gender: 'Male',
          id_number: '',
          id_expiry: new Date('2099-12-31'),
          id_issue_date: now,
          country_interest: null as number | null,
          sub_country_interest: 0,
          service_interest: null as number | null,
          market_source: marketSourceId,
          sub_market_source: 0,
          priority: 'Medium',
          // Unassigned unless a matching counselor name resolved above —
          // 'untouched' so an unassigned import row is findable separately
          // from a 'New' lead someone already owns.
          status: assignToId ? 'New' : 'untouched',
          lead_quality: 'Warm',
          enquiry: 'Bulk import',
          convet: 'New',
          regdate: regDate,
          regtime: now,
          last_updated: now.toLocaleDateString(),
          last_updtd_time: now.toTimeString().split(' ')[0],
          followup: now,
          folowuptime: now.toTimeString().split(' ')[0],
          stepComplete: 1,
          assignTo: assignToId,
          case_officer: assignToId,
          Counsilor: assignToId,
          branch: branchId,
          region: regionId,
          payTotal: 0,
          discount: 0,
          paidYet: 0,
          payBalance: 0,
          demandAmt: 0,
          notf: 0,
          type: 'lead',
          transfered_by: currentUser.id,
          transfer_time: now.toTimeString().split(' ')[0],
          exist: 0,
          no_of_applicants: 1,
          advanced: 0,
          do_status: 0,
          arm_status: 0,
          gm_status: 0,
          discount_status: 0,
          discount_remarks: '',
          discount_by: currentUser.id,
          discount_date: now,
          campaign,
          campaign_group: campaignGroup,
          pa_fname: '',
          pa_lname: '',
          lead_remark: remarks || 'Bulk imported lead',
          created: now,
          created_by: currentUser.id,
          alert: 0,
          area: '',
          transferred_remark_update: 0,
          untouch_transfer: 0,
          lead_nq_reason: '',
          tele_caller_alert: 0,
          tele_caller_remark: '',
          tele_caller_remark_by: currentUser.id,
          tele_date: now,
          lead_date: now,
          duplicate: duplicateCheck.isDuplicate ? 1 : 0,
          duplicate_count: duplicateCheck.duplicateCount,
          ref_remark: '',
          na_record: 0,
          old_assgined: 0,
          nal_count: 0,
          campaign_id: campaignId,
          old_branch: 0,
          status_date: now,
          education,
          profession,
          lead_import_by: currentUser.id,
          lead_import: 1,
        };

        const insertResult = await sequelize.query(
          `INSERT INTO crm_forum_leads (
            fname, mname, lname, email, phone, mobile, whatsapp_number, nationality, address, dob, gender,
            id_number, id_expiry, id_issue_date, country_interest, sub_country_interest,
            service_interest, market_source, sub_market_source, priority, status, lead_quality,
            enquiry, convet, regdate, regtime, last_updated, last_updtd_time, followup,
            folowuptime, stepComplete,
            assignTo, case_officer, Counsilor, branch, region, payTotal, discount, paidYet,
            payBalance, demandAmt, notf, type, transfered_by, transfer_time, exist,
            no_of_applicants, advanced, do_status, arm_status, gm_status, discount_status,
            discount_remarks, discount_by, discount_date, campaign, campaign_group,
            pa_fname, pa_lname, lead_remark, created, created_by, alert, area,
            transferred_remark_update, untouch_transfer, lead_nq_reason, tele_caller_alert,
            tele_caller_remark, tele_caller_remark_by, tele_date, lead_date, duplicate,
            duplicate_count, ref_remark, na_record, old_assgined, nal_count, campaign_id,
            old_branch, status_date, education, profession, lead_import_by, lead_import
          ) VALUES (${Array(85).fill('?').join(', ')})`,
          {
            replacements: [
              leadData.fname, leadData.mname, leadData.lname, leadData.email, leadData.phone, leadData.mobile,
              leadData.whatsapp_number, leadData.nationality, leadData.address, leadData.dob, leadData.gender,
              leadData.id_number, leadData.id_expiry, leadData.id_issue_date, leadData.country_interest,
              leadData.sub_country_interest, leadData.service_interest, leadData.market_source,
              leadData.sub_market_source, leadData.priority, leadData.status, leadData.lead_quality,
              leadData.enquiry, leadData.convet, leadData.regdate, leadData.regtime, leadData.last_updated,
              leadData.last_updtd_time, leadData.followup, leadData.folowuptime, leadData.stepComplete,
              leadData.assignTo, leadData.case_officer, leadData.Counsilor, leadData.branch, leadData.region,
              leadData.payTotal, leadData.discount, leadData.paidYet, leadData.payBalance, leadData.demandAmt,
              leadData.notf, leadData.type, leadData.transfered_by, leadData.transfer_time, leadData.exist,
              leadData.no_of_applicants, leadData.advanced, leadData.do_status, leadData.arm_status,
              leadData.gm_status, leadData.discount_status, leadData.discount_remarks, leadData.discount_by,
              leadData.discount_date, leadData.campaign, leadData.campaign_group, leadData.pa_fname,
              leadData.pa_lname, leadData.lead_remark, leadData.created, leadData.created_by, leadData.alert,
              leadData.area, leadData.transferred_remark_update, leadData.untouch_transfer, leadData.lead_nq_reason,
              leadData.tele_caller_alert, leadData.tele_caller_remark, leadData.tele_caller_remark_by,
              leadData.tele_date, leadData.lead_date, leadData.duplicate, leadData.duplicate_count,
              leadData.ref_remark, leadData.na_record, leadData.old_assgined, leadData.nal_count,
              leadData.campaign_id, leadData.old_branch, leadData.status_date, leadData.education,
              leadData.profession, leadData.lead_import_by, leadData.lead_import,
            ],
            type: QueryTypes.INSERT,
          }
        );

        const insertId = getInsertId(insertResult);
        if (!insertId) throw new Error('Lead was created but the new lead ID could not be resolved');

        if (assignToId) {
          await recordLeadAssignment({
            leadId: insertId,
            oldAssignTo: null,
            newAssignTo: assignToId,
            actorId: currentUser.id,
            actorRole: currentUser.roleName || currentUser.type,
          });
        }

        created.push({ row: rowNumber, id: insertId });
      } catch (error) {
        const dbMessage = (error as any)?.original?.sqlMessage || (error as any)?.parent?.sqlMessage;
        errors.push({ row: rowNumber, error: dbMessage || (error instanceof Error ? error.message : String(error)) });
      }
    }

    return NextResponse.json({
      message: `Import completed. ${created.length} lead${created.length === 1 ? '' : 's'} created, ${skipped.length} duplicate${skipped.length === 1 ? '' : 's'} skipped, ${errors.length} failed, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`,
      created: created.length,
      failed: errors.length,
      duplicates: skipped.length,
      created_rows: created,
      errors,
      warnings,
      skipped,
    });
  } catch (error) {
    console.error('Lead bulk-upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to import leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
