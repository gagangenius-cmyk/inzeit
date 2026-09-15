import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { resolveLeadAutoAssignment } from '@/lib/leadAutoAssignment';
import { verifyToken } from '@/lib/auth';
import { QueryTypes } from 'sequelize';
import { checkForDuplicate, findExistingLead } from '@/lib/duplicateLeadCheck';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const authorization = request.headers.get('authorization');
    const token = request.cookies.get('auth-token')?.value || authorization?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;

    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Authentication is required to create a lead' }, { status: 401 });
    }

    const counselorBranchId = Number(currentUser.branch || data.branch || data.branchId || 0);
    if (!counselorBranchId) {
      return NextResponse.json({ success: false, error: 'Your login does not have a branch assigned' }, { status: 422 });
    }
    
    console.log('Creating lead:', data);
    const assignment = await resolveLeadAutoAssignment({
      branchId: counselorBranchId,
      preferredEmployeeId: currentUser.id,
      forceAutoAssign: false,
      roundRobin: false,
    });

    // This legacy table does not auto-increment IDs in every deployment, so
    // allocate one explicitly before inserting a counselor-created lead.
    const nextIdRows = await sequelize.query<{ nextId: number }>(`
      SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM crm_forum_leads
    `, { type: QueryTypes.SELECT });
    const leadId = Number(nextIdRows[0]?.nextId || 0);
    if (!leadId) throw new Error('Could not allocate a lead ID');

    // Block on an existing match rather than inserting a second row for the
    // same client (see /api/leads for the same check) — point the counselor
    // at whoever already owns it so they go through lead-transfer instead.
    const existingLead = await findExistingLead({ phone: data.phone, email: data.email });
    if (existingLead) {
      const ownerLabel = existingLead.ownerName || 'an unassigned queue — contact your Branch Manager';
      return NextResponse.json({
        success: false,
        error: `A lead with this email or phone already exists (Lead #${existingLead.id}, currently with ${ownerLabel}). Request a transfer instead of creating a duplicate.`,
        duplicateLeadId: existingLead.id,
        duplicateLeadOwner: existingLead.ownerName,
      }, { status: 409 });
    }
    const duplicateCheck = await checkForDuplicate({ phone: data.phone, email: data.email });
    const now = new Date();
    const timeNow = now.toTimeString().split(' ')[0];

    // Simple lead creation with minimal required fields. The remaining
    // columns below are NOT NULL with no DB default, so they must all be
    // supplied even though this endpoint only collects a handful of fields.
    const [result] = await sequelize.query(`
      INSERT INTO crm_forum_leads (
        id, fname, mname, lname, email, phone, mobile, nationality, address,
        gender, id_number, id_expiry, id_issue_date, country_interest, sub_country_interest,
        service_interest, market_source, sub_market_source, followup, folowuptime, sf,
        status, priority, lead_quality, enquiry, convet, regdate, regtime, last_updated,
        last_updtd_time, created, created_by, status_date, type,
        assignTo, branch, region, Counsilor, case_officer,
        transfer_time, transfered_by, exist, no_of_applicants, advanced, do_status,
        arm_status, gm_status, discount_status, discount_remarks, discount_by, discount_date,
        campaign, campaign_group, pa_fname, pa_lname, lead_remark, alert, area,
        transferred_remark_update, untouch_transfer, lead_nq_reason, tele_caller_alert,
        tele_caller_remark, tele_caller_remark_by, tele_date, lead_date,
        duplicate, duplicate_count, ref_remark, na_record, old_assgined, nal_count,
        campaign_id, old_branch
      ) VALUES (${Array(74).fill('?').join(', ')})
    `, {
      replacements: [
        leadId,
        data.fname || '',
        data.mname || '',
        data.lname || '',
        data.email || '',
        data.phone || '',
        data.mobile || data.phone || '',
        data.nationality || 'Unknown',
        data.address || '',
        data.gender || 'Male',
        data.id_number || '',
        now, // id_expiry
        now, // id_issue_date
        data.country_interest || '',
        0, // sub_country_interest
        data.service_interest || '',
        data.market_source || '',
        0, // sub_market_source
        now, // followup
        timeNow, // folowuptime
        0, // sf
        'New',
        data.priority || 'P1',
        'Warm', // lead_quality
        data.enquiry || 'New lead enquiry',
        'New', // convet
        new Date().toISOString().split('T')[0], // regdate
        timeNow, // regtime
        now.toLocaleDateString(), // last_updated
        timeNow, // last_updtd_time
        now, // created
        currentUser.id,
        now, // status_date
        'lead', // type
        assignment.assignedEmployeeId,
        assignment.branchId,
        1, // region (use valid region ID 1)
        assignment.counselorId,
        assignment.assignedEmployeeId, // case_officer
        timeNow, // transfer_time
        currentUser.id, // transfered_by
        0, // exist
        1, // no_of_applicants
        0, // advanced
        0, // do_status
        0, // arm_status
        0, // gm_status
        0, // discount_status
        '', // discount_remarks
        currentUser.id, // discount_by
        now, // discount_date
        '', // campaign
        '', // campaign_group
        '', // pa_fname
        '', // pa_lname
        'Created via quick-add', // lead_remark
        0, // alert
        '', // area
        0, // transferred_remark_update
        0, // untouch_transfer
        '', // lead_nq_reason
        0, // tele_caller_alert
        '', // tele_caller_remark
        currentUser.id, // tele_caller_remark_by
        now, // tele_date
        now, // lead_date
        duplicateCheck.isDuplicate ? 1 : 0,
        duplicateCheck.duplicateCount,
        '', // ref_remark
        0, // na_record
        0, // old_assgined
        0, // nal_count
        0, // campaign_id
        0, // old_branch
      ]
    });

    // Get the created lead
    const [newLead] = await sequelize.query(`
      SELECT id, fname, lname, email, phone, status, priority, created
      FROM crm_forum_leads
      WHERE id = ?
      LIMIT 1
    `, { replacements: [leadId] });

    return NextResponse.json({
      success: true,
      data: newLead[0],
      assignment
    });

  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Authentication is required' }, { status: 401 });
    }

    const [leads] = await sequelize.query(`
      SELECT id, fname, lname, email, phone, status, priority, created 
      FROM crm_forum_leads 
      ORDER BY created DESC 
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      data: leads
    });

  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
