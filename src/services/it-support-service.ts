import { QueryTypes } from 'sequelize';
import crypto from 'crypto';
import { sequelize } from '@/lib/sequelize';
import type { User } from '@/lib/auth';

export const ITSupportCategories = [
  'Laptop / Desktop Hardware',
  'Access & Accounts',
  'New Procurement',
  'Network & Internet',
  'Email & Communication',
  'Software & Licensing',
] as const;
export type ITSupportCategory = typeof ITSupportCategories[number];

export const ITSupportPriorities = ['High', 'Medium', 'Low'] as const;
export type ITSupportPriority = typeof ITSupportPriorities[number];

export type ITSupportWorkflowStatus =
  | 'IT Manager Review'
  | 'Branch Manager Review'
  | 'Director Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved Awaiting Confirmation'
  | 'Closed'
  | 'Rejected';

type StageReviewInput = {
  ticketId: string;
  actor: User;
  decision: 'Approved' | 'Rejected';
  comment?: string | null;
};

const tatHoursByPriority: Record<ITSupportPriority, number> = {
  High: 24,
  Medium: 48,
  Low: 72,
};

class TicketAccessError extends Error {}

type TicketRow = {
  id: string;
  ticket_number: string | null;
  title: string;
  description: string | null;
  category: ITSupportCategory;
  priority: ITSupportPriority;
  estimated_cost_aed: string | number | null;
  raised_by: number;
  branch_id: number;
  status: 'Open' | 'Resolved' | 'Closed' | 'Rejected';
  workflow_status: ITSupportWorkflowStatus;
  requires_branch_approval: number | boolean;
  requires_director_approval: number | boolean;
  assigned_to: number | null;
  due_at: string;
  [key: string]: unknown;
};

export class ITSupportService {
  static async getDirectorThresholdAed(): Promise<number> {
    const [row] = await sequelize.query<{ setting_value: string }>(
      `SELECT setting_value FROM crm_it_settings WHERE setting_key = 'director_approval_threshold_aed' LIMIT 1`,
      { type: QueryTypes.SELECT }
    );
    const value = Number(row?.setting_value);
    return Number.isFinite(value) ? value : 2000;
  }

  static async setDirectorThresholdAed(actor: User, valueAed: number) {
    await sequelize.query(
      `
        INSERT INTO crm_it_settings (setting_key, setting_value, updated_by)
        VALUES ('director_approval_threshold_aed', :value, :updatedBy)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)
      `,
      { replacements: { value: String(valueAed), updatedBy: actor.id } }
    );
    return { director_approval_threshold_aed: valueAed };
  }

  private static async logActivity(
    ticketId: string,
    authorId: number,
    body: string,
    commentType: 'Comment' | 'StatusChange' | 'System' = 'System',
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    await sequelize.query(
      `
        INSERT INTO crm_it_ticket_comments (id, ticket_id, author_id, comment_type, body, old_value, new_value)
        VALUES (:id, :ticketId, :authorId, :commentType, :body, :oldValue, :newValue)
      `,
      {
        replacements: {
          id: crypto.randomUUID(),
          ticketId,
          authorId,
          commentType,
          body,
          oldValue: oldValue ?? null,
          newValue: newValue ?? null,
        },
      }
    );
  }

  private static async assignTicketNumber(id: string) {
    const [row] = await sequelize.query<{ ticket_seq: number; created_at: string }>(
      'SELECT ticket_seq, created_at FROM crm_it_tickets WHERE id = :id LIMIT 1',
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!row) return null;
    const year = new Date(row.created_at).getFullYear();
    const ticketNumber = `IT-${year}-${String(row.ticket_seq).padStart(6, '0')}`;
    await sequelize.query('UPDATE crm_it_tickets SET ticket_number = :ticketNumber WHERE id = :id', {
      replacements: { ticketNumber, id },
    });
    return ticketNumber;
  }

  private static canViewAll(actor: User) {
    return actor.permissions?.includes('all') || actor.permissions?.includes('it.view');
  }

