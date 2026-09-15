'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect, useCallback } from 'react';
import { CrmClientsAttributes } from '@/models';
import { Printer, DollarSign, X, AlertCircle, CheckCircle, Loader2, Receipt, KeyRound, FileCheck2, Send, FileText, Eye } from 'lucide-react';
import ConversationHistoryModal from '@/components/shared/ConversationHistoryModal';
import { useAuth } from '@/contexts/AuthContext';
import { BANK_PAYMENT_OPTIONS, CARD_PAYMENT_OPTIONS } from '@/lib/paymentOptions';
import { getLeadBranchDetails, printReceipt as printReceiptDocument } from '@/lib/receiptTemplate';
import { useDebounce } from '@/hooks/useDebounce';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// The client-list API joins each client's lead to its crm_branch record, so
// the receipt can show that client's actual branch instead of always Dubai.
type ClientWithBranch = CrmClientsAttributes & {
  opportunityId?: number | null;
  phone?: string;
  branchName?: string;
  branchAddress?: string;
  branchEmail?: string;
  branchMobile?: string;
  branchLicenseNumber?: string | null;
  branchVatGstPercent?: number | string | null;
  currencyCode?: string | null;
};

interface BalanceRow {
  clientId: number;
  leadId: number;
  payTotal: number;
  paidYet: number;
  payBalance: number;
  receiptCount: number;
  lastReceiptNumber: string;
  lastPaymentDate: string;
}

interface PortalDocumentRow {
  document_id: string;
  document_label: string;
  status: string;
  file_url: string | null;
  file_name: string | null;
  review_note: string | null;
}

interface QuickPayState {
  client: ClientWithBranch;
  balance: BalanceRow | null;
  amount: string;
  method: string;
  date: string;
  txnId: string;
  saving: boolean;
  msg: string;
  success: boolean;
  receipt: any;
}

