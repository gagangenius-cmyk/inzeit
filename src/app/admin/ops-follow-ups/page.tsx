'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
  Search, Calendar, User, Phone, Mail, ArrowRight, MessageSquare,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

interface FollowUp {
  id: number;
  lead_id: number;
  user_id: number;
  reminder_date: string;
  message: string;
  status: string;
  priority: string;
  completed_at?: string;
  created_at: string;
  fname?: string;
  lname?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  leadStatus?: string;
  employeeName?: string;
  employeeBranch?: number;
  branchName?: string;
  countryName?: string;
  serviceName?: string;
}

interface Summary {
  total: number;
  overdue: number;
  pending: number;
  completed: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800',
};

export default function OpsFollowUpsPage() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, overdue: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [addNoteId, setAddNoteId] = useState<number | null>(null);
  const [addNoteText, setAddNoteText] = useState('');

  // Role detection
  const normalizedRole = String(user?.type || '').toLowerCase().replace(/[\s-]+/g, '_');
  const canViewAll = user?.role === 1 || ['admin', 'administrator', 'super_admin', 'director_of_sales', 'director', 'dos', 'director_of_operations', 'operation_manager'].includes(normalizedRole);
  const isBranchManager = ['branch_manager', 'bm'].includes(normalizedRole) && !canViewAll;
  const viewLabel = canViewAll ? 'All Follow-ups' : isBranchManager ? 'Branch Follow-ups' : 'My Follow-ups';

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/admin/ops-follow-ups?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setFollowUps(data.data || []);
      setSummary(data.summary || { total: 0, overdue: 0, pending: 0, completed: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchTerm]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const handleAction = async (id: number, action: 'complete' | 'cancel', rescheduledAt?: string) => {
    try {
      setActionLoading(id);
      const body: any = { id, action };
      if (rescheduledAt) { body.action = 'reschedule'; body.rescheduledAt = rescheduledAt; }
      if (action === 'cancel') body.action = 'cancel';
      const res = await fetch('/api/admin/ops-follow-ups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Action failed');
      setRescheduleId(null);
      setRescheduleDate('');
      setAddNoteId(null);
      setAddNoteText('');
      await fetchFollowUps();
    } catch {
      window.toast.error('Failed to update follow-up');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNote = async (id: number) => {
    if (!addNoteText.trim()) return;
    try {
      setActionLoading(id);
      const res = await fetch('/api/admin/ops-follow-ups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'complete', notes: addNoteText.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setAddNoteId(null);
      setAddNoteText('');
      await fetchFollowUps();
    } catch {
      window.toast.error('Failed to save note');
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayStatus = (fu: FollowUp): string => {
    if (fu.status !== 'pending') return fu.status;
    if (new Date(fu.reminder_date) < new Date()) return 'overdue';
    return 'pending';
  };

  const filtered = followUps.filter(fu => {
    const leadName = `${fu.fname || ''} ${fu.lname || ''}`.trim().toLowerCase();
    const matchesSearch = !searchTerm ||
      leadName.includes(searchTerm.toLowerCase()) ||
      (fu.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fu.message || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fu.phone || '').includes(searchTerm);
    return matchesSearch;
  });

  const { sorted: sortedFollowUps, sortKey: followUpSortKey, sortDirection: followUpSortDirection, toggleSort: toggleFollowUpSort } = useSortableData(
    filtered,
    {
      lead: (fu) => `${fu.fname || ''} ${fu.lname || ''}`,
      counselor: (fu) => fu.employeeName,
      dueDate: (fu) => fu.reminder_date,
      priority: (fu) => fu.priority,
      status: (fu) => getDisplayStatus(fu),
      message: (fu) => fu.message,
    },
  );

  const formatDate = (d: string) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-gray-600 mt-1">{viewLabel} &middot; Track and manage lead follow-up reminders</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {canViewAll ? '👑 All' : isBranchManager ? '🏢 Branch' : '👤 Mine'}
          </span>
          <button onClick={fetchFollowUps} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: summary.total, icon: <Calendar className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Overdue', value: summary.overdue, icon: <AlertCircle className="w-5 h-5 text-red-600" />, bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Pending', value: summary.pending, icon: <Clock className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50', border: 'border-yellow-200' },
          { label: 'Completed', value: summary.completed, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', border: 'border-green-200' },
        ].map(({ label, value, icon, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">{label}</span>
              {icon}
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by lead name, phone, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <SearchableSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </SearchableSelect>
        <SearchableSelect value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </SearchableSelect>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Follow-up Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh label="Lead" sortKey="lead" activeKey={followUpSortKey} direction={followUpSortDirection} onSort={toggleFollowUpSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <SortableTh label="Counselor" sortKey="counselor" activeKey={followUpSortKey} direction={followUpSortDirection} onSort={toggleFollowUpSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <SortableTh label="Due Date" sortKey="dueDate" activeKey={followUpSortKey} direction={followUpSortDirection} onSort={toggleFollowUpSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <SortableTh label="Priority" sortKey="priority" activeKey={followUpSortKey} direction={followUpSortDirection} onSort={toggleFollowUpSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <SortableTh label="Status" sortKey="status" activeKey={followUpSortKey} direction={followUpSortDirection} onSort={toggleFollowUpSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <SortableTh label="Message" sortKey="message" activeKey={followUpSortKey} direction={followUpSortDirection} onSort={toggleFollowUpSort} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    No follow-ups found.
                  </td>
                </tr>
              ) : sortedFollowUps.map((fu) => {
                const displayStatus = getDisplayStatus(fu);
                const isExpanded = expandedId === fu.id;
                const isRescheduling = rescheduleId === fu.id;
                const isAddingNote = addNoteId === fu.id;
                const isLoading = actionLoading === fu.id;

                return (
                  <tr key={fu.id} className={`hover:bg-gray-50 ${displayStatus === 'overdue' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{fu.fname} {fu.lname}</div>
                      <div className="text-xs text-gray-500">{fu.phone || fu.mobile || '—'}</div>
                      {fu.countryName && <div className="text-xs text-gray-400">{fu.countryName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{fu.employeeName || '—'}</div>
                      {fu.branchName && <div className="text-xs text-gray-400">{fu.branchName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{formatDate(fu.reminder_date)}</div>
                      <div className="text-xs text-gray-500">{formatTime(fu.reminder_date)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${PRIORITY_COLORS[fu.priority] || 'bg-gray-100 text-gray-800'}`}>
                        {fu.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[displayStatus] || 'bg-gray-100'}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-sm text-gray-700 truncate" title={fu.message}>{fu.message}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {fu.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : fu.id)}
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                              title="Take action"
                            >
                              Action
                            </button>
                          </>
                        )}
                      </div>

                      {/* Action Panel */}
                      {isExpanded && fu.status === 'pending' && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-left space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(fu.id, 'complete')}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Complete
                            </button>
                            <button
                              onClick={() => { setAddNoteId(fu.id); setAddNoteText(''); }}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Add Note & Complete
                            </button>
                            <button
                              onClick={() => setRescheduleId(isRescheduling ? null : fu.id)}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--cmg-blue)] text-white text-xs rounded-lg hover:bg-[var(--cmg-blue-dark)] disabled:opacity-50"
                            >
                              <Calendar className="w-3 h-3" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleAction(fu.id, 'cancel')}
                              disabled={isLoading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>

                          {/* Reschedule form */}
                          {isRescheduling && (
                            <div className="flex gap-2 items-center">
                              <input
                                type="datetime-local"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                onClick={() => handleAction(fu.id, 'complete', rescheduleDate)}
                                disabled={!rescheduleDate || isLoading}
                                className="px-3 py-1 bg-[var(--cmg-blue)] text-white text-xs rounded hover:bg-[var(--cmg-blue-dark)] disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          )}

                          {/* Add note form */}
                          {isAddingNote && (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={addNoteText}
                                onChange={(e) => setAddNoteText(e.target.value)}
                                placeholder="Enter follow-up note..."
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                onClick={() => handleAddNote(fu.id)}
                                disabled={!addNoteText.trim() || isLoading}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save Note & Complete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
