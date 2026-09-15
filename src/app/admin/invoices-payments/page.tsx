'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, DollarSign, TrendingUp, TrendingDown, Search, RefreshCw,
  Printer, Eye, Download, Calendar, Building2, Filter, ChevronDown,
  CheckCircle, Clock, AlertCircle, X, CreditCard, Wallet, BarChart3,
  ArrowUpRight, ArrowDownRight, XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { printReceipt as printReceiptDocument } from '@/lib/receiptTemplate';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';

interface Invoice {
  id: number; receipt: string; company: string; purpose: string;
  totPayAmt: number; payBalance: number; amount: number; discount: number;
  status: number; created: string; branchName: string; counselorName: string;
  paymentNumber: string; paidAmount: number; proofOfPaymentUrl: string;
  currency: string; paymentMethod: string; paymentDate: string; oppClientName: string;
  oppClientEmail: string; oppClientPhone: string; serviceName: string;
  branchAddress: string | null; branchEmail: string | null;
  branchLicenseNumber: string | null; branchVatGstPercent: number | string | null;
}

interface Payment {
  id: number; opportunityId: number; paymentNumber: string; paymentStructure: string;
  totalAmount: number; paidAmount: number; remainingBalance: number;
  currency: string; paymentMethod: string; transactionId: string;
  paymentDate: string; status: string; proofOfPaymentUrl: string;
  clientName: string; clientEmail: string; clientPhone: string;
  serviceName: string; branchName: string; counselorName: string;
  fname: string; lname: string; phone: string; email: string;
  accountantStatus: string; accountantRemarks: string; accountantName: string; accountantVerifiedAt: string;
  leadId: number; agreementNumber: string | null; receiptNumber?: string | null;
  dmBranchName: string | null; dmBranchAddress: string | null; dmBranchEmail: string | null;
  dmBranchPhone?: string | null;
  dmBranchLicenseNumber: string | null; dmBranchVatGstPercent: number | string | null;
  remark?: string | null;
}

interface Stats {
  payments: { totalPayments: number; totalCollected: number; totalOutstanding: number; totalPackageValue: number; completedPayments: number; pendingPayments: number };
  invoices: { totalInvoices: number; totalInvoiceAmount: number; totalInvoiceBalance: number; totalReceived: number };
  branchBreakdown: Array<{ branch: string; payments: number; collected: number; outstanding: number }>;
  monthlyTrend: Array<{ month: string; payments: number; collected: number }>;
}

