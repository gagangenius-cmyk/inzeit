import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['leads.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test') {
      return NextResponse.json({
        success: false,
        message: 'Synthetic lead CRUD tests are disabled. Use live lead APIs with real request data.',
        timestamp: new Date().toISOString()
      }, { status: 400 });
      
    } else {
      // Return current leads
      const [leads] = await sequelize.query('SELECT id, fname, lname, email, phone, status, priority, created FROM crm_forum_leads ORDER BY id DESC LIMIT 10');
      
      return NextResponse.json({
        success: true,
        data: leads,
        count: (leads as any[]).length,
        message: 'Leads retrieved successfully'
      });
    }
    
  } catch (error: any) {
    console.error('❌ Lead CRUD test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json({
      success: false,
      message: 'Lead CRUD test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['leads.create']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json({
        success: false,
        message: 'Lead email is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Get template from existing lead
    const [existingLead] = await sequelize.query('SELECT * FROM crm_forum_leads LIMIT 1');
    
    if ((existingLead as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No existing leads found to use as template',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const template = (existingLead as any)[0];
    
    // Create lead using template
    const createQuery = `
      INSERT INTO crm_forum_leads 
      (fname, mname, lname, email, phone, mobile, nationality, address, dob, gender, 
       id_number, id_expiry, id_issue_date, country_interest, sub_country_interest, 
       service_interest, market_source, sub_market_source, appointment, followup, 
       folowuptime, followupstat, enquiry, convet, priority, regdate, regtime, 
       last_updated, last_updtd_time, stepComplete, assignTo, case_officer, 
       Counsilor, branch, region, payTotal, discount, paidYet, payBalance, 
       status, created, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `;
    
    const [result] = await sequelize.query(createQuery, {
      replacements: [
        body.fname || template.fname,
        body.mname || template.mname,
        body.lname || template.lname,
        body.email,
        body.phone || template.phone,
        body.mobile || template.mobile,
        body.nationality || template.nationality,
        body.address || template.address,
        body.dob || template.dob,
        body.gender || template.gender,
        body.id_number || template.id_number,
        body.id_expiry || template.id_expiry,
        body.id_issue_date || template.id_issue_date,
        body.country_interest || template.country_interest,
        body.sub_country_interest || template.sub_country_interest,
        body.service_interest || template.service_interest,
        body.market_source || template.market_source,
        body.sub_market_source || template.sub_market_source,
        body.appointment || template.appointment,
        body.followup || template.followup,
        body.folowuptime || template.folowuptime,
        body.followupstat || template.followupstat,
        body.enquiry || template.enquiry,
        body.convet || template.convet,
        body.priority || template.priority,
        new Date().toISOString().split('T')[0], // regdate
        new Date().toTimeString().split(' ')[0], // regtime
        new Date().toISOString().split('T')[0], // last_updated
        new Date().toTimeString().split(' ')[0], // last_updtd_time
        template.stepComplete,
        template.assignTo,
        template.case_officer,
        template.Counsilor,
        template.branch,
        template.region,
        template.payTotal,
        template.discount,
        template.paidYet,
        template.payBalance,
        body.status || template.status,
        new Date(), // created
        template.created_by
      ]
    });
    
    const insertId = (result as any).insertId;
    
    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      data: { id: insertId, ...body },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Lead creation failed:', error.message);
    
    return NextResponse.json({
      success: false,
      message: 'Lead creation failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['leads.update']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Lead ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update lead
    const updateFields = [];
    const updateValues = [];

    if (body.fname !== undefined) {
      updateFields.push('fname = ?');
      updateValues.push(body.fname);
    }
    if (body.lname !== undefined) {
      updateFields.push('lname = ?');
      updateValues.push(body.lname);
    }
    if (body.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(body.email);
    }
    if (body.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(body.phone);
    }
    if (body.mobile !== undefined) {
      updateFields.push('mobile = ?');
      updateValues.push(body.mobile);
    }
    if (body.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(body.status);
    }
    if (body.priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(body.priority);
    }
    
    // Always update last_updated
    updateFields.push('last_updated = ?');
    updateValues.push(new Date().toISOString().split('T')[0]);
    
    if (updateFields.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid fields to update',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    const updateQuery = `UPDATE crm_forum_leads SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(id);
    
    await sequelize.query(updateQuery, {
      replacements: updateValues
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
      data: { id, ...body },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Lead update failed:', error.message);
    
    return NextResponse.json({
      success: false,
      message: 'Lead update failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const currentUser = token ? verifyToken(token) : null;
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Lead ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    // Check if lead exists
    const [checkResult] = await sequelize.query('SELECT id FROM crm_forum_leads WHERE id = ?', {
      replacements: [id]
    });
    
    if ((checkResult as any[]).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Lead not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    // Delete lead
    await sequelize.query('DELETE FROM crm_forum_leads WHERE id = ?', {
      replacements: [id]
    });
    
    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
      data: { id },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Lead deletion failed:', error.message);
    
    return NextResponse.json({
      success: false,
      message: 'Lead deletion failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
