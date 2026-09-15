'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import {
  Activity, AlertCircle, CheckCircle, Clock, Users, Target,
  RefreshCw, Bell, Calendar, TrendingUp, AlertTriangle, UserCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIs {
  todayLeads: number; weekLeads: number;
  todayConverted: number; weekConverted: number;
  overdueFollowups: number; unassignedLeads: number; totalActiveLeads: number;
  todayAppointments: number; completedAppointments: number;
  pendingAppointments: number; missedAppointments: number;
}

interface RecentActivity {
  id: number; name: string; status: string; priority: string;
  assignedTo: string; branch: string; timestamp: string;
}

interface CounselorActivity {
  id: number; name: string; branch: string;
  todayLeads: number; weekLeads: number; weekConverted: number;
  conversionRate: number; todayAppointments: number;
}

interface TodayAppointment {
  id: number; leadId: number; client: string; phone: string;
  time: string; status: string; counselor: string; branch: string;
}

interface OverdueFollowup {
  id: number; leadId: number; client: string; dueDate: string;
  message: string; assignedTo: string; priority: string;
}

interface Alert { type: string; title: string; message: string; severity: string; }

interface MonitorData {
  kpis: KPIs;
  recentActivity: RecentActivity[];
  counselorActivity: CounselorActivity[];
  todayAppointments: TodayAppointment[];
  overdueFollowups: OverdueFollowup[];
  statusBreakdown: Array<{ status: string; count: number }>;
  alerts: Alert[];
  generatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat('en').format(n);

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-700',
  'Client': 'bg-green-100 text-green-700',
  'Qualified': 'bg-purple-100 text-purple-700',
  'Contacted': 'bg-yellow-100 text-yellow-700',
  'Closed': 'bg-red-100 text-red-700',
};

const PRIORITY_DOT: Record<string, string> = {
  'Hot': 'bg-red-500', 'Warm': 'bg-yellow-500', 'Cold': 'bg-blue-400',
};

const SEVERITY_COLORS: Record<string, string> = {
  'high': 'border-red-400 bg-red-50 text-red-800',
  'medium': 'border-yellow-400 bg-yellow-50 text-yellow-800',
  'low': 'border-blue-400 bg-blue-50 text-blue-800',
};

