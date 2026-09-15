import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { QueryTypes } from 'sequelize';
import { verifyToken } from '@/lib/auth';
import { isCeo } from '@/lib/roleChecks';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const ensureRulesTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_auto_reassignment_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rule_name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      inactive_hours_threshold INT NOT NULL DEFAULT 6,
      auto_reassign TINYINT(1) NOT NULL DEFAULT 1,
      reassign_to_role VARCHAR(50) NOT NULL DEFAULT 'available',
      reassign_to_branch INT NOT NULL DEFAULT 0,
      priority_filter VARCHAR(50) NOT NULL DEFAULT '',
      lead_quality_filter VARCHAR(100) NOT NULL DEFAULT '',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [{ count }] = await sequelize.query<{ count: number }>(
    'SELECT COUNT(*) AS count FROM crm_auto_reassignment_rules',
    { type: QueryTypes.SELECT }
  );

  if (Number(count) === 0) {
    await sequelize.query(`
      INSERT INTO crm_auto_reassignment_rules
        (rule_name, description, inactive_hours_threshold, auto_reassign, reassign_to_role, reassign_to_branch, is_active)
      VALUES
        ('Default 6-Hour Rule', 'Auto reassign leads untouched for 6+ hours', 6, 1, 'available', 0, 1)
    `);
  }
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureRulesTable();
    const rules = await sequelize.query('SELECT * FROM crm_auto_reassignment_rules ORDER BY id DESC', {
      type: QueryTypes.SELECT,
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Error fetching reassignment rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reassignment rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureRulesTable();
    const body = await request.json();

    const [result] = await sequelize.query(
      `INSERT INTO crm_auto_reassignment_rules
        (rule_name, description, inactive_hours_threshold, auto_reassign, reassign_to_role, reassign_to_branch, priority_filter, lead_quality_filter, is_active)
       VALUES (:rule_name, :description, :inactive_hours_threshold, :auto_reassign, :reassign_to_role, :reassign_to_branch, :priority_filter, :lead_quality_filter, :is_active)`,
      {
        replacements: {
          rule_name: body.rule_name,
          description: body.description || null,
          inactive_hours_threshold: body.inactive_hours_threshold || 6,
          auto_reassign: body.auto_reassign ?? true,
          reassign_to_role: body.reassign_to_role || 'available',
          reassign_to_branch: body.reassign_to_branch || 0,
          priority_filter: body.priority_filter || '',
          lead_quality_filter: body.lead_quality_filter || '',
          is_active: body.is_active ?? true,
        },
      }
    );

    return NextResponse.json({
      message: 'Reassignment rule saved successfully',
      ruleId: (result as any).insertId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving reassignment rule:', error);
    return NextResponse.json(
      { error: 'Failed to save reassignment rule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureRulesTable();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    await sequelize.query(
      `UPDATE crm_auto_reassignment_rules
       SET rule_name = :rule_name,
           description = :description,
           inactive_hours_threshold = :inactive_hours_threshold,
           auto_reassign = :auto_reassign,
           reassign_to_role = :reassign_to_role,
           reassign_to_branch = :reassign_to_branch,
           priority_filter = :priority_filter,
           lead_quality_filter = :lead_quality_filter,
           is_active = :is_active
       WHERE id = :id`,
      {
        replacements: {
          id: body.id,
          rule_name: body.rule_name,
          description: body.description || null,
          inactive_hours_threshold: body.inactive_hours_threshold || 6,
          auto_reassign: body.auto_reassign ?? true,
          reassign_to_role: body.reassign_to_role || 'available',
          reassign_to_branch: body.reassign_to_branch || 0,
          priority_filter: body.priority_filter || '',
          lead_quality_filter: body.lead_quality_filter || '',
          is_active: body.is_active ?? true,
        },
      }
    );

    return NextResponse.json({ message: 'Reassignment rule updated successfully' });
  } catch (error) {
    console.error('Error updating reassignment rule:', error);
    return NextResponse.json(
      { error: 'Failed to update reassignment rule' },
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

    await ensureRulesTable();
    const { searchParams } = new URL(request.url);
    const id = Number.parseInt(searchParams.get('id') || '', 10);

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    await sequelize.query('DELETE FROM crm_auto_reassignment_rules WHERE id = :id', {
      replacements: { id },
    });

    return NextResponse.json({ message: 'Reassignment rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting reassignment rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete reassignment rule' },
      { status: 500 }
    );
  }
}
