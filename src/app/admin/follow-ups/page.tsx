'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, CheckCircle, XCircle, AlertCircle, RefreshCw,
  Search, Filter, Calendar, User, Phone, Mail, Building2,
  ChevronDown, ChevronUp, Eye, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface FollowUp {
  id: number;
  lead_id: number;
  user_id: number;
  reminder_date: string;
  message: string;
  status: string;
  priority: string;
  completed_at?: string;
  completion_notes?: string | null;
  created_at: string;
  fname?: string;
  lname?: string;
  email?: string;
  phone?: string;
  leadStatus?: string;
  employeeName?: string;
  employeeEmail?: string;
  branchId?: number | null;
  branchName?: string | null;
}

interface Summary {
  total: number;
  overdue: number;
  upcoming: number;
  completed: number;
  pending: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  rescheduled: 'bg-purple-100 text-purple-800',
  overdue: 'bg-red-100 text-red-800',
};

export default function FollowUpsPage() {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, overdue: 0, upcoming: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [remarksById, setRemarksById] = useState<Record<number, string>>({});
  const [viewId, setViewId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', `${dateTo} 23:59:59`);
      const res = await fetch(`/api/follow-up-reminders?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load follow-ups');
      setFollowUps(data.reminders || []);
      setSummary(data.summary || { total: 0, overdue: 0, upcoming: 0, completed: 0, pending: 0 });
      setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, pages: data.pagination?.pages ?? 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, statusFilter, priorityFilter, dateFrom, dateTo]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const handleAction = async (reminderId: number, action: 'complete' | 'cancel', rescheduledAt?: string) => {
    try {
      setActionLoading(reminderId);
      const body: any = { reminderId, action, notes: remarksById[reminderId]?.trim() || undefined };
      if (action === 'cancel') body.action = 'cancel';
      if (rescheduledAt) { body.action = 'reschedule'; body.rescheduledAt = rescheduledAt; }

      const res = await fetch('/api/follow-up-reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Action failed');
      setRescheduleId(null);
      setRescheduleDate('');
      setRemarksById((prev) => { const next = { ...prev }; delete next[reminderId]; return next; });
      await fetchFollowUps();
    } catch {
      window.toast.error('Failed to update follow-up. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayStatus = (fu: FollowUp): string => {
    if (fu.status !== 'pending') return fu.status;
    if (new Date(fu.reminder_date) < new Date()) return 'overdue';
    return 'pending';
  };

  const { sorted: sortedFollowUps, sortKey: followUpSortKey, sortDirection: followUpSortDirection, toggleSort: toggleFollowUpSort } = useSortableData(
    followUps,
    {
      lead: (fu) => `${fu.fname || ''} ${fu.lname || ''}`.trim() || `Lead #${fu.lead_id}`,
      counselor: (fu) => fu.employeeName || fu.user_id,
      branch: (fu) => fu.branchName || '',
      dueDate: (fu) => fu.reminder_date,
      priority: (fu) => fu.priority,
      status: (fu) => getDisplayStatus(fu),
      message: (fu) => fu.message,
    },
  );

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
          <p className="text-gray-600 mt-1">Track and manage lead follow-up reminders</p>
        </div>
        <button
          onClick={fetchFollowUps}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: summary.total, icon: <Calendar className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Pending', value: summary.pending, icon: <Clock className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50' },
          { label: 'Overdue', value: summary.overdue, icon: <AlertCircle className="w-5 h-5 text-red-600" />, bg: 'bg-red-50' },
          { label: 'Upcoming', value: summary.upcoming, icon: <RefreshCw className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
          { label: 'Completed', value: summary.completed, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className={`${bg} rounded-lg p-4 flex items-center space-x-3`}>
            <div>{icon}</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by lead, counselor, or message..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <SearchableSelect
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </SearchableSelect>
          <SearchableSelect
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </SearchableSelect>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              max={dateTo || undefined}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              aria-label="Due date from"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              min={dateFrom || undefined}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              aria-label="Due date to"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); setPagination((prev) => ({ ...prev, page: 1 })); }}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow p-3">
        <SortButtonRow
          options={[
            ['lead', 'Lead'],
            ['counselor', 'Counselor'],
            ['branch', 'Branch'],
            ['dueDate', 'Due Date'],
            ['priority', 'Priority'],
            ['status', 'Status'],
            ['message', 'Message'],
          ] as const}
          activeKey={followUpSortKey}
          direction={followUpSortDirection}
          onSort={toggleFollowUpSort}
        />

        <RecordList
          isEmpty={followUps.length === 0}
          emptyIcon={Clock}
          emptyTitle="No follow-ups found"
          emptyDescription="Try changing filters or search terms."
        >
          {sortedFollowUps.map(fu => {
            const leadName = `${fu.fname || ''} ${fu.lname || ''}`.trim() || `Lead #${fu.lead_id}`;
            const displayStatus = getDisplayStatus(fu);
            const isExpanded = expandedId === fu.id;
            const isPending = fu.status === 'pending';
            const dueDate = new Date(fu.reminder_date);
            const isOverdue = displayStatus === 'overdue';

            return (
              <div key={fu.id}>
                <RecordCard
                  className={isOverdue ? 'border-red-200 bg-red-50/40' : ''}
                  avatar={<User className="h-4 w-4" />}
                  avatarColorClass={isOverdue ? 'from-red-600 to-orange-400' : 'from-blue-600 to-cyan-400'}
                  title={
                    fu.lead_id ? (
                      <Link href={`/admin/leads/${fu.lead_id}/edit`} className="min-w-0 break-words text-base font-bold text-blue-700 hover:text-blue-900 hover:underline">
                        {leadName}
                      </Link>
                    ) : (
                      <span className="min-w-0 break-words text-base font-bold text-gray-950">{leadName}</span>
                    )
                  }
                  titleBadges={
                    <>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[fu.priority] || 'bg-gray-100 text-gray-700'}`}>
                        {fu.priority}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[displayStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {displayStatus}
                      </span>
                    </>
                  }
                  metaItems={[
                    fu.email ? { icon: Mail, text: fu.email, key: 'email' } : null,
                    fu.phone ? { icon: Phone, text: fu.phone, key: 'phone' } : null,
                    { icon: User, text: fu.employeeName || `Employee #${fu.user_id}`, key: 'counselor' },
                    fu.branchName ? { icon: Building2, text: fu.branchName, key: 'branch' } : null,
                  ].filter((item): item is { icon: typeof Mail; text: string; key: string } => item !== null)}
                  stats={[
                    { label: 'Due Date', value: dueDate.toLocaleDateString(), sub: dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                  ]}
                  extra={
                    <>
                      <div className="mt-3">
                        <div className={`text-sm text-gray-700 ${isExpanded ? '' : 'truncate'}`}>
                          {fu.message}
                        </div>
                        {fu.message && fu.message.length > 60 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : fu.id)}
                            className="text-xs text-blue-600 hover:underline mt-0.5 flex items-center gap-0.5"
                          >
                            {isExpanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />More</>}
                          </button>
                        )}
                      </div>

                      {isPending && (
                        <div className="mt-3 flex flex-wrap items-start gap-2">
                          <textarea
                            value={remarksById[fu.id] || ''}
                            onChange={(e) => setRemarksById((prev) => ({ ...prev, [fu.id]: e.target.value }))}
                            placeholder="Remarks (optional)"
                            rows={2}
                            className="w-full max-w-xs px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => handleAction(fu.id, 'complete')}
                              disabled={actionLoading === fu.id}
                              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </button>
                            {rescheduleId === fu.id ? (
                              <div className="flex flex-col gap-1">
                                <input
                                  type="datetime-local"
                                  value={rescheduleDate}
                                  onChange={e => setRescheduleDate(e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => rescheduleDate && handleAction(fu.id, 'complete', rescheduleDate)}
                                    disabled={!rescheduleDate || actionLoading === fu.id}
                                    className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => { setRescheduleId(null); setRescheduleDate(''); }}
                                    className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRescheduleId(fu.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-[var(--cmg-blue)] text-white rounded text-xs hover:bg-[var(--cmg-blue-dark)]"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Reschedule
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(fu.id, 'cancel')}
                              disabled={actionLoading === fu.id}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      {!isPending && (
                        <div className="mt-3 text-xs text-gray-400 italic">
                          <div>{fu.completed_at ? `Done ${new Date(fu.completed_at).toLocaleDateString()}` : fu.status}</div>
                          {fu.completion_notes && <div className="mt-0.5 not-italic text-gray-600">{fu.completion_notes}</div>}
                        </div>
                      )}
                    </>
                  }
                  actions={[
                    { key: 'view', icon: Eye, label: viewId === fu.id ? 'Hide details' : 'View details and remarks', onClick: () => setViewId(viewId === fu.id ? null : fu.id), colorClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'viewLead', icon: ExternalLink, label: 'View lead', onClick: () => router.push(`/admin/leads/${fu.lead_id}/edit`), colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100', hidden: !fu.lead_id },
                  ]}
                />
                {viewId === fu.id && (
                  <div className="-mt-1 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Follow-up message</div>
                        <div className="text-gray-800 whitespace-pre-wrap">{fu.message || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Remarks</div>
                        <div className="text-gray-800 whitespace-pre-wrap">{fu.completion_notes || 'No remarks added yet.'}</div>
                      </div>
                      {fu.completed_at && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Actioned on</div>
                          <div className="text-gray-800">{new Date(fu.completed_at).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </RecordList>

        <div className="flex items-center justify-between px-1 py-3 mt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {Math.max(pagination.pages, 1)} — {pagination.total} follow-ups
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages || prev.page, prev.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
