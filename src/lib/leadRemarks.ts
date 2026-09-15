import { Transaction, QueryTypes } from 'sequelize';
import { CrmRemarks } from '@/models/CrmRemarks';
import { sequelize } from '@/lib/sequelize';
import { notifyUser } from '@/lib/notify';
import { CACHE_TAGS, invalidateReportCaches } from '@/lib/reportCache';

export type LeadRemarkAction =
  | 'lead_created'
  | 'lead_assigned'
  | 'status_changed'
  | 'remark_added'
  | 'appointment_booked'
  | 'followup_added'
  | 'duplicate_detected'
  | 'operations_case_transfer'
  | 'operations_case_status_changed'
  | 'operations_task_reassigned';

interface LogLeadRemarkInput {
  leadId: number;
  action: LeadRemarkAction;
  remark: string;
  previousValue?: string | null;
  newValue?: string | null;
  actorId?: number | null;
  actorRole?: string | null;
  transaction?: Transaction;
}

/**
 * Records a major lead action (assignment, status change, remark, appointment,
 * follow-up) into crm_remarks. Never throws — a failed audit write must not
 * roll back or block the primary action it's logging.
 */
export async function logLeadRemark({
  leadId,
  action,
  remark,
  previousValue = null,
  newValue = null,
  actorId = null,
  actorRole = null,
  transaction,
}: LogLeadRemarkInput): Promise<void> {
  try {
    await CrmRemarks.create(
      { leadId, action, remark, previousValue, newValue, actorId, actorRole },
      { transaction }
    );
  } catch (error) {
    console.error('Failed to record lead activity in crm_remarks:', error);
  }
}

interface RecordLeadAssignmentInput {
  leadId: number;
  oldAssignTo: number | null;
  newAssignTo: number | null;
  actorId?: number | null;
  actorRole?: string | null;
  transaction?: Transaction;
}

/**
 * The single place every lead-assignment code path (manual reassignment,
 * lead-pool claim, auto-assignment, lead creation, ...) should call whenever
 * it changes a lead's assignTo. Stamps crm_forum_leads.transfer_date/
 * transfer_time/transfered/transfered_by (the "assigned since" audit fields
 * — already used correctly by the Edit Lead PUT flow, just not by any other
 * assignment path), logs a `lead_assigned` entry into crm_remarks recording
 * who assigned the lead to whom, and — only on a genuine unassigned→assigned
 * transition — clears a lead still sitting at the system-set 'untouched'
 * status to 'New', since it no longer meets "unassigned and untouched".
 *
 * No-ops if oldAssignTo === newAssignTo (re-saving the same assignee must
 * not reset the assigned-since date). Never throws, matching logLeadRemark.
 */
export async function recordLeadAssignment({
  leadId,
  oldAssignTo,
  newAssignTo,
  actorId = null,
  actorRole = null,
  transaction,
}: RecordLeadAssignmentInput): Promise<void> {
  if (oldAssignTo === newAssignTo) return;
  try {
    const employeeIds = [oldAssignTo, newAssignTo].filter((v): v is number => v !== null);
    const employeeNames = employeeIds.length
      ? await sequelize.query<{ id: number; name: string }>(
          'SELECT id, name FROM crm_employee WHERE id IN (:ids)',
          { replacements: { ids: employeeIds }, type: QueryTypes.SELECT, transaction }
        )
      : [];
    const nameOf = (empId: number | null) =>
      empId === null ? 'Unassigned' : employeeNames.find((e) => e.id === empId)?.name || `Employee #${empId}`;

    const now = new Date();
    const clearsUntouched = oldAssignTo === null && newAssignTo !== null;
    // crm_forum_leads.transfered_by is NOT NULL (a legacy constraint - see
    // leadDefaults.ts's own `transfered_by: data.transfered_by || 1`), but
    // every assignment path until now has always had a real human actorId.
    // The lead pool SLA sweep (src/lib/leadPool.ts runSlaSweep) is the first
    // fully-automatic path with no human actor at all - falls back to
    // employee id 1, the same "system" sentinel leadDefaults.ts already uses,
    // rather than violating the constraint and losing the audit trail entirely.
    await sequelize.query(
      `UPDATE crm_forum_leads
       SET transfer_date = ?, transfer_time = ?, transfered = 1, transfered_by = ?
           ${clearsUntouched ? ", status = IF(status = 'untouched', 'New', status)" : ''}
       WHERE id = ?`,
      {
        replacements: [now, now.toTimeString().split(' ')[0], actorId ?? 1, leadId],
        transaction,
      }
    );

    let actorLabel = actorRole ? `(${actorRole})` : '';
    if (actorId) {
      const [actorRow] = await sequelize.query<{ name: string }>(
        'SELECT name FROM crm_employee WHERE id = :id LIMIT 1',
        { replacements: { id: actorId }, type: QueryTypes.SELECT, transaction }
      );
      actorLabel = `${actorRow?.name || `Employee #${actorId}`} ${actorLabel}`.trim();
    } else {
      actorLabel = actorLabel || 'System';
    }

    await logLeadRemark({
      leadId,
      action: 'lead_assigned',
      remark: `Lead assigned from ${nameOf(oldAssignTo)} to ${nameOf(newAssignTo)} by ${actorLabel}`,
      previousValue: nameOf(oldAssignTo),
      newValue: nameOf(newAssignTo),
      actorId,
      actorRole,
      transaction,
    });

    // Notify the new owner - this is the single hook every assignment path
    // (manual, round robin, rule engine, inactivity reassignment) already
    // calls, so it's the one place a "lead assigned to you" alert can live
    // without wiring notifications into each individual call site.
    if (newAssignTo && newAssignTo !== actorId) {
      const [leadRow] = await sequelize.query<{ fname: string; lname: string }>(
        'SELECT fname, lname FROM crm_forum_leads WHERE id = :id LIMIT 1',
        { replacements: { id: leadId }, type: QueryTypes.SELECT, transaction }
      );
      const leadName = `${leadRow?.fname || ''} ${leadRow?.lname || ''}`.trim() || `Lead #${leadId}`;
      const byWhom = actorId ? ` by ${actorLabel}` : '';
      await notifyUser({
        userId: newAssignTo,
        type: 'lead_assigned',
        title: 'New lead assigned to you',
        message: `${leadName} has been assigned to you${byWhom}.`,
        priority: 'high',
        relatedId: leadId,
        relatedType: 'lead',
        link: `/admin/leads/${leadId}`,
      });
    }

    // Every reassignment path (manual, lead pool claim/release, bulk
    // transfer, round-robin, SLA sweep) funnels through this one function -
    // the choke point to invalidate cached dashboard/report aggregates.
    invalidateReportCaches([CACHE_TAGS.leads]);
  } catch (error) {
    console.error('Failed to record lead assignment:', error);
  }
}
