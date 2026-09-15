'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { getDiscountTier, canApproveDiscountTier, discountTierLabel, DEFAULT_DISCOUNT_TIER_THRESHOLDS, type DiscountTierThresholds } from '@/lib/discountApproval';
import {
  CheckCircle, XCircle, Clock, DollarSign, User,
  AlertCircle, Search, RefreshCw, ChevronDown, ChevronUp, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface DiscountApproval {
  id: number;
  leadId: number;
  opportunityId: number | null;
  discountType: string;
  discountAmount: number;
  originalAmount: number;
  discountedAmount: number;
  currency: string;
  reason: string;
  requestedBy: number;
  approvedBy: number | null;
  status: 'pending' | 'approved' | 'rejected';
  requestedDate: string;
  approvedAt: string | null;
  rejectedDate: string | null;
  createdAt: string;
  updatedAt: string;
  // joins
  fname?: string;
  lname?: string;
  email?: string;
  mobile?: string;
  opportunityName?: string;
  estimatedValue?: number;
  requestedEmployeeName?: string;
  approvedEmployeeName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const TYPE_COLORS: Record<string, string> = {
  percentage: 'bg-blue-100 text-blue-800',
  fixed:      'bg-purple-100 text-purple-800',
  waiver:     'bg-orange-100 text-orange-800',
};

export default function DiscountApprovalsPage() {
  const { user, token } = useAuth();
  const [approvals, setApprovals] = useState<DiscountApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  // Approval/rejection modal state
  const [modal, setModal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  // Tiered policy thresholds, staff-editable (see the Tier Settings panel
  // below, CEO only) rather than fixed in code — fetched once and reused for
  // every row, since a single list can mix requests across all three tiers.
  // The backend enforces this too (see /api/discount-approvals[/id] PUT);
  // this just controls button visibility.
  const [thresholds, setThresholds] = useState<DiscountTierThresholds>(DEFAULT_DISCOUNT_TIER_THRESHOLDS);
  const [thresholdsDraft, setThresholdsDraft] = useState<{ autoMaxPercent: string; bmCeoMaxPercent: string } | null>(null);
  const [savingThresholds, setSavingThresholds] = useState(false);

  const fetchThresholds = useCallback(async () => {
    try {
      const res = await fetch('/api/discount-approvals/tier-config');
      const data = await res.json();
      if (res.ok && data.success) setThresholds(data.data);
    } catch {
      // Keep the default thresholds if this fails — same fallback the
      // backend uses, so button visibility stays consistent with enforcement.
    }
  }, []);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  const canApprove = (a: DiscountApproval) =>
    canApproveDiscountTier(getDiscountTier(Number(a.discountAmount), Number(a.originalAmount), thresholds), user as any);

  const saveThresholds = async () => {
    if (!thresholdsDraft) return;
    setSavingThresholds(true);
    setError('');
    try {
      const res = await fetch('/api/discount-approvals/tier-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          autoMaxPercent: Number(thresholdsDraft.autoMaxPercent),
          bmCeoMaxPercent: Number(thresholdsDraft.bmCeoMaxPercent),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update thresholds');
      setThresholds(data.data);
      setThresholdsDraft(null);
      setSuccess('Discount approval thresholds updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thresholds');
    } finally {
      setSavingThresholds(false);
    }
  };

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      const res = await fetch(`/api/discount-approvals?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setApprovals(Array.isArray(data.data) ? data.data : []);
      setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, totalPages: data.pagination?.totalPages ?? 0 }));
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discount approvals');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearchTerm]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleAction = async () => {
    if (!modal) return;
    try {
      setActionLoading(modal.id);
      const body: any = {
        status: modal.action === 'approve' ? 'approved' : 'rejected',
        approverRole: 'ceo',
        approvedBy: user?.id || 1,
      };
      if (modal.action === 'approve') {
        body.approvedAt = new Date().toISOString();
      } else {
        body.rejectedDate = new Date().toISOString();
        body.reviewNotes = reviewNotes;
      }

      const res = await fetch(`/api/discount-approvals/${modal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Action failed');

      setSuccess(`Discount ${modal.action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
      setModal(null);
      setReviewNotes('');
      await fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pct = (d: DiscountApproval) =>
    d.originalAmount > 0
      ? ((d.discountAmount / d.originalAmount) * 100).toFixed(1)
      : '0';

  const { sorted: sortedApprovals, sortKey: discountSortKey, sortDirection: discountSortDirection, toggleSort: toggleDiscountSort } = useSortableData(
    approvals,
    {
      id: (a) => a.id,
      client: (a) => `${a.fname || ''} ${a.lname || ''}`,
      discount: (a) => pct(a),
      amount: (a) => a.discountedAmount,
      requestedBy: (a) => a.requestedEmployeeName || a.requestedBy,
      status: (a) => a.status,
      date: (a) => a.createdAt,
    },
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discount Approvals</h1>
          <p className="text-gray-500 mt-1">
            0-{thresholds.autoMaxPercent}% is auto-approved. {thresholds.autoMaxPercent}-{thresholds.bmCeoMaxPercent}% needs Branch Manager or CEO. Above {thresholds.bmCeoMaxPercent}% needs the CEO.
          </p>
        </div>
        <button onClick={fetchApprovals}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isBranchManagerOrCeo(user as any) && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle className="h-5 w-5 shrink-0" />
          You are logged in as an authorized approver. Pending requests above the auto-approve threshold can be approved or rejected below.
        </div>
      )}

      {isCeo(user as any) && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {thresholdsDraft ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Auto-approve up to (%)</label>
                <input type="number" min={0} max={100} value={thresholdsDraft.autoMaxPercent}
                  onChange={e => setThresholdsDraft({ ...thresholdsDraft, autoMaxPercent: e.target.value })}
                  className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Branch Manager/CEO up to (%)</label>
                <input type="number" min={0} max={100} value={thresholdsDraft.bmCeoMaxPercent}
                  onChange={e => setThresholdsDraft({ ...thresholdsDraft, bmCeoMaxPercent: e.target.value })}
                  className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
              <p className="text-xs text-gray-500">Branch Manager or CEO can approve any discount above this — no upper limit.</p>
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setThresholdsDraft(null)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={saveThresholds} disabled={savingThresholds}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                  {savingThresholds ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Discount approval tiers: auto-approve up to <strong>{thresholds.autoMaxPercent}%</strong>, Branch Manager or CEO can approve anything above that — no upper limit.
              </p>
              <button
                onClick={() => setThresholdsDraft({ autoMaxPercent: String(thresholds.autoMaxPercent), bmCeoMaxPercent: String(thresholds.bmCeoMaxPercent) })}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                Edit Thresholds
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: summary.total,    icon: <DollarSign className="w-5 h-5 text-blue-600" />,   bg: 'bg-blue-50',   filter: '' },
          { label: 'Pending',  value: summary.pending,  icon: <Clock className="w-5 h-5 text-yellow-600" />,      bg: 'bg-yellow-50', filter: 'pending' },
          { label: 'Approved', value: summary.approved, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50',  filter: 'approved' },
          { label: 'Rejected', value: summary.rejected, icon: <XCircle className="w-5 h-5 text-red-600" />,       bg: 'bg-red-50',    filter: 'rejected' },
        ].map(({ label, value, icon, bg, filter }) => (
          <button key={label}
            onClick={() => { setStatusFilter(filter); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className={`${bg} rounded-lg p-4 flex items-center gap-3 text-left w-full transition-all ${statusFilter === filter ? 'ring-2 ring-blue-400' : 'hover:opacity-80'}`}>
            {icon}
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by client, email, opportunity..."
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <SearchableSelect value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </SearchableSelect>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4">
          <SortButtonRow
            options={[
              ['id', '#'],
              ['client', 'Client'],
              ['discount', 'Discount'],
              ['amount', 'Amount'],
              ['requestedBy', 'Requested By'],
              ['status', 'Status'],
              ['date', 'Date'],
            ] as const}
            activeKey={discountSortKey}
            direction={discountSortDirection}
            onSort={toggleDiscountSort}
          />
          <RecordList isEmpty={approvals.length === 0} emptyIcon={DollarSign} emptyTitle="No discount approvals found">
            {sortedApprovals.map(a => {
              const isExpanded = expandedId === a.id;
              const isPending = a.status === 'pending';
              return (
                <RecordCard
                  key={a.id}
                  avatar={<DollarSign className="h-4 w-4" />}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{a.fname} {a.lname}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{a.id}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[a.discountType] || 'bg-gray-100 text-gray-700'}`}>
                        {a.discountType}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'}`}>
                        {a.status}
                      </span>
                    </>
                  }
                  metaItems={[
                    { icon: User, text: `${a.email || ''}${a.opportunityName ? ' · ' + a.opportunityName : ''}`, key: 'contact' },
                    { icon: User, text: `Requested by ${a.requestedEmployeeName || `Emp #${a.requestedBy}`}`, key: 'requestedBy' },
                  ]}
                  stats={[
                    { label: 'Discount', value: `${pct(a)}%` },
                    { label: 'Original', value: <span className="line-through">{a.currency} {a.originalAmount?.toLocaleString()}</span> },
                    { label: 'Final Amount', value: <span className="font-bold text-green-700">{a.currency} {a.discountedAmount?.toLocaleString()}</span>, sub: `-${a.currency} ${a.discountAmount?.toLocaleString()}` },
                    { label: 'Date', value: new Date(a.createdAt).toLocaleDateString(), sub: a.approvedEmployeeName ? `by ${a.approvedEmployeeName}` : undefined },
                  ]}
                  extra={isExpanded ? (
                    <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm">
                      <span className="font-medium text-gray-700">Reason: </span>
                      <span className="text-gray-600">{a.reason || '—'}</span>
                      {a.approvedAt && <div className="mt-1 text-xs text-gray-500">Approved: {new Date(a.approvedAt).toLocaleString()}</div>}
                      {a.rejectedDate && <div className="mt-1 text-xs text-gray-500">Rejected: {new Date(a.rejectedDate).toLocaleString()}</div>}
                    </div>
                  ) : (isPending && !canApprove(a) ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Awaiting {discountTierLabel(getDiscountTier(Number(a.discountAmount), Number(a.originalAmount), thresholds), thresholds)}
                    </p>
                  ) : undefined)}
                  actions={[
                    { key: 'approve', icon: CheckCircle, label: 'Approve', onClick: () => setModal({ id: a.id, action: 'approve' }), disabled: actionLoading === a.id, colorClass: 'bg-green-50 text-green-700 hover:bg-green-100', hidden: !(isPending && canApprove(a)) },
                    { key: 'reject', icon: XCircle, label: 'Reject', onClick: () => setModal({ id: a.id, action: 'reject' }), disabled: actionLoading === a.id, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !(isPending && canApprove(a)) },
                    { key: 'toggle', icon: isExpanded ? ChevronUp : ChevronDown, label: 'Reason', onClick: () => setExpandedId(isExpanded ? null : a.id) },
                  ]}
                />
              );
            })}
          </RecordList>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} — {pagination.total} requests
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
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages || prev.page, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Approve / Reject Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className={`flex items-center gap-3 mb-4`}>
              {modal.action === 'approve'
                ? <CheckCircle className="w-6 h-6 text-green-600" />
                : <XCircle className="w-6 h-6 text-red-600" />}
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {modal.action} Discount Request #{modal.id}
              </h3>
            </div>

            {modal.action === 'approve' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
                This will approve the discount and update the opportunity value accordingly.
              </div>
            ) : (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
                  Please provide a reason for rejection.
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Explain why this discount is being rejected..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setModal(null); setReviewNotes(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={modal.action === 'reject' && !reviewNotes.trim() || actionLoading === modal.id}
                className={`px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50 ${
                  modal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {actionLoading === modal.id ? 'Processing...' : `Confirm ${modal.action === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
