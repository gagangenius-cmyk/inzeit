'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import {
  Users, TrendingUp, Target, DollarSign, Calendar, Award,
  RefreshCw, Building2, BarChart3, Activity, CheckCircle2, Clock,
  AlertCircle, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Summary {
  totalLeads: number;
  newLeads: number;
  activeLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  collectedAmount: number;
  pendingAmount: number;
  totalEmployees: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
}

interface LeadByStatus  { status: string; count: number; }
interface LeadByMonth   { month: string; total: number; converted: number; }
interface LeadBySource  { source: string; count: number; }
interface PaymentTrend  { month: string; collected: number; }
interface RecentLead    { id: number; fname: string; lname: string; status: string; priority: string; branch_name: string; assigned_to: string; regdate: string; }

interface CounselorRow {
  id: number; name: string; branch: string;
  totalLeads: number; convertedLeads: number; conversionRate: number;
  revenue: number; collected: number;
}

interface BranchRow {
  id: number; name: string; region: string;
  totalLeads: number; convertedLeads: number; conversionRate: number;
  revenue: number; collected: number;
}

interface AnalyticsData {
  summary: Summary;
  leadsByStatus: LeadByStatus[];
  leadsByMonth: LeadByMonth[];
  leadsBySource: LeadBySource[];
  counselorPerformance: CounselorRow[];
  branchPerformance: BranchRow[];
  paymentTrend: PaymentTrend[];
  recentLeads: RecentLead[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(n);

const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('en', { month: 'short', year: '2-digit' });
};

const RANGE_LABELS: Record<string, string> = {
  week: 'Last 7 days', month: 'Last 30 days', quarter: 'Last 90 days', year: 'Last Year', all: 'All Time',
};

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Client': 'bg-green-100 text-green-800',
  'Qualified': 'bg-purple-100 text-purple-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Closed': 'bg-red-100 text-red-800',
  'Unknown': 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Hot': 'text-red-600', 'Warm': 'text-yellow-600', 'Cold': 'text-blue-500',
};