  private static canApproveBranch(actor: User) {
    return actor.permissions?.includes('all') || actor.permissions?.includes('it.approve.branch');
  }

  private static assertVisible(ticket: TicketRow, actor: User) {
    if (this.canViewAll(actor)) return;
    if (this.canApproveBranch(actor) && Number(ticket.branch_id) === Number(actor.branch)) return;
    if (Number(ticket.raised_by) === Number(actor.id)) return;
    throw new TicketAccessError('You do not have access to this ticket');
  }

  private static visibilityScopeSql(actor: User, alias = 't') {
    if (this.canViewAll(actor)) return { clause: '1 = 1', replacements: {} as Record<string, unknown> };
    if (this.canApproveBranch(actor)) {
      return {
        clause: `(${alias}.branch_id = :actorBranch OR ${alias}.raised_by = :actorId)`,
        replacements: { actorBranch: actor.branch, actorId: actor.id },
      };
    }
    return { clause: `${alias}.raised_by = :actorId`, replacements: { actorId: actor.id } };
  }

  static async createTicket(input: {
    title: string;
    description?: string | null;
    category: ITSupportCategory;
    priority: ITSupportPriority;
    estimated_cost_aed?: number | null;
    branch_id?: number | null;
  }, actor: User) {
    if (!input.title?.trim()) throw new Error('title is required');
    if (!ITSupportCategories.includes(input.category)) throw new Error('category is invalid');
    if (!ITSupportPriorities.includes(input.priority)) throw new Error('priority is invalid');

    const requiresBranchApproval = input.category === 'New Procurement';
    let requiresDirectorApproval = false;
    if (requiresBranchApproval && input.estimated_cost_aed != null) {
      const threshold = await this.getDirectorThresholdAed();
      requiresDirectorApproval = Number(input.estimated_cost_aed) >= threshold;
    }

    const id = crypto.randomUUID();
    const branchId = input.branch_id ?? actor.branch;
    const dueHours = tatHoursByPriority[input.priority];

    await sequelize.query(
      `
        INSERT INTO crm_it_tickets (
          id, title, description, category, priority, estimated_cost_aed,
          raised_by, branch_id, status, workflow_status,
          requires_branch_approval, requires_director_approval,
          branch_manager_status, director_status, due_at
        ) VALUES (
          :id, :title, :description, :category, :priority, :estimatedCostAed,
          :raisedBy, :branchId, 'Open', 'IT Manager Review',
          :requiresBranchApproval, :requiresDirectorApproval,
          :branchManagerStatus, :directorStatus, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL :dueHours HOUR)
        )
      `,
      {
        replacements: {
          id,
          title: input.title.trim(),
          description: input.description || null,
          category: input.category,
          priority: input.priority,
          estimatedCostAed: input.estimated_cost_aed ?? null,
          raisedBy: actor.id,
          branchId,
          requiresBranchApproval,
          requiresDirectorApproval,
          branchManagerStatus: requiresBranchApproval ? 'Pending' : 'Not Required',
          directorStatus: requiresDirectorApproval ? 'Pending' : 'Not Required',
          dueHours,
        },
      }
    );

    const ticketNumber = await this.assignTicketNumber(id);
    await this.logActivity(id, actor.id, `Ticket raised by ${actor.name}`, 'System');

    return this.getTicketDetail(id, actor);
  }

