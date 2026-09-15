import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isFoeOrBranchManagerOrCeo, isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { recordLeadAssignment } from '@/lib/leadRemarks';

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

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const reassignmentType = searchParams.get('reassignmentType');

    // Build WHERE clause
    let whereClause = '';
    const replacements: any[] = [];

    if (leadId) {
      whereClause += ' WHERE r.leadId = ?';
      replacements.push(leadId);
    }

    if (status) {
      whereClause += whereClause ? ' AND r.status = ?' : ' WHERE r.status = ?';
      replacements.push(status);
    }

    if (reassignmentType) {
      whereClause += whereClause ? ' AND r.reassignmentType = ?' : ' WHERE r.reassignmentType = ?';
      replacements.push(reassignmentType);
    }

    // Get reassignments with related data
    const [reassignments] = await sequelize.query(`
      SELECT
        r.*,
        l.fname as lead_fname,
        l.lname as lead_lname,
        l.email as lead_email,
        l.mobile as lead_mobile,
        fe.name as from_employee_name,
        te.name as to_employee_name,
        ae.name as approved_employee_name,
        ce.name as created_employee_name
      FROM crm_lead_reassignments r
      LEFT JOIN crm_forum_leads l ON r.leadId = l.id
      LEFT JOIN crm_employee fe ON r.fromEmployeeId = fe.id
      LEFT JOIN crm_employee te ON r.toEmployeeId = te.id
      LEFT JOIN crm_employee ae ON r.approvedBy = ae.id
      LEFT JOIN crm_employee ce ON r.createdBy = ce.id
      ${whereClause}
      ORDER BY r.createdAt DESC
    `, {
      replacements
    });

    return NextResponse.json({
      success: true,
      data: reassignments,
      count: (reassignments as any[]).length
    });
  } catch (error: any) {
    console.error('Error fetching lead reassignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead reassignments: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();

    // Immediately reassigning (skipping approval) is restricted to FOE/Branch
    // Manager/CEO — anyone authenticated can still file a pending request.
    if (body.autoApprove && !isFoeOrBranchManagerOrCeo(auth)) {
      return NextResponse.json(
        { success: false, error: 'Only FOE, Branch Manager, or CEO can auto-approve a lead reassignment' },
        { status: 403 }
      );
    }

    // Validate required fields
    const requiredFields = ['leadId', 'fromEmployeeId', 'toEmployeeId', 'reassignmentType', 'reason', 'previousStatus', 'newStatus', 'createdBy'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if lead exists
    const [leadCheck] = await sequelize.query(`
      SELECT id, fname, lname, assignTo, branch FROM crm_forum_leads WHERE id = ?
    `, {
      replacements: [body.leadId]
    });

    if (!leadCheck || (leadCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // FOE/Branch Manager may only auto-approve within their own branch; CEO
    // is unrestricted. This is the immediate-move path (autoApprove), so the
    // lead's branch must be checked before the reassignment record is even created.
    if (body.autoApprove && !isCeo(auth)) {
      const leadBranch = (leadCheck as any[])[0].branch;
      if (leadBranch !== null && Number(leadBranch) !== Number(auth.branch || 0)) {
        return NextResponse.json(
          { success: false, error: 'You can only auto-approve a reassignment for a lead in your own branch' },
          { status: 403 }
        );
      }
    }

    // Check if employees exist
    const [employeeCheck] = await sequelize.query(`
      SELECT id, name FROM crm_employee WHERE id IN (?, ?)
    `, {
      replacements: [body.fromEmployeeId, body.toEmployeeId]
    });

    if (!employeeCheck || (employeeCheck as any[]).length < 2) {
      return NextResponse.json(
        { success: false, error: 'One or both employees not found' },
        { status: 404 }
      );
    }

    // Duplicate-submission guard: block an identical reassignment request
    // for this lead created in the last minute.
    const [recentDuplicate] = await sequelize.query<{ id: number }>(
      `SELECT id FROM crm_lead_reassignments
       WHERE leadId = ? AND fromEmployeeId = ? AND toEmployeeId = ?
         AND createdAt >= (NOW() - INTERVAL 60 SECOND)
       LIMIT 1`,
      { replacements: [body.leadId, body.fromEmployeeId, body.toEmployeeId], type: QueryTypes.SELECT }
    );
    if (recentDuplicate) {
      return NextResponse.json(
        { success: false, error: 'This reassignment was already submitted a moment ago.' },
        { status: 409 }
      );
    }

    // Create reassignment record
    const [result] = await sequelize.query(`
      INSERT INTO crm_lead_reassignments (
        leadId, fromEmployeeId, toEmployeeId, reassignmentType, reason,
        previousStatus, newStatus, reassignmentDate, createdBy, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [
        body.leadId,
        body.fromEmployeeId,
        body.toEmployeeId,
        body.reassignmentType,
        body.reason,
        body.previousStatus,
        body.newStatus,
        new Date(),
        body.createdBy
      ]
    });

    const reassignmentId = getInsertId(result);
    if (!reassignmentId) {
      throw new Error('Lead reassignment was created but the new reassignment ID could not be resolved');
    }

    // Update lead assignment if reassignment is approved or auto-approved
    if (body.autoApprove) {
      await sequelize.query(`
        UPDATE crm_forum_leads 
        SET assignTo = ?, Counsilor = ?, last_updated = ?, last_updtd_time = ?, status = ?
        WHERE id = ?
      `, {
        replacements: [
          body.toEmployeeId,
          body.toEmployeeId,
          new Date().toISOString().split('T')[0],
          new Date().toTimeString().split(' ')[0],
          body.newStatus,
          body.leadId
        ]
      });

      await sequelize.query(
        `UPDATE crm_lead_reassignments SET updatedAt = NOW() WHERE id = ?`,
        { replacements: [reassignmentId] }
      );

      await recordLeadAssignment({
        leadId: Number(body.leadId),
        oldAssignTo: body.fromEmployeeId !== undefined && body.fromEmployeeId !== null ? Number(body.fromEmployeeId) : null,
        newAssignTo: Number(body.toEmployeeId),
        actorId: auth.id,
        actorRole: auth.roleName || auth.type,
      });
    }

    // Get the created reassignment with details
    const [newReassignment] = await sequelize.query(`
      SELECT 
        r.*,
        l.fname as lead_fname,
        l.lname as lead_lname,
        l.email as lead_email,
        fe.name as from_employee_name,
        te.name as to_employee_name
      FROM crm_lead_reassignments r
      LEFT JOIN crm_forum_leads l ON r.leadId = l.id
      LEFT JOIN crm_employee fe ON r.fromEmployeeId = fe.id
      LEFT JOIN crm_employee te ON r.toEmployeeId = te.id
      WHERE r.id = ?
    `, {
      replacements: [reassignmentId]
    });

    return NextResponse.json({
      success: true,
      message: 'Lead reassignment created successfully',
      data: (newReassignment as any[])[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead reassignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lead reassignment: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reassignment ID is required' },
        { status: 400 }
      );
    }

    // Check if reassignment exists
    const [existingReassignment] = await sequelize.query(`
      SELECT * FROM crm_lead_reassignments WHERE id = ?
    `, {
      replacements: [id]
    });

    if (!existingReassignment || (existingReassignment as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead reassignment not found' },
        { status: 404 }
      );
    }

    const reassignmentRow = (existingReassignment as any[])[0];

    // Approving a reassignment (which immediately moves the lead) is
    // restricted to FOE/Branch Manager/CEO — except a 'transfer' request
    // (filed when a counselor tries to add a lead whose email/mobile already
    // belongs to someone else), which moves an active client between
    // counselors and so is narrowed to Branch Manager/CEO only, no FOE.
    if (body.status === 'approved') {
      const isTransferRequest = reassignmentRow.reassignmentType === 'transfer';
      const approverOk = isTransferRequest ? isBranchManagerOrCeo(auth) : isFoeOrBranchManagerOrCeo(auth);
      if (!approverOk) {
        return NextResponse.json(
          {
            success: false,
            error: isTransferRequest
              ? 'Only Branch Manager or CEO can approve a lead transfer request'
              : 'Only FOE, Branch Manager, or CEO can approve a lead reassignment',
          },
          { status: 403 }
        );
      }

      // FOE/Branch Manager may only approve within their own branch; CEO is unrestricted.
      if (!isCeo(auth)) {
        const [leadBranchRows] = await sequelize.query(
          'SELECT branch FROM crm_forum_leads WHERE id = ? LIMIT 1',
          { replacements: [reassignmentRow.leadId] },
        );
        const leadBranch = (leadBranchRows as any[])[0]?.branch;
        if (leadBranch !== undefined && leadBranch !== null && Number(leadBranch) !== Number(auth.branch || 0)) {
          return NextResponse.json(
            { success: false, error: 'You can only approve a reassignment for a lead in your own branch' },
            { status: 403 },
          );
        }
      }
    }

    const allowedStatuses = ['pending', 'approved', 'rejected'];
    const nextStatus = allowedStatuses.includes(body.status) ? body.status : undefined;

    await sequelize.query(`
      UPDATE crm_lead_reassignments
      SET status = COALESCE(?, status),
          approvedBy = COALESCE(?, approvedBy),
          approvedAt = CASE WHEN ? IS NOT NULL THEN NOW() ELSE approvedAt END,
          notes = COALESCE(?, notes),
          updatedAt = NOW()
      WHERE id = ?
    `, {
      replacements: [nextStatus || null, body.approvedBy || null, nextStatus || null, body.notes || null, id]
    });

    // If approved, update lead assignment
    if (body.status === 'approved') {
      const [reassignmentData] = await sequelize.query(`
        SELECT leadId, toEmployeeId, newStatus FROM crm_lead_reassignments WHERE id = ?
      `, {
        replacements: [id]
      });

      if (reassignmentData && (reassignmentData as any[]).length > 0) {
        const reassign = (reassignmentData as any)[0];
        
        await sequelize.query(`
          UPDATE crm_forum_leads 
          SET assignTo = ?, Counsilor = ?, last_updated = ?, last_updtd_time = ?, status = ?
          WHERE id = ?
        `, {
          replacements: [
            reassign.toEmployeeId,
            reassign.toEmployeeId,
            new Date().toISOString().split('T')[0],
            new Date().toTimeString().split(' ')[0],
            reassign.newStatus,
            reassign.leadId
          ]
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lead reassignment updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating lead reassignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead reassignment: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  if (!isCeo(auth)) {
    return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Reassignment ID is required' },
        { status: 400 }
      );
    }

    // Check if reassignment exists
    const [existingReassignment] = await sequelize.query(`
      SELECT * FROM crm_lead_reassignments WHERE id = ?
    `, {
      replacements: [id]
    });

    if (!existingReassignment || (existingReassignment as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead reassignment not found' },
        { status: 404 }
      );
    }

    // Delete reassignment
    await sequelize.query(`
      DELETE FROM crm_lead_reassignments WHERE id = ?
    `, {
      replacements: [id]
    });

    return NextResponse.json({
      success: true,
      message: 'Lead reassignment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting lead reassignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead reassignment: ' + error.message },
      { status: 500 }
    );
  }
}