export default function ClientsManagement() {
  const { user, currencyCode } = useAuth();
  const [clients, setClients]           = useState<ClientWithBranch[]>([]);
  const [balances, setBalances]         = useState<Map<number, BalanceRow>>(new Map());
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithBranch | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [conversationHistoryLeadId, setConversationHistoryLeadId] = useState<number | null>(null);
  const [quickPay, setQuickPay]         = useState<QuickPayState | null>(null);
  const [portalDocuments, setPortalDocuments] = useState<PortalDocumentRow[]>([]);
  const [portalMsg, setPortalMsg]       = useState('');
  const [generatingCredentials, setGeneratingCredentials] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [postingStatus, setPostingStatus] = useState(false);

  const normalizeClient = (client: ClientWithBranch): ClientWithBranch => ({
    ...client,
    first_name: client.first_name || '',
    last_name: client.last_name || '',
    email: client.email || '',
    dob: client.dob ? new Date(client.dob) : new Date(0),
    token_validity: client.token_validity ? new Date(client.token_validity) : new Date(0),
    created: client.created ? new Date(client.created) : new Date(0),
  });

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);

      const clientsRes = await fetch(`/api/admin/clients?${params}`);
      if (clientsRes.ok) {
        const result = await clientsRes.json();
        setClients((result.data || []).map(normalizeClient));
        setPagination((prev) => ({ ...prev, total: result.pagination?.total ?? 0, totalPages: result.pagination?.totalPages ?? 0 }));
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // Balances are a separate, smaller aggregate dataset (not paginated with
  // the client list) — fetched once on mount.
  useEffect(() => {
    fetch('/api/admin/clients/balances')
      .then((res) => (res.ok ? res.json() : null))
      .then((bResult) => {
        if (!bResult) return;
        const map = new Map<number, BalanceRow>();
        (bResult.data || []).forEach((b: BalanceRow) => map.set(b.clientId, b));
        setBalances(map);
      })
      .catch((error) => console.error('Failed to load client balances:', error));
  }, []);

  const { sorted: sortedClients, sortKey: clientSortKey, sortDirection: clientSortDirection, toggleSort: toggleClientSort } = useSortableData(
    clients,
    {
      name: (c) => `${c.first_name || ''} ${c.last_name || ''}`,
      email: (c) => c.email,
      nationality: (c) => c.nationality,
      status: (c) => c.status,
      totalFee: (c) => balances.get(c.id)?.payTotal,
      paid: (c) => balances.get(c.id)?.paidYet,
      balanceDue: (c) => balances.get(c.id)?.payBalance,
      receipts: (c) => balances.get(c.id)?.receiptCount,
    },
  );

  const loadPortalDocuments = async (leadId: number) => {
    try {
      const res = await fetch(`/api/admin/clients/${leadId}/documents`);
      const json = await res.json();
      if (res.ok) setPortalDocuments(json.documents || []);
    } catch {
      setPortalDocuments([]);
    }
  };

  const handleViewClient = (client: ClientWithBranch) => {
    setSelectedClient(client);
    setShowModal(true);
    setPortalMsg('');
    setStatusMessage('');
    loadPortalDocuments(client.leadId);
  };

  // Server re-validates compliance/accounts approval itself regardless of
  // whatever this button's enabled/disabled state shows client-side.
  const handleGenerateCredentials = async (leadId: number) => {
    setGeneratingCredentials(true);
    setPortalMsg('');
    try {
      const res = await fetch(`/api/admin/clients/${leadId}/credentials`, { method: 'POST' });
      const json = await res.json();
      setPortalMsg(res.ok ? `Portal credentials emailed to ${json.email}.` : (json.error || 'Failed to generate credentials'));
    } catch {
      setPortalMsg('Failed to generate credentials');
    } finally {
      setGeneratingCredentials(false);
    }
  };

  const handleReviewDocument = async (leadId: number, documentId: string, status: 'Approved' | 'Rejected' | 'Resubmit Requested') => {
    const note = status !== 'Approved' ? (prompt('Add a note for the client (optional):') ?? undefined) : undefined;
    const res = await fetch(`/api/admin/clients/${leadId}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId, status, review_note: note }),
    });
    if (res.ok) await loadPortalDocuments(leadId);
  };

  const handlePostStatus = async (leadId: number) => {
    if (!statusMessage.trim()) return;
    setPostingStatus(true);
    try {
      const res = await fetch(`/api/admin/clients/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: statusMessage.trim() }),
      });
      if (res.ok) setStatusMessage('');
    } finally {
      setPostingStatus(false);
    }
  };

  const openQuickPay = (client: ClientWithBranch) => {
    const balance = balances.get(client.id) || null;
    setQuickPay({
      client,
      balance,
      amount: balance ? String(balance.payBalance > 0 ? balance.payBalance : '') : '',
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
      txnId: '',
      saving: false,
      msg: '',
      success: false,
      receipt: null,
    });
  };

  const openOpportunityFlow = (client: ClientWithBranch) => {
    const params = new URLSearchParams({
      leadId: String(client.leadId),
      stage: 'closed',
    });
    if (client.opportunityId) params.set('opportunityId', String(client.opportunityId));
    window.location.href = `/admin/leads/opportunity-flow?${params.toString()}`;
  };

  // Branch branding (legal name, address, contact, licence) is resolved from
  // the client's own crm_branch record via the centralized receipt template
  // shared with the Opportunity Flow wizard and Lead Management's quick-pay,
  // instead of a "Dubai HQ vs. everyone else" special case kept only here.
  const printReceipt = (receipt: any, client: ClientWithBranch, qp: QuickPayState) => {
    const branchDetails = getLeadBranchDetails({
      dmBranch: {
        name: client.branchName,
        address: client.branchAddress,
        email: client.branchEmail,
        mobile: client.branchMobile,
        licenseNumber: client.branchLicenseNumber,
        vatGstPercent: client.branchVatGstPercent,
      },
    });
    printReceiptDocument({
      receiptNumber: receipt.receiptNumber || receipt.paymentNumber,
      paymentDate: qp.date,
      clientName: `${client.first_name} ${client.last_name}`,
      email: client.email,
      phone: client.phone,
      agreementNumber: receipt.agreementNumber,
      companyName: branchDetails.companyName,
      branchName: branchDetails.branchName,
      branchAddress: branchDetails.branchAddress,
      branchEmail: branchDetails.branchEmail,
      branchPhone: branchDetails.branchPhone,
      licenseNumber: branchDetails.licenseNumber,
      vatGstPercent: branchDetails.vatGstPercent,
      paymentMethod: qp.method,
      transactionId: qp.txnId,
      currency: client.currencyCode || currencyCode,
      totalAmount: qp.balance?.payTotal,
      previouslyPaid: qp.balance?.paidYet,
      paidAmount: qp.amount,
      remainingBalance: Math.max(0, Number(qp.balance?.payBalance || 0) - Number(qp.amount || 0)),
    });
  };

  const submitQuickPay = async () => {
    if (!quickPay) return;
    const amount = Number(quickPay.amount);
    if (!amount || amount <= 0) { setQuickPay(p => p ? { ...p, msg: 'Enter a valid amount.' } : null); return; }

    setQuickPay(p => p ? { ...p, saving: true, msg: '' } : null);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: quickPay.client.leadId,
          opportunityId: null,
          paymentData: {
            paymentStructure: 'installment',
            paymentMethod: quickPay.method,
            transactionId: quickPay.txnId || undefined,
            paymentDate: quickPay.date,
            paidAmount: amount,
            totalAmount: quickPay.balance?.payTotal || amount,
            amount,
          },
          receiptData: {
            description: `Balance payment receipt for ${quickPay.client.first_name} ${quickPay.client.last_name}`,
            receiptType: 'payment',
            taxAmount: 0,
            discountAmount: 0,
            notes: '',
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create receipt');
      const receipt = json.data?.receipt || json.data || json;
      setQuickPay(p => p ? { ...p, saving: false, success: true, receipt, msg: `Receipt ${receipt.receiptNumber || ''} created!` } : null);
      // Refresh balances
      const bRes = await fetch('/api/admin/clients/balances');
      if (bRes.ok) {
        const bResult = await bRes.json();
        const map = new Map<number, BalanceRow>();
        (bResult.data || []).forEach((b: BalanceRow) => map.set(b.clientId, b));
        setBalances(map);
      }
    } catch (err: any) {
      setQuickPay(p => p ? { ...p, saving: false, msg: err.message || 'Failed to save payment' } : null);
    }
  };

  const getStatusColor = (status: number) =>
    status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  const getVerificationColor = (verify: number) =>
    verify === 1 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all clients</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search clients by name, email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
          <SearchableSelect className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Verification</option>
            <option value="1">Verified</option>
            <option value="0">Not Verified</option>
          </SearchableSelect>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4">
          <SortButtonRow
            options={[
              ['name', 'Client'],
              ['email', 'Email'],
              ['nationality', 'Nationality'],
              ['status', 'Status'],
              ['totalFee', 'Total Fee'],
              ['paid', 'Paid'],
              ['balanceDue', 'Balance Due'],
              ['receipts', 'Receipts'],
            ] as const}
            activeKey={clientSortKey}
            direction={clientSortDirection}
            onSort={toggleClientSort}
          />
          <RecordList isEmpty={sortedClients.length === 0}>
            {sortedClients.map((client) => {
              const bal = balances.get(client.id);
              const hasBalance = bal && Number(bal.payBalance) > 0;
              return (
                <RecordCard
                  key={client.id}
                  className={hasBalance ? 'border-l-4 border-l-orange-400' : ''}
                  avatar={<span className="text-sm font-bold">{client.first_name.charAt(0)}{client.last_name.charAt(0)}</span>}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{client.first_name} {client.last_name}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{client.leadId} · {client.city || '—'}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                        {client.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </>
                  }
                  metaItems={[{ icon: FileCheck2, text: `${client.email} · ${client.nationality || '—'}`, key: 'contact' }]}
                  stats={[
                    { label: 'Total Fee', value: bal ? `${client.currencyCode || 'AED'} ${Number(bal.payTotal).toLocaleString()}` : '—' },
                    { label: 'Paid', value: bal ? <span className="text-green-700">{client.currencyCode || 'AED'} {Number(bal.paidYet).toLocaleString()}</span> : '—' },
                    {
                      label: 'Balance Due',
                      value: bal ? (
                        hasBalance ? (
                          <span className="inline-flex items-center gap-1 font-bold text-red-700"><AlertCircle className="w-3.5 h-3.5" /> {client.currencyCode || 'AED'} {Number(bal.payBalance).toLocaleString()}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Fully Paid</span>
                        )
                      ) : '—',
                    },
                    { label: 'Receipts', value: bal ? `${Number(bal.receiptCount)} receipt${Number(bal.receiptCount) !== 1 ? 's' : ''}` : '—' },
                  ]}
                  actions={[
                    { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewClient(client) },
                    { key: 'flow', icon: FileText, label: 'Opportunity Flow', onClick: () => openOpportunityFlow(client), colorClass: 'bg-blue-600 text-white hover:bg-blue-700' },
                    { key: 'pay', icon: Receipt, label: `Collect balance ${client.currencyCode || 'AED'} ${Number(bal?.payBalance).toLocaleString()} & generate receipt`, onClick: () => openQuickPay(client), colorClass: 'bg-orange-500 text-white hover:bg-orange-600', hidden: !hasBalance },
                  ]}
                />
              );
            })}
          </RecordList>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} — {pagination.total} clients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages || prev.page, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Client Details Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Client Details</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Personal Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedClient.first_name} {selectedClient.last_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedClient.email}</p>
                    <p><span className="font-medium">Date of Birth:</span> {selectedClient.dob.toLocaleDateString()}</p>
                    <p><span className="font-medium">Nationality:</span> {selectedClient.nationality}</p>
                    <p><span className="font-medium">City:</span> {selectedClient.city}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Account Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Lead ID:</span> #{selectedClient.leadId}</p>
                    <p><span className="font-medium">Status:</span> {selectedClient.status === 1 ? 'Active' : 'Inactive'}</p>
                    <p><span className="font-medium">Verified:</span> {selectedClient.verify === 1 ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Accepted:</span> {selectedClient.accept === 1 ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Case Manager:</span> #{selectedClient.case_manager}</p>
                    <p><span className="font-medium">Backend Person:</span> #{selectedClient.backend_person}</p>
                  </div>
                </div>
              </div>
              {(() => {
                const b = balances.get(selectedClient.id);
                return b ? (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Payment Summary</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div><span className="text-gray-500">Total Fee:</span> <span className="font-medium">{selectedClient.currencyCode || 'AED'} {Number(b.payTotal).toLocaleString()}</span></div>
                      <div><span className="text-gray-500">Paid:</span> <span className="font-medium text-green-700">{selectedClient.currencyCode || 'AED'} {Number(b.paidYet).toLocaleString()}</span></div>
                      <div><span className="text-gray-500">Balance:</span> <span className={`font-bold ${Number(b.payBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>{selectedClient.currencyCode || 'AED'} {Number(b.payBalance).toLocaleString()}</span></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{b.receiptCount} receipt(s) · Last: {b.lastReceiptNumber || '—'}</p>
                  </div>
                ) : null;
              })()}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Address Information</h4>
                <p className="mt-1">{selectedClient.full_address}</p>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Token Information</h4>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Token:</span> {selectedClient.token}</p>
                  <p><span className="font-medium">Token Validity:</span> {selectedClient.token_validity.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Account Dates</h4>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Created:</span> {selectedClient.created.toLocaleDateString()}</p>
                </div>
              </div>

              {/* Client Portal: credential generation, document review, status updates */}
              <div className="mt-4 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700">Client Portal</h4>
                  <button
                    onClick={() => handleGenerateCredentials(selectedClient.leadId)}
                    disabled={generatingCredentials}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {generatingCredentials ? 'Generating…' : 'Generate Client Portal Credentials'}
                  </button>
                </div>
                {portalMsg && <p className="mt-2 text-xs text-slate-600">{portalMsg}</p>}

                {portalDocuments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="flex items-center gap-1 text-xs font-medium text-slate-500"><FileCheck2 className="h-3.5 w-3.5" /> Uploaded Documents</p>
                    {portalDocuments.map((doc) => (
                      <div key={doc.document_id} className="flex items-center justify-between rounded-md border border-slate-100 p-2 text-xs">
                        <div>
                          <p className="font-medium text-slate-800">{doc.document_label}</p>
                          <p className="text-slate-500">{doc.status}{doc.file_name ? ` · ${doc.file_name}` : ''}</p>
                        </div>
                        {doc.status === 'Submitted' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleReviewDocument(selectedClient.leadId, doc.document_id, 'Approved')} className="rounded bg-emerald-100 px-2 py-1 text-emerald-700 hover:bg-emerald-200">Approve</button>
                            <button onClick={() => handleReviewDocument(selectedClient.leadId, doc.document_id, 'Resubmit Requested')} className="rounded bg-amber-100 px-2 py-1 text-amber-700 hover:bg-amber-200">Resubmit</button>
                            <button onClick={() => handleReviewDocument(selectedClient.leadId, doc.document_id, 'Rejected')} className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200">Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="Post a status update visible to the client…"
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handlePostStatus(selectedClient.leadId)}
                    disabled={postingStatus || !statusMessage.trim()}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> Post
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                Close
              </button>
              <button onClick={() => setConversationHistoryLeadId(selectedClient.leadId)}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
                Conversation History
              </button>
              <button onClick={() => openOpportunityFlow(selectedClient)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" /> Opportunity Flow
              </button>
              {balances.get(selectedClient.id) && Number(balances.get(selectedClient.id)?.payBalance) > 0 && (
                <button onClick={() => { setShowModal(false); openQuickPay(selectedClient); }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Collect Balance Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {quickPay && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Collect Payment</h3>
                <p className="text-sm text-gray-500">{quickPay.client.first_name} {quickPay.client.last_name}</p>
              </div>
              <button onClick={() => setQuickPay(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {quickPay.balance && (
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500">Total Fee</div>
                    <div className="font-bold text-gray-800">{quickPay.client.currencyCode || 'AED'} {Number(quickPay.balance.payTotal).toLocaleString()}</div>
                  </div>
                  <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-green-600">Paid So Far</div>
                    <div className="font-bold text-green-700">{quickPay.client.currencyCode || 'AED'} {Number(quickPay.balance.paidYet).toLocaleString()}</div>
                  </div>
                  <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-red-600">Balance Due</div>
                    <div className="font-bold text-red-700">{quickPay.client.currencyCode || 'AED'} {Number(quickPay.balance.payBalance).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {!quickPay.success ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received ({quickPay.client.currencyCode || 'AED'})</label>
                    <input
                      type="number"
                      min="0"
                      value={quickPay.amount}
                      onChange={e => setQuickPay(p => p ? { ...p, amount: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <SearchableSelect
                      value={quickPay.method}
                      onChange={e => setQuickPay(p => p ? { ...p, method: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online</option>
                      <optgroup label="Bank">
                        {BANK_PAYMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Card / POS">
                        {CARD_PAYMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                    </SearchableSelect>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={quickPay.date}
                      onChange={e => setQuickPay(p => p ? { ...p, date: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (optional)</label>
                    <input
                      type="text"
                      value={quickPay.txnId}
                      onChange={e => setQuickPay(p => p ? { ...p, txnId: e.target.value } : null)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Reference / transaction number"
                    />
                  </div>

                  {quickPay.msg && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {quickPay.msg}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-800">{quickPay.msg}</p>
                  <p className="text-sm text-green-600 mt-1">Payment recorded in pay history and lead updated.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setQuickPay(null)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                {quickPay.success ? 'Close' : 'Cancel'}
              </button>
              {quickPay.success && quickPay.receipt && quickPay.receipt.accountantStatus === 'verified' ? (
                <button
                  onClick={() => printReceipt(quickPay.receipt, quickPay.client, quickPay)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
              ) : quickPay.success && quickPay.receipt ? (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-3 py-2">
                  Awaiting accounts verification
                </span>
              ) : (
                <button
                  onClick={submitQuickPay}
                  disabled={quickPay.saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {quickPay.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  {quickPay.saving ? 'Processing…' : 'Save & Create Receipt'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {conversationHistoryLeadId && (
        <ConversationHistoryModal
          leadId={conversationHistoryLeadId}
          clientName={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined}
          onClose={() => setConversationHistoryLeadId(null)}
        />
      )}
    </div>
  );
}
