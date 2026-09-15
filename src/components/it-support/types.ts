export interface ITSupportTicketRow {
  id: string;
  ticket_number: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_cost_aed: string | number | null;
  status: 'Open' | 'Resolved' | 'Closed' | 'Rejected';
  workflow_status: string;
  raised_by: number;
  raised_by_name?: string | null;
  branch_id: number;
  branch_name?: string | null;
  assigned_to: number | null;
  assigned_to_name?: string | null;
  due_at: string;
  created_at: string;
  updated_at: string;
}

export interface ITSupportTicketComment {
  id: string;
  ticket_id: string;
  author_id: number;
  author_name?: string | null;
  comment_type: 'Comment' | 'StatusChange' | 'System';
  body: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface ITSupportDashboardStats {
  openTickets: number;
  overdueTickets: number;
  awaitingItAction: number;
  resolvedClosed: number;
}
