'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Receipt, User, Wallet, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { isBranchManagerOrCeo } from '@/lib/roleChecks';
import { AddThirdPartyPaymentDrawer } from '@/components/Payments/AddThirdPartyPaymentDrawer';
import { EditOpportunityPaymentDrawer, type EditablePayment } from '@/components/Payments/EditOpportunityPaymentDrawer';
import { EditThirdPartyPaymentDrawer, type EditableThirdPartyPayment } from '@/components/Payments/EditThirdPartyPaymentDrawer';

interface ThirdPartyPayment {
  id: number;
  leadId: number;
  date: Date | null;
  currency_id: number;
  amount: number;
  Tax: number;
  payMethod: string | null;
  emp_id: number;
  receipt_date: Date | null;
  cc_number: string;
  receipt: string;
  counselor_receipt: string;
  trans_or_ref_number: string;
  remarks: string;
  payoption?: string;
  paycardoption?: string;
}

interface LeadFee {
  id: number;
  lead: number;
  amount: number;
  taxAmt: number;
  payDate: Date;
  paidAmt: number;
  paidDate: Date;
  profAmt: number;
  status: number;
}

interface OpportunityPayment {
  id: number;
  opportunityId: number;
  paymentNumber: string;
  receiptNumber: string | null;
  totalAmount: number;
  amount: number;
  paidAmount: number;
  remainingBalance: number;
  currency: string;
  paymentMethod: string;
  paymentDate: Date | null;
  status: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceName: string | null;
  branchName: string | null;
  consultantName: string | null;
  taxAmount: number;
  discountAmount: number;
  accountantStatus: string | null;
  notes?: string | null;
  description?: string | null;
  remark?: string | null;
  adminFeeIncluded?: boolean;
  adminFeeAmount?: number;
  receiptUrl?: string | null;
  dmcOpportunity?: {
    id: number;
    opportunityName: string;
  };
  createdEmployee?: {
    id: number;
    name: string;
  };
}

interface FilterOption {
  value: string;
  label: string;
}

