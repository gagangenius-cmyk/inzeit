import { CrmLeaveType } from '@/models/CrmLeaveType';

/**
 * Single source of truth for "which leave types exist" - reads crm_leave_type
 * instead of each caller hand-maintaining its own copy of the name list (this
 * used to be duplicated across 4 files and could silently drift out of sync).
 * Entitlement-days/category policy for each type is a separate concern (see
 * HRService.leaveEntitlements) and intentionally isn't stored here.
 */
export async function getActiveLeaveTypeNames(): Promise<string[]> {
  const rows = await CrmLeaveType.findAll({
    where: { status: 1 },
    order: [['id', 'ASC']],
    attributes: ['name'],
    raw: true,
  });
  return rows.map((r) => r.name);
}
