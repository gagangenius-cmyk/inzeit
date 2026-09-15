'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DataTable } from '@/components/ui/data-table';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  FileWarning,
  Landmark,
  ListChecks,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type RenewalItem = {
  id: number;
  title: string;
  category: string;
  owner: string;
  authority: string;
  expiryDate: string;
  status: string;
  daysLeft: number;
};

type WpsRun = {
  id: number;
  month: string;
  employees: number;
  grossPayroll: number;
  sifStatus: string;
  bank: string;
  transferDate: string;
};

type ProTask = {
  id: number;
  title: string;
  category: string;
  owner: string;
  dueDate: string;
  priority: string;
  status: string;
};

type PRODashboardData = {
  renewalExpiryOverview: {
    totalDocuments: number;
    dueIn30Days: number;
    dueIn90Days: number;
    expired: number;
    renewals: RenewalItem[];
  };
  wpsComplianceStatus: {
    totalRuns: number;
    approvedRuns: number;
    pendingRuns: number;
    compliancePercent: number;
    grossPayroll: number;
    runs: WpsRun[];
  };
  monthlyProTaskList: {
    total: number;
    openTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    highPriority: number;
    tasks: ProTask[];
  };
  apiAndDbQueries: {
    endpoint: string;
    sourceTables: string[];
    sections: string[];
  };
};
type UAEComplianceCheck = {
  key: string;
  area: string;
  requirement: string;
  status: 'Compliant' | 'Attention Required' | 'At Risk';
  severity: 'Info' | 'Warning' | 'Critical';
  count: number;
};
type UAEComplianceData = {
  checks: UAEComplianceCheck[];
  summary: {
    total: number;
    compliant: number;
    attentionRequired: number;
    atRisk: number;
  };
};

