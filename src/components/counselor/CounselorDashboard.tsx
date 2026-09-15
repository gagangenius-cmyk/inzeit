'use client';

import { useEffect, useState } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import {
  Calendar,
  Bell,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  CheckCircle2,
  Clock,
  Phone,
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
  pendingAppointments: number;
  upcomingAppointments: number;
  totalRevenue: number;
  totalPaidAmount: number;
  totalBalance: number;
  monthTrend: {
    thisMonthLeads: number;
    lastMonthLeads: number;
    thisMonthConverted: number;
    lastMonthConverted: number;
    thisMonthAppointments: number;
    lastMonthAppointments: number;
  };
}

interface AppointmentRow {
  id: number;
  date: string;
  appointtime: string;
  fname?: string;
  lname?: string;
  phone?: string;
  mobile?: string;
  booked?: number;
  done?: number;
  not_done?: number;
}

interface FollowUpRow {
  id: number;
  reminder_date: string;
  message?: string;
  priority?: string;
  fname?: string;
  lname?: string;
  phone?: string;
  mobile?: string;
}

interface RecoveryRow {
  leadId: number;
  clientName: string;
  balanceDue: number;
  amountPaid: number;
  totalFee: number;
  lastPaymentDate: string | null;
}

const emptyStats: DashboardStats = {
  totalLeads: 0,
  convertedLeads: 0,
  conversionRate: 0,
  pendingFollowups: 0,
  totalAppointments: 0,
  todayAppointments: 0,
  pendingAppointments: 0,
  upcomingAppointments: 0,
  totalRevenue: 0,
  totalPaidAmount: 0,
  totalBalance: 0,
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

export default function CounselorDashboard() {
  const { user, currencyCode } = useAuth();
  // Shows the logged-in user's own branch currency (AED, QAR, etc.), not a
  // hardcoded "$" - branches span multiple countries/currencies.
  const money = (v: number) => `${currencyCode} ${(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentRow[]>([]);
  const { sorted: sortedTodayAppointments, sortKey: appointmentSortKey, sortDirection: appointmentSortDirection, toggleSort: toggleAppointmentSort } = useSortableData(
    todayAppointments,
    {
      time: (a) => a.appointtime,
      client: (a) => `${a.fname || ''} ${a.lname || ''}`,
      contact: (a) => a.mobile || a.phone,
      status: (a) => (a.done ? 'Done' : a.not_done ? 'Not Done' : 'Pending'),
    },
  );
  const [todayFollowUps, setTodayFollowUps] = useState<FollowUpRow[]>([]);
  const [recovery, setRecovery] = useState<RecoveryRow[]>([]);
  const [recoveryTotal, setRecoveryTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const [dashRes, recoveryRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        user?.id ? fetch(`/api/admin/recovery-report?counselor=${user.id}&limit=8`) : Promise.resolve(null),
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
            pendingAppointments: s.pendingAppointments || 0,
            upcomingAppointments: s.upcomingAppointments || 0,
            totalRevenue: s.totalRevenue || 0,
            totalPaidAmount: s.totalPaidAmount || 0,
            totalBalance: s.totalBalance || 0,
            monthTrend: s.monthTrend || emptyStats.monthTrend,
          });
        }
        setTodayAppointments(json.data?.todayAppointments || []);
        setTodayFollowUps(json.data?.todayFollowUps || []);
      }

      if (recoveryRes && recoveryRes.ok) {
        const rjson = await recoveryRes.json();
        setRecovery(rjson.data || []);
        setRecoveryTotal(rjson.summary?.totalBalance || 0);
      }

      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Counselor dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
            Your leads, appointments, follow-ups, and collections at a glance.
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
        <StatTile label="Assigned Leads" value={stats.totalLeads} icon={Users} accent="bg-blue-50 text-blue-600" />
        <StatTile label="Converted" value={stats.convertedLeads} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
        <StatTile label="Conversion Rate" value={`${stats.conversionRate}%`} icon={TrendingUp} accent="bg-violet-50 text-violet-600" />
        <StatTile label="Pending Follow-ups" value={stats.pendingFollowups} icon={Bell} accent="bg-amber-50 text-amber-600" />
        <StatTile label="Today's Appointments" value={stats.todayAppointments} icon={Calendar} accent="bg-sky-50 text-sky-600" />
        <StatTile label="Upcoming Appointments" value={stats.upcomingAppointments} icon={Clock} accent="bg-cyan-50 text-cyan-600" />
        <StatTile label="Collected" value={money(stats.totalPaidAmount)} icon={Wallet} accent="bg-green-50 text-green-600" />
        <StatTile label="Outstanding Balance" value={money(stats.totalBalance)} icon={Wallet} accent="bg-red-50 text-red-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Performance trend / achievement */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">This Month vs Last Month</h2>
          </div>
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
                <Bar dataKey="This Month" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Today's follow-ups */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Follow-ups</h2>
          <div className="mt-3 space-y-2">
            {todayFollowUps.length === 0 && (
              <p className="text-sm text-slate-400">No follow-ups scheduled for today.</p>
            )}
            {todayFollowUps.slice(0, 6).map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {`${f.fname || ''} ${f.lname || ''}`.trim() || 'Unknown lead'}
                  </p>
                  <p className="truncate text-xs text-slate-500">{f.message || 'Follow-up reminder'}</p>
                </div>
                {(f.phone || f.mobile) && (
                  <span className="ml-2 inline-flex shrink-0 items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" />{f.mobile || f.phone}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today's appointments */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Appointments</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <SortableTh label="Time" sortKey="time" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} className="pb-2" />
                  <SortableTh label="Client" sortKey="client" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} className="pb-2" />
                  <SortableTh label="Contact" sortKey="contact" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} className="pb-2" />
                  <SortableTh label="Status" sortKey="status" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {sortedTodayAppointments.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-400">No appointments today.</td></tr>
                )}
                {sortedTodayAppointments.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="py-2 text-slate-700">{a.appointtime || '—'}</td>
                    <td className="py-2 text-slate-800">{`${a.fname || ''} ${a.lname || ''}`.trim() || 'Unknown'}</td>
                    <td className="py-2 text-slate-500">{a.mobile || a.phone || '—'}</td>
                    <td className="py-2">
                      {a.done ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Done</span>
                      ) : a.not_done ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Not Done</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recovery */}
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recovery — Outstanding Balance</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Total pending: <span className="font-semibold text-slate-800">{money(recoveryTotal)}</span></p>
          <div className="mt-3 space-y-2">
            {recovery.length === 0 && (
              <p className="text-sm text-slate-400">No outstanding balances 🎉</p>
            )}
            {recovery.map((r) => (
              <div key={r.leadId} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{r.clientName || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">
                    Last payment: {r.lastPaymentDate ? new Date(r.lastPaymentDate).toLocaleDateString() : 'None'}
                  </p>
                </div>
                <span className="ml-2 shrink-0 text-sm font-semibold text-red-600">{money(r.balanceDue)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