const rateColor = (rate: number) =>
  rate >= 40 ? 'text-green-600' : rate >= 20 ? 'text-yellow-600' : 'text-red-500';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color = 'green', trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string; trend?: 'up' | 'down' | 'neutral';
}) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    green:  { bg: 'bg-[#FBF6EC]', text: 'text-[#1C1812]', icon: 'text-[#2A2620]' },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-800',  icon: 'text-blue-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-800', icon: 'text-purple-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-800', icon: 'text-orange-500' },
    red:    { bg: 'bg-red-50',    text: 'text-red-800',   icon: 'text-red-500' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-800', icon: 'text-yellow-500' },
  };
  const c = colorMap[color] || colorMap.green;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-[#2A2620]" />
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PerformanceAnalytics() {
  const { currencyCode } = useAuth();
  // Shows the logged-in user's own branch currency, not a hardcoded 'AED' -
  // branches span multiple countries/currencies.
  const fmtCurrency = (n: number) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `${currencyCode} ${fmt(n)}`;
    }
  };
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('month');
  const [activeTab, setActiveTab] = useState<'counselors' | 'branches'>('counselors');

  const load = useCallback(async (r: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analytics?range=${r}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const { sorted: sortedCounselorPerformance, sortKey: counselorSortKey, sortDirection: counselorSortDirection, toggleSort: toggleCounselorSort } = useSortableData(
    data?.counselorPerformance || [],
    {
      counselor: (c) => c.name,
      branch: (c) => c.branch,
      leads: (c) => c.totalLeads,
      converted: (c) => c.convertedLeads,
      rate: (c) => c.conversionRate,
      revenue: (c) => c.revenue,
      collected: (c) => c.collected,
    },
  );

  const topCounselorId = useMemo(() => {
    const list = data?.counselorPerformance || [];
    return list.length ? list.reduce((top, c) => (c.convertedLeads > top.convertedLeads ? c : top), list[0]).id : null;
  }, [data]);

  const { sorted: sortedBranchPerformance, sortKey: branchSortKey, sortDirection: branchSortDirection, toggleSort: toggleBranchSort } = useSortableData(
    data?.branchPerformance || [],
    {
      branch: (b) => b.name,
      region: (b) => b.region,
      leads: (b) => b.totalLeads,
      converted: (b) => b.convertedLeads,
      rate: (b) => b.conversionRate,
      revenue: (b) => b.revenue,
      collected: (b) => b.collected,
    },
  );

  const { sorted: sortedRecentLeads, sortKey: recentLeadSortKey, sortDirection: recentLeadSortDirection, toggleSort: toggleRecentLeadSort } = useSortableData(
    data?.recentLeads || [],
    {
      lead: (lead) => `${lead.fname || ''} ${lead.lname || ''}`,
      status: (lead) => lead.status,
      priority: (lead) => lead.priority,
      branch: (lead) => lead.branch_name,
      assignedTo: (lead) => lead.assigned_to,
      date: (lead) => lead.regdate,
    },
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-3 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin text-[#2A2620]" />
        <span>Loading live data…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-3 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <span>{error || 'No data'}</span>
        <button
          onClick={() => load(range)}
          className="mt-2 px-4 py-2 rounded-lg bg-[#2A2620] text-white text-sm hover:bg-[#1C1812]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, leadsByStatus, leadsByMonth, leadsBySource, counselorPerformance, branchPerformance, paymentTrend, recentLeads } = data;

  // Bar chart data prep
  const monthLabels = leadsByMonth.map(m => fmtMonth(m.month));
  const maxLeads = Math.max(...leadsByMonth.map(m => m.total), 1);
  const maxPay   = Math.max(...paymentTrend.map(m => m.collected), 1);

  return (
    <div className="space-y-6">

      {/* ── Top controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-500">{RANGE_LABELS[range]} · Live from database</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {Object.entries(RANGE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`px-3 py-1.5 transition-colors ${range === key ? 'bg-[#2A2620] text-white font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {label.replace('Last ', '')}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(range)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={fmt(summary.totalLeads)} sub={`${fmt(summary.newLeads)} new`} icon={Users} color="blue" />
        <KpiCard label="Clients Won" value={fmt(summary.convertedLeads)} sub={`${summary.conversionRate}% rate`} icon={CheckCircle2} color="green" trend="up" />
        <KpiCard label="Total Revenue" value={fmtCurrency(summary.totalRevenue)} sub="Contracted amount" icon={DollarSign} color="purple" />
        <KpiCard label="Collected" value={fmtCurrency(summary.collectedAmount)} sub={`${fmtCurrency(summary.pendingAmount)} pending`} icon={TrendingUp} color="orange" trend="up" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Leads" value={fmt(summary.activeLeads)} sub="In pipeline" icon={Activity} color="yellow" />
        <KpiCard label="Appointments" value={fmt(summary.totalAppointments)} sub={`${fmt(summary.pendingAppointments)} pending`} icon={Calendar} color="blue" />
        <KpiCard label="Completion Rate" value={summary.totalAppointments > 0 ? `${((summary.completedAppointments / summary.totalAppointments) * 100).toFixed(0)}%` : '—'} sub="Appointments done" icon={Target} color="green" />
        <KpiCard label="Team Members" value={fmt(summary.totalEmployees)} sub="Active employees" icon={Award} color="purple" />
      </div>

      {/* ── Charts row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Lead trend */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <SectionHeader icon={BarChart3} title="Lead Trend — Last 12 Months" />
          {leadsByMonth.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-36">
                {leadsByMonth.map((m, i) => (
                  <div key={i} className="relative flex-1 group">
                    {/* total bar */}
                    <div
                      className="w-full bg-[#FBF6EC] border border-[#E7DCC3] rounded-sm overflow-hidden"
                      style={{ height: `${Math.max((m.total / maxLeads) * 136, m.total > 0 ? 4 : 0)}px` }}
                    >
                      {/* converted portion fills from bottom */}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[#2A2620] rounded-sm"
                        style={{ height: m.total > 0 ? `${(m.converted / m.total) * 100}%` : 0 }}
                      />
                    </div>
                    {/* tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none z-10">
                      {m.total} leads · {m.converted} won
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                {monthLabels.map((l, i) => (
                  <div key={i} className="flex-1 text-center text-[9px] text-gray-400 truncate">{l}</div>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#2A2620] inline-block" /> Converted</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#FBF6EC] border border-[#E7DCC3] inline-block" /> In Pipeline</span>
              </div>
            </div>
          )}
        </div>

        {/* Lead status breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <SectionHeader icon={Target} title="Status Breakdown" />
          {leadsByStatus.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <div className="space-y-2.5">
              {leadsByStatus.slice(0, 8).map((s, i) => {
                const pct = summary.totalLeads > 0 ? (s.count / summary.totalLeads) * 100 : 0;
                const colorClass = STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>{s.status}</span>
                      <span className="text-gray-700 font-medium">{fmt(s.count)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2A2620] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Source & Payment trend ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Lead sources */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <SectionHeader icon={Activity} title="Leads by Source" />
          {leadsBySource.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No source data available</div>
          ) : (
            <div className="space-y-3">
              {leadsBySource.map((s, i) => {
                const total = leadsBySource.reduce((a, b) => a + b.count, 0);
                const pct = total > 0 ? (s.count / total) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 w-4 text-right">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="truncate text-gray-700 font-medium">{s.source}</span>
                        <span className="text-gray-500 ml-2 shrink-0">{fmt(s.count)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: `hsl(${130 - i * 12}, 60%, ${45 + i * 3}%)`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 w-10 text-right shrink-0">{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment trend */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <SectionHeader icon={DollarSign} title="Payment Collection — Last 6 Months" />
          {paymentTrend.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No payment data available</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end gap-2 h-32">
                {paymentTrend.map((p, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-[#2A2620] rounded-t-md opacity-85 transition-opacity group-hover:opacity-100"
                      style={{ height: `${(p.collected / maxPay) * 112}px`, minHeight: p.collected > 0 ? 4 : 0 }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none z-10">
                      {fmtCurrency(p.collected)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {paymentTrend.map((p, i) => (
                  <div key={i} className="flex-1 text-center text-[9px] text-gray-400 truncate">{fmtMonth(p.month)}</div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-400">Total Collected (period)</div>
                  <div className="text-sm font-semibold text-[#1C1812]">{fmtCurrency(paymentTrend.reduce((a, b) => a + b.collected, 0))}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Pending Amount</div>
                  <div className="text-sm font-semibold text-orange-600">{fmtCurrency(summary.pendingAmount)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Performance tables ────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Tab switcher */}
        <div className="flex border-b border-gray-200">
          {(['counselors', 'branches'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-[#1C1812] border-b-2 border-[#2A2620] bg-[#FDFAF4]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'counselors' ? <><Users className="w-4 h-4 inline mr-1.5" />Counselor Performance</> : <><Building2 className="w-4 h-4 inline mr-1.5" />Branch Performance</>}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'counselors' ? (
            counselorPerformance.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No counselor data for this period</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">#</th>
                    <SortableTh label="Counselor" sortKey="counselor" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Branch" sortKey="branch" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Leads" sortKey="leads" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Converted" sortKey="converted" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Rate" sortKey="rate" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Revenue" sortKey="revenue" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Collected" sortKey="collected" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedCounselorPerformance.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#FBF6EC] flex items-center justify-center text-[#1C1812] text-xs font-bold shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                          {c.id === topCounselorId && <Award className="w-4 h-4 text-yellow-500" aria-label="Top performer" />}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{c.branch}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700 font-medium">{fmt(c.totalLeads)}</td>
                      <td className="px-5 py-3 text-sm text-right">
                        <span className="text-green-700 font-medium">{fmt(c.convertedLeads)}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right">
                        <span className={`font-semibold ${rateColor(c.conversionRate)}`}>{c.conversionRate}%</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">{fmtCurrency(c.revenue)}</td>
                      <td className="px-5 py-3 text-sm text-right text-[#1C1812] font-medium">{fmtCurrency(c.collected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            branchPerformance.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No branch data for this period</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">#</th>
                    <SortableTh label="Branch" sortKey="branch" activeKey={branchSortKey} direction={branchSortDirection} onSort={toggleBranchSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Region" sortKey="region" activeKey={branchSortKey} direction={branchSortDirection} onSort={toggleBranchSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Leads" sortKey="leads" activeKey={branchSortKey} direction={branchSortDirection} onSort={toggleBranchSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Converted" sortKey="converted" activeKey={branchSortKey} direction={branchSortDirection} onSort={toggleBranchSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Rate" sortKey="rate" activeKey={branchSortKey} direction={branchSortDirection} onSort={toggleBranchSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Revenue" sortKey="revenue" activeKey={branchSortKey} direction={branchSortDirection} onSort={toggleBranchSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Collected" sortKey="collected" activeKey={branchSortKey} direction={branchSortDirection} onSort={toggleBranchSort} className="px-5 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedBranchPerformance.map((b, i) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{b.region}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700 font-medium">{fmt(b.totalLeads)}</td>
                      <td className="px-5 py-3 text-sm text-right text-green-700 font-medium">{fmt(b.convertedLeads)}</td>
                      <td className="px-5 py-3 text-sm text-right">
                        <span className={`font-semibold ${rateColor(b.conversionRate)}`}>{b.conversionRate}%</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">{fmtCurrency(b.revenue)}</td>
                      <td className="px-5 py-3 text-sm text-right text-[#1C1812] font-medium">{fmtCurrency(b.collected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* ── Recent Leads ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#2A2620]" />
          <h3 className="text-base font-semibold text-gray-800">Recent Leads</h3>
        </div>
        {recentLeads.length === 0 ? (
          <div className="py-10 text-center text-gray-400">No recent leads</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <SortableTh label="Lead" sortKey="lead" activeKey={recentLeadSortKey} direction={recentLeadSortDirection} onSort={toggleRecentLeadSort} className="px-5 py-3 text-left" />
                  <SortableTh label="Status" sortKey="status" activeKey={recentLeadSortKey} direction={recentLeadSortDirection} onSort={toggleRecentLeadSort} className="px-5 py-3 text-left" />
                  <SortableTh label="Priority" sortKey="priority" activeKey={recentLeadSortKey} direction={recentLeadSortDirection} onSort={toggleRecentLeadSort} className="px-5 py-3 text-left" />
                  <SortableTh label="Branch" sortKey="branch" activeKey={recentLeadSortKey} direction={recentLeadSortDirection} onSort={toggleRecentLeadSort} className="px-5 py-3 text-left" />
                  <SortableTh label="Assigned To" sortKey="assignedTo" activeKey={recentLeadSortKey} direction={recentLeadSortDirection} onSort={toggleRecentLeadSort} className="px-5 py-3 text-left" />
                  <SortableTh label="Date" sortKey="date" activeKey={recentLeadSortKey} direction={recentLeadSortDirection} onSort={toggleRecentLeadSort} className="px-5 py-3 text-left" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRecentLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-900">{lead.fname} {lead.lname}</div>
                      <div className="text-xs text-gray-400">#{lead.id}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${PRIORITY_COLORS[lead.priority] || 'text-gray-400'}`}>
                        {lead.priority || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{lead.branch_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{lead.assigned_to}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{lead.regdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
