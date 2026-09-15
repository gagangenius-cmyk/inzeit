'use client';

import { useEffect, useState } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import {
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Bell,
  Calendar,
  Wallet,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  pendingFollowups: number;
  totalAppointments: number;
  todayAppointments: number;
  totalBalance: number;
  totalPaidAmount: number;
  totalEmployees: number;
  monthTrend: {
    thisMonthLeads: number;
    lastMonthLeads: number;
    thisMonthConverted: number;
    lastMonthConverted: number;
    thisMonthAppointments: number;
    lastMonthAppointments: number;
  };
}

interface CounselorRow {
  id: number;
  name: string;
  branch: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  todayAppointments: number;
  pendingFollowups: number;
  status: number;
}

interface RecoveryRow {
  leadId: number;
  clientName: string;
  balanceDue: number;
  counselorName: string;
  lastPaymentDate: string | null;
}

const emptyStats: DashboardStats = {
  totalLeads: 0,
  convertedLeads: 0,
  conversionRate: 0,
  pendingFollowups: 0,
  totalAppointments: 0,
  todayAppointments: 0,
  totalBalance: 0,
  totalPaidAmount: 0,
  totalEmployees: 0,
  monthTrend: {
    thisMonthLeads: 0,
    lastMonthLeads: 0,
    thisMonthConverted: 0,
    lastMonthConverted: 0,
    thisMonthAppointments: 0,
    lastMonthAppointments: 0,
  },
};

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-md p-1.5 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-slate-400">No change vs last month</span>;
  const positive = diff > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
      {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {positive ? '+' : ''}{diff} vs last month
    </span>
  );
}

