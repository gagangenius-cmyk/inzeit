'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, RefreshCw, AlertCircle, FileText, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FinanceSummary {
  totalOpportunities: number; wonOpportunities: number;
  totalRevenue: number; collected: number; balance: number;
  totalExpenses: number; netProfit: number; collectionRate: number;
}

interface MonthlyTrend { month: string; collected: number; expenses: number; profit: number; }

interface Opportunity {
  id: number; name: string; client: string; counselor: string; branch: string;
  status: string; totalFee: number; paid: number; balance: number; service: string; date: string;
}

interface Expense {
  id: number; date: string; description: string; amount: number; vat: number;
  total: number; branch: string; type: string; approved: boolean;
}

interface BranchPerf { id: number; name: string; revenue: number; collected: number; opportunities: number; }
interface CounselorPerf { id: number; name: string; branch: string; opportunities: number; collected: number; }
interface PaymentMethod { method: string; count: number; total: number; }

interface FinanceData {
  summary: FinanceSummary;
  monthlyTrend: MonthlyTrend[];
  opportunities: Opportunity[];
  expenses: Expense[];
  branchPerformance: BranchPerf[];
  counselorPerformance: CounselorPerf[];
  paymentMethods: PaymentMethod[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtMoney = (n: number, currency = 'AED') =>
  `${currency} ${Number(n || 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const monthLabel = (m: string) => {
  const d = new Date(m + '-01');
  return d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
};

const CHART_COLORS = ['#2A2620', '#1C1812', '#4A4137', '#DC2626', '#C7973E', '#B91C1C', '#0f766e', '#7c3aed'];

const STATUS_COLOR: Record<string, string> = {
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  prospect: 'bg-gray-100 text-gray-600',
  qualified: 'bg-blue-100 text-blue-700',
  negotiation: 'bg-yellow-100 text-yellow-700',
  quotation_sent: 'bg-purple-100 text-purple-700',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, trend }: {
  label: string; value: string; sub?: string; icon: React.ElementType; trend?: 'up' | 'down';
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-[#FBF6EC] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#2A2620]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
        <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// Shared date-range + branch filter row, rendered on both the Revenue and
// Expenses tabs (each keeps its own search/status controls alongside it).
function DateBranchFilterRow({
  dateFrom, setDateFrom, dateTo, setDateTo, branchFilter, setBranchFilter, branchOptions,
}: {
  dateFrom: string; setDateFrom: (v: string) => void;
  dateTo: string; setDateTo: (v: string) => void;
  branchFilter: string; setBranchFilter: (v: string) => void;
  branchOptions: { value: string; label: string }[];
}) {
  return (
    <>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>From</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-[#2A2620]"
        />
        <span>To</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-[#2A2620]"
        />
      </div>
      <SearchableSelect
        value={branchFilter}
        onChange={e => setBranchFilter(e.target.value)}
        className="border border-gray-200 rounded-lg text-sm px-3 py-2"
      >
        <option value="">All Branches</option>
        {branchOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
      </SearchableSelect>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CRMFinanceModule() {
  const { currencyCode } = useAuth();
  // Shadows the module-level fmtMoney so every call site below (which relies
  // on the default 'AED' param) shows the logged-in user's own branch
  // currency instead, with no other changes needed.
  const fmtMoney = (n: number, currency = currencyCode) =>
    `${currency} ${Number(n || 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [months, setMonths] = useState('6');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'expenses' | 'branches' | 'counselors'>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Calendar + branch filters shown on the Revenue and Expenses tabs. A date
  // range, when set, overrides the relative `months` lookback server-side.
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/lead-filter-options')
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (json?.branches) setBranchOptions(json.branches); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ months });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (branchFilter) params.set('branch', branchFilter);
      const res = await fetch(`/api/admin/finance?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, [months, dateFrom, dateTo, branchFilter]);

  useEffect(() => { load(); }, [load]);

  // Filtered opportunities
  const filteredOps = useMemo(() => {
    if (!data) return [];
    return data.opportunities.filter(o =>
      (statusFilter === '' || o.status === statusFilter) &&
      (search === '' || o.client.toLowerCase().includes(search.toLowerCase()) ||
        o.counselor.toLowerCase().includes(search.toLowerCase()) ||
        o.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [data, statusFilter, search]);

  const filteredExps = useMemo(() => {
    if (!data) return [];
    return data.expenses.filter(e =>
      search === '' ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.branch.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const { sorted: sortedOps, sortKey: opSortKey, sortDirection: opSortDirection, toggleSort: toggleOpSort } = useSortableData(
    filteredOps,
    {
      client: (o) => o.client,
      counselor: (o) => o.counselor,
      branch: (o) => o.branch,
      totalFee: (o) => o.totalFee,
      collected: (o) => o.paid,
      balance: (o) => o.balance,
      status: (o) => o.status,
      date: (o) => o.date,
    },
  );

  const { sorted: sortedExps, sortKey: expSortKey, sortDirection: expSortDirection, toggleSort: toggleExpSort } = useSortableData(
    filteredExps,
    {
      date: (e) => e.date,
      description: (e) => e.description,
      branch: (e) => e.branch,
      type: (e) => e.type,
      amount: (e) => e.amount,
      vat: (e) => e.vat,
      total: (e) => e.total,
      approved: (e) => (e.approved ? 1 : 0),
    },
  );

  const { sorted: sortedBranchPerformance, sortKey: branchPerfSortKey, sortDirection: branchPerfSortDirection, toggleSort: toggleBranchPerfSort } = useSortableData(
    data?.branchPerformance || [],
    {
      branch: (b) => b.name,
      opportunities: (b) => b.opportunities,
      revenue: (b) => b.revenue,
      collected: (b) => b.collected,
      collectionPct: (b) => (b.revenue > 0 ? b.collected / b.revenue : 0),
    },
  );

  const topCounselorId = useMemo(() => {
    const list = data?.counselorPerformance || [];
    return list.length ? list.reduce((top, c) => (c.collected > top.collected ? c : top), list[0]).id : null;
  }, [data]);

  const { sorted: sortedCounselorPerformance, sortKey: counselorSortKey, sortDirection: counselorSortDirection, toggleSort: toggleCounselorSort } = useSortableData(
    data?.counselorPerformance || [],
    {
      counselor: (c) => c.name,
      branch: (c) => c.branch,
      opportunities: (c) => c.opportunities,
      collected: (c) => c.collected,
      avgPerDeal: (c) => (c.opportunities > 0 ? c.collected / c.opportunities : 0),
    },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin text-[#2A2620]" /> Loading finance data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <span>{error || 'No data available'}</span>
        <button onClick={load} className="px-4 py-2 bg-[#2A2620] text-white rounded-lg text-sm hover:bg-[#1C1812]">Retry</button>
      </div>
    );
  }

  const { summary, monthlyTrend, branchPerformance, counselorPerformance, paymentMethods } = data;

  return (
    <div className="space-y-5">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#2A2620]" />
          <span className="font-semibold text-gray-800">Finance Dashboard</span>
          <span className="text-xs text-gray-400 hidden sm:inline">· Live database</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchableSelect
            value={months}
            onChange={e => setMonths(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#2A2620]"
          >
            <option value="1">Last 1 month</option>
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="24">Last 24 months</option>
          </SearchableSelect>
          <button onClick={load} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Revenue" value={fmtMoney(summary.totalRevenue)} sub={`${summary.totalOpportunities} opportunities`} icon={DollarSign} />
        <KpiCard label="Collected" value={fmtMoney(summary.collected)} sub={`${summary.collectionRate}% collection rate`} icon={TrendingUp} trend="up" />
        <KpiCard label="Pending Balance" value={fmtMoney(summary.balance)} icon={AlertCircle} trend={summary.balance > 0 ? 'down' : undefined} />
        <KpiCard label="Total Expenses" value={fmtMoney(summary.totalExpenses)} icon={TrendingDown} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Net Profit" value={fmtMoney(summary.netProfit)} icon={BarChart3} trend={summary.netProfit >= 0 ? 'up' : 'down'} />
        <KpiCard label="Won Cases" value={String(summary.wonOpportunities)} sub={`of ${summary.totalOpportunities} total`} icon={FileText} />
        <KpiCard label="Branches Active" value={String(branchPerformance.filter(b => b.opportunities > 0).length)} icon={BarChart3} />
        <KpiCard label="Active Counselors" value={String(counselorPerformance.length)} icon={Users} />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'expenses', label: 'Expenses' },
            { key: 'branches', label: 'Branches' },
            { key: 'counselors', label: 'Counselors' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-[#1C1812] border-b-2 border-[#2A2620] bg-[#FDFAF4]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Monthly P&L chart */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly P&L (Last {months} Months)</h3>
                {monthlyTrend.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No trend data for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyTrend.map(m => ({ ...m, month: monthLabel(m.month) }))} barSize={18} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                      <Tooltip formatter={(v: number | undefined) => fmtMoney(v ?? 0)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="collected" name="Collected" fill="#2A2620" radius={[3,3,0,0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3,3,0,0]} />
                      <Bar dataKey="profit" name="Net Profit" fill="#2563eb" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Payment methods pie */}
              {paymentMethods.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Methods Distribution</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={paymentMethods} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80} label={({ method, percent }) => `${method} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {paymentMethods.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number | undefined) => fmtMoney(v ?? 0)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 min-w-48">
                      {paymentMethods.map((m, i) => (
                        <div key={m.method} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-gray-600 flex-1">{m.method}</span>
                          <span className="font-medium text-gray-800">{fmtMoney(m.total)}</span>
                          <span className="text-gray-400 text-xs">({m.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REVENUE ───────────────────────────────────────────────────── */}
          {activeTab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search client, counselor, service..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A2620]"
                />
                <SearchableSelect
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg text-sm px-3 py-2"
                >
                  <option value="">All Status</option>
                  <option value="won">Won</option>
                  <option value="qualified">Qualified</option>
                  <option value="prospect">Prospect</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="lost">Lost</option>
                </SearchableSelect>
                <DateBranchFilterRow
                  dateFrom={dateFrom} setDateFrom={setDateFrom}
                  dateTo={dateTo} setDateTo={setDateTo}
                  branchFilter={branchFilter} setBranchFilter={setBranchFilter}
                  branchOptions={branchOptions}
                />
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <SortableTh label="Client / Service" sortKey="client" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Counselor" sortKey="counselor" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Branch" sortKey="branch" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Total Fee" sortKey="totalFee" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Collected" sortKey="collected" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Balance" sortKey="balance" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Status" sortKey="status" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Date" sortKey="date" activeKey={opSortKey} direction={opSortDirection} onSort={toggleOpSort} className="px-4 py-3 text-left" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedOps.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No opportunities found</td></tr>
                    ) : sortedOps.slice(0, 100).map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate max-w-48">{o.client}</div>
                          <div className="text-xs text-gray-400 truncate">{o.service || o.name}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{o.counselor}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{o.branch}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{fmtShort(o.totalFee)}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-medium">{fmtShort(o.paid)}</td>
                        <td className="px-4 py-3 text-right text-red-500">{fmtShort(o.balance)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-600'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOps.length > 100 && (
                <div className="text-xs text-gray-400 text-right">Showing 100 of {filteredOps.length} records</div>
              )}
            </div>
          )}

          {/* ── EXPENSES ──────────────────────────────────────────────────── */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {/* Expense trend chart */}
              {monthlyTrend.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Expense Trend</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthlyTrend.map(m => ({ ...m, month: monthLabel(m.month) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                      <Tooltip formatter={(v: number | undefined) => fmtMoney(v ?? 0)} />
                      <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search description or branch..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A2620]"
                />
                <DateBranchFilterRow
                  dateFrom={dateFrom} setDateFrom={setDateFrom}
                  dateTo={dateTo} setDateTo={setDateTo}
                  branchFilter={branchFilter} setBranchFilter={setBranchFilter}
                  branchOptions={branchOptions}
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <SortableTh label="Date" sortKey="date" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Description" sortKey="description" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Branch" sortKey="branch" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Type" sortKey="type" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Amount" sortKey="amount" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-right" />
                      <SortableTh label="VAT" sortKey="vat" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Total" sortKey="total" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Approved" sortKey="approved" activeKey={expSortKey} direction={expSortDirection} onSort={toggleExpSort} className="px-4 py-3 text-left" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedExps.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No expenses found</td></tr>
                    ) : sortedExps.slice(0, 100).map(e => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500">{e.date}</td>
                        <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{e.description}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{e.branch}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{e.type}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800">{fmtShort(e.amount)}</td>
                        <td className="px-4 py-3 text-right text-orange-600 text-xs">{fmtShort(e.vat)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtShort(e.total)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {e.approved ? 'Yes' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BRANCHES ──────────────────────────────────────────────────── */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={branchPerformance.slice(0, 10).map(b => ({ name: b.name, Collected: b.collected, Revenue: b.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                  <Tooltip formatter={(v: number | undefined) => fmtMoney(v ?? 0)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Collected" fill="#2A2620" radius={[3,3,0,0]} />
                  <Bar dataKey="Revenue" fill="#2563eb" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <SortableTh label="Branch" sortKey="branch" activeKey={branchPerfSortKey} direction={branchPerfSortDirection} onSort={toggleBranchPerfSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Opportunities" sortKey="opportunities" activeKey={branchPerfSortKey} direction={branchPerfSortDirection} onSort={toggleBranchPerfSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Total Revenue" sortKey="revenue" activeKey={branchPerfSortKey} direction={branchPerfSortDirection} onSort={toggleBranchPerfSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Collected" sortKey="collected" activeKey={branchPerfSortKey} direction={branchPerfSortDirection} onSort={toggleBranchPerfSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Collection %" sortKey="collectionPct" activeKey={branchPerfSortKey} direction={branchPerfSortDirection} onSort={toggleBranchPerfSort} className="px-4 py-3 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedBranchPerformance.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{b.opportunities}</td>
                        <td className="px-4 py-3 text-right text-gray-800">{fmtMoney(b.revenue)}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-medium">{fmtMoney(b.collected)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-[#2A2620]">
                            {b.revenue > 0 ? ((b.collected / b.revenue) * 100).toFixed(1) : '0'}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── COUNSELORS ────────────────────────────────────────────────── */}
          {activeTab === 'counselors' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <SortableTh label="Counselor" sortKey="counselor" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Branch" sortKey="branch" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-4 py-3 text-left" />
                      <SortableTh label="Opportunities" sortKey="opportunities" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Collected" sortKey="collected" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-4 py-3 text-right" />
                      <SortableTh label="Avg per Deal" sortKey="avgPerDeal" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-4 py-3 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedCounselorPerformance.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No counselor data for this period</td></tr>
                    ) : sortedCounselorPerformance.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#FBF6EC] flex items-center justify-center text-[#1C1812] text-xs font-bold shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{c.name}</div>
                              {c.id === topCounselorId && <div className="text-[10px] text-[#2A2620] font-semibold">Top Performer</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{c.branch}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{c.opportunities}</td>
                        <td className="px-4 py-3 text-right text-green-700 font-semibold">{fmtMoney(c.collected)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {c.opportunities > 0 ? fmtMoney(Math.round(c.collected / c.opportunities)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