  static async listTickets(actor: User, filters: {
    tab?: string;
    category?: string;
    priority?: string;
    branchId?: number;
    search?: string;
    mine?: boolean;
    limit?: number;
  } = {}) {
    const scope = this.visibilityScopeSql(actor);
    const conditions = [scope.clause];
    const replacements: Record<string, unknown> = { ...scope.replacements, limit: filters.limit || 200 };

    // "My Tickets" means "tickets I raised" for everyone — except CEO/IT (and
    // anyone else with full view-all rights), who see every ticket there too,
    // since they already have company-wide oversight on the main dashboard.
    if (filters.mine && !this.canViewAll(actor)) {
      conditions.push('t.raised_by = :mineId');
      replacements.mineId = actor.id;
    }
    if (filters.tab && filters.tab !== 'All') {
      conditions.push('t.workflow_status = :tab');
      replacements.tab = filters.tab;
    }
    if (filters.category) {
      conditions.push('t.category = :category');
      replacements.category = filters.category;
    }
    if (filters.priority) {
      conditions.push('t.priority = :priority');
      replacements.priority = filters.priority;
    }
    if (filters.branchId) {
      conditions.push('t.branch_id = :branchId');
      replacements.branchId = filters.branchId;
    }
    if (filters.search) {
      conditions.push('(t.title LIKE :search OR t.ticket_number LIKE :search)');
      replacements.search = `%${filters.search}%`;
    }

    return sequelize.query(
      `
        SELECT
          t.id, t.ticket_number, t.title, t.description, t.category, t.priority,
          t.estimated_cost_aed, t.status, t.workflow_status, t.raised_by,
          raiser.name AS raised_by_name, t.branch_id, b.branch AS branch_name,
          t.assigned_to, assignee.name AS assigned_to_name,
          t.due_at, t.created_at, t.updated_at
        FROM crm_it_tickets t
        LEFT JOIN crm_employee raiser ON raiser.id = t.raised_by
        LEFT JOIN crm_employee assignee ON assignee.id = t.assigned_to
        LEFT JOIN crm_branch b ON b.id = t.branch_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY t.created_at DESC
        LIMIT :limit
      `,
      { replacements, type: QueryTypes.SELECT }
    );
  }

  static async getTicketDetail(ticketId: string, actor: User) {
    const [ticket] = await sequelize.query<TicketRow & Record<string, unknown>>(
      `
        SELECT
          t.*, raiser.name AS raised_by_name, b.branch AS branch_name,
          assignee.name AS assigned_to_name,
          itManager.name AS it_manager_name,
          branchManager.name AS branch_manager_name,
          director.name AS director_name
        FROM crm_it_tickets t
        LEFT JOIN crm_employee raiser ON raiser.id = t.raised_by
        LEFT JOIN crm_employee assignee ON assignee.id = t.assigned_to
        LEFT JOIN crm_branch b ON b.id = t.branch_id
        LEFT JOIN crm_employee itManager ON itManager.id = t.it_manager_id
        LEFT JOIN crm_employee branchManager ON branchManager.id = t.branch_manager_id
        LEFT JOIN crm_employee director ON director.id = t.director_id
        WHERE t.id = :id
        LIMIT 1
      `,
      { replacements: { id: ticketId }, type: QueryTypes.SELECT }
    );
    if (!ticket) throw new Error('Ticket not found');
    this.assertVisible(ticket, actor);

    const comments = await this.listComments(ticketId, actor);
    return { ticket, comments };
  }

  static async listComments(ticketId: string, actor: User) {
    const [ticket] = await sequelize.query<TicketRow>(
      'SELECT id, raised_by, branch_id FROM crm_it_tickets WHERE id = :id LIMIT 1',
      { replacements: { id: ticketId }, type: QueryTypes.SELECT }
    );
    if (!ticket) throw new Error('Ticket not found');
    this.assertVisible(ticket, actor);

    return sequelize.query(
      `
        SELECT c.id, c.ticket_id, c.author_id, author.name AS author_name,
               c.comment_type, c.body, c.old_value, c.new_value, c.created_at
        FROM crm_it_ticket_comments c
        LEFT JOIN crm_employee author ON author.id = c.author_id
        WHERE c.ticket_id = :ticketId
        ORDER BY c.created_at ASC
      `,
      { replacements: { ticketId }, type: QueryTypes.SELECT }
    );
  }