export default function BranchManagerDashboard() {
  const { user, currencyCode } = useAuth();
  const money = (v: number) => `${currencyCode} ${(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [team, setTeam] = useState<CounselorRow[]>([]);
  const { sorted: sortedTeam, sortKey: teamSortKey, sortDirection: teamSortDirection, toggleSort: toggleTeamSort } = useSortableData(
    team,
    {
      counsellor: (c) => c.name,
      leads: (c) => c.totalLeads,
      converted: (c) => c.convertedLeads,
      conversion: (c) => c.conversionRate,
      todayAppts: (c) => c.todayAppointments,
      pendingFollowups: (c) => c.pendingFollowups,
    },
  );
  const [teamSummary, setTeamSummary] = useState({ total: 0, active: 0, avgConversion: 0 });
  const [recovery, setRecovery] = useState<RecoveryRow[]>([]);
  const [recoveryTotal, setRecoveryTotal] = useState(0);
  const [branchName, setBranchName] = useState('Your Branch');
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const branchId = user?.branch;
      const [dashRes, teamRes, recoveryRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        branchId ? fetch(`/api/admin/counselors?branch=${branchId}`) : Promise.resolve(null),
        branchId ? fetch(`/api/admin/recovery-report?branch=${branchId}&limit=8`) : Promise.resolve(null),
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        const s = json.success && json.data ? json.data.stats : json;
        if (s) {
          setStats({
            totalLeads: s.totalLeads || 0,
            convertedLeads: s.convertedLeads || 0,
            conversionRate: parseFloat(s.conversionRate || 0) || 0,
            pendingFollowups: s.pendingFollowups || 0,
            totalAppointments: s.totalAppointments || 0,
            todayAppointments: s.todayAppointments || 0,
            totalBalance: s.totalBalance || 0,
            totalPaidAmount: s.totalPaidAmount || 0,
            totalEmployees: s.totalEmployees || 0,
            monthTrend: s.monthTrend || emptyStats.monthTrend,
          });
        }
      }

      if (teamRes && teamRes.ok) {
        const tjson = await teamRes.json();
        setTeam(tjson.counselors || []);
        setTeamSummary(tjson.summary || { total: 0, active: 0, avgConversion: 0 });
        if (tjson.counselors?.[0]?.branch) setBranchName(tjson.counselors[0].branch);
      }

      if (recoveryRes && recoveryRes.ok) {
        const rjson = await recoveryRes.json();
        setRecovery(rjson.data || []);
        setRecoveryTotal(rjson.summary?.totalBalance || 0);
      }
    } catch (error) {
      console.error('Branch manager dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.branch]);

  const trendData = [
    { name: 'Leads', 'Last Month': stats.monthTrend.lastMonthLeads, 'This Month': stats.monthTrend.thisMonthLeads },
    { name: 'Converted', 'Last Month': stats.monthTrend.lastMonthConverted, 'This Month': stats.monthTrend.thisMonthConverted },
    { name: 'Appointments', 'Last Month': stats.monthTrend.lastMonthAppointments, 'This Month': stats.monthTrend.thisMonthAppointments },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {branchName} · branch-wide performance and your counsellor team.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Branch Leads" value={stats.totalLeads} icon={Users} accent="bg-blue-50 text-blue-600" />
        <StatTile label="Converted" value={stats.convertedLeads} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
        <StatTile label="Conversion Rate" value={`${stats.conversionRate}%`} icon={TrendingUp} accent="bg-violet-50 text-violet-600" />
        <StatTile label="Team Size" value={teamSummary.total} icon={UserCheck} accent="bg-indigo-50 text-indigo-600" />
        <StatTile label="Today's Appointments" value={stats.todayAppointments} icon={Calendar} accent="bg-sky-50 text-sky-600" />
        <StatTile label="Pending Follow-ups" value={stats.pendingFollowups} icon={Bell} accent="bg-amber-50 text-amber-600" />
        <StatTile label="Collected" value={money(stats.totalPaidAmount)} icon={Wallet} accent="bg-green-50 text-green-600" />
        <StatTile label="Outstanding Balance" value={money(stats.totalBalance)} icon={Wallet} accent="bg-red-50 text-red-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Performance trend */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Branch Trend — This Month vs Last Month</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500">Leads</p>
              <p className="text-lg font-semibold text-slate-900">{stats.monthTrend.thisMonthLeads}</p>
              <Delta current={stats.monthTrend.thisMonthLeads} previous={stats.monthTrend.lastMonthLeads} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Converted</p>
              <p className="text-lg font-semibold text-slate-900">{stats.monthTrend.thisMonthConverted}</p>
              <Delta current={stats.monthTrend.thisMonthConverted} previous={stats.monthTrend.lastMonthConverted} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Appointments</p>
              <p className="text-lg font-semibold text-slate-900">{stats.monthTrend.thisMonthAppointments}</p>
              <Delta current={stats.monthTrend.thisMonthAppointments} previous={stats.monthTrend.lastMonthAppointments} />
            </div>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Last Month" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="This Month" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Branch recovery */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Recovery — Outstanding Balance</h2>
          <p className="mt-1 text-xs text-slate-500">Branch total pending: <span className="font-semibold text-slate-800">{money(recoveryTotal)}</span></p>
          <div className="mt-3 space-y-2">
            {recovery.length === 0 && (
              <p className="text-sm text-slate-400">No outstanding balances 🎉</p>
            )}
            {recovery.map((r) => (
              <div key={r.leadId} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{r.clientName || 'Unknown'}</p>
                  <p className="truncate text-xs text-slate-500">{r.counselorName || 'Unassigned'}</p>
                </div>
                <span className="ml-2 shrink-0 text-sm font-semibold text-red-600">{money(r.balanceDue)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Team roster */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Your Counsellor Team</h2>
          <span className="text-xs text-slate-500">Avg. conversion {teamSummary.avgConversion}%</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <SortableTh label="Counsellor" sortKey="counsellor" activeKey={teamSortKey} direction={teamSortDirection} onSort={toggleTeamSort} className="pb-2" />
                <SortableTh label="Leads" sortKey="leads" activeKey={teamSortKey} direction={teamSortDirection} onSort={toggleTeamSort} className="pb-2" />
                <SortableTh label="Converted" sortKey="converted" activeKey={teamSortKey} direction={teamSortDirection} onSort={toggleTeamSort} className="pb-2" />
                <SortableTh label="Conversion" sortKey="conversion" activeKey={teamSortKey} direction={teamSortDirection} onSort={toggleTeamSort} className="pb-2" />
                <SortableTh label="Today's Appts" sortKey="todayAppts" activeKey={teamSortKey} direction={teamSortDirection} onSort={toggleTeamSort} className="pb-2" />
                <SortableTh label="Pending Follow-ups" sortKey="pendingFollowups" activeKey={teamSortKey} direction={teamSortDirection} onSort={toggleTeamSort} className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {sortedTeam.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-slate-400">No counsellors found for this branch.</td></tr>
              )}
              {sortedTeam.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-800">{c.name}</td>
                  <td className="py-2 text-slate-600">{c.totalLeads}</td>
                  <td className="py-2 text-slate-600">{c.convertedLeads}</td>
                  <td className="py-2 text-slate-600">{c.conversionRate}%</td>
                  <td className="py-2 text-slate-600">{c.todayAppointments}</td>
                  <td className="py-2 text-slate-600">{c.pendingFollowups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