const emptyDashboardData: PRODashboardData = {
  renewalExpiryOverview: {
    totalDocuments: 0,
    dueIn30Days: 0,
    dueIn90Days: 0,
    expired: 0,
    renewals: [],
  },
  wpsComplianceStatus: {
    totalRuns: 0,
    approvedRuns: 0,
    pendingRuns: 0,
    compliancePercent: 0,
    grossPayroll: 0,
    runs: [],
  },
  monthlyProTaskList: {
    total: 0,
    openTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    highPriority: 0,
    tasks: [],
  },
  apiAndDbQueries: {
    endpoint: '/api/admin/pro-works/dashboard',
    sourceTables: ['crm_pro_documents', 'crm_pro_wps_runs', 'crm_pro_tasks'],
    sections: ['12.1', '12.2', '12.3', '12.4'],
  },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatMoney = (value: number) => (
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(value)
);

const badge = (status: string) => {
  const classes: Record<string, string> = {
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Compliant: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Prepared: 'border-sky-200 bg-sky-50 text-sky-700',
    Uploaded: 'border-sky-200 bg-sky-50 text-sky-700',
    'In Progress': 'border-sky-200 bg-sky-50 text-sky-700',
    Open: 'border-amber-200 bg-amber-50 text-amber-700',
    Expiring: 'border-amber-200 bg-amber-50 text-amber-700',
    Expired: 'border-rose-200 bg-rose-50 text-rose-700',
    'Attention Required': 'border-amber-200 bg-amber-50 text-amber-700',
    'At Risk': 'border-rose-200 bg-rose-50 text-rose-700',
    High: 'border-rose-200 bg-rose-50 text-rose-700',
    Medium: 'border-amber-200 bg-amber-50 text-amber-700',
    Low: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${classes[status] || classes.Low}`}>
      {status}
    </span>
  );
};

export default function PROWorksDashboard() {
  const { hasPermission, currencyCode } = useAuth();
  const formatMoney = (value: number) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
    }
  };
  const [data, setData] = useState<PRODashboardData>(emptyDashboardData);
  const [compliance, setCompliance] = useState<UAEComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/pro-works/dashboard');
      if (!response.ok) throw new Error('Dashboard API returned an error');
      const [dashboard, complianceResponse] = await Promise.all([
        response.json(),
        fetch('/api/admin/compliance/uae'),
      ]);
      setData(dashboard);
      if (complianceResponse.ok) {
        setCompliance(await complianceResponse.json());
      }
    } catch (loadError) {
      console.error('Failed to load PRO Works dashboard:', loadError);
      setData(emptyDashboardData);
      setError('Live PRO dashboard data is unavailable. No database records are shown.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const complianceTone = data.wpsComplianceStatus.compliancePercent >= 90
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : data.wpsComplianceStatus.compliancePercent >= 60
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  const canViewDashboard = hasPermission('pro.dashboard') ||
    hasPermission('pro.view') ||
    hasPermission('pro.wps.view');

  if (!canViewDashboard) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">PRO access required</h1>
        <p className="mt-2 text-sm text-slate-600">Your role does not include PRO dashboard access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">PRO Works Module</p>
          <h1 className="text-3xl font-bold text-slate-950">PRO Works Dashboard Specification</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Renewal and expiry overview, WPS compliance, monthly PRO task load, and API/DB query coverage.
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
        <MetricCard number="12.1" label="Renewals Due in 30 Days" value={data.renewalExpiryOverview.dueIn30Days.toString()} detail={`${data.renewalExpiryOverview.dueIn90Days} due in 90 days`} icon={CalendarClock} />
        <MetricCard number="12.1" label="Expired Documents" value={data.renewalExpiryOverview.expired.toString()} detail={`${data.renewalExpiryOverview.totalDocuments} documents tracked`} icon={FileWarning} />
        <MetricCard number="12.2" label="WPS Compliance" value={`${data.wpsComplianceStatus.compliancePercent}%`} detail={`${data.wpsComplianceStatus.approvedRuns}/${data.wpsComplianceStatus.totalRuns} runs approved`} icon={Landmark} tone={complianceTone} />
        <MetricCard number="12.3" label="Monthly Tasks" value={data.monthlyProTaskList.total.toString()} detail={`${data.monthlyProTaskList.highPriority} high priority`} icon={ListChecks} />
      </div>

      {compliance && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">9</p>
              <h2 className="text-lg font-semibold text-slate-950">UAE Compliance Notes</h2>
              <p className="mt-1 text-sm text-slate-600">MOHRE, WPS, GDRFA, Emirates ID, health insurance, and privacy checks from live HR/PRO data.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {badge(`${compliance.summary.compliant} Compliant`)}
              {badge(`${compliance.summary.attentionRequired} Attention`)}
              {badge(`${compliance.summary.atRisk} At Risk`)}
            </div>
          </div>
          <DataTable
            className="mt-5"
            headers={['Area', 'Requirement', 'Findings', 'Status']}
            rows={compliance.checks.slice(0, 6).map((check) => [
              check.area,
              check.requirement,
              check.count.toString(),
              badge(check.status),
            ])}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">12.1</p>
              <h2 className="text-lg font-semibold text-slate-950">Renewal & Expiry Overview</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {data.renewalExpiryOverview.totalDocuments} records
            </span>
          </div>
          <DataTable
            className="mt-5"
            headers={['Document', 'Authority', 'Expiry Date', 'Days Left', 'Status']}
            rows={data.renewalExpiryOverview.renewals.map((item) => [
              <RecordTitle key={item.id} title={item.title} subtitle={`${item.owner} · ${item.category}`} />,
              item.authority,
              formatDate(item.expiryDate),
              <span key={item.id} className={item.daysLeft <= 30 ? 'font-semibold text-rose-700' : item.daysLeft <= 90 ? 'font-semibold text-amber-700' : 'text-slate-700'}>{item.daysLeft}</span>,
              badge(item.status),
            ])}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">12.2</p>
          <h2 className="text-lg font-semibold text-slate-950">WPS Compliance Status</h2>
          <div className="mt-5 h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-blue-600" style={{ width: `${Math.max(4, data.wpsComplianceStatus.compliancePercent)}%` }} />
          </div>
          <div className="mt-5 space-y-3">
            <Detail label="Approved runs" value={data.wpsComplianceStatus.approvedRuns.toString()} />
            <Detail label="Pending runs" value={data.wpsComplianceStatus.pendingRuns.toString()} />
            <Detail label="Gross payroll" value={formatMoney(data.wpsComplianceStatus.grossPayroll)} />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">12.3</p>
              <h2 className="text-lg font-semibold text-slate-950">Monthly PRO Task List</h2>
            </div>
            <div className="flex gap-2">
              {badge(`${data.monthlyProTaskList.openTasks} Open`)}
              {badge(`${data.monthlyProTaskList.inProgressTasks} In Progress`)}
            </div>
          </div>
          <DataTable
            className="mt-5"
            headers={['Task', 'Owner', 'Due Date', 'Priority', 'Status']}
            rows={data.monthlyProTaskList.tasks.map((task) => [
              <RecordTitle key={task.id} title={task.title} subtitle={task.category} />,
              task.owner,
              formatDate(task.dueDate),
              badge(task.priority),
              badge(task.status),
            ])}
          />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">12.2</p>
          <h2 className="text-lg font-semibold text-slate-950">Recent WPS Runs</h2>
          <div className="mt-5 space-y-3">
            {data.wpsComplianceStatus.runs.slice(0, 4).map((run) => (
              <div key={run.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{run.month}</p>
                    <p className="text-xs text-slate-500">{run.employees} employees · {run.bank}</p>
                  </div>
                  {badge(run.sifStatus)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatMoney(run.grossPayroll)}</span>
                  <span>{formatDate(run.transferDate)}</span>
                </div>
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
            <p className="text-sm font-medium text-slate-500">12.4</p>
            <h2 className="text-lg font-semibold text-slate-950">PRO Dashboard — API & DB Queries</h2>
            <p className="mt-1 text-sm text-slate-600">
              Dashboard metrics are served by <span className="font-mono text-slate-950">{data.apiAndDbQueries.endpoint}</span>.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <CheckCircle2 className="h-4 w-4" />
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
              <AlertTriangle className="h-4 w-4" />
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

function MetricCard({
  number,
  label,
  value,
  detail,
  icon: Icon,
  tone = 'border-slate-200 bg-white text-slate-950',
}: {
  number: string;
  label: string;
  value: string;
  detail: string;
  icon: typeof CalendarClock;
  tone?: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{number}</span>
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}


function RecordTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="font-medium text-slate-950">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
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
