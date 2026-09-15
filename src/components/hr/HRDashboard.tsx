'use client';

import { useEffect, useState } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import type { ComponentType } from 'react';
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  Database,
  GitPullRequest,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

type WorkforceDelta = {
  absolute: number;
  percent: number;
};
type WorkforceKpi = {
  value: number;
  delta: WorkforceDelta;
  href: string;
};

type DepartmentMetric = {
  departmentId: number | null;
  departmentName: string;
  total: number;
  active: number;
  offshore: number;
  fullTime: number;
  contract: number;
  freelance: number;
  partTime: number;
};

type RecentJoiner = {
  id: number;
  name: string;
  EID?: string | null;
  doj?: string | null;
  department?: number | null;
  status: number;
};

type HRDashboardData = {
  workforceStrength: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    onLeaveEmployees: number;
    missingJoiningDate: number;
    kpis?: {
      totalActiveEmployees: WorkforceKpi;
      statusBreakdown: {
        active: number;
        inactive: number;
        onLeave: number;
        delta: WorkforceDelta;
        href: string;
      };
      newJoinersThisMonth: WorkforceKpi;
      exitsThisMonth: WorkforceKpi;
    };
  };
  onshoreOffshore: {
    onshoreEmployees: number;
    offshoreEmployees: number;
    total?: number;
    segments?: Array<{
      workLocation: string;
      headcount: number;
    }>;
  };
  departmentBreakdown: DepartmentMetric[];
  payrollStatus: {
    month: string;
    status: 'Ready' | 'Review' | 'Pending' | string;
    coveragePercent: number;
    attendanceRecords: number;
    employeesWithAttendance: number;
    totalHours: number;
    shortfallRecords: number;
    overtimeHours: number;
  };
  exitPipelineAttrition: {
    exitCount: number;
    activeExitPipeline: number;
    exitsThisMonth?: number;
    attritionRate: number;
    pendingLeaveRequests: number;
  };
  hiringDynamics: {
    joinedThisMonth: number;
    joinedLastMonth: number;
    joinedThisYear: number;
    recentJoiners: RecentJoiner[];
  };
  apiAndDbQueries: {
    endpoint: string;
    sourceTables: string[];
    sections: string[];
  };
};

