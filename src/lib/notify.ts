import { QueryTypes } from 'sequelize';
import { sequelize } from './sequelize';
import { CrmcNotifications } from '@/models';

export async function notifyUser({
  userId,
  type,
  title,
  message,
  priority = 'medium',
  link,
  relatedId,
  relatedType,
}: {
  userId: number | null | undefined;
  type: string;
  title: string;
  message: string;
  priority?: string;
  link?: string | null;
  relatedId?: number | null;
  relatedType?: string | null;
}) {
  if (!userId) return;
  await CrmcNotifications.create({
    user_id: Number(userId),
    type,
    title,
    message,
    priority,
    link: link || null,
    related_id: relatedId ?? null,
    related_type: relatedType ?? null,
  });
}

// Broadcasts to every employee whose crm_role.type matches roleType (e.g.
// 'accountant'), optionally scoped to one branch. Used where the recipient
// is "whoever holds this role" rather than a specific known user.
export async function notifyRole({
  roleType,
  branchId,
  type,
  title,
  message,
  priority = 'medium',
  link,
  relatedId,
  relatedType,
}: {
  roleType: string;
  branchId?: number | null;
  type: string;
  title: string;
  message: string;
  priority?: string;
  link?: string | null;
  relatedId?: number | null;
  relatedType?: string | null;
}) {
  const conditions = ['r.type = :roleType', 'e.status = 1'];
  const replacements: Record<string, unknown> = { roleType };
  if (branchId) {
    conditions.push('e.branch = :branchId');
    replacements.branchId = branchId;
  }

  const employees = await sequelize.query<{ id: number }>(
    `SELECT e.id FROM crm_employee e
     INNER JOIN crm_role r ON r.id = e.role
     WHERE ${conditions.join(' AND ')}`,
    { replacements, type: QueryTypes.SELECT }
  );

  await Promise.all(employees.map((e) => notifyUser({ userId: e.id, type, title, message, priority, link, relatedId, relatedType })));
}
