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
    const status = searchParams.get('status');
    const oldNew = searchParams.get('oldNew');
    const searchTerm = searchParams.get('search');

    // Build WHERE conditions
    let whereConditions = [];
    let replacements = [];

    if (status && status !== 'all') {
      whereConditions.push('p.status = ?');
      replacements.push(status);
    }

    if (oldNew && oldNew !== 'all') {
      whereConditions.push('p.oldNew = ?');
      replacements.push(oldNew);
    }

    if (searchTerm) {
      whereConditions.push('(p.agreementNumber LIKE ? OR p.noc LIKE ? OR e.name LIKE ?)');
      replacements.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get prospects with related data
    const [prospectsResult] = await sequelize.query(`
      SELECT 
        p.*,
        e.name as counselorName,
        e.email as counselorEmail,
        COUNT(d.id) as documentCount,
        COUNT(r.id) as remarkCount
      FROM crm_prospects p
      LEFT JOIN crm_employee e ON p.counselorId = e.id
      LEFT JOIN crm_prospect_documents d ON p.id = d.prospectId
      LEFT JOIN crm_prospect_remarks r ON p.id = r.prospectId
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.createdAt DESC
    `, {
      replacements
    });

    // Get documents and remarks for each prospect
    const prospects = await Promise.all(
      (prospectsResult as any[]).map(async (prospect: any) => {
        // Get documents
        const [documentsResult] = await sequelize.query(`
          SELECT id, name, uploadDate, url, type
          FROM crm_prospect_documents
          WHERE prospectId = ?
          ORDER BY uploadDate DESC
        `, {
          replacements: [prospect.id]
        });

        // Get remarks
        const [remarksResult] = await sequelize.query(`
          SELECT r.id, r.date, r.remark, r.employeeId, e.name as employeeName
          FROM crm_prospect_remarks r
          LEFT JOIN crm_employee e ON r.employeeId = e.id
          WHERE r.prospectId = ?
          ORDER BY r.date DESC
        `, {
          replacements: [prospect.id]
        });

        return {
          ...prospect,
          documents: documentsResult,
          remarks: remarksResult
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: prospects
    });

  } catch (error: any) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prospects: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['leads.create']);
  if (isAuthError(auth)) return auth;
  try {
    const formData = await request.formData();
    
    const agreementNumber = formData.get('agreementNumber') as string;
    const oldNew = formData.get('oldNew') as string;
    const noc = formData.get('noc') as string;
    const remark = formData.get('remark') as string;
    const document = formData.get('document') as File | null;

    if (!agreementNumber || !noc) {
      return NextResponse.json(
        { success: false, error: 'Agreement number and NOC are required' },
        { status: 400 }
      );
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Create prospect
      const [prospectResult] = await sequelize.query(`
        INSERT INTO crm_prospects (
          agreementNumber, date, oldNew, noc, counselorId, status,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          agreementNumber,
          new Date().toISOString().split('T')[0],
          oldNew || 'new',
          noc,
          1, // Default counselor ID - would come from auth context
          'pending'
        ],
        transaction
      });

      const prospectId = (prospectResult as any).insertId;

      // Add initial remark if provided
      if (remark && remark.trim()) {
        await sequelize.query(`
          INSERT INTO crm_prospect_remarks (
            prospectId, date, remark, employeeId, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            prospectId,
            new Date().toISOString().split('T')[0],
            remark.trim(),
            1 // Default employee ID - would come from auth context
          ],
          transaction
        });
      }

      // Handle document upload
      if (document) {
        // In a real implementation, you would save the file to storage
        // For now, we'll just store the metadata
        const documentUrl = `/uploads/prospects/${prospectId}_${document.name}`;
        
        await sequelize.query(`
          INSERT INTO crm_prospect_documents (
            prospectId, name, uploadDate, url, type, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            prospectId,
            document.name,
            new Date().toISOString().split('T')[0],
            documentUrl,
            document.type.split('/')[0] || 'document'
          ],
          transaction
        });
      }

      // Commit transaction
      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: 'Prospect created successfully',
        data: {
          id: prospectId,
          agreementNumber,
          noc,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

  } catch (error: any) {
    console.error('Error creating prospect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create prospect: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['leads.update']);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const { id, status, counselorId, remark } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prospect ID is required' },
        { status: 400 }
      );
    }

    // Update prospect
    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (counselorId) updateData.counselorId = counselorId;

    await sequelize.query(`
      UPDATE crm_prospects 
      SET ${Object.keys(updateData).map(key => `${key} = ?`).join(', ')}
      WHERE id = ?
    `, {
      replacements: [...Object.values(updateData), id]
    });

    // Add remark if provided
    if (remark && remark.trim()) {
      await sequelize.query(`
        INSERT INTO crm_prospect_remarks (
          prospectId, date, remark, employeeId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          id,
          new Date().toISOString().split('T')[0],
          remark.trim(),
          1 // Default employee ID - would come from auth context
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Prospect updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating prospect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prospect: ' + error.message },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: 'Prospect ID is required' },
        { status: 400 }
      );
    }

    // Delete related records first
    await sequelize.query(`DELETE FROM crm_prospect_documents WHERE prospectId = ?`, {
      replacements: [id]
    });

    await sequelize.query(`DELETE FROM crm_prospect_remarks WHERE prospectId = ?`, {
      replacements: [id]
    });

    // Delete prospect
    await sequelize.query(`DELETE FROM crm_prospects WHERE id = ?`, {
      replacements: [id]
    });

    return NextResponse.json({
      success: true,
      message: 'Prospect deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting prospect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete prospect: ' + error.message },
      { status: 500 }
    );
  }
}
