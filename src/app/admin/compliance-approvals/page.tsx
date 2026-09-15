'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, Clock, FileCheck, User,
  Search, RefreshCw, ChevronDown, ChevronUp,
  ExternalLink, AlertCircle, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isBranchManagerOrCeo } from '@/lib/roleChecks';

interface ComplianceApproval {
  id: number;
  leadId: number;
  opportunityId: number | null;
  signedAgreementUrl: string;
  clientSignature: string | null;
  signatureDate: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedBy: number | null;
  reviewedBy: string | null;
  reviewerRole: string | null;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  counselorName?: string | null;
  counselorId?: number | null;
  conversationSummary?: string | null;
  clientCommitments?: string | null;
  nextAction?: string | null;
  paymentNumber?: string | null;
  receiptNumber?: string | null;
  paidAmount?: number | string | null;
  totalAmount?: number | string | null;
  currency?: string | null;
  accountantStatus?: string | null;
  accountantVerifiedAt?: string | null;
  proofOfPaymentUrl?: string | null;
  counsellorSheetUrl?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:      'bg-yellow-100 text-yellow-800',
  approved:     'bg-green-100 text-green-800',
  rejected:     'bg-red-100 text-red-800',
  under_review: 'bg-blue-100 text-blue-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:      <Clock className="w-4 h-4 text-yellow-500" />,
  approved:     <CheckCircle className="w-4 h-4 text-green-500" />,
  rejected:     <XCircle className="w-4 h-4 text-red-500" />,
  under_review: <AlertCircle className="w-4 h-4 text-blue-500" />,
};

