'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { Eye, Printer, Download, ChevronLeft, ChevronRight, Trash2, FileText } from 'lucide-react';
import { CrmB2bInvoicesAttributes } from '@/models';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useDebounce } from '@/hooks/useDebounce';

interface FilterOption {
  value: string;
  label: string;
}

type InvoiceRow = CrmB2bInvoicesAttributes & { currencyCode?: string };

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [purposeOptions, setPurposeOptions] = useState<FilterOption[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const [newInvoice, setNewInvoice] = useState({
    region: 1,
    receipt: '',
    branch: 1,
    company: '',
    purpose: '',
    narration: '',
    vat: 5,
    taxAmt: 0,
    totPayAmt: 0,
    payBalance: 0,
    payment_mode: '',
    amount: 0,
    discount: 0,
    status: 1,
    Counsilor: 1,
    created_by: 1,
  });

  useEffect(() => {
    fetchPurposeOptions();
  }, []);

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearchTerm, regionFilter, statusFilter]);

  const toNumber = (value: unknown) => Number(value || 0);

  const normalizeInvoice = (invoice: InvoiceRow): InvoiceRow => ({
    ...invoice,
    receipt: invoice.receipt || '',
    company: invoice.company || '',
    purpose: invoice.purpose || '',
    payment_mode: invoice.payment_mode || '',
    amount: toNumber(invoice.amount),
    taxAmt: toNumber(invoice.taxAmt),
    totPayAmt: toNumber(invoice.totPayAmt),
    payBalance: toNumber(invoice.payBalance),
    discount: toNumber(invoice.discount),
    created: invoice.created ? new Date(invoice.created) : new Date(),
    currencyCode: invoice.currencyCode || 'AED',
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      if (regionFilter) params.set('region', regionFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/invoices?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const result = await response.json();
      setInvoices((result.data || []).map(normalizeInvoice));
      setPagination((prev) => ({ ...prev, total: result.pagination?.total ?? 0, totalPages: result.pagination?.totalPages ?? 0 }));
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurposeOptions = async () => {
    try {
      const response = await fetch('/api/lead-filter-options');
      if (!response.ok) return;
      const data = await response.json();
      setPurposeOptions(data.services || []);
    } catch (error) {
      console.error('Failed to load purpose options:', error);
      setPurposeOptions([]);
    }
  };

  const getPurposeLabel = (purpose?: string | null) => {
    const value = String(purpose || '').trim();
    if (!value) return 'N/A';
    return purposeOptions.find((option) => option.value === value)?.label || value;
  };

  const { sorted: sortedInvoices, sortKey: invoiceSortKey, sortDirection: invoiceSortDirection, toggleSort: toggleInvoiceSort } = useSortableData(
    invoices,
    {
      receipt: (invoice) => invoice.receipt,
      company: (invoice) => invoice.company,
      purpose: (invoice) => getPurposeLabel(invoice.purpose),
      amount: (invoice) => invoice.amount,
      taxAmount: (invoice) => invoice.taxAmt,
      totalAmount: (invoice) => invoice.totPayAmt,
      balance: (invoice) => invoice.payBalance,
      paymentMode: (invoice) => invoice.payment_mode,
      status: (invoice) => invoice.status,
    },
  );

  const handleViewInvoice = (invoice: CrmB2bInvoicesAttributes) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.receipt || !newInvoice.company || isAddingInvoice) return;
    setIsAddingInvoice(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        window.toast.error(err.error || err.message || 'Failed to create invoice');
        return;
      }
      await fetchInvoices();
      setNewInvoice({
        region: 1,
        receipt: '',
        branch: 1,
        company: '',
        purpose: '',
        narration: '',
        vat: 5,
        taxAmt: 0,
        totPayAmt: 0,
        payBalance: 0,
        payment_mode: '',
        amount: 0,
        discount: 0,
        status: 1,
        Counsilor: 1,
        created_by: 1,
      });
      setShowAddModal(false);
    } finally {
      setIsAddingInvoice(false);
    }
  };

  const getStatusColor = (status?: number | null) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (status?: number | null) => {
    return status === 1 ? 'Paid' : 'Pending';
  };

  const getPaymentModeColor = (paymentMode?: string | null) => {
    switch (paymentMode) {
      case 'Bank Transfer':
        return 'bg-blue-100 text-blue-800';
      case 'Credit Card':
        return 'bg-purple-100 text-purple-800';
      case 'Cash':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Opens a formatted, standalone copy of the invoice in a new tab and
  // auto-triggers the browser's print dialog, from which "Save as PDF" is a
  // built-in destination — same open/review/download pattern already used
  // for receipts and B2B invoices on the Invoices & Payments page.
  const openInvoiceDocument = (invoice: InvoiceRow, autoPrint: boolean) => {
    const w = window.open('', '_blank');
    if (!w) {
      window.toast.error('Please allow pop-ups to open the invoice.');
      return;
    }
    const cur = invoice.currencyCode || 'AED';
    const fmt = (n?: number | null) => `${cur} ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    w.document.write(`
      <html><head><title>Invoice ${invoice.receipt}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .col { flex: 1; }
        .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 14px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
        th { background: #1e40af; color: white; }
        .total-row td { background: #f0f4ff; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header"><h1>INVOICE</h1></div>
      <div class="row">
        <div class="col">
          <div class="label">Billed To</div>
          <div class="value">${invoice.company || 'N/A'}</div>
        </div>
        <div class="col" style="text-align:right">
          <div class="label">Invoice Details</div>
          <div class="value"><strong>Receipt #:</strong> ${invoice.receipt}</div>
          <div class="value"><strong>Date:</strong> ${invoice.created ? new Date(invoice.created).toLocaleDateString() : 'N/A'}</div>
          <div class="value"><strong>Purpose:</strong> ${getPurposeLabel(invoice.purpose)}</div>
        </div>
      </div>
      <table>
        <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
        <tr><td>Amount</td><td style="text-align:right">${fmt(invoice.amount)}</td></tr>
        ${invoice.discount ? `<tr><td>Discount</td><td style="text-align:right; color:red">- ${fmt(invoice.discount)}</td></tr>` : ''}
        <tr><td>Tax (${invoice.vat || 0}%)</td><td style="text-align:right">${fmt(invoice.taxAmt)}</td></tr>
        <tr class="total-row"><td>Total Amount</td><td style="text-align:right">${fmt(invoice.totPayAmt)}</td></tr>
        <tr><td>Balance Due</td><td style="text-align:right">${fmt(invoice.payBalance)}</td></tr>
      </table>
      <div class="row">
        <div class="col"><div class="label">Payment Mode</div><div class="value">${invoice.payment_mode || 'N/A'}</div></div>
        <div class="col"><div class="label">Status</div><div class="value">${getStatusText(invoice.status)}</div></div>
      </div>
      ${invoice.narration ? `<div style="margin-top:16px"><div class="label">Narration</div><div class="value">${invoice.narration}</div></div>` : ''}
      <div class="footer"><p>This is a computer-generated invoice.</p></div>
      ${autoPrint ? '<script>window.onload=()=>window.print();</script>' : ''}
      </body></html>
    `);
    w.document.close();
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all invoices</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Invoice
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search invoices by receipt, company, or purpose..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Regions</option>
            <option value="1">UAE</option>
            <option value="2">Canada</option>
            <option value="3">Australia</option>
          </SearchableSelect>
          <SearchableSelect value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="1">Paid</option>
            <option value="0">Pending</option>
          </SearchableSelect>
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-4">
          <SortButtonRow
            options={[
              ['receipt', 'Receipt'],
              ['company', 'Company'],
              ['purpose', 'Purpose'],
              ['amount', 'Amount'],
              ['taxAmount', 'Tax Amount'],
              ['totalAmount', 'Total Amount'],
              ['balance', 'Balance'],
              ['paymentMode', 'Payment Mode'],
              ['status', 'Status'],
            ] as const}
            activeKey={invoiceSortKey}
            direction={invoiceSortDirection}
            onSort={toggleInvoiceSort}
          />
          <RecordList isEmpty={sortedInvoices.length === 0} emptyIcon={FileText} emptyTitle="No invoices found">
            {sortedInvoices.map((invoice) => (
              <RecordCard
                key={invoice.id}
                avatar={<FileText className="h-4 w-4" />}
                avatarColorClass="from-blue-600 to-cyan-400"
                title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{invoice.company}</span>}
                titleBadges={
                  <>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{invoice.receipt}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentModeColor(invoice.payment_mode)}`}>
                      {invoice.payment_mode || 'N/A'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </>
                }
                stats={[
                  { label: 'Purpose', value: getPurposeLabel(invoice.purpose) },
                  { label: 'Amount', value: `${invoice.currencyCode || 'AED'} ${invoice.amount?.toLocaleString() || '0'}` },
                  { label: 'Tax Amount', value: `${invoice.currencyCode || 'AED'} ${invoice.taxAmt?.toLocaleString() || '0'}` },
                  { label: 'Total Amount', value: `${invoice.currencyCode || 'AED'} ${invoice.totPayAmt?.toLocaleString() || '0'}` },
                  { label: 'Balance', value: `${invoice.currencyCode || 'AED'} ${invoice.payBalance?.toLocaleString() || '0'}` },
                ]}
                actions={[
                  { key: 'view', icon: Eye, label: 'View details', onClick: () => handleViewInvoice(invoice) },
                  { key: 'open', icon: Printer, label: 'Open invoice', onClick: () => openInvoiceDocument(invoice, false), colorClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                  { key: 'download', icon: Download, label: 'Download invoice (Print > Save as PDF)', onClick: () => openInvoiceDocument(invoice, true), colorClass: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
                  { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => {}, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' },
                ]}
              />
            ))}
          </RecordList>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} — {pagination.total} invoices
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

      {/* Invoice Details Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
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
                  <h4 className="font-semibold text-gray-700">Basic Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Receipt:</span> {selectedInvoice.receipt}</p>
                    <p><span className="font-medium">Company:</span> {selectedInvoice.company}</p>
                    <p><span className="font-medium">Purpose:</span> {getPurposeLabel(selectedInvoice.purpose)}</p>
                    <p><span className="font-medium">Region:</span> #{selectedInvoice.region}</p>
                    <p><span className="font-medium">Branch:</span> #{selectedInvoice.branch}</p>
                    <p><span className="font-medium">Counselor:</span> #{selectedInvoice.Counsilor}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Financial Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Amount:</span> {selectedInvoice.currencyCode || 'AED'} {selectedInvoice.amount?.toLocaleString()}</p>
                    <p><span className="font-medium">VAT (%):</span> {selectedInvoice.vat}%</p>
                    <p><span className="font-medium">Tax Amount:</span> {selectedInvoice.currencyCode || 'AED'} {selectedInvoice.taxAmt?.toLocaleString()}</p>
                    <p><span className="font-medium">Total Amount:</span> {selectedInvoice.currencyCode || 'AED'} {selectedInvoice.totPayAmt?.toLocaleString()}</p>
                    <p><span className="font-medium">Discount:</span> {selectedInvoice.currencyCode || 'AED'} {selectedInvoice.discount?.toLocaleString()}</p>
                    <p><span className="font-medium">Balance:</span> {selectedInvoice.currencyCode || 'AED'} {selectedInvoice.payBalance?.toLocaleString()}</p>
                    <p><span className="font-medium">Payment Mode:</span> {selectedInvoice.payment_mode}</p>
                    <p><span className="font-medium">Status:</span> {getStatusText(selectedInvoice.status)}</p>
                  </div>
                </div>
              </div>
              {selectedInvoice.narration && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700">Narration</h4>
                  <p className="mt-1">{selectedInvoice.narration}</p>
                </div>
              )}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Created Information</h4>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Created Date:</span> {selectedInvoice.created?.toLocaleDateString()}</p>
                  <p><span className="font-medium">Created By:</span> User #{selectedInvoice.created_by}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => openInvoiceDocument(selectedInvoice, false)}
                className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Open
              </button>
              <button
                onClick={() => openInvoiceDocument(selectedInvoice, true)}
                className="px-4 py-2 border border-[var(--cmg-blue)] text-[var(--cmg-blue)] rounded-lg hover:bg-[var(--cmg-blue-soft)] transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create New Invoice</h3>
              <button
                onClick={() => setShowAddModal(false)}
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
                  <label htmlFor="receipt" className="block text-sm font-medium text-gray-700">
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    id="receipt"
                    value={newInvoice.receipt}
                    onChange={(e) => setNewInvoice({ ...newInvoice, receipt: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter receipt number"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={newInvoice.company}
                    onChange={(e) => setNewInvoice({ ...newInvoice, company: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                    Purpose
                  </label>
                  <input
                    type="text"
                    id="purpose"
                    value={newInvoice.purpose}
                    onChange={(e) => setNewInvoice({ ...newInvoice, purpose: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter purpose"
                  />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700">
                    Payment Mode
                  </label>
                  <SearchableSelect
                    id="paymentMode"
                    value={newInvoice.payment_mode}
                    onChange={(e) => setNewInvoice({ ...newInvoice, payment_mode: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select payment mode</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                    Region
                  </label>
                  <SearchableSelect
                    id="region"
                    value={newInvoice.region}
                    onChange={(e) => setNewInvoice({ ...newInvoice, region: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={1}>UAE</option>
                    <option value={2}>Canada</option>
                    <option value={3}>Australia</option>
                  </SearchableSelect>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="narration" className="block text-sm font-medium text-gray-700">
                  Narration
                </label>
                <textarea
                  id="narration"
                  rows={3}
                  value={newInvoice.narration}
                  onChange={(e) => setNewInvoice({ ...newInvoice, narration: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter narration"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewInvoice({
                    region: 1,
                    receipt: '',
                    branch: 1,
                    company: '',
                    purpose: '',
                    narration: '',
                    vat: 5,
                    taxAmt: 0,
                    totPayAmt: 0,
                    payBalance: 0,
                    payment_mode: '',
                    amount: 0,
                    discount: 0,
                    status: 1,
                    Counsilor: 1,
                    created_by: 1,
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInvoice}
                disabled={isAddingInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingInvoice ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