  static async addComment(ticketId: string, actor: User, body: string) {
    if (!body?.trim()) throw new Error('Comment body is required');
    const [ticket] = await sequelize.query<TicketRow>(
      'SELECT id, raised_by, branch_id FROM crm_it_tickets WHERE id = :id LIMIT 1',
      { replacements: { id: ticketId }, type: QueryTypes.SELECT }
    );
    if (!ticket) throw new Error('Ticket not found');
    this.assertVisible(ticket, actor);
    await this.logActivity(ticketId, actor.id, body.trim(), 'Comment');
    return { success: true };
  }

  private static async getTicketForTransition(ticketId: string) {
    const [ticket] = await sequelize.query<TicketRow>(
      'SELECT * FROM crm_it_tickets WHERE id = :id LIMIT 1',
      { replacements: { id: ticketId }, type: QueryTypes.SELECT }
    );
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
  }

  private static assertNotSelfApproval(ticket: TicketRow, actor: User) {
    if (Number(ticket.raised_by) === Number(actor.id)) {
      throw new Error('You cannot approve or reject a ticket you raised yourself');
    }
  }

  static async reviewByItManager({ ticketId, actor, decision, comment }: StageReviewInput) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'IT Manager Review') throw new Error('Ticket is not awaiting IT Manager review');
    this.assertNotSelfApproval(ticket, actor);

    if (decision === 'Rejected') {
      await sequelize.query(
        `
          UPDATE crm_it_tickets SET
            it_manager_id = :actorId, it_manager_status = 'Rejected', it_manager_reviewed_at = CURRENT_TIMESTAMP,
            it_manager_comment = :comment, status = 'Rejected', workflow_status = 'Rejected',
            rejected_by = :actorId, rejected_at = CURRENT_TIMESTAMP, rejected_stage = 'IT Manager', rejection_reason = :comment
          WHERE id = :id
        `,
        { replacements: { id: ticketId, actorId: actor.id, comment: comment || null } }
      );
      await this.logActivity(ticketId, actor.id, `Rejected at IT Manager review${comment ? `: ${comment}` : ''}`, 'StatusChange', ticket.workflow_status, 'Rejected');
      return this.getTicketDetail(ticketId, actor);
    }

    const nextStatus: ITSupportWorkflowStatus = ticket.requires_branch_approval
      ? 'Branch Manager Review'
      : 'Assigned';

    await sequelize.query(
      `
        UPDATE crm_it_tickets SET
          it_manager_id = :actorId, it_manager_status = 'Approved', it_manager_reviewed_at = CURRENT_TIMESTAMP,
          it_manager_comment = :comment, workflow_status = :nextStatus
        WHERE id = :id
      `,
      { replacements: { id: ticketId, actorId: actor.id, comment: comment || null, nextStatus } }
    );
    await this.logActivity(ticketId, actor.id, `Approved at IT Manager review, moved to ${nextStatus}`, 'StatusChange', ticket.workflow_status, nextStatus);
    return this.getTicketDetail(ticketId, actor);
  }

  static async reviewByBranchManager({ ticketId, actor, decision, comment }: StageReviewInput) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'Branch Manager Review') throw new Error('Ticket is not awaiting Branch Manager review');
    this.assertNotSelfApproval(ticket, actor);
    if (!this.canViewAll(actor) && Number(ticket.branch_id) !== Number(actor.branch)) {
      throw new Error('You can only review tickets for your own branch');
    }

    if (decision === 'Rejected') {
      await sequelize.query(
        `
          UPDATE crm_it_tickets SET
            branch_manager_id = :actorId, branch_manager_status = 'Rejected', branch_manager_reviewed_at = CURRENT_TIMESTAMP,
            branch_manager_comment = :comment, status = 'Rejected', workflow_status = 'Rejected',
            rejected_by = :actorId, rejected_at = CURRENT_TIMESTAMP, rejected_stage = 'Branch Manager', rejection_reason = :comment
          WHERE id = :id
        `,
        { replacements: { id: ticketId, actorId: actor.id, comment: comment || null } }
      );
      await this.logActivity(ticketId, actor.id, `Rejected at Branch Manager review${comment ? `: ${comment}` : ''}`, 'StatusChange', ticket.workflow_status, 'Rejected');
      return this.getTicketDetail(ticketId, actor);
    }

    const nextStatus: ITSupportWorkflowStatus = ticket.requires_director_approval ? 'Director Review' : 'Assigned';

    await sequelize.query(
      `
        UPDATE crm_it_tickets SET
          branch_manager_id = :actorId, branch_manager_status = 'Approved', branch_manager_reviewed_at = CURRENT_TIMESTAMP,
          branch_manager_comment = :comment, workflow_status = :nextStatus
        WHERE id = :id
      `,
      { replacements: { id: ticketId, actorId: actor.id, comment: comment || null, nextStatus } }
    );
    await this.logActivity(ticketId, actor.id, `Approved at Branch Manager review, moved to ${nextStatus}`, 'StatusChange', ticket.workflow_status, nextStatus);
    return this.getTicketDetail(ticketId, actor);
  }

  static async reviewByDirector({ ticketId, actor, decision, comment }: StageReviewInput) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'Director Review') throw new Error('Ticket is not awaiting Director review');
    this.assertNotSelfApproval(ticket, actor);

    if (decision === 'Rejected') {
      await sequelize.query(
        `
          UPDATE crm_it_tickets SET
            director_id = :actorId, director_status = 'Rejected', director_reviewed_at = CURRENT_TIMESTAMP,
            director_comment = :comment, status = 'Rejected', workflow_status = 'Rejected',
            rejected_by = :actorId, rejected_at = CURRENT_TIMESTAMP, rejected_stage = 'Director', rejection_reason = :comment
          WHERE id = :id
        `,
        { replacements: { id: ticketId, actorId: actor.id, comment: comment || null } }
      );
      await this.logActivity(ticketId, actor.id, `Rejected at Director review${comment ? `: ${comment}` : ''}`, 'StatusChange', ticket.workflow_status, 'Rejected');
      return this.getTicketDetail(ticketId, actor);
    }

    await sequelize.query(
      `
        UPDATE crm_it_tickets SET
          director_id = :actorId, director_status = 'Approved', director_reviewed_at = CURRENT_TIMESTAMP,
          director_comment = :comment, workflow_status = 'Assigned'
        WHERE id = :id
      `,
      { replacements: { id: ticketId, actorId: actor.id, comment: comment || null } }
    );
    await this.logActivity(ticketId, actor.id, 'Approved at Director review, moved to Assigned', 'StatusChange', ticket.workflow_status, 'Assigned');
    return this.getTicketDetail(ticketId, actor);
  }

  static async assignTicket(ticketId: string, actor: User, assigneeId: number) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'Assigned') throw new Error('Ticket is not ready for assignment');

    await sequelize.query(
      `UPDATE crm_it_tickets SET assigned_to = :assigneeId, assigned_by = :actorId, assigned_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { replacements: { id: ticketId, assigneeId, actorId: actor.id } }
    );
    await this.logActivity(ticketId, actor.id, `Ticket assigned`, 'System');
    return this.getTicketDetail(ticketId, actor);
  }

  static async startProgress(ticketId: string, actor: User) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'Assigned') throw new Error('Ticket must be assigned before work can start');
    if (!ticket.assigned_to) throw new Error('Ticket has no assignee yet');
    if (Number(ticket.assigned_to) !== Number(actor.id) && !actor.permissions?.includes('all') && !actor.permissions?.includes('it.manage')) {
      throw new Error('Only the assignee can start progress on this ticket');
    }

    await sequelize.query(
      `UPDATE crm_it_tickets SET workflow_status = 'In Progress', in_progress_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { replacements: { id: ticketId } }
    );
    await this.logActivity(ticketId, actor.id, 'Work started', 'StatusChange', 'Assigned', 'In Progress');
    return this.getTicketDetail(ticketId, actor);
  }

  static async markResolved(ticketId: string, actor: User, resolutionNotes?: string | null) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'In Progress') throw new Error('Ticket must be in progress to resolve');
    if (Number(ticket.assigned_to) !== Number(actor.id) && !actor.permissions?.includes('all') && !actor.permissions?.includes('it.manage')) {
      throw new Error('Only the assignee can resolve this ticket');
    }

    await sequelize.query(
      `
        UPDATE crm_it_tickets SET
          workflow_status = 'Resolved Awaiting Confirmation', status = 'Resolved',
          resolved_by = :actorId, resolved_at = CURRENT_TIMESTAMP, resolution_notes = :notes
        WHERE id = :id
      `,
      { replacements: { id: ticketId, actorId: actor.id, notes: resolutionNotes || null } }
    );
    await this.logActivity(ticketId, actor.id, `Marked resolved${resolutionNotes ? `: ${resolutionNotes}` : ''}`, 'StatusChange', 'In Progress', 'Resolved Awaiting Confirmation');
    return this.getTicketDetail(ticketId, actor);
  }

  static async confirmClose(ticketId: string, actor: User) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'Resolved Awaiting Confirmation') throw new Error('Ticket is not awaiting confirmation');
    const isRaiser = Number(ticket.raised_by) === Number(actor.id);
    const canOverride = actor.permissions?.includes('all') || actor.permissions?.includes('it.manage');
    if (!isRaiser && !canOverride) throw new Error('Only the ticket raiser can confirm closure');

    await sequelize.query(
      `
        UPDATE crm_it_tickets SET
          workflow_status = 'Closed', status = 'Closed',
          confirmed_by = :actorId, confirmed_at = CURRENT_TIMESTAMP, closed_at = CURRENT_TIMESTAMP
        WHERE id = :id
      `,
      { replacements: { id: ticketId, actorId: actor.id } }
    );
    await this.logActivity(ticketId, actor.id, 'Ticket confirmed and closed', 'StatusChange', 'Resolved Awaiting Confirmation', 'Closed');
    return this.getTicketDetail(ticketId, actor);
  }

  static async reopenTicket(ticketId: string, actor: User, reason?: string | null) {
    const ticket = await this.getTicketForTransition(ticketId);
    if (ticket.workflow_status !== 'Resolved Awaiting Confirmation') throw new Error('Only a resolved ticket awaiting confirmation can be reopened');
    if (Number(ticket.raised_by) !== Number(actor.id)) throw new Error('Only the ticket raiser can reopen this ticket');

    await sequelize.query(
      `
        UPDATE crm_it_tickets SET
          workflow_status = 'In Progress', status = 'Open', reopened_count = reopened_count + 1
        WHERE id = :id
      `,
      { replacements: { id: ticketId } }
    );
    await this.logActivity(ticketId, actor.id, `Ticket reopened${reason ? `: ${reason}` : ''}`, 'StatusChange', 'Resolved Awaiting Confirmation', 'In Progress');
    return this.getTicketDetail(ticketId, actor);
  }

  static async getDashboardStats(actor: User) {
    const scope = this.visibilityScopeSql(actor);
    const [row] = await sequelize.query<{
      open_count: number;
      overdue_count: number;
      awaiting_it_action_count: number;
      resolved_closed_count: number;
    }>(
      `
        SELECT
          SUM(CASE WHEN t.status = 'Open' THEN 1 ELSE 0 END) AS open_count,
          SUM(CASE WHEN t.status = 'Open' AND t.due_at < NOW() THEN 1 ELSE 0 END) AS overdue_count,
          SUM(CASE WHEN t.workflow_status IN ('IT Manager Review', 'Assigned', 'In Progress') THEN 1 ELSE 0 END) AS awaiting_it_action_count,
          SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved_closed_count
        FROM crm_it_tickets t
        WHERE ${scope.clause}
      `,
      { replacements: scope.replacements, type: QueryTypes.SELECT }
    );

    return {
      openTickets: Number(row?.open_count || 0),
      overdueTickets: Number(row?.overdue_count || 0),
      awaitingItAction: Number(row?.awaiting_it_action_count || 0),
      resolvedClosed: Number(row?.resolved_closed_count || 0),
    };
  }
}

export { TicketAccessError };
