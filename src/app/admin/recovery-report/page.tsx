'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect, useCallback } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import {
  Search, RefreshCw, Filter, Download, DollarSign,
  AlertCircle, CheckCircle, TrendingDown, Users, FileText,
  ChevronLeft, ChevronRight, Printer, X, UserRound,
} from 'lucide-react';

interface RecoveryRow {
  leadId: number;
  clientName: string;
  email: string;
  mobile: string;
  nationality: string;
  totalFee: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  agreementNumber: string;
  agreementDate: string;
  agreedFee: number;
  discount: number;
  serviceInterest: string;
  countryInterest: string;
  counselorName: string;
  assignedToName: string;
  branchName: string;
  lastPaymentDate: string;
  paymentCount: number;
}

interface Summary {
  totalClients: number;
  totalFees: number;
  totalPaid: number;
  totalBalance: number;
}

interface Branch { id: number; name: string; }
interface Employee { id: number; name: string; }

function fmt(n: number) { return Number(n || 0).toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function pctPaid(paid: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

export default function RecoveryReportPage() {
  const [rows, setRows] = useState<RecoveryRow[]>([]);
  const { sorted: sortedRows, sortKey: recoverySortKey, sortDirection: recoverySortDirection, toggleSort: toggleRecoverySort } = useSortableData(
    rows,
    {
      client: (row) => row.clientName,
      agreement: (row) => row.agreementNumber,
      service: (row) => row.serviceInterest,
      totalFee: (row) => row.totalFee,
      paid: (row) => row.amountPaid,
      balanceDue: (row) => row.balanceDue,
      recoveryPct: (row) => pctPaid(row.amountPaid, row.totalFee),
      counselor: (row) => row.counselorName || row.assignedToName,
      lastPayment: (row) => row.lastPaymentDate,
    },
  );
  const [summary, setSummary] = useState<Summary>({ totalClients: 0, totalFees: 0, totalPaid: 0, totalBalance: 0 });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [counselors, setCounselors] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  const [search, setSearch]       = useState('');
  const [branchId, setBranchId]   = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [page, setPage]           = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (search) params.set('search', search);
      if (branchId) params.set('branch', branchId);
      if (counselorId) params.set('counselor', counselorId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (minBalance) params.set('minBalance', minBalance);

      const res = await fetch(`/api/admin/recovery-report?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');

      setRows(json.data || []);
      setSummary(json.summary || { totalClients: 0, totalFees: 0, totalPaid: 0, totalBalance: 0 });
      setPagination(json.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
      if (json.branches?.length) setBranches(json.branches);
      if (json.counselors?.length) setCounselors(json.counselors);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [search, branchId, counselorId, dateFrom, dateTo, minBalance]);

  useEffect(() => { load(1); setPage(1); }, [load]);

  const reset = () => {
    setSearch(''); setBranchId(''); setCounselorId('');
    setDateFrom(''); setDateTo(''); setMinBalance('');
    setPage(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const goPage = (p: number) => { setPage(p); load(p); };

  const totalBalancePct = summary.totalFees > 0
    ? Math.round((summary.totalBalance / summary.totalFees) * 100)
    : 0;

  return (
    <div className="space-y-5 pb-16 print:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recovery Report</h1>
          <p className="text-sm text-gray-500 mt-1">Outstanding balances by agreement — {pagination.total} client{pagination.total !== 1 ? 's' : ''} with pending payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={() => load(page)}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" /> Clients with Balance
          </div>
          <div className="text-2xl font-bold text-gray-900">{fmt(summary.totalClients)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" /> Total Agreed Fees
          </div>
          <div className="text-2xl font-bold text-gray-900">AED {fmt(summary.totalFees)}</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Total Collected
          </div>
          <div className="text-2xl font-bold text-green-700">AED {fmt(summary.totalPaid)}</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <TrendingDown className="w-4 h-4" /> Total Outstanding
          </div>
          <div className="text-2xl font-bold text-red-700">AED {fmt(summary.totalBalance)}</div>
          <div className="text-xs text-red-500 mt-1">{totalBalancePct}% of total fees unpaid</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3 print:hidden">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search client, email, mobile, agreement no…"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(1)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <SearchableSelect value={branchId} onChange={e => setBranchId(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </SearchableSelect>
          <SearchableSelect value={counselorId} onChange={e => setCounselorId(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-48">
            <option value="">All Counselors</option>
            {counselors.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </SearchableSelect>
          <input type="number" placeholder="Min balance (AED)" value={minBalance}
            onChange={e => setMinBalance(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Agreement date from</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-xs text-gray-500">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => load(1)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            <Filter className="w-4 h-4" /> Apply
          </button>
          <button onClick={reset}
            className="inline-flex items-center gap-2 text-gray-500 text-sm px-4 py-2 rounded-lg border hover:bg-gray-50">
            <X className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Print header */}
        <div className="hidden print:block p-6 border-b">
          <h2 className="text-xl font-bold">DM Immigration Consultants — Recovery Report</h2>
          <p className="text-sm text-gray-500 mt-1">Outstanding balances as of {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="p-4">
          <SortButtonRow
            options={[
              ['client', 'Client'],
              ['agreement', 'Agreement'],
              ['service', 'Service / Country'],
              ['totalFee', 'Total Fee'],
              ['paid', 'Paid'],
              ['balanceDue', 'Balance Due'],
              ['recoveryPct', 'Recovery %'],
              ['counselor', 'Counselor'],
              ['lastPayment', 'Last Payment'],
            ] as const}
            activeKey={recoverySortKey}
            direction={recoverySortDirection}
            onSort={toggleRecoverySort}
          />
          <RecordList
            loading={loading}
            isEmpty={!loading && sortedRows.length === 0}
            emptyIcon={UserRound}
            emptyTitle="No outstanding balances found"
          >
            {sortedRows.map((row, i) => {
              const pct = pctPaid(row.amountPaid, row.totalFee);
              const balanceClass = row.balanceDue > 50000
                ? 'font-bold text-red-700'
                : row.balanceDue > 10000
                ? 'font-semibold text-orange-700'
                : 'font-medium text-yellow-700';
              return (
                <RecordCard
                  key={row.leadId}
                  avatar={<span className="text-xs">{(page - 1) * 50 + i + 1}</span>}
                  avatarColorClass="from-gray-600 to-gray-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{row.clientName}</span>}
                  titleBadges={
                    row.agreementNumber !== '—' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700">
                        <FileText className="h-3 w-3" />{row.agreementNumber}
                      </span>
                    ) : <span className="text-xs text-gray-400">No agreement</span>
                  }
                  metaItems={[
                    { icon: UserRound, text: `${row.mobile || row.email}${row.nationality ? ' · ' + row.nationality : ''}`, key: 'contact' },
                    { icon: FileText, text: `${row.serviceInterest || ''}${row.countryInterest ? ' · ' + row.countryInterest : ''}${row.branchName ? ' · ' + row.branchName : ''}` || '—', key: 'service' },
                  ]}
                  stats={[
                    { label: 'Total Fee', value: `AED ${fmt(row.totalFee)}` },
                    { label: 'Paid', value: <span className="text-green-700">AED {fmt(row.amountPaid)}</span> },
                    { label: 'Balance Due', value: <span className={balanceClass}>AED {fmt(row.balanceDue)}</span> },
                    { label: 'Counselor', value: row.counselorName || row.assignedToName || 'Unassigned' },
                    {
                      label: 'Last Payment',
                      value: fmtDate(row.lastPaymentDate),
                      sub: row.paymentCount > 0 ? `${row.paymentCount} payment${row.paymentCount !== 1 ? 's' : ''}` : undefined,
                    },
                  ]}
                  extra={
                    <div className="mt-2 flex items-center gap-2 print:hidden">
                      <div className="h-2 min-w-16 flex-1 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-xs text-gray-500">{pct}% paid</span>
                    </div>
                  }
                />
              );
            })}
          </RecordList>
          {rows.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-700">Page Total</span>
              <div className="flex flex-wrap gap-4 text-sm font-bold">
                <span className="text-gray-800">AED {fmt(rows.reduce((s, r) => s + Number(r.totalFee), 0))}</span>
                <span className="text-green-700">AED {fmt(rows.reduce((s, r) => s + Number(r.amountPaid), 0))}</span>
                <span className="text-red-700">AED {fmt(rows.reduce((s, r) => s + Number(r.balanceDue), 0))}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t print:hidden">
            <span className="text-sm text-gray-500">
              Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => goPage(page - 1)} disabled={page <= 1}
                className="p-1.5 rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Page {page} / {pagination.totalPages}</span>
              <button onClick={() => goPage(page + 1)} disabled={page >= pagination.totalPages}
                className="p-1.5 rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { font-size: 11pt; }
          article { font-size: 9pt; }
        }
      `}</style>
    </div>
  );
}