const emptyDashboardData: HRDashboardData = {
  workforceStrength: {
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    onLeaveEmployees: 0,
    missingJoiningDate: 0,
    kpis: {
      totalActiveEmployees: { value: 0, delta: { absolute: 0, percent: 0 }, href: '/admin/hr/employee-data-sheet?status=Active' },
      statusBreakdown: { active: 0, inactive: 0, onLeave: 0, delta: { absolute: 0, percent: 0 }, href: '/admin/hr/employee-data-sheet' },
      newJoinersThisMonth: { value: 0, delta: { absolute: 0, percent: 0 }, href: '/admin/hr/employee-data-sheet?joining=this-month' },
      exitsThisMonth: { value: 0, delta: { absolute: 0, percent: 0 }, href: '/admin/hr/eosb?last_working_day=this-month' },
    },
  },
  onshoreOffshore: {
    onshoreEmployees: 0,
    offshoreEmployees: 0,
    total: 0,
    segments: [],
  },
  departmentBreakdown: [],
  payrollStatus: {
    month: '',
    status: 'Pending',
    coveragePercent: 0,
    attendanceRecords: 0,
    employeesWithAttendance: 0,
    totalHours: 0,
    shortfallRecords: 0,
    overtimeHours: 0,
  },
  exitPipelineAttrition: {
    exitCount: 0,
    activeExitPipeline: 0,
    exitsThisMonth: 0,
    attritionRate: 0,
    pendingLeaveRequests: 0,
  },
  hiringDynamics: {
    joinedThisMonth: 0,
    joinedLastMonth: 0,
    joinedThisYear: 0,
    recentJoiners: [],
  },
  apiAndDbQueries: {
    endpoint: '/api/admin/hr/dashboard',
    sourceTables: ['crm_employee', 'crm_department', 'crm_hr_headcount_snapshots', 'crm_hr_attendance_records', 'crm_hr_leave_requests', 'crm_hr_leave_balances', 'crm_hr_eosb_settlements'],
    sections: ['11.1', '11.2', '11.3', '11.4', '11.5', '11.6', '11.7'],
  },
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const workLocationColors: Record<string, string> = {
  Onshore: '#2563eb',
  Offshore: '#f97316',
  'Remote-UAE': '#0d9488',
  'GCC-Branch': '#7c3aed',
};

const employmentTypeColors = {
  fullTime: '#2563eb',
  contract: '#0d9488',
  freelance: '#f97316',
  partTime: '#7c3aed',
};

const deltaLabel = (deltaValue: WorkforceDelta) => {
  const direction = deltaValue.absolute >= 0 ? 'up' : 'down';
  const sign = deltaValue.absolute >= 0 ? '+' : '-';
  return {
    direction,
    text: `${sign}${Math.abs(deltaValue.absolute)} (${Math.abs(deltaValue.percent)}%)`,
    className: deltaValue.absolute >= 0 ? 'text-emerald-700' : 'text-rose-700',
  };
};

export default function HRDashboard() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState<HRDashboardData>(emptyDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departmentChartMode, setDepartmentChartMode] = useState<'grouped' | 'stacked'>('grouped');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/hr/dashboard');
      if (!response.ok) throw new Error('Dashboard API returned an error');
      const dashboard = await response.json();
      setData(dashboard);
    } catch (loadError) {
      console.error('Failed to load HR dashboard:', loadError);
      setData(emptyDashboardData);
      setError('Live dashboard data is unavailable. No database records are shown.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalWorkforce = Math.max(data.workforceStrength.totalEmployees, 1);
  const workLocationSegments = data.onshoreOffshore.segments?.length
    ? data.onshoreOffshore.segments
    : [
        { workLocation: 'Onshore', headcount: data.onshoreOffshore.onshoreEmployees },
        { workLocation: 'Offshore', headcount: data.onshoreOffshore.offshoreEmployees },
      ];
  const workLocationTotal = workLocationSegments.reduce((sum, item) => sum + item.headcount, 0) || totalWorkforce;
  const workforceKpis = data.workforceStrength.kpis || emptyDashboardData.workforceStrength.kpis;
  const departmentTotal = data.departmentBreakdown.reduce((sum, department) => sum + department.total, 0) || 1;
  const departmentChartData = data.departmentBreakdown.map((department) => ({
    ...department,
    percent: Number(((department.total / departmentTotal) * 100).toFixed(1)),
  }));
  const { sorted: sortedDepartmentChartData, sortKey: departmentSortKey, sortDirection: departmentSortDirection, toggleSort: toggleDepartmentSort } = useSortableData(
    departmentChartData,
    {
      department: (d) => d.departmentName,
      total: (d) => d.total,
      percent: (d) => d.percent,
      fullTime: (d) => d.fullTime,
      contract: (d) => d.contract,
      freelance: (d) => d.freelance + d.partTime,
    },
  );
  const canViewDashboard = hasPermission('hr.dashboard') ||
    hasPermission('hr.view') ||
    hasPermission('hr.payroll') ||
    hasPermission('hr.eosb') ||
    hasPermission('hr.team.attendance_leave');

  if (!canViewDashboard) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">HR access required</h1>
        <p className="mt-2 text-sm text-slate-600">Your role does not include HR dashboard access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">HR Module</p>
          <h1 className="text-3xl font-bold text-slate-950">HR Dashboard Specification</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Workforce strength, onshore/offshore split, department composition, payroll readiness, exit pipeline, hiring dynamics, and API/DB query coverage.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          number="11.1"
          label="Total Active Employees"
          value={workforceKpis?.totalActiveEmployees.value || 0}
          delta={workforceKpis?.totalActiveEmployees.delta || { absolute: 0, percent: 0 }}
          href={workforceKpis?.totalActiveEmployees.href || '/admin/hr/employee-data-sheet?status=Active'}
          icon={Users}
        />
        <a href={workforceKpis?.statusBreakdown.href || '/admin/hr/employee-data-sheet'} className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">11.1</span>
            <BadgeCheck className="h-5 w-5 text-slate-500" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Active / Inactive / On Leave</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniMetric label="Active" value={String(workforceKpis?.statusBreakdown.active || 0)} />
            <MiniMetric label="Inactive" value={String(workforceKpis?.statusBreakdown.inactive || 0)} />
            <MiniMetric label="On Leave" value={String(workforceKpis?.statusBreakdown.onLeave || 0)} />
          </div>
          <DeltaLine delta={workforceKpis?.statusBreakdown.delta || { absolute: 0, percent: 0 }} />
        </a>
        <KpiCard
          number="11.1"
          label="New Joiners This Month"
          value={workforceKpis?.newJoinersThisMonth.value || 0}
          delta={workforceKpis?.newJoinersThisMonth.delta || { absolute: 0, percent: 0 }}
          href={workforceKpis?.newJoinersThisMonth.href || '/admin/hr/employee-data-sheet?joining=this-month'}
          icon={CalendarDays}
        />
        <KpiCard
          number="11.1"
          label="Exits This Month"
          value={workforceKpis?.exitsThisMonth.value || 0}
          delta={workforceKpis?.exitsThisMonth.delta || { absolute: 0, percent: 0 }}
          href={workforceKpis?.exitsThisMonth.href || '/admin/hr/eosb?last_working_day=this-month'}
          icon={GitPullRequest}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">11.3</p>
              <h2 className="text-lg font-semibold text-slate-950">Department-wise Breakdown</h2>
            </div>
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {(['grouped', 'stacked'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDepartmentChartMode(mode)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    departmentChartMode === mode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="departmentName" width={96} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [Number(value || 0), String(name)]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar dataKey="fullTime" name="Full-time" fill={employmentTypeColors.fullTime} stackId={departmentChartMode === 'stacked' ? 'employment' : undefined} radius={[0, 4, 4, 0]} />
                <Bar dataKey="contract" name="Contract" fill={employmentTypeColors.contract} stackId={departmentChartMode === 'stacked' ? 'employment' : undefined} radius={[0, 4, 4, 0]} />
                <Bar dataKey="freelance" name="Freelance" fill={employmentTypeColors.freelance} stackId={departmentChartMode === 'stacked' ? 'employment' : undefined} radius={[0, 4, 4, 0]} />
                <Bar dataKey="partTime" name="Part-time" fill={employmentTypeColors.partTime} stackId={departmentChartMode === 'stacked' ? 'employment' : undefined} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                  <SortableTh label="Department" sortKey="department" activeKey={departmentSortKey} direction={departmentSortDirection} onSort={toggleDepartmentSort} className="py-2 pr-4" />
                  <SortableTh label="Total" sortKey="total" activeKey={departmentSortKey} direction={departmentSortDirection} onSort={toggleDepartmentSort} className="py-2 pr-4 text-right" />
                  <SortableTh label="% of headcount" sortKey="percent" activeKey={departmentSortKey} direction={departmentSortDirection} onSort={toggleDepartmentSort} className="py-2 pr-4 text-right" />
                  <SortableTh label="Full-time" sortKey="fullTime" activeKey={departmentSortKey} direction={departmentSortDirection} onSort={toggleDepartmentSort} className="py-2 pr-4 text-right" />
                  <SortableTh label="Contract" sortKey="contract" activeKey={departmentSortKey} direction={departmentSortDirection} onSort={toggleDepartmentSort} className="py-2 pr-4 text-right" />
                  <SortableTh label="Freelance / Part-time" sortKey="freelance" activeKey={departmentSortKey} direction={departmentSortDirection} onSort={toggleDepartmentSort} className="py-2 pr-4 text-right" />
                </tr>
              </thead>
              <tbody>
                {sortedDepartmentChartData.map((department) => (
                  <tr key={`${department.departmentId}-${department.departmentName}`} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-3 pr-4">
                      <a href={`/admin/hr/employee-data-sheet?department=${encodeURIComponent(department.departmentName)}`} className="font-medium text-slate-900 hover:text-blue-700">
                        {department.departmentName}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-700">{department.total}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{department.percent}%</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{department.fullTime}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{department.contract}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{department.freelance + department.partTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hidden">
            {data.departmentBreakdown.map((department) => {
              const width = Math.max(4, Math.round((department.total / totalWorkforce) * 100));
              return (
                <div key={`${department.departmentId}-${department.departmentName}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{department.departmentName}</span>
                    <span className="text-slate-500">{department.total} total · {department.active} active · {department.offshore} offshore</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">11.2</p>
          <h2 className="text-lg font-semibold text-slate-950">Onshore / Offshore Bifurcation</h2>
          <div className="relative mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workLocationSegments}
                  dataKey="headcount"
                  nameKey="workLocation"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={2}
                  onClick={(segment) => {
                    window.location.href = `/admin/hr/employee-data-sheet?work_location=${encodeURIComponent(String(segment.workLocation))}`;
                  }}
                >
                  {workLocationSegments.map((segment) => (
                    <Cell key={segment.workLocation} fill={workLocationColors[segment.workLocation] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const numeric = Number(value || 0);
                    const percent = workLocationTotal ? Math.round((numeric / workLocationTotal) * 100) : 0;
                    return [`${numeric} (${percent}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-950">{workLocationTotal}</div>
                <div className="text-xs font-medium text-slate-500">Total</div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {workLocationSegments.map((segment) => {
              const percent = workLocationTotal ? Math.round((segment.headcount / workLocationTotal) * 100) : 0;
              return (
                <a
                  key={segment.workLocation}
                  href={`/admin/hr/employee-data-sheet?work_location=${encodeURIComponent(segment.workLocation)}`}
                  className="rounded-md border border-slate-200 p-2 text-sm hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: workLocationColors[segment.workLocation] || '#64748b' }} />
                    <span className="font-medium text-slate-800">{segment.workLocation}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{segment.headcount} employees · {percent}%</div>
                </a>
              );
            })}
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
            Missing joining dates: <span className="font-semibold text-slate-950">{data.workforceStrength.missingJoiningDate}</span>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">11.4</p>
          <h2 className="text-lg font-semibold text-slate-950">Payroll Status Widget</h2>
          <div className="mt-5 space-y-3">
            <Detail label="Payroll month" value={data.payrollStatus.month} />
            <Detail label="Employees covered" value={data.payrollStatus.employeesWithAttendance.toString()} />
            <Detail label="Attendance records" value={data.payrollStatus.attendanceRecords.toString()} />
            <Detail label="Total hours" value={data.payrollStatus.totalHours.toFixed(1)} />
            <Detail label="Records with shortfall" value={data.payrollStatus.shortfallRecords.toString()} />
            <Detail label="Overtime hours" value={data.payrollStatus.overtimeHours.toFixed(1)} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">11.5</p>
          <h2 className="text-lg font-semibold text-slate-950">Exit Pipeline & Attrition</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniMetric label="Exit records" value={data.exitPipelineAttrition.exitCount.toString()} />
            <MiniMetric label="Pipeline" value={data.exitPipelineAttrition.activeExitPipeline.toString()} />
            <MiniMetric label="Attrition" value={`${data.exitPipelineAttrition.attritionRate}%`} />
            <MiniMetric label="Leave approvals" value={data.exitPipelineAttrition.pendingLeaveRequests.toString()} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">11.6</p>
          <h2 className="text-lg font-semibold text-slate-950">Hiring Dynamics</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniMetric label="This month" value={data.hiringDynamics.joinedThisMonth.toString()} />
            <MiniMetric label="Last month" value={data.hiringDynamics.joinedLastMonth.toString()} />
            <MiniMetric label="This year" value={data.hiringDynamics.joinedThisYear.toString()} />
          </div>
          <div className="mt-5 space-y-3">
            {data.hiringDynamics.recentJoiners.slice(0, 4).map((joiner) => (
              <div key={joiner.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-950">{joiner.name}</p>
                  <p className="text-xs text-slate-500">{joiner.EID || `#${joiner.id}`}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDate(joiner.doj)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">11.7</p>
            <h2 className="text-lg font-semibold text-slate-950">HR Dashboard — API & DB Queries</h2>
            <p className="mt-1 text-sm text-slate-600">
              Dashboard metrics are served by <span className="font-mono text-slate-950">{data.apiAndDbQueries.endpoint}</span>.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <GitPullRequest className="h-4 w-4" />
              Covered Sections
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.apiAndDbQueries.sections.map((section) => (
                <span key={section} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{section}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Activity className="h-4 w-4" />
              Source Tables
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.apiAndDbQueries.sourceTables.map((table) => (
                <span key={table} className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-700">{table}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  number,
  label,
  value,
  delta,
  href,
  icon: Icon,
}: {
  number: string;
  label: string;
  value: number;
  delta: WorkforceDelta;
  href: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <a href={href} className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{number}</span>
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-950">{value}</p>
      <DeltaLine delta={delta} />
    </a>
  );
}

function DeltaLine({ delta }: { delta: WorkforceDelta }) {
  const formatted = deltaLabel(delta);

  return (
    <p className={`mt-2 text-xs font-medium ${formatted.className}`}>
      {formatted.direction === 'up' ? '↑' : '↓'} {formatted.text} vs previous month
    </p>
  );
}

export function SplitBar({ label, value, percent, color }: { label: string; value: number; percent: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-slate-500">{value} employees · {percent}%</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-slate-100">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${Math.max(4, percent)}%` }} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
