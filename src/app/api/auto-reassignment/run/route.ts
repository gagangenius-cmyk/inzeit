import { NextRequest, NextResponse } from 'next/server';
import { CrmcForumLeads, CrmcLeadReassignments, CrmEmployee } from '@/models';
import { sequelize } from '@/lib/sequelize';
import { Op, QueryTypes } from 'sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { recordLeadAssignment } from '@/lib/leadRemarks';

type Rule = {
  id: number;
  rule_name: string;
  inactive_hours_threshold: number;
  reassign_to_role: string;
  reassign_to_branch: number;
  priority_filter: string;
  lead_quality_filter: string;
};

const ensureRunTable = () =>
  sequelize.query(`
    CREATE TABLE IF NOT EXISTS crm_auto_reassignment_runs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      processed INT NOT NULL DEFAULT 0,
      reassigned INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
};

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['transfers.manage']);
  if (isAuthError(auth)) return auth;
  try {
    await ensureRulesTable();
    const activeRules = await sequelize.query<Rule>(
      'SELECT * FROM crm_auto_reassignment_rules WHERE is_active = 1 AND auto_reassign = 1',
      { type: QueryTypes.SELECT }
    );

    if (activeRules.length === 0) {
      return NextResponse.json({
        message: 'No active reassignment rules found',
        processed: 0,
        reassigned: 0,
      });
    }

    let processed = 0;
    let reassigned = 0;

    for (const rule of activeRules) {
      const leads = await sequelize.query<any>(
        `SELECT *
         FROM crm_forum_leads
         WHERE assignTo IS NOT NULL
           AND TIMESTAMPDIFF(
             HOUR,
             COALESCE(STR_TO_DATE(last_updated, '%Y-%m-%d'), created),
             NOW()
           ) >= :hours
           AND (:priority = '' OR priority = :priority)
           AND (:quality = '' OR lead_quality = :quality)
         LIMIT 100`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            hours: rule.inactive_hours_threshold,
            priority: rule.priority_filter || '',
            quality: rule.lead_quality_filter || '',
          },
        }
      );

      for (const lead of leads) {
        processed++;
        const targetEmployeeId = await findTargetEmployee(rule, lead.assignTo);

        if (!targetEmployeeId || targetEmployeeId === lead.assignTo) {
          continue;
        }

        await CrmcLeadReassignments.create({
          leadId: lead.id,
          fromEmployeeId: lead.assignTo || 0,
          toEmployeeId: targetEmployeeId,
          reassignmentType: 'automatic',
          reason: `Auto reassignment by rule: ${rule.rule_name}`,
          previousStatus: lead.status || '',
          newStatus: 'reassigned',
          reassignmentDate: new Date(),
          notes: null,
          approvedBy: 1,
          status: 'approved',
          approvedAt: new Date(),
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await CrmcForumLeads.update(
          {
            assignTo: targetEmployeeId,
            status: 'reassigned',
            last_updated: new Date().toISOString().slice(0, 10),
          },
          { where: { id: lead.id } }
        );

        await recordLeadAssignment({
          leadId: lead.id,
          oldAssignTo: lead.assignTo || null,
          newAssignTo: targetEmployeeId,
          actorId: auth.id,
          actorRole: `${auth.roleName || auth.type} (auto-reassignment rule: ${rule.rule_name})`,
        });

        reassigned++;
      }
    }

    await ensureRunTable();
    await sequelize.query(
      'INSERT INTO crm_auto_reassignment_runs (processed, reassigned) VALUES (:processed, :reassigned)',
      { replacements: { processed, reassigned } }
    );

    return NextResponse.json({
      message: 'Auto reassignment completed',
      processed,
      reassigned,
      lastRunTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error running auto reassignment:', error);
    return NextResponse.json(
      { error: 'Failed to run auto reassignment' },
      { status: 500 }
    );
  }
}

async function findTargetEmployee(rule: Rule, currentEmployeeId: number) {
  const where: Record<string, unknown> = {
    status: 1,
    id: { [Op.ne]: currentEmployeeId || 0 },
  };

  if (rule.reassign_to_branch) {
    where.branch = rule.reassign_to_branch;
  }

  const employee = await CrmEmployee.findOne({
    where,
    attributes: ['id'],
    order: [['id', 'ASC']],
  });

  return employee?.id || null;
}