function KpiTile({ label, value, sub, icon: Icon, color = 'green' }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'text-[#1F3B63] bg-[#FBEAE0]',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    yellow: 'text-yellow-600 bg-yellow-50',
  };
  const c = colorMap[color] || colorMap.green;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-gray-900">{typeof value === 'number' ? fmt(value) : value}</div>
        <div className="text-xs font-medium text-gray-500 leading-tight">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ActivityMonitor() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'activity' | 'counselors' | 'appointments' | 'followups'>('activity');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { sorted: sortedRecentActivity, sortKey: activitySortKey, sortDirection: activitySortDirection, toggleSort: toggleActivitySort } = useSortableData(
    data?.recentActivity || [],
    {
      lead: (a) => a.name,
      status: (a) => a.status,
      priority: (a) => a.priority,
      assignedTo: (a) => a.assignedTo,
      branch: (a) => a.branch,
      time: (a) => a.timestamp,
    },
  );

  const { sorted: sortedCounselorActivity, sortKey: counselorSortKey, sortDirection: counselorSortDirection, toggleSort: toggleCounselorSort } = useSortableData(
    data?.counselorActivity || [],
    {
      counselor: (c) => c.name,
      branch: (c) => c.branch,
      today: (c) => c.todayLeads,
      weekLeads: (c) => c.weekLeads,
      weekConverted: (c) => c.weekConverted,
      rate: (c) => c.conversionRate,
      apptsToday: (c) => c.todayAppointments,
    },
  );

  const { sorted: sortedTodayAppointments, sortKey: apptSortKey, sortDirection: apptSortDirection, toggleSort: toggleApptSort } = useSortableData(
    data?.todayAppointments || [],
    {
      client: (a) => a.client,
      phone: (a) => a.phone,
      time: (a) => a.time,
      status: (a) => a.status,
      counselor: (a) => a.counselor,
      branch: (a) => a.branch,
    },
  );

  const { sorted: sortedOverdueFollowups, sortKey: followupSortKey, sortDirection: followupSortDirection, toggleSort: toggleFollowupSort } = useSortableData(
    data?.overdueFollowups || [],
    {
      client: (f) => f.client,
      dueDate: (f) => f.dueDate,
      message: (f) => f.message,
      assignedTo: (f) => f.assignedTo,
      priority: (f) => f.priority,
    },
  );

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetch('/api/monitoring');
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin text-[#1F3B63]" />
        Loading live monitoring data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <span>{error || 'No data'}</span>
        <button onClick={load} className="px-4 py-2 bg-[#1F3B63] text-white rounded-lg text-sm hover:bg-[#14273F]">Retry</button>
      </div>
    );
  }

  const { kpis, recentActivity, counselorActivity, todayAppointments, overdueFollowups, statusBreakdown, alerts } = data;

  return (
    <div className="space-y-5">

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {autoRefresh ? 'Live · refreshes every 30s' : 'Paused'}
          </span>
          {data.generatedAt && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              · Last: {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${autoRefresh ? 'bg-[#FBEAE0] border-[#1F3B63] text-[#14273F]' : 'bg-white border-gray-200 text-gray-500'}`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button onClick={load} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Alerts ───────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.low}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">{a.title}</div>
                <div className="text-xs mt-0.5">{a.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="New Leads Today" value={kpis.todayLeads} sub={`${fmt(kpis.weekLeads)} this week`} icon={Users} color="blue" />
        <KpiTile label="Converted Today" value={kpis.todayConverted} sub={`${fmt(kpis.weekConverted)} this week`} icon={Target} color="green" />
        <KpiTile label="Appointments Today" value={kpis.todayAppointments} sub={`${fmt(kpis.completedAppointments)} done`} icon={Calendar} color="blue" />
        <KpiTile label="Overdue Follow-ups" value={kpis.overdueFollowups} icon={Clock} color={kpis.overdueFollowups > 0 ? 'red' : 'green'} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Active Leads" value={kpis.totalActiveLeads} icon={Activity} color="blue" />
        <KpiTile label="Unassigned Leads" value={kpis.unassignedLeads} icon={AlertCircle} color={kpis.unassignedLeads > 5 ? 'orange' : 'green'} />
        <KpiTile label="Pending Appointments" value={kpis.pendingAppointments} icon={Clock} color="yellow" />
        <KpiTile label="Missed Appointments" value={kpis.missedAppointments} icon={AlertTriangle} color={kpis.missedAppointments > 0 ? 'red' : 'green'} />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {([
            { key: 'activity', label: 'Recent Activity', icon: Activity },
            { key: 'counselors', label: 'Counselor Activity', icon: UserCheck },
            { key: 'appointments', label: "Today's Appointments", icon: Calendar },
            { key: 'followups', label: 'Overdue Follow-ups', icon: Bell },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'text-[#14273F] border-b-2 border-[#1F3B63] bg-[#FDF3EC]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'followups' && kpis.overdueFollowups > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">{kpis.overdueFollowups}</span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">

          {/* Recent Activity */}
          {activeTab === 'activity' && (
            recentActivity.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No activity in the last 24 hours</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <SortableTh label="Lead" sortKey="lead" activeKey={activitySortKey} direction={activitySortDirection} onSort={toggleActivitySort} className="px-5 py-3 text-left" />
                    <SortableTh label="Status" sortKey="status" activeKey={activitySortKey} direction={activitySortDirection} onSort={toggleActivitySort} className="px-5 py-3 text-left" />
                    <SortableTh label="Priority" sortKey="priority" activeKey={activitySortKey} direction={activitySortDirection} onSort={toggleActivitySort} className="px-5 py-3 text-left" />
                    <SortableTh label="Assigned To" sortKey="assignedTo" activeKey={activitySortKey} direction={activitySortDirection} onSort={toggleActivitySort} className="px-5 py-3 text-left" />
                    <SortableTh label="Branch" sortKey="branch" activeKey={activitySortKey} direction={activitySortDirection} onSort={toggleActivitySort} className="px-5 py-3 text-left" />
                    <SortableTh label="Time" sortKey="time" activeKey={activitySortKey} direction={activitySortDirection} onSort={toggleActivitySort} className="px-5 py-3 text-left" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedRecentActivity.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-gray-900">{a.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">#{a.id}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {a.priority && <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[a.priority] || 'bg-gray-300'}`} />}
                          <span className="text-xs text-gray-600">{a.priority || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{a.assignedTo}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{a.branch}</td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {a.timestamp ? new Date(a.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Counselor Activity */}
          {activeTab === 'counselors' && (
            counselorActivity.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No counselor activity this week</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <SortableTh label="Counselor" sortKey="counselor" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Branch" sortKey="branch" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Today" sortKey="today" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Week Leads" sortKey="weekLeads" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Week Conv." sortKey="weekConverted" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Rate" sortKey="rate" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                    <SortableTh label="Appts Today" sortKey="apptsToday" activeKey={counselorSortKey} direction={counselorSortDirection} onSort={toggleCounselorSort} className="px-5 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedCounselorActivity.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#FBEAE0] flex items-center justify-center text-[#14273F] text-xs font-bold shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">{c.branch}</td>
                      <td className="px-5 py-3 text-sm text-right font-medium text-gray-700">{c.todayLeads}</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-700">{c.weekLeads}</td>
                      <td className="px-5 py-3 text-sm text-right text-green-700 font-medium">{c.weekConverted}</td>
                      <td className="px-5 py-3 text-sm text-right">
                        <span className={`font-semibold ${c.conversionRate >= 40 ? 'text-green-600' : c.conversionRate >= 20 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {c.conversionRate}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right text-blue-600 font-medium">{c.todayAppointments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Today's Appointments */}
          {activeTab === 'appointments' && (
            todayAppointments.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No appointments scheduled for today</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <SortableTh label="Client" sortKey="client" activeKey={apptSortKey} direction={apptSortDirection} onSort={toggleApptSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Phone" sortKey="phone" activeKey={apptSortKey} direction={apptSortDirection} onSort={toggleApptSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Time" sortKey="time" activeKey={apptSortKey} direction={apptSortDirection} onSort={toggleApptSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Status" sortKey="status" activeKey={apptSortKey} direction={apptSortDirection} onSort={toggleApptSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Counselor" sortKey="counselor" activeKey={apptSortKey} direction={apptSortDirection} onSort={toggleApptSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Branch" sortKey="branch" activeKey={apptSortKey} direction={apptSortDirection} onSort={toggleApptSort} className="px-5 py-3 text-left" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedTodayAppointments.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-gray-900">{a.client}</div>
                        <div className="text-xs text-gray-400">Lead #{a.leadId}</div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{a.phone || '—'}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-700">{a.time}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          a.status === 'Not Done' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{a.counselor}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{a.branch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Overdue Follow-ups */}
          {activeTab === 'followups' && (
            overdueFollowups.length === 0 ? (
              <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-400" />
                No overdue follow-ups
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <tr>
                    <SortableTh label="Client" sortKey="client" activeKey={followupSortKey} direction={followupSortDirection} onSort={toggleFollowupSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Due Date" sortKey="dueDate" activeKey={followupSortKey} direction={followupSortDirection} onSort={toggleFollowupSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Message" sortKey="message" activeKey={followupSortKey} direction={followupSortDirection} onSort={toggleFollowupSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Assigned To" sortKey="assignedTo" activeKey={followupSortKey} direction={followupSortDirection} onSort={toggleFollowupSort} className="px-5 py-3 text-left" />
                    <SortableTh label="Priority" sortKey="priority" activeKey={followupSortKey} direction={followupSortDirection} onSort={toggleFollowupSort} className="px-5 py-3 text-left" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedOverdueFollowups.map(f => {
                    const daysOverdue = Math.floor((Date.now() - new Date(f.dueDate).getTime()) / 86400000);
                    return (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium text-gray-900">{f.client || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">Lead #{f.leadId}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-sm text-red-600 font-medium">{f.dueDate}</div>
                          <div className="text-xs text-red-400">{daysOverdue}d overdue</div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600 max-w-xs">
                          <div className="truncate">{f.message || '—'}</div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{f.assignedTo}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            f.priority === 'high' ? 'bg-red-100 text-red-700' :
                            f.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{f.priority}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

        </div>
      </div>

      {/* ── Status breakdown ───────────────────────────────────────────── */}
      {statusBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#1F3B63]" />
            <h3 className="text-sm font-semibold text-gray-700">Today's New Leads by Status</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {statusBreakdown.map(s => (
              <div key={s.status} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                  {s.status}
                </span>
                <span className="text-sm font-bold text-gray-800">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