export default function InvoicesPaymentsPage() {
  const { currencyCode } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments' | 'reports'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [verifyPayment, setVerifyPayment] = useState<Payment | null>(null);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab: activeTab });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(page));

      const res = await fetch(`/api/admin/invoices-payments?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');

      if (activeTab === 'overview') setStats(json.data);
      else if (activeTab === 'payments') { setPayments(json.data || []); setPagination(json.pagination || { total: 0, pages: 0 }); }
      else { setInvoices(json.data || []); setPagination(json.pagination || { total: 0, pages: 0 }); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, statusFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const printInvoice = (inv: Invoice) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const invBranchLabel = inv.branchName || 'DM Immigration Consultants';
    const invLicenseLine = inv.branchLicenseNumber
      ? `${invBranchLabel} | Licence No. ${inv.branchLicenseNumber}`
      : invBranchLabel;
    w.document.write(`
      <html><head><title>Invoice ${inv.receipt}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { color: #1e40af; margin: 0; font-size: 28px; }
        .header p { color: #666; margin: 5px 0 0; }
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
      <div class="header">
        <h1>${invBranchLabel.toUpperCase()}</h1>
        <p>Professional Immigration Services</p>
      </div>
      <div class="row">
        <div class="col">
          <div class="label">Invoice To</div>
          <div class="value">${inv.oppClientName || inv.company || 'N/A'}</div>
          <div class="value">${inv.oppClientEmail || ''}</div>
          <div class="value">${inv.oppClientPhone || ''}</div>
        </div>
        <div class="col" style="text-align:right">
          <div class="label">Invoice Details</div>
          <div class="value"><strong>Invoice #:</strong> ${inv.receipt}</div>
          <div class="value"><strong>Date:</strong> ${inv.created ? new Date(inv.created).toLocaleDateString() : 'N/A'}</div>
          <div class="value"><strong>Branch:</strong> ${inv.branchName || 'N/A'}</div>
          <div class="value"><strong>Service:</strong> ${inv.serviceName || inv.purpose || 'N/A'}</div>
        </div>
      </div>
      <table>
        <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
        <tr><td>Package Amount</td><td style="text-align:right">${inv.currency || currencyCode} ${(inv.totPayAmt || 0).toLocaleString()}</td></tr>
        ${inv.discount ? `<tr><td>Discount</td><td style="text-align:right; color:red">- ${inv.currency || currencyCode} ${inv.discount.toLocaleString()}</td></tr>` : ''}
        <tr><td>Amount Received</td><td style="text-align:right">${inv.currency || currencyCode} ${(inv.amount || inv.paidAmount || 0).toLocaleString()}</td></tr>
        <tr class="total-row"><td>Balance Due</td><td style="text-align:right">${inv.currency || currencyCode} ${(inv.payBalance || 0).toLocaleString()}</td></tr>
      </table>
      <div class="row">
        <div class="col"><div class="label">Payment Method</div><div class="value">${inv.paymentMethod || 'N/A'}</div></div>
        <div class="col"><div class="label">Payment Date</div><div class="value">${inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : 'N/A'}</div></div>
        <div class="col"><div class="label">Counselor</div><div class="value">${inv.counselorName || 'N/A'}</div></div>
      </div>
      ${inv.proofOfPaymentUrl ? `<div style="margin-top:20px;padding:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px"><strong>Proof of Payment:</strong> ${inv.proofOfPaymentUrl.split('/').pop()}</div>` : ''}
      <div class="footer">
        <p>${invLicenseLine}</p>
        <p>This is a computer-generated invoice.</p>
      </div>
      <script>window.onload=()=>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  const fmt = (n: number) => `${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const { sorted: sortedInvoices, sortKey: invoiceSortKey, sortDirection: invoiceSortDirection, toggleSort: toggleInvoiceSort } = useSortableData(
    invoices,
    {
      invoiceNumber: (inv) => inv.receipt || `INV-${inv.id}`,
      client: (inv) => inv.oppClientName || inv.company,
      service: (inv) => inv.serviceName || inv.purpose,
      amount: (inv) => inv.totPayAmt,
      balance: (inv) => inv.payBalance,
      date: (inv) => inv.created,
    },
  );

  const { sorted: sortedPayments, sortKey: paymentSortKey, sortDirection: paymentSortDirection, toggleSort: togglePaymentSort } = useSortableData(
    payments,
    {
      paymentNumber: (p) => p.paymentNumber,
      client: (p) => p.clientName || `${p.fname || ''} ${p.lname || ''}`.trim(),
      method: (p) => p.paymentMethod,
      total: (p) => p.totalAmount,
      paid: (p) => p.paidAmount,
      balance: (p) => p.remainingBalance,
      status: (p) => p.status,
      accountant: (p) => p.accountantStatus,
    },
  );

  const handleVerifyPayment = async (paymentId: number, status: 'verified' | 'rejected') => {
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/opportunity-payments/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status, remarks: verifyRemarks })
      });
      if (!res.ok) throw new Error('Failed');
      window.toast.success(`Payment ${status} successfully`);
      setVerifyPayment(null);
      setVerifyRemarks('');
      fetchData();
    } catch {
      window.toast.error('Failed to update payment status');
    } finally {
      setVerifying(false);
    }
  };

  const printReceipt = (p: Payment) => {
    printReceiptDocument({
      receiptNumber: p.receiptNumber || p.paymentNumber,
      paymentNumber: p.paymentNumber,
      paymentDate: p.paymentDate,
      clientName: p.clientName || `${p.fname || ''} ${p.lname || ''}`.trim() || 'N/A',
      email: p.clientEmail || p.email,
      phone: p.clientPhone || p.phone,
      agreementNumber: p.agreementNumber,
      opportunityId: p.opportunityId,
      serviceName: p.serviceName,
      consultantName: p.counselorName,
      companyName: p.branchName || p.dmBranchName || undefined,
      branchName: p.branchName || p.dmBranchName || undefined,
      branchAddress: p.dmBranchAddress,
      branchEmail: p.dmBranchEmail,
      branchPhone: p.dmBranchPhone,
      licenseNumber: p.dmBranchLicenseNumber,
      vatGstPercent: p.dmBranchVatGstPercent,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      currency: p.currency,
      totalAmount: p.totalAmount,
      paidAmount: p.paidAmount,
      remainingBalance: p.remainingBalance,
      remark: p.remark,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices & Payments</h1>
          <p className="text-gray-600 mt-1">Manage invoices, track payments, and generate reports</p>
        </div>
        <div className="flex gap-2">
          {(['overview', 'invoices', 'payments', 'reports'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); setSearch(''); setStatusFilter(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {tab === 'overview' ? 'Overview' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Collected', value: fmt(stats.payments?.totalCollected), icon: <TrendingUp className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', border: 'border-green-200' },
                  { label: 'Outstanding Balance', value: fmt(stats.payments?.totalOutstanding), icon: <TrendingDown className="w-5 h-5 text-red-600" />, bg: 'bg-red-50', border: 'border-red-200' },
                  { label: 'Total Invoices', value: stats.invoices?.totalInvoices || 0, icon: <FileText className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', border: 'border-blue-200' },
                  { label: 'Package Value', value: fmt(stats.payments?.totalPackageValue), icon: <Wallet className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', border: 'border-purple-200' },
                ].map(({ label, value, icon, bg, border }) => (
                  <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">{label}</span>{icon}</div>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Branch breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Branch Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payments</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.branchBreakdown?.map((b, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.branch || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-right">{b.payments}</td>
                          <td className="px-4 py-3 text-sm text-right text-green-700 font-medium">{fmt(b.collected)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">{fmt(b.outstanding)}</td>
                        </tr>
                      ))}
                      {(!stats.branchBreakdown || stats.branchBreakdown.length === 0) && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No branch data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly trend */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Monthly Collection Trend</h3>
                <div className="space-y-2">
                  {stats.monthlyTrend?.slice(0, 6).map((m, i) => {
                    const maxVal = Math.max(...(stats.monthlyTrend || []).map(x => x.collected || 1));
                    const pct = Math.min(((m.collected || 0) / maxVal) * 100, 100);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-20 shrink-0">{m.month}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full flex items-center pl-2" style={{ width: `${Math.max(pct, 8)}%` }}>
                            <span className="text-xs text-white font-medium">{fmt(m.collected)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">{m.payments} pays</span>
                      </div>
                    );
                  })}
                  {(!stats.monthlyTrend || stats.monthlyTrend.length === 0) && (
                    <p className="text-gray-500 text-sm">No trend data available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── INVOICES TAB ── */}
          {activeTab === 'invoices' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4">
                <SortButtonRow
                  options={[
                    ['invoiceNumber', 'Invoice #'],
                    ['client', 'Client / Company'],
                    ['service', 'Service'],
                    ['amount', 'Amount'],
                    ['balance', 'Balance'],
                    ['date', 'Date'],
                  ] as const}
                  activeKey={invoiceSortKey}
                  direction={invoiceSortDirection}
                  onSort={toggleInvoiceSort}
                />
                <RecordList isEmpty={sortedInvoices.length === 0} emptyIcon={FileText} emptyTitle="No invoices found">
                  {sortedInvoices.map(inv => (
                    <RecordCard
                      key={inv.id}
                      avatar={<FileText className="h-4 w-4" />}
                      avatarColorClass="from-blue-600 to-cyan-400"
                      title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{inv.oppClientName || inv.company || 'N/A'}</span>}
                      titleBadges={<span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">{inv.receipt || `INV-${inv.id}`}</span>}
                      metaItems={inv.oppClientEmail ? [{ icon: Eye, text: inv.oppClientEmail, key: 'email' }] : undefined}
                      stats={[
                        { label: 'Service', value: inv.serviceName || inv.purpose || '—' },
                        { label: 'Amount', value: fmt(inv.totPayAmt) },
                        { label: 'Balance', value: <span className={inv.payBalance > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(inv.payBalance)}</span> },
                        { label: 'Date', value: inv.created ? new Date(inv.created).toLocaleDateString() : '—' },
                      ]}
                      actions={[
                        { key: 'view', icon: Eye, label: 'View details', onClick: () => setViewInvoice(inv) },
                        { key: 'print', icon: Printer, label: 'Print invoice', onClick: () => printInvoice(inv), colorClass: 'bg-green-50 text-green-700 hover:bg-green-100' },
                      ]}
                    />
                  ))}
                </RecordList>
              </div>
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t">
                  <span className="text-sm text-gray-500">Page {page} of {pagination.pages} ({pagination.total} total)</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4">
                <SortButtonRow
                  options={[
                    ['paymentNumber', 'Payment #'],
                    ['client', 'Client'],
                    ['method', 'Method'],
                    ['total', 'Total'],
                    ['paid', 'Paid'],
                    ['balance', 'Balance'],
                    ['status', 'Status'],
                    ['accountant', 'Accountant'],
                  ] as const}
                  activeKey={paymentSortKey}
                  direction={paymentSortDirection}
                  onSort={togglePaymentSort}
                />
                <RecordList isEmpty={sortedPayments.length === 0} emptyIcon={DollarSign} emptyTitle="No payments found">
                  {sortedPayments.map(p => (
                    <RecordCard
                      key={p.id}
                      avatar={<DollarSign className="h-4 w-4" />}
                      avatarColorClass="from-blue-600 to-cyan-400"
                      title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{p.clientName || `${p.fname || ''} ${p.lname || ''}`.trim() || 'N/A'}</span>}
                      titleBadges={
                        <>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">{p.paymentNumber}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${p.status === 'completed' || p.status === 'paid' ? 'bg-green-100 text-green-800' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {p.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${p.accountantStatus === 'verified' ? 'bg-green-100 text-green-800' : p.accountantStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {p.accountantStatus || 'pending'}
                          </span>
                        </>
                      }
                      metaItems={(p.clientEmail || p.email) ? [{ icon: Eye, text: p.clientEmail || p.email, key: 'email' }] : undefined}
                      stats={[
                        { label: 'Method', value: <span className="capitalize">{p.paymentMethod || '—'}</span> },
                        { label: 'Total', value: fmt(p.totalAmount) },
                        { label: 'Paid', value: <span className="text-green-700">{fmt(p.paidAmount)}</span> },
                        { label: 'Balance', value: <span className={p.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(p.remainingBalance)}</span> },
                      ]}
                      extra={p.accountantRemarks ? <p className="mt-1 text-xs text-gray-500" title={p.accountantRemarks}>{p.accountantRemarks}</p> : undefined}
                      actions={[
                        { key: 'view', icon: Eye, label: 'View details', onClick: () => setViewPayment(p) },
                        { key: 'print', icon: Printer, label: 'Print receipt', onClick: () => printReceipt(p), colorClass: 'bg-green-50 text-green-700 hover:bg-green-100', hidden: p.accountantStatus !== 'verified' },
                        { key: 'verify', icon: CheckCircle, label: 'Verify / Reject', onClick: () => { setVerifyPayment(p); setVerifyRemarks(p.accountantRemarks || ''); }, colorClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                      ]}
                    />
                  ))}
                </RecordList>
              </div>
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t">
                  <span className="text-sm text-gray-500">Page {page} of {pagination.pages} ({pagination.total} total)</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REPORTS TAB ── */}
          {activeTab === 'reports' && stats && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Report</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Invoices</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.invoices?.totalInvoices || 0}</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Received</div>
                    <div className="text-2xl font-bold text-green-700">{fmt(stats.invoices?.totalReceived)}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Invoice Balance</div>
                    <div className="text-2xl font-bold text-amber-700">{fmt(stats.invoices?.totalInvoiceBalance)}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Collection Rate</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {stats.invoices?.totalInvoiceAmount ? Math.round(((stats.invoices.totalReceived || 0) / stats.invoices.totalInvoiceAmount) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Branch-wise Summary</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payments</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collection %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.branchBreakdown?.map((b, i) => {
                        const total = (b.collected || 0) + (b.outstanding || 0);
                        const pct = total ? Math.round((b.collected / total) * 100) : 0;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.branch || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-right">{b.payments}</td>
                            <td className="px-4 py-3 text-sm text-right text-green-700 font-medium">{fmt(b.collected)}</td>
                            <td className="px-4 py-3 text-sm text-right text-red-600">{fmt(b.outstanding)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                                <span className="text-xs font-medium">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collections</h3>
                <div className="space-y-3">
                  {stats.monthlyTrend?.map((m, i) => {
                    const maxVal = Math.max(...(stats.monthlyTrend || []).map(x => x.collected || 1));
                    const pct = Math.min(((m.collected || 0) / maxVal) * 100, 100);
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 w-20 shrink-0 font-medium">{m.month}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center px-3" style={{ width: `${Math.max(pct, 10)}%` }}>
                            <span className="text-xs text-white font-semibold">{fmt(m.collected)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{m.payments} payments</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Invoice Detail Modal ── */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Invoice {viewInvoice.receipt}</h2>
              <button onClick={() => setViewInvoice(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-gray-500">Client</span><p className="text-sm font-medium">{viewInvoice.oppClientName || viewInvoice.company || 'N/A'}</p></div>
                <div><span className="text-xs text-gray-500">Email</span><p className="text-sm">{viewInvoice.oppClientEmail || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Service</span><p className="text-sm">{viewInvoice.serviceName || viewInvoice.purpose || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Branch</span><p className="text-sm">{viewInvoice.branchName || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Total Amount</span><p className="text-sm font-medium">{fmt(viewInvoice.totPayAmt)}</p></div>
                <div><span className="text-xs text-gray-500">Balance Due</span><p className={`text-sm font-medium ${viewInvoice.payBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(viewInvoice.payBalance)}</p></div>
                <div><span className="text-xs text-gray-500">Payment Method</span><p className="text-sm capitalize">{viewInvoice.paymentMethod || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Date</span><p className="text-sm">{viewInvoice.paymentDate ? new Date(viewInvoice.paymentDate).toLocaleDateString() : '—'}</p></div>
              </div>
              {viewInvoice.proofOfPaymentUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-800">Proof of Payment</span></div>
                  <p className="text-sm text-green-700">{viewInvoice.proofOfPaymentUrl.split('/').pop()}</p>
                </div>
              )}
            </div>
            <div className="border-t px-6 py-3 flex justify-end gap-3">
              <button onClick={() => setViewInvoice(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Close</button>
              <button onClick={() => printInvoice(viewInvoice)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Detail Modal ── */}
      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Payment {viewPayment.paymentNumber}</h2>
              <button onClick={() => setViewPayment(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-gray-500">Client</span><p className="text-sm font-medium">{viewPayment.clientName || `${viewPayment.fname || ''} ${viewPayment.lname || ''}`.trim() || 'N/A'}</p></div>
                <div><span className="text-xs text-gray-500">Email</span><p className="text-sm">{viewPayment.clientEmail || viewPayment.email || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Service</span><p className="text-sm">{viewPayment.serviceName || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Agreement No.</span><p className="text-sm">{viewPayment.agreementNumber || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Branch</span><p className="text-sm">{viewPayment.branchName || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Total Amount</span><p className="text-sm font-medium">{fmt(viewPayment.totalAmount)}</p></div>
                <div><span className="text-xs text-gray-500">Paid Amount</span><p className="text-sm font-medium text-green-700">{fmt(viewPayment.paidAmount)}</p></div>
                <div><span className="text-xs text-gray-500">Remaining Balance</span><p className={`text-sm font-medium ${viewPayment.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(viewPayment.remainingBalance)}</p></div>
                <div><span className="text-xs text-gray-500">Payment Method</span><p className="text-sm capitalize">{viewPayment.paymentMethod || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Transaction ID</span><p className="text-sm">{viewPayment.transactionId || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Date</span><p className="text-sm">{viewPayment.paymentDate ? new Date(viewPayment.paymentDate).toLocaleDateString() : '—'}</p></div>
                <div><span className="text-xs text-gray-500">Counselor</span><p className="text-sm">{viewPayment.counselorName || '—'}</p></div>
                <div><span className="text-xs text-gray-500">Status</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${viewPayment.status === 'completed' || viewPayment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{viewPayment.status}</span>
                </div>
                <div><span className="text-xs text-gray-500">Accountant Verification</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${viewPayment.accountantStatus === 'verified' ? 'bg-green-100 text-green-800' : viewPayment.accountantStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{viewPayment.accountantStatus || 'pending'}</span>
                </div>
                {viewPayment.accountantRemarks && <div><span className="text-xs text-gray-500">Accountant Remarks</span><p className="text-sm">{viewPayment.accountantRemarks}</p></div>}
                {viewPayment.accountantName && <div><span className="text-xs text-gray-500">Verified By</span><p className="text-sm">{viewPayment.accountantName}</p></div>}
              </div>
              {viewPayment.proofOfPaymentUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-800">Proof of Payment</span></div>
                  <p className="text-sm text-green-700">{viewPayment.proofOfPaymentUrl.split('/').pop()}</p>
                </div>
              )}
            </div>
            <div className="border-t px-6 py-3 flex justify-end gap-3">
              <button onClick={() => setViewPayment(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Close</button>
              {viewPayment.accountantStatus === 'verified' && (
                <button onClick={() => { printReceipt(viewPayment); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"><Printer className="w-4 h-4" /> Print Receipt</button>
              )}
              <button onClick={() => { setVerifyPayment(viewPayment); setViewPayment(null); setVerifyRemarks(viewPayment.accountantRemarks || ''); }} className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg text-sm hover:bg-[var(--cmg-blue-dark)] flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Verify / Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Verify / Reject Modal ── */}
      {verifyPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Accountant Review</h2>
              <button onClick={() => { setVerifyPayment(null); setVerifyRemarks(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Payment #:</span> <span className="font-medium">{verifyPayment.paymentNumber}</span></div>
                  <div><span className="text-gray-500">Client:</span> <span className="font-medium">{verifyPayment.clientName || `${verifyPayment.fname || ''} ${verifyPayment.lname || ''}`.trim() || 'N/A'}</span></div>
                  <div><span className="text-gray-500">Amount:</span> <span className="font-medium">{verifyPayment.currency || 'AED'} {fmt(verifyPayment.totalAmount)}</span></div>
                  <div><span className="text-gray-500">Paid:</span> <span className="font-medium text-green-700">{verifyPayment.currency || 'AED'} {fmt(verifyPayment.paidAmount)}</span></div>
                  {verifyPayment.proofOfPaymentUrl && <div className="col-span-2"><span className="text-gray-500">Proof of Payment:</span> <span className="font-medium text-green-700">{verifyPayment.proofOfPaymentUrl.split('/').pop()}</span></div>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accountant Remarks</label>
                <textarea
                  value={verifyRemarks}
                  onChange={e => setVerifyRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter remarks (optional for verify, recommended for reject)..."
                />
              </div>
            </div>
            <div className="border-t px-6 py-3 flex justify-end gap-3">
              <button onClick={() => { setVerifyPayment(null); setVerifyRemarks(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleVerifyPayment(verifyPayment.id, 'rejected')} disabled={verifying} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button onClick={() => handleVerifyPayment(verifyPayment.id, 'verified')} disabled={verifying} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-green-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