export default function ComplianceApprovalsPage() {
  const { user } = useAuth();
  const canReview = isBranchManagerOrCeo(user);
  const [approvals, setApprovals] = useState<ComplianceApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal state
  const [modal, setModal] = useState<{
    id: number;
    action: 'approve' | 'reject' | 'under_review';
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/opportunity-compliance-approvals?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setApprovals(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance approvals');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleAction = async () => {
    if (!modal) return;
    try {
      setError('');
      setActionLoading(modal.id);

      const statusMap = {
        approve:      'approved',
        reject:       'rejected',
        under_review: 'under_review',
      } as const;

      const body: any = {
        status:       statusMap[modal.action],
        reviewedBy:   reviewerName || 'Compliance Officer',
        reviewerRole: 'compliance_officer',
        reviewNotes:  reviewNotes || null,
        reviewedAt:   new Date().toISOString(),
      };

      const res = await fetch(`/api/opportunity-compliance-approvals?id=${modal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Action failed');

      const msgs: Record<string, string> = {
        approve:      'Compliance approved — agreement is now active',
        reject:       'Compliance rejected — counselor will be notified',
        under_review: 'Marked as under review',
      };
      setSuccess(msgs[modal.action]);
      setTimeout(() => setSuccess(''), 4000);
      setModal(null);
      setReviewNotes('');
      setReviewerName('');
      await fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const summary = {
    total:        approvals.length,
    pending:      approvals.filter(a => a.status === 'pending').length,
    under_review: approvals.filter(a => a.status === 'under_review').length,
    approved:     approvals.filter(a => a.status === 'approved').length,
    rejected:     approvals.filter(a => a.status === 'rejected').length,
  };

  const filtered = approvals.filter(a => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return String(a.leadId).includes(s) ||
           String(a.opportunityId || '').includes(s) ||
           (a.clientName || '').toLowerCase().includes(s) ||
           (a.counselorName || '').toLowerCase().includes(s) ||
           (a.receiptNumber || '').toLowerCase().includes(s) ||
           (a.reviewedBy || '').toLowerCase().includes(s) ||
           (a.reviewNotes || '').toLowerCase().includes(s);
  });

  const { sorted: sortedApprovals, sortKey: approvalSortKey, sortDirection: approvalSortDirection, toggleSort: toggleApprovalSort } = useSortableData(
    filtered,
    {
      id: (a) => a.id,
      lead: (a) => a.clientName?.trim() || a.leadId,
      submitted: (a) => a.submittedAt,
      status: (a) => a.status,
      reviewer: (a) => a.reviewedBy,
    },
  );

  const activeModalApproval = modal ? approvals.find(a => a.id === modal.id) : null;

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
          <h1 className="text-3xl font-bold text-gray-900">Compliance Approvals</h1>
          <p className="text-gray-500 mt-1">Review signed agreements submitted after lead-to-opportunity conversion</p>
        </div>
        <button onClick={fetchApprovals}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Compliance workflow:</strong> After a lead is converted to an opportunity and the client signs the agreement,
          counselors submit the signed agreement here for compliance review. Only a compliance officer can approve or reject.
          Approved agreements unlock the full operations module for the client.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',        value: summary.total,        icon: <FileCheck className="w-5 h-5 text-gray-600" />,    bg: 'bg-gray-50',    filter: '' },
          { label: 'Pending',      value: summary.pending,      icon: <Clock className="w-5 h-5 text-yellow-600" />,      bg: 'bg-yellow-50',  filter: 'pending' },
          { label: 'Under Review', value: summary.under_review, icon: <AlertCircle className="w-5 h-5 text-blue-600" />,  bg: 'bg-blue-50',    filter: 'under_review' },
          { label: 'Approved',     value: summary.approved,     icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50',   filter: 'approved' },
          { label: 'Rejected',     value: summary.rejected,     icon: <XCircle className="w-5 h-5 text-red-600" />,       bg: 'bg-red-50',     filter: 'rejected' },
        ].map(({ label, value, icon, bg, filter }) => (
          <button key={label}
            onClick={() => setStatusFilter(filter)}
            className={`${bg} rounded-lg p-3 flex items-center gap-3 text-left w-full transition-all ${statusFilter === filter ? 'ring-2 ring-blue-400' : 'hover:opacity-80'}`}>
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
          <input type="text" placeholder="Search by client, lead, counselor, receipt, reviewer..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <SearchableSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
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
              ['lead', 'Lead / Opportunity'],
              ['submitted', 'Submitted'],
              ['status', 'Status'],
              ['reviewer', 'Reviewer'],
            ] as const}
            activeKey={approvalSortKey}
            direction={approvalSortDirection}
            onSort={toggleApprovalSort}
          />
          <RecordList isEmpty={filtered.length === 0} emptyIcon={ShieldCheck} emptyTitle="No compliance approvals found" emptyDescription="Compliance submissions appear here after counselors submit signed agreements">
            {sortedApprovals.map(a => {
              const isExpanded = expandedId === a.id;
              const isPending = a.status === 'pending' || a.status === 'under_review';
              return (
                <RecordCard
                  key={a.id}
                  avatar={STATUS_ICONS[a.status]}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{a.clientName?.trim() || `Lead #${a.leadId}`}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{a.id}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </>
                  }
                  metaItems={[
                    { icon: User, text: `Lead #${a.leadId}${a.opportunityId ? ` · Opp #${a.opportunityId}` : ''}${a.counselorName ? ` · Counselor: ${a.counselorName}` : ''}`, key: 'lead' },
                  ]}
                  stats={[
                    {
                      label: 'Signed Agreement',
                      value: a.signedAgreementUrl ? (
                        <a href={a.signedAgreementUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                      ) : <span className="italic text-gray-400">No file</span>,
                      sub: a.signatureDate ? `Signed: ${new Date(a.signatureDate).toLocaleDateString()}` : undefined,
                    },
                    { label: 'Submitted', value: new Date(a.submittedAt).toLocaleDateString(), sub: a.submittedBy ? `by #${a.submittedBy}` : undefined },
                    {
                      label: 'Reviewer',
                      value: a.reviewedBy ? a.reviewedBy : <span className="italic text-gray-400">Not reviewed</span>,
                      sub: a.reviewedBy ? `${a.reviewerRole || ''}${a.reviewedAt ? ' · ' + new Date(a.reviewedAt).toLocaleDateString() : ''}` : undefined,
                    },
                  ]}
                  extra={isExpanded ? (
                    <div className="mt-3 grid gap-3 rounded-lg bg-gray-50 p-3 text-sm md:grid-cols-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="font-semibold text-gray-800 mb-1">Receipt Verification</div>
                        <div className="text-gray-600">Receipt: {a.receiptNumber || a.paymentNumber || 'N/A'}</div>
                        <div className="text-gray-600">Paid: {a.currency || 'AED'} {Number(a.paidAmount || 0).toLocaleString()}</div>
                        <div className="text-gray-600 capitalize">Accounts: {a.accountantStatus || 'pending'}</div>
                        {a.accountantVerifiedAt && <div className="text-xs text-gray-400">Verified: {new Date(a.accountantVerifiedAt).toLocaleString()}</div>}
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="font-semibold text-gray-800 mb-1">Counselor Summary</div>
                        <p className="whitespace-pre-wrap text-gray-600">{a.conversationSummary || 'No counselor summary found.'}</p>
                        {a.clientCommitments && <p className="mt-2 text-xs text-gray-500"><span className="font-medium">Commitments:</span> {a.clientCommitments}</p>}
                        {a.nextAction && <p className="mt-1 text-xs text-gray-500"><span className="font-medium">Next:</span> {a.nextAction}</p>}
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="font-semibold text-gray-800 mb-1">Review Notes</div>
                        <p className="whitespace-pre-wrap text-gray-600">{a.reviewNotes || 'No review notes yet.'}</p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="font-semibold text-gray-800 mb-1">Counsellor Sheet</div>
                        {a.counsellorSheetUrl ? (
                          <a href={a.counsellorSheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900">
                            <ExternalLink className="w-3 h-3" /> View Counsellor Sheet
                          </a>
                        ) : (
                          <p className="text-gray-400 italic">Not uploaded.</p>
                        )}
                      </div>
                    </div>
                  ) : (a.clientSignature || a.proofOfPaymentUrl || a.counsellorSheetUrl) ? (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {a.clientSignature && <span className="text-gray-500">Sig: {a.clientSignature}</span>}
                      {a.proofOfPaymentUrl && (
                        <a href={a.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-700 hover:text-green-900">
                          <ExternalLink className="w-3 h-3" /> Receipt Proof
                        </a>
                      )}
                      {a.counsellorSheetUrl && (
                        <a href={a.counsellorSheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900">
                          <ExternalLink className="w-3 h-3" /> Counsellor Sheet
                        </a>
                      )}
                    </div>
                  ) : undefined}
                  actions={[
                    { key: 'approve', icon: CheckCircle, label: 'Approve', onClick: () => { setError(''); setModal({ id: a.id, action: 'approve' }); }, disabled: actionLoading === a.id, colorClass: 'bg-green-50 text-green-700 hover:bg-green-100', hidden: !(isPending && canReview) },
                    { key: 'review', icon: AlertCircle, label: 'Review', onClick: () => { setError(''); setModal({ id: a.id, action: 'under_review' }); }, disabled: actionLoading === a.id, colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100', hidden: !(isPending && canReview && a.status === 'pending') },
                    { key: 'reject', icon: XCircle, label: 'Reject', onClick: () => { setError(''); setModal({ id: a.id, action: 'reject' }); }, disabled: actionLoading === a.id, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !(isPending && canReview) },
                    { key: 'toggle', icon: isExpanded ? ChevronUp : ChevronDown, label: 'Details', onClick: () => setExpandedId(isExpanded ? null : a.id) },
                  ]}
                />
              );
            })}
          </RecordList>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          Showing {filtered.length} of {approvals.length} submissions
        </div>
      </div>

      {/* Action Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              {modal.action === 'approve'
                ? <CheckCircle className="w-6 h-6 text-green-600" />
                : modal.action === 'under_review'
                  ? <AlertCircle className="w-6 h-6 text-blue-600" />
                  : <XCircle className="w-6 h-6 text-red-600" />}
              <h3 className="text-lg font-semibold text-gray-900">
                {modal.action === 'approve' ? 'Approve Compliance' :
                 modal.action === 'under_review' ? 'Mark Under Review' :
                 'Reject Compliance'}
              </h3>
            </div>

            {/* This is a fixed, full-screen overlay — the page-level error banner
                above the table sits behind it and is invisible while the modal is
                open, so a failed action (missing evidence, not authorized, etc.)
                looked like clicking Confirm did nothing. Show it here instead. */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 mb-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Context */}
            {modal.action === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
                Approving this agreement confirms the client has signed and the compliance check passed.
                The case will be unlocked for the operations team.
              </div>
            )}
            {modal.action === 'approve' && activeModalApproval && (
              <div className="border border-gray-200 rounded-lg p-3 mb-4 text-sm space-y-3">
                <div className="font-medium text-gray-800">Verification packet</div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Signed agreement</span>
                  {activeModalApproval.signedAgreementUrl ? (
                    <a href={activeModalApproval.signedAgreementUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                      <ExternalLink className="w-3 h-3" /> View Agreement
                    </a>
                  ) : (
                    <span className="text-red-600 font-medium">Missing</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Receipt proof</span>
                  {activeModalApproval.proofOfPaymentUrl ? (
                    <a href={activeModalApproval.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-700 hover:text-green-900 font-medium">
                      <ExternalLink className="w-3 h-3" /> View Receipt
                    </a>
                  ) : (
                    <span className="text-red-600 font-medium">Missing</span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600 shrink-0">Counsellor sheet</span>
                  {activeModalApproval.counsellorSheetUrl ? (
                    <a href={activeModalApproval.counsellorSheetUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-medium">
                      <ExternalLink className="w-3 h-3" /> View Sheet
                    </a>
                  ) : (
                    <span className="text-red-600 font-medium">Missing</span>
                  )}
                </div>

                <div>
                  <span className="text-gray-600">Counselor conversation summary</span>
                  {activeModalApproval.conversationSummary ? (
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 border border-gray-200 p-2 text-gray-700 text-xs max-h-32 overflow-y-auto">
                      {activeModalApproval.conversationSummary}
                    </p>
                  ) : (
                    <div className="mt-1 text-red-600 font-medium">Missing</div>
                  )}
                </div>
              </div>
            )}
            {modal.action === 'under_review' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                Mark this submission as under review. Add notes to inform the counselor of what is being checked.
              </div>
            )}
            {modal.action === 'reject' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
                Rejecting will notify the counselor that the signed agreement is not acceptable. Provide a clear reason.
              </div>
            )}

            {/* Reviewer name */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (Reviewer)</label>
              <input type="text" value={reviewerName} onChange={e => setReviewerName(e.target.value)}
                placeholder="Compliance officer name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {modal.action === 'reject' ? 'Rejection Reason *' : 'Notes (optional)'}
              </label>
              <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                placeholder={
                  modal.action === 'approve' ? 'Any compliance notes for the record...' :
                  modal.action === 'under_review' ? 'What is being reviewed...' :
                  'Why is this agreement being rejected?'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setModal(null); setReviewNotes(''); setReviewerName(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAction}
                disabled={
                  (modal.action === 'reject' && !reviewNotes.trim()) ||
                  actionLoading === modal.id
                }
                className={`px-4 py-2 text-white text-sm rounded-lg disabled:opacity-50 ${
                  modal.action === 'approve'      ? 'bg-green-600 hover:bg-green-700' :
                  modal.action === 'under_review' ? 'bg-blue-600 hover:bg-blue-700' :
                                                    'bg-red-600 hover:bg-red-700'
                }`}>
                {actionLoading === modal.id ? 'Processing...' :
                  modal.action === 'approve'      ? 'Confirm Approval' :
                  modal.action === 'under_review' ? 'Mark Under Review' :
                                                    'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
