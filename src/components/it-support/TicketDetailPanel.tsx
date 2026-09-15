'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ITSupportTicketComment, ITSupportTicketRow } from './types';
import { WORKFLOW_STATUS_BADGE, PRIORITY_BADGE, formatDateTime } from './statusStyles';

interface TicketDetail extends ITSupportTicketRow {
  it_manager_name?: string | null;
  branch_manager_name?: string | null;
  director_name?: string | null;
  it_manager_comment?: string | null;
  branch_manager_comment?: string | null;
  director_comment?: string | null;
  resolution_notes?: string | null;
  requires_branch_approval: number | boolean;
  requires_director_approval: number | boolean;
}

export default function TicketDetailPanel({ ticketId, onClose, onChanged }: { ticketId: string; onClose: () => void; onChanged: () => void }) {
  const { user, token, hasPermission } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comments, setComments] = useState<ITSupportTicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/it-support/tickets/${ticketId}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load ticket');
      setTicket(data.ticket);
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, token]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/it-support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setTicket(data.ticket);
      setComments(data.comments || []);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/it-support/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ body: comment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add comment');
      setComment('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="rounded-lg bg-white px-6 py-4 text-sm text-slate-500">Loading ticket…</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-5">
          <p className="text-sm text-rose-600">{error || 'Ticket not found'}</p>
          <button onClick={onClose} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm">Close</button>
        </div>
      </div>
    );
  }

  const isRaiser = Number(ticket.raised_by) === Number(user?.id);
  const isAssignee = Number(ticket.assigned_to) === Number(user?.id);
  const canManage = hasPermission('it.manage');
  const overdue = ticket.status === 'Open' && new Date(ticket.due_at).getTime() < Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium text-slate-500">{ticket.ticket_number || 'Pending number'}</p>
            <h2 className="text-lg font-semibold text-slate-900">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className={`inline-flex rounded-full border px-2 py-1 font-medium ${WORKFLOW_STATUS_BADGE[ticket.workflow_status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {ticket.workflow_status}
            </span>
            <span className={`inline-flex rounded-full border px-2 py-1 font-medium ${PRIORITY_BADGE[ticket.priority] || ''}`}>
              {ticket.priority} priority
            </span>
            <span className="text-slate-500">{ticket.category}</span>
            <span className="text-slate-500">· {ticket.branch_name || `Branch #${ticket.branch_id}`}</span>
          </div>

          <p className="mb-4 whitespace-pre-wrap text-sm text-slate-700">{ticket.description || 'No description provided.'}</p>

          <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <div>Raised by: <span className="font-medium text-slate-900">{ticket.raised_by_name || `#${ticket.raised_by}`}</span></div>
            <div className={overdue ? 'font-medium text-rose-600' : ''}>
              TAT: {overdue ? `Overdue · ${formatDateTime(ticket.due_at)}` : formatDateTime(ticket.due_at)}
            </div>
            {ticket.assigned_to_name && <div>Assigned to: <span className="font-medium text-slate-900">{ticket.assigned_to_name}</span></div>}
            {ticket.estimated_cost_aed != null && <div>Est. cost: AED {Number(ticket.estimated_cost_aed).toLocaleString()}</div>}
          </div>

          {/* Actions */}
          <div className="mb-4 space-y-2">
            {ticket.workflow_status === 'IT Manager Review' && hasPermission('it.approve.manager') && !isRaiser && (
              <ActionRow
                label="IT Manager review"
                onApprove={() => runAction('approve_manager')}
                onReject={() => runAction('reject_manager')}
                disabled={actionLoading}
              />
            )}
            {ticket.workflow_status === 'Branch Manager Review' && hasPermission('it.approve.branch') && !isRaiser && (
              <ActionRow
                label="Branch Manager review"
                onApprove={() => runAction('approve_branch')}
                onReject={() => runAction('reject_branch')}
                disabled={actionLoading}
              />
            )}
            {ticket.workflow_status === 'Director Review' && hasPermission('it.approve.director') && !isRaiser && (
              <ActionRow
                label="Director review"
                onApprove={() => runAction('approve_director')}
                onReject={() => runAction('reject_director')}
                disabled={actionLoading}
              />
            )}
            {ticket.workflow_status === 'Assigned' && !ticket.assigned_to && canManage && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-3">
                <input
                  type="number"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  placeholder="IT Support Staff employee ID"
                  className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  disabled={actionLoading || !assigneeId}
                  onClick={() => runAction('assign', { assignee_id: Number(assigneeId) })}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Assign
                </button>
              </div>
            )}
            {ticket.workflow_status === 'Assigned' && ticket.assigned_to && (isAssignee || canManage) && (
              <button disabled={actionLoading} onClick={() => runAction('start_progress')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                Start progress
              </button>
            )}
            {ticket.workflow_status === 'In Progress' && (isAssignee || canManage) && (
              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Resolution notes"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button disabled={actionLoading} onClick={() => runAction('resolve', { resolution_notes: resolutionNotes || null })} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                  Mark resolved
                </button>
              </div>
            )}
            {ticket.workflow_status === 'Resolved Awaiting Confirmation' && (isRaiser || canManage) && (
              <div className="flex gap-2">
                <button disabled={actionLoading} onClick={() => runAction('confirm_close')} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                  Confirm &amp; close
                </button>
                {isRaiser && (
                  <button disabled={actionLoading} onClick={() => runAction('reopen')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60">
                    Reopen
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Activity / comments */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Activity</h3>
            <div className="space-y-2">
              {comments.map((item) => (
                <div key={item.id} className={`rounded-lg border px-3 py-2 text-sm ${item.comment_type === 'Comment' ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{item.author_name || `#${item.author_id}`}</span>
                    <span>{formatDateTime(item.created_at)}</span>
                  </div>
                  <p className={item.comment_type === 'Comment' ? 'text-slate-700' : ''}>{item.body}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 px-5 py-3">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment…"
            onKeyDown={(e) => { if (e.key === 'Enter') postComment(); }}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button disabled={actionLoading || !comment.trim()} onClick={postComment} className="rounded-lg bg-slate-900 p-2 text-white disabled:opacity-60">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ label, onApprove, onReject, disabled }: { label: string; onApprove: () => void; onReject: () => void; disabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-2">
        <button disabled={disabled} onClick={onApprove} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">Approve</button>
        <button disabled={disabled} onClick={onReject} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">Reject</button>
      </div>
    </div>
  );
}