export default function PaymentsManagement() {
  const { user, currencyCode } = useAuth();
  const canEditPayments = isBranchManagerOrCeo(user);
  const [opportunityPayments, setOpportunityPayments] = useState<OpportunityPayment[]>([]);
  const [payments, setPayments] = useState<ThirdPartyPayment[]>([]);
  const [leadFees, setLeadFees] = useState<LeadFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<ThirdPartyPayment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'opportunity' | 'thirdparty' | 'fees'>('opportunity');
  const [serviceOptions, setServiceOptions] = useState<FilterOption[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const [showThirdPartyDrawer, setShowThirdPartyDrawer] = useState(false);
  const [editingOppPayment, setEditingOppPayment] = useState<OpportunityPayment | null>(null);
  const [editingThirdPartyPayment, setEditingThirdPartyPayment] = useState<ThirdPartyPayment | null>(null);

  useEffect(() => {
    fetchServiceOptions();
  }, []);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pagination.page, pagination.limit, debouncedSearchTerm]);

  const toNumber = (value: unknown) => Number(value || 0);

  const normalizeOpportunityPayment = (payment: any): OpportunityPayment => ({
    ...payment,
    totalAmount: toNumber(payment.totalAmount),
    amount: toNumber(payment.amount),
    paidAmount: toNumber(payment.paidAmount),
    remainingBalance: toNumber(payment.remainingBalance),
    taxAmount: toNumber(payment.taxAmount),
    discountAmount: toNumber(payment.discountAmount),
    adminFeeAmount: toNumber(payment.adminFeeAmount),
    paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
    receiptNumber: payment.receiptNumber || '',
    paymentNumber: payment.paymentNumber || '',
    paymentMethod: payment.paymentMethod || '',
    status: payment.status || 'pending',
  });

  const normalizePayment = (payment: ThirdPartyPayment): ThirdPartyPayment => ({
    ...payment,
    amount: toNumber(payment.amount),
    Tax: toNumber(payment.Tax),
    receipt: payment.receipt || '',
    trans_or_ref_number: payment.trans_or_ref_number || '',
    payMethod: payment.payMethod || '',
    date: payment.date ? new Date(payment.date) : new Date(0),
    receipt_date: payment.receipt_date ? new Date(payment.receipt_date) : new Date(0),
    payoption: payment.payoption || '',
    paycardoption: payment.paycardoption || '',
  });

  const normalizeFee = (fee: LeadFee): LeadFee => ({
    ...fee,
    amount: toNumber(fee.amount),
    taxAmt: toNumber(fee.taxAmt),
    paidAmt: toNumber(fee.paidAmt),
    profAmt: toNumber(fee.profAmt),
    payDate: fee.payDate ? new Date(fee.payDate) : new Date(0),
    paidDate: fee.paidDate ? new Date(fee.paidDate) : new Date(0),
  });

  // Only the active tab's data is ever fetched — switching tabs re-fetches
  // rather than loading all three payment sources up front, since each is
  // now independently server-paginated.
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);

      if (activeTab === 'opportunity') {
        const res = await fetch(`/api/opportunity-payments?${params}`);
        if (!res.ok) throw new Error('Failed to fetch opportunity payments');
        const result = await res.json();
        setOpportunityPayments((result.data || []).map(normalizeOpportunityPayment));
        setPagination((prev) => ({ ...prev, total: result.pagination?.total ?? 0, totalPages: result.pagination?.totalPages ?? 0 }));
      } else if (activeTab === 'thirdparty') {
        const res = await fetch(`/api/admin/payments?type=thirdparty&${params}`);
        if (!res.ok) throw new Error('Failed to fetch third party payments');
        const result = await res.json();
        setPayments((result.data || []).map(normalizePayment));
        setPagination((prev) => ({ ...prev, total: result.pagination?.total ?? 0, totalPages: result.pagination?.totalPages ?? 0 }));
      } else {
        const res = await fetch(`/api/admin/payments?type=fees&${params}`);
        if (!res.ok) throw new Error('Failed to fetch lead fees');
        const result = await res.json();
        setLeadFees((result.data || []).map(normalizeFee));
        setPagination((prev) => ({ ...prev, total: result.pagination?.total ?? 0, totalPages: result.pagination?.totalPages ?? 0 }));
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceOptions = async () => {
    try {
      const response = await fetch('/api/lead-filter-options');
      if (!response.ok) return;
      const data = await response.json();
      setServiceOptions(data.services || []);
    } catch (error) {
      console.error('Failed to load service options:', error);
      setServiceOptions([]);
    }
  };

  const getServiceLabel = (value?: string | null) => {
    const key = String(value || '').trim();
    if (!key) return '';
    return serviceOptions.find((option) => option.value === key)?.label || key;
  };

  // Search is applied server-side per tab now (see fetchPayments); method/date
  // have no backend equivalent for any of the three payment sources, so they
  // still narrow whichever page is currently loaded.
  const filteredOpportunityPayments = opportunityPayments.filter(payment => {
    const matchMethod = !methodFilter || (payment.paymentMethod || '').toLowerCase() === methodFilter.toLowerCase();
    const matchDate = !dateFilter || (payment.paymentDate && new Date(payment.paymentDate).toISOString().startsWith(dateFilter));
    return matchMethod && matchDate;
  });

  const filteredPayments = payments.filter(payment => {
    const matchMethod = !methodFilter || (payment.payMethod || '').toLowerCase() === methodFilter.toLowerCase();
    const matchDate = !dateFilter || (payment.date && new Date(payment.date).toISOString().startsWith(dateFilter));
    return matchMethod && matchDate;
  });

  const filteredFees = leadFees;

  const { sorted: sortedOpportunityPayments, sortKey: oppPaymentSortKey, sortDirection: oppPaymentSortDirection, toggleSort: toggleOppPaymentSort } = useSortableData(
    filteredOpportunityPayments,
    {
      payment: (p) => p.paymentNumber,
      client: (p) => p.clientName,
      service: (p) => getServiceLabel(p.serviceName) || p.dmcOpportunity?.opportunityName,
      amount: (p) => p.paidAmount,
      balance: (p) => p.remainingBalance,
      method: (p) => p.paymentMethod,
      status: (p) => p.status,
      verification: (p) => p.accountantStatus,
    },
  );

  const { sorted: sortedThirdPartyPayments, sortKey: thirdPartyPaymentSortKey, sortDirection: thirdPartyPaymentSortDirection, toggleSort: toggleThirdPartyPaymentSort } = useSortableData(
    filteredPayments,
    {
      receipt: (p) => p.receipt,
      leadId: (p) => p.leadId,
      amount: (p) => p.amount,
      tax: (p) => p.Tax,
      method: (p) => p.payMethod,
      date: (p) => p.date,
    },
  );

  const { sorted: sortedFees, sortKey: feeSortKey, sortDirection: feeSortDirection, toggleSort: toggleFeeSort } = useSortableData(
    filteredFees,
    {
      leadId: (f) => f.lead,
      totalAmount: (f) => f.amount,
      taxAmount: (f) => f.taxAmt,
      paidAmount: (f) => f.paidAmt,
      professionalAmount: (f) => f.profAmt,
      status: (f) => f.status,
      paymentDate: (f) => f.payDate,
    },
  );

  const handleViewPayment = (payment: ThirdPartyPayment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getPaymentMethodColor = (method: string | null) => {
    switch (method) {
      case 'Credit Card':
        return 'bg-blue-100 text-blue-800';
      case 'Bank Transfer':
        return 'bg-green-100 text-green-800';
      case 'Cash':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all payments and fees</p>
        </div>
        {activeTab === 'thirdparty' && (
          <button
            onClick={() => setShowThirdPartyDrawer(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Payment
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab('opportunity'); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'opportunity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Opportunity Payments
            </button>
            <button
              onClick={() => { setActiveTab('thirdparty'); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'thirdparty'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Third Party Payments
            </button>
            <button
              onClick={() => { setActiveTab('fees'); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === 'fees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lead Fees
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={
                activeTab === 'opportunity'
                  ? 'Search by payment, receipt, client, service, or opportunity ID...'
                  : activeTab === 'thirdparty'
                    ? 'Search by receipt or transaction number...'
                    : 'Search by lead ID...'
              }
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Payment Methods</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </SearchableSelect>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Opportunity Payments */}
      {activeTab === 'opportunity' && (
        <div className="bg-white rounded-lg shadow p-3">
          <SortButtonRow
            options={[
              ['payment', 'Payment'], ['client', 'Client'], ['service', 'Service'],
              ['amount', 'Amount'], ['balance', 'Balance'], ['method', 'Method'],
              ['status', 'Status'], ['verification', 'Verification'],
            ]}
            activeKey={oppPaymentSortKey}
            direction={oppPaymentSortDirection}
            onSort={toggleOppPaymentSort}
          />
          <RecordList isEmpty={filteredOpportunityPayments.length === 0} emptyTitle="No opportunity payments found">
            {sortedOpportunityPayments.map((payment) => (
              <RecordCard
                key={payment.id}
                avatar={<Wallet className="h-4 w-4" />}
                avatarColorClass="from-blue-600 to-cyan-400"
                title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{payment.paymentNumber}</span>}
                titleBadges={
                  <>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{payment.receiptNumber || 'No receipt'}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentMethodColor(payment.paymentMethod)}`}>
                      {payment.paymentMethod || 'N/A'}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${payment.status === 'paid' || payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {payment.status}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                      payment.accountantStatus === 'verified' ? 'bg-green-100 text-green-800' :
                      payment.accountantStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.accountantStatus === 'verified' ? 'Approved' : payment.accountantStatus === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </>
                }
                metaItems={[
                  { icon: FileText, text: `Opportunity #${payment.opportunityId}`, key: 'opp' },
                  { icon: User, text: `${payment.clientName || 'Client'}${payment.clientPhone || payment.clientEmail ? ` · ${payment.clientPhone || payment.clientEmail}` : ''}`, key: 'client' },
                  { icon: User, text: payment.consultantName || payment.createdEmployee?.name || '—', key: 'consultant' },
                ]}
                stats={[
                  { label: 'Service', value: getServiceLabel(payment.serviceName) || payment.dmcOpportunity?.opportunityName || 'Service', sub: payment.branchName || undefined },
                  { label: 'Amount', value: `${payment.currency} ${payment.paidAmount.toFixed(2)}`, sub: `Total ${payment.totalAmount.toFixed(2)}` },
                  { label: 'Balance', value: `${payment.currency} ${payment.remainingBalance.toFixed(2)}` },
                  { label: 'Payment Date', value: payment.paymentDate?.toLocaleDateString() || 'No date' },
                ]}
                actions={[
                  {
                    key: 'receipt',
                    icon: FileText,
                    label: 'View Receipt',
                    onClick: () => window.open(`/admin/leads/receipt/${payment.opportunityId}`, '_blank'),
                    colorClass: 'bg-green-50 text-green-700 hover:bg-green-100',
                    hidden: !(payment.accountantStatus === 'verified' && payment.opportunityId),
                  },
                  {
                    key: 'edit',
                    icon: Pencil,
                    label: 'Edit',
                    onClick: () => setEditingOppPayment(payment),
                    colorClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                    hidden: !canEditPayments,
                  },
                ]}
              />
            ))}
          </RecordList>
        </div>
      )}

      {/* Third Party Payments */}
      {activeTab === 'thirdparty' && (
        <div className="bg-white rounded-lg shadow p-3">
          <SortButtonRow
            options={[
              ['receipt', 'Receipt'], ['leadId', 'Lead ID'], ['amount', 'Amount'],
              ['tax', 'Tax'], ['method', 'Payment Method'], ['date', 'Date'],
            ]}
            activeKey={thirdPartyPaymentSortKey}
            direction={thirdPartyPaymentSortDirection}
            onSort={toggleThirdPartyPaymentSort}
          />
          <RecordList isEmpty={filteredPayments.length === 0} emptyTitle="No third party payments found">
            {sortedThirdPartyPayments.map((payment) => (
              <RecordCard
                key={payment.id}
                avatar={<Receipt className="h-4 w-4" />}
                avatarColorClass="from-purple-600 to-fuchsia-400"
                title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{payment.receipt}</span>}
                titleBadges={
                  <>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Lead #{payment.leadId}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentMethodColor(payment.payMethod)}`}>
                      {payment.payMethod}
                    </span>
                  </>
                }
                stats={[
                  { label: 'Amount', value: `${currencyCode} ${payment.amount.toFixed(2)}` },
                  { label: 'Tax', value: `${currencyCode} ${payment.Tax.toFixed(2)}` },
                  { label: 'Date', value: payment.date?.toLocaleDateString() || 'N/A' },
                ]}
                actions={[
                  { key: 'view', icon: FileText, label: 'View', onClick: () => handleViewPayment(payment), colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                  { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => setEditingThirdPartyPayment(payment), colorClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200', hidden: !canEditPayments },
                  { key: 'delete', icon: FileText, label: 'Delete', colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' },
                ]}
              />
            ))}
          </RecordList>
        </div>
      )}

      {/* Lead Fees */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-lg shadow p-3">
          <SortButtonRow
            options={[
              ['leadId', 'Lead ID'], ['totalAmount', 'Total Amount'], ['taxAmount', 'Tax Amount'],
              ['paidAmount', 'Paid Amount'], ['professionalAmount', 'Professional Amount'],
              ['status', 'Status'], ['paymentDate', 'Payment Date'],
            ]}
            activeKey={feeSortKey}
            direction={feeSortDirection}
            onSort={toggleFeeSort}
          />
          <RecordList isEmpty={filteredFees.length === 0} emptyTitle="No lead fees found">
            {sortedFees.map((fee) => (
              <RecordCard
                key={fee.id}
                avatar={<Wallet className="h-4 w-4" />}
                avatarColorClass="from-emerald-600 to-teal-400"
                title={<span className="min-w-0 break-words text-base font-bold text-gray-950">Lead #{fee.lead}</span>}
                titleBadges={
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                    {fee.status === 1 ? 'Paid' : 'Pending'}
                  </span>
                }
                stats={[
                  { label: 'Total Amount', value: `${currencyCode} ${fee.amount.toFixed(2)}` },
                  { label: 'Tax Amount', value: `${currencyCode} ${fee.taxAmt.toFixed(2)}` },
                  { label: 'Paid Amount', value: `${currencyCode} ${fee.paidAmt.toFixed(2)}` },
                  { label: 'Professional Amount', value: `${currencyCode} ${fee.profAmt.toFixed(2)}` },
                ]}
                metaItems={[{ icon: FileText, text: `Payment date: ${new Date(fee.payDate).toLocaleDateString()}`, key: 'date' }]}
              />
            ))}
          </RecordList>
        </div>
      )}

      <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
        <p className="text-sm text-gray-600">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)} — {pagination.total} records
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

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Payment Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Receipt Number:</span> {selectedPayment.receipt}</p>
                    <p><span className="font-medium">Lead ID:</span> {selectedPayment.leadId}</p>
                    <p><span className="font-medium">Amount:</span> ${selectedPayment.amount.toFixed(2)}</p>
                    <p><span className="font-medium">Tax:</span> ${selectedPayment.Tax.toFixed(2)}</p>
                    <p><span className="font-medium">Total:</span> ${(selectedPayment.amount + selectedPayment.Tax).toFixed(2)}</p>
                    <p><span className="font-medium">Payment Method:</span> {selectedPayment.payMethod}</p>
                    <p><span className="font-medium">Payment Option:</span> {selectedPayment.payoption}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Transaction Details</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Transaction Number:</span> {selectedPayment.trans_or_ref_number}</p>
                    <p><span className="font-medium">Receipt Date:</span> {selectedPayment.receipt_date?.toLocaleDateString() || 'N/A'}</p>
                    <p><span className="font-medium">Payment Date:</span> {selectedPayment.date?.toLocaleDateString() || 'N/A'}</p>
                    <p><span className="font-medium">Counselor Receipt:</span> {selectedPayment.counselor_receipt}</p>
                    {selectedPayment.cc_number && (
                      <p><span className="font-medium">Card Number:</span> {selectedPayment.cc_number}</p>
                    )}
                    <p><span className="font-medium">Card Type:</span> {selectedPayment.paycardoption}</p>
                  </div>
                </div>
              </div>
              {selectedPayment.remarks && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700">Remarks</h4>
                  <p className="mt-1">{selectedPayment.remarks}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <AddThirdPartyPaymentDrawer
        open={showThirdPartyDrawer}
        onClose={() => setShowThirdPartyDrawer(false)}
        onCreated={fetchPayments}
      />

      <EditOpportunityPaymentDrawer
        open={Boolean(editingOppPayment)}
        payment={editingOppPayment as EditablePayment | null}
        serviceOptions={serviceOptions}
        onClose={() => setEditingOppPayment(null)}
        onSaved={fetchPayments}
      />

      <EditThirdPartyPaymentDrawer
        open={Boolean(editingThirdPartyPayment)}
        payment={editingThirdPartyPayment as EditableThirdPartyPayment | null}
        onClose={() => setEditingThirdPartyPayment(null)}
        onSaved={fetchPayments}
      />
    </div>
  );
}
