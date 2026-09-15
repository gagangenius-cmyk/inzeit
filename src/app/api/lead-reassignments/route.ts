import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isFoeOrBranchManagerOrCeo, isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const status = searchParams.get('status');
    const reassignmentType = searchParams.get('reassignmentType');

    // Build WHERE conditions
    let whereConditions = [];
    let replacements = [];

    if (leadId) {
      whereConditions.push('lr.leadId = ?');
      replacements.push(leadId);
    }

    if (status && status !== 'pending') {
      whereConditions.push('1 = 0');
    }

    if (reassignmentType) {
      whereConditions.push('lr.reassignmentType = ?');
      replacements.push(reassignmentType);
    }

    // requireAuth above has no permission requirement (any authenticated
    // user), so this needs its own visibility clamp: CEO sees everything,
    // Branch Manager their own branch, everyone else only reassignments
    // they were personally involved in.
    if (!isCeo(auth)) {
      if (isBranchManagerOrCeo(auth)) {
        whereConditions.push('l.branch = ?');
        replacements.push(auth.branch || 0);
      } else {
        whereConditions.push('(lr.fromEmployeeId = ? OR lr.toEmployeeId = ? OR lr.createdBy = ?)');
        replacements.push(auth.id, auth.id, auth.id);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [reassignments] = await sequelize.query(`
      SELECT 
        lr.*,
        'pending' as status,
        NULL as approvedBy,
        NULL as approvedAt,
        NULL as notes,
        l.fname, l.lname, l.email, l.mobile,
        e_from.name as fromEmployeeName,
        e_to.name as toEmployeeName,
        NULL as approvedEmployeeName,
        e_cre.name as createdEmployeeName
      FROM crm_lead_reassignments lr
      LEFT JOIN crm_forum_leads l ON lr.leadId = l.id
      LEFT JOIN crm_employee e_from ON lr.fromEmployeeId = e_from.id
      LEFT JOIN crm_employee e_to ON lr.toEmployeeId = e_to.id
      LEFT JOIN crm_employee e_cre ON lr.createdBy = e_cre.id
      ${whereClause}
      ORDER BY lr.createdAt DESC
    `, {
      replacements
    });

    return NextResponse.json({
      success: true,
      data: reassignments
    });
  } catch (error) {
    console.error('Error fetching lead reassignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead reassignments' },
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
    // Manager/CEO, matching lead-reassignments-working — anyone authenticated
    // can still file a pending request.
    if (body.autoApprove && !isFoeOrBranchManagerOrCeo(auth)) {
      return NextResponse.json(
        { success: false, error: 'Only FOE, Branch Manager, or CEO can auto-approve a lead reassignment' },
        { status: 403 }
      );
    }

    const [reassignmentResult] = await sequelize.query(`
      INSERT INTO crm_lead_reassignments (
        leadId, fromEmployeeId, toEmployeeId, reassignmentType, reason,
        previousStatus, newStatus, reassignmentDate, createdBy,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        body.createdBy,
        new Date(),
        new Date()
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Lead reassignment created successfully',
      data: { id: (reassignmentResult as any).insertId }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead reassignment:', error);
    return NextResponse.json(
      { error: 'Failed to create lead reassignment' },
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

    const [existingResult] = await sequelize.query(`
      SELECT id FROM crm_lead_reassignments WHERE id = ?
    `, {
      replacements: [id]
    });

    if (!existingResult || (existingResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lead reassignment not found' },
        { status: 404 }
      );
    }

    const allowedFields = [
      'leadId',
      'fromEmployeeId',
      'toEmployeeId',
      'reassignmentType',
      'reason',
      'previousStatus',
      'newStatus',
      'reassignmentDate',
      'createdBy',
    ];
    const updateFields = Object.keys(body).filter((key) => allowedFields.includes(key));

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Lead reassignment unchanged',
      });
    }

    await sequelize.query(`
      UPDATE crm_lead_reassignments
      SET ${updateFields.map(key => `${key} = ?`).join(', ')},
        updatedAt = NOW()
      WHERE id = ?
    `, {
      replacements: [...updateFields.map((key) => body[key]), id]
    });

    return NextResponse.json({
      success: true,
      message: 'Lead reassignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead reassignment:', error);
    return NextResponse.json(
      { error: 'Failed to update lead reassignment' },
      { status: 500 }
    );
  }
}
