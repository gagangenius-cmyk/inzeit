import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { recordLeadAssignment } from '@/lib/leadRemarks';
import { resolveLeadAssignment } from '@/lib/assignmentRuleEngine';
import { pushLeadPoolEvent } from '@/lib/pusherServer';

// Core "Lead Pool" mechanics: a lead with no owner (assignTo IS NULL) is
// poolable - visible to every active agent in its branch, claimable by
// whoever gets there first, and swept up by an SLA timer if nobody does.
// This sits alongside (not instead of) the existing admin bulk-transfer tool
// in src/app/api/admin/lead-pool/route.ts, which pushes leads to a specific
// counsellor; this module is the self-serve pull side of the same pool.

export const DEFAULT_SLA_MINUTES = 30;

export function getSlaMinutes(): number {
  const raw = Number(process.env.LEAD_POOL_SLA_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SLA_MINUTES;
}

export type ClaimResult =
  | { success: true; leadName: string }
  | { success: false, reason: 'already_claimed' | 'not_found' };

// Atomic claim: the UPDATE's WHERE clause re-checks "still unassigned" at the
// database level, so two agents racing to claim the same lead can't both
// win - whoever's UPDATE actually matches a row (affectedRows === 1) gets it,
// the loser's affectedRows is 0 and they're told it's already gone instead of
// silently overwriting the winner's claim a moment later.
export async function claimLead({
  leadId,
  employeeId,
  actorRole,
}: {
  leadId: number;
  employeeId: number;
  actorRole?: string | null;
}): Promise<ClaimResult> {
  const [leadRow] = await sequelize.query<{ id: number; fname: string; lname: string; branch: number | null }>(
    `SELECT id, fname, lname, branch FROM crm_forum_leads WHERE id = :leadId LIMIT 1`,
    { replacements: { leadId }, type: QueryTypes.SELECT },
  );
  if (!leadRow) return { success: false, reason: 'not_found' };

  await sequelize.query(
    `UPDATE crm_forum_leads
     SET assignTo = :employeeId, Counsilor = :employeeId, pool_entered_at = NULL
     WHERE id = :leadId AND (assignTo IS NULL OR assignTo = 0)`,
    { replacements: { employeeId, leadId } },
  );

  // Re-check who actually ended up owning the row rather than trust the
  // UPDATE's affectedRows shape (mysql2/Sequelize's typing for it is
  // inconsistent across query styles) - this is the real source of truth for
  // whether *this* request's claim won the race.
  const claimed = await sequelize.query<{ assignTo: number | null }>(
    `SELECT assignTo FROM crm_forum_leads WHERE id = :leadId LIMIT 1`,
    { replacements: { leadId }, type: QueryTypes.SELECT },
  );
  if (Number(claimed[0]?.assignTo) !== Number(employeeId)) {
    return { success: false, reason: 'already_claimed' };
  }

  await recordLeadAssignment({
    leadId,
    oldAssignTo: null,
    newAssignTo: employeeId,
    actorId: employeeId,
    actorRole: actorRole ? `${actorRole} (self-claimed from pool)` : 'Self-claimed from pool',
  });

  if (leadRow.branch) {
    await pushLeadPoolEvent(leadRow.branch, 'lead-pool:claimed', { leadId });
  }

  return { success: true, leadName: `${leadRow.fname} ${leadRow.lname}`.trim() || `Lead #${leadId}` };
}

export type ReleaseResult =
  | { success: true }
  | { success: false; reason: 'not_found' | 'already_unassigned' };

// Manager-initiated: pulls an already-owned lead back into the shared pool
// (e.g. an underperforming or overloaded agent). Stamps pool_entered_at with
// *now*, not the lead's original creation date, so the SLA sweep and the
// "waiting Xm" badge measure time since it re-entered the pool, not its
// entire lifetime.
export async function releaseToPool({
  leadId,
  actorId,
  actorRole,
}: {
  leadId: number;
  actorId: number;
  actorRole?: string | null;
}): Promise<ReleaseResult> {
  const [leadRow] = await sequelize.query<{ id: number; assignTo: number | null; branch: number | null }>(
    `SELECT id, assignTo, branch FROM crm_forum_leads WHERE id = :leadId LIMIT 1`,
    { replacements: { leadId }, type: QueryTypes.SELECT },
  );
  if (!leadRow) return { success: false, reason: 'not_found' };
  if (!leadRow.assignTo) return { success: false, reason: 'already_unassigned' };

  await sequelize.query(
    `UPDATE crm_forum_leads SET assignTo = NULL, Counsilor = NULL, pool_entered_at = NOW() WHERE id = :leadId`,
    { replacements: { leadId } },
  );

  await recordLeadAssignment({
    leadId,
    oldAssignTo: leadRow.assignTo,
    newAssignTo: null,
    actorId,
    actorRole: actorRole ? `${actorRole} (released to pool)` : 'Released to pool',
  });

  if (leadRow.branch) {
    await pushLeadPoolEvent(leadRow.branch, 'lead-pool:new', { leadId, branchId: leadRow.branch });
  }

  return { success: true };
}

export interface SlaSweepResult {
  scanned: number;
  autoAssigned: number;
  stillUnassignable: number;
}

// The SLA safety net: a lead nobody claims within getSlaMinutes() falls back
// to the same round-robin engine every other auto-assignment path already
// uses (src/lib/assignmentRuleEngine.ts), so a pool nobody is watching still
// gets everyone routed eventually instead of aging forever. Invoked on a
// schedule by src/lib/lead-pool-sla-cron.ts.
export async function runSlaSweep(limit = 200): Promise<SlaSweepResult> {
  const slaMinutes = getSlaMinutes();
  const overdueLeads = await sequelize.query<{ id: number; branch: number | null; priority: string | null }>(
    `SELECT id, branch, priority
     FROM crm_forum_leads
     WHERE (assignTo IS NULL OR assignTo = 0)
       AND TIMESTAMPDIFF(MINUTE, COALESCE(pool_entered_at, created), NOW()) >= :slaMinutes
     ORDER BY COALESCE(pool_entered_at, created) ASC
     LIMIT :limit`,
    { replacements: { slaMinutes, limit }, type: QueryTypes.SELECT },
  );

  let autoAssigned = 0;
  let stillUnassignable = 0;

  for (const lead of overdueLeads) {
    if (!lead.branch) { stillUnassignable++; continue; }
    try {
      const assignment = await resolveLeadAssignment({
        branchId: lead.branch,
        forceAutoAssign: true,
        roundRobin: true,
        priority: lead.priority || 'medium',
      });
      await sequelize.query(
        `UPDATE crm_forum_leads SET assignTo = :employeeId, Counsilor = :counselorId, pool_entered_at = NULL WHERE id = :leadId`,
        { replacements: { employeeId: assignment.assignedEmployeeId, counselorId: assignment.counselorId, leadId: lead.id } },
      );
      await recordLeadAssignment({
        leadId: lead.id,
        oldAssignTo: null,
        newAssignTo: assignment.assignedEmployeeId,
        actorId: null,
        actorRole: `System (lead pool SLA sweep, ${slaMinutes}m timeout)`,
      });
      if (lead.branch) await pushLeadPoolEvent(lead.branch, 'lead-pool:claimed', { leadId: lead.id });
      autoAssigned++;
    } catch (error) {
      // "No active employees are available" (leadAutoAssignment.ts) is the
      // expected/common case for a branch with nobody checked in right now -
      // leave the lead in the pool and let the next sweep retry it, rather
      // than treating an empty office as an error.
      stillUnassignable++;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('No active employees are available')) {
        console.error(`Lead pool SLA sweep failed to auto-assign lead ${lead.id}:`, error);
      }
    }
  }

  return { scanned: overdueLeads.length, autoAssigned, stillUnassignable };
}
