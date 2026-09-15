'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, CheckSquare, UserCog, Phone, Download, RefreshCw, Printer,
  PlusCircle, PhoneCall, Loader2,
} from 'lucide-react';

const VISA_TYPES = ['Visit visa', 'Student visa', 'Canada', 'Australia', 'RMS', 'Work Permit'] as const;
const CLIENT_STATUSES = ['Active', 'Expired', 'Dormant but Active', 'Renewals', 'Refunds', 'Close'] as const;

type VisaRow = { total: number } & Record<string, number>;
type TaskVisaRow = { assigned: number; completed: number; pending: number; productivity: number };

interface ClientRow {
  leadId: number;
  opportunityId: number;
  name: string;
  branchId: number;
  location: string;
  visaType: string;
  status: string;
}

interface SummaryResponse {
  success: boolean;
  branches: { id: number; location: string }[];
  employees: { id: number; name: string; branch: number | null }[];
  clients: {
    total: number;
    statusTotals: Record<string, number>;
    matrix: Record<string, VisaRow>;
    visaTypeTotals: VisaRow;
    rows: ClientRow[];
    byBranch: { branchId: number; location: string; statusTotals: Record<string, number>; total: number }[];
  };
  tasks: {
    totalAssigned: number;
    completed: number;
    pending: number;
    productivity: number;
    unclassified: number;
    matrix: Record<string, TaskVisaRow>;
    byBranch: { branchId: number; location: string; assigned: number; completed: number; pending: number; productivity: number }[];
  };
  staff: {
    total: number;
    byLocation: { branchId: number; location: string; count: number }[];
  };
  calls: {
    total: number;
    completed: number;
    highEscalation: number;
    pending: number;
    productivity: number;
    byLocation: { branchId: number; location: string; total: number; completed: number; highEscalation: number; pending: number; productivity: number }[];
  };
}

interface CallRequestRecord {
  id: number;
  branch_id: number;
  status: string;
  is_high_escalation: number;
  notes: string | null;
  requested_at: string;
  lead?: { id: number; fname: string; lname: string } | null;
  requestedByEmployee?: { id: number; name: string } | null;
}

const productivityClass = (pct: number) => {
  if (pct >= 80) return 'text-green-700 bg-green-50';
  if (pct >= 50) return 'text-yellow-700 bg-yellow-50';
  return 'text-red-700 bg-red-50';
};

const statCard = (label: string, value: string | number, icon: React.ReactNode, accent: string) => (
  <div className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${accent}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

export default function OpsDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [callRequests, setCallRequests] = useState<CallRequestRecord[]>([]);
  const [callForm, setCallForm] = useState({ branchId: '', leadId: '', isHighEscalation: false, notes: '' });
  const [callSubmitting, setCallSubmitting] = useState(false);

  const [taskForm, setTaskForm] = useState({ opportunityKey: '', task: '', asignTo: '', dob: '' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const fetchSummary = useCallback(async (branch: string) => {
    const params = branch ? `?branch=${branch}` : '';
    const res = await fetch(`/api/admin/ops-dashboard/summary${params}`);
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || 'Failed to load dashboard');
    setData(result);
  }, []);

  const fetchCallRequests = useCallback(async (branch: string) => {
    const params = new URLSearchParams({ limit: '10' });
    if (branch) params.set('branch', branch);
    const res = await fetch(`/api/admin/ops-dashboard/call-requests?${params}`);
    const result = await res.json();
    if (res.ok && result.success) setCallRequests(result.data);
  }, []);

  const loadAll = useCallback(async (branch: string) => {
    setError('');
    try {
      await Promise.all([fetchSummary(branch), fetchCallRequests(branch)]);
    } catch (e: any) {
      setError(e.message || 'Failed to load operations dashboard');
    }
  }, [fetchSummary, fetchCallRequests]);

  useEffect(() => {
    setLoading(true);
    loadAll(branchFilter).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAll(branchFilter);
    setRefreshing(false);
  };

  const wonClientOptions = useMemo(
    () => (data?.clients.rows || []).map((r) => ({ key: `${r.opportunityId}:${r.leadId}:${r.visaType}`, ...r })),
    [data]
  );

  const exportToExcel = async (rows: Record<string, unknown>[], sheetName: string, filename: string) => {
    if (!rows.length) return;
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  const exportClients = () => exportToExcel(
    (data?.clients.rows || []).map((r) => ({
      'Lead ID': r.leadId,
      'Client Name': r.name,
      Location: r.location,
      'Visa Type': r.visaType,
      Status: r.status,
    })),
    'Clients',
    'operations-clients.xlsx'
  );

  const submitCallRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callForm.branchId) return;
    setCallSubmitting(true);
    try {
      const selected = wonClientOptions.find((o) => o.key === callForm.leadId);
      const res = await fetch('/api/admin/ops-dashboard/call-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: Number(callForm.branchId),
          leadId: selected?.leadId,
          opportunityId: selected?.opportunityId,
          isHighEscalation: callForm.isHighEscalation,
          notes: callForm.notes,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to log call');
      setCallForm({ branchId: '', leadId: '', isHighEscalation: false, notes: '' });
      await loadAll(branchFilter);
    } catch (e: any) {
      setError(e.message || 'Failed to log call');
    } finally {
      setCallSubmitting(false);
    }
  };

  const markCallCompleted = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/ops-dashboard/call-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update call');
      await loadAll(branchFilter);
    } catch (e: any) {
      setError(e.message || 'Failed to update call');
    }
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.opportunityKey || !taskForm.task || !taskForm.asignTo) return;
    setTaskSubmitting(true);
    try {
      const selected = wonClientOptions.find((o) => o.key === taskForm.opportunityKey);
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskForm.task,
          asignTo: Number(taskForm.asignTo),
          asignBy: user?.id || 0,
          dob: taskForm.dob || null,
          status: '0',
          opportunityId: selected?.opportunityId,
          visaType: selected?.visaType,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to assign task');
      setTaskForm({ opportunityKey: '', task: '', asignTo: '', dob: '' });
      await loadAll(branchFilter);
    } catch (e: any) {
      setError(e.message || 'Failed to assign task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 rounded-lg p-4">{error || 'Failed to load operations dashboard'}</div>
      </div>
    );
  }

  const { clients, tasks, staff, calls, branches, employees } = data;

  return (
    <div className="p-6 space-y-6 print:p-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600">Live client, task, staffing &amp; call metrics — every won deal becomes an operations client automatically.</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchableSelect
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[160px]"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>{b.location}</option>
            ))}
          </SearchableSelect>
          <button onClick={refresh} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-1">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm print:hidden">{error}</div>}

      {/* Total Client */}
      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Client</h2>
              <p className="text-sm text-gray-500">Client count by status and visa type — sourced from every won deal</p>
            </div>
          </div>
          <button onClick={exportClients} className="text-sm px-3 py-1.5 border rounded-md flex items-center gap-1 hover:bg-gray-50 print:hidden">
            <Download className="h-4 w-4" /> Download detail sheet
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCard('Total clients', clients.total, <Users className="h-6 w-6 text-blue-500" />, 'border-blue-500')}
          {CLIENT_STATUSES.map((status) => statCard(status, clients.statusTotals[status] ?? 0, <Users className="h-6 w-6 text-blue-300" />, 'border-blue-300'))}
        </div>
        <div className="overflow-x-auto p-6 pt-0">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold text-gray-600 border">Status</th>
                {VISA_TYPES.map((v) => <th key={v} className="px-4 py-2 text-center font-semibold text-gray-600 border">{v}</th>)}
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {CLIENT_STATUSES.map((status) => (
                <tr key={status}>
                  <td className="px-4 py-2 border font-medium text-gray-700">{status}</td>
                  {VISA_TYPES.map((v) => <td key={v} className="px-4 py-2 border text-center">{clients.matrix[status]?.[v] ?? 0}</td>)}
                  <td className="px-4 py-2 border text-center font-semibold">{clients.matrix[status]?.total ?? 0}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2 border">Total</td>
                {VISA_TYPES.map((v) => <td key={v} className="px-4 py-2 border text-center">{clients.visaTypeTotals[v] ?? 0}</td>)}
                <td className="px-4 py-2 border text-center">{clients.visaTypeTotals.total}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Status by branch */}
        <div className="overflow-x-auto p-6 pt-0">
          <p className="text-xs font-medium text-gray-500 mb-2">By branch</p>
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold text-gray-600 border">Status</th>
                {clients.byBranch.map((b) => <th key={b.branchId} className="px-4 py-2 text-center font-semibold text-gray-600 border">{b.location}</th>)}
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {CLIENT_STATUSES.map((status) => (
                <tr key={status}>
                  <td className="px-4 py-2 border font-medium text-gray-700">{status}</td>
                  {clients.byBranch.map((b) => <td key={b.branchId} className="px-4 py-2 border text-center">{b.statusTotals[status] ?? 0}</td>)}
                  <td className="px-4 py-2 border text-center font-semibold">{clients.matrix[status]?.total ?? 0}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2 border">Total</td>
                {clients.byBranch.map((b) => <td key={b.branchId} className="px-4 py-2 border text-center">{b.total}</td>)}
                <td className="px-4 py-2 border text-center">{clients.visaTypeTotals.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Task Management */}
      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 pb-0 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-orange-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Task Management</h2>
            <p className="text-sm text-gray-500">Assigned vs. completed, by visa type</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCard('Total tasks assigned', tasks.totalAssigned, <CheckSquare className="h-6 w-6 text-orange-500" />, 'border-orange-500')}
          {statCard('Completed', tasks.completed, <CheckSquare className="h-6 w-6 text-green-500" />, 'border-green-500')}
          {statCard('Pending', tasks.pending, <CheckSquare className="h-6 w-6 text-yellow-500" />, 'border-yellow-500')}
          {statCard('Overall productivity', `${tasks.productivity}%`, <CheckSquare className="h-6 w-6 text-purple-500" />, 'border-purple-500')}
        </div>
        <div className="overflow-x-auto px-6">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold text-gray-600 border">Metric</th>
                {VISA_TYPES.map((v) => <th key={v} className="px-4 py-2 text-center font-semibold text-gray-600 border">{v}</th>)}
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border font-medium">Total task assigned</td>
                {VISA_TYPES.map((v) => <td key={v} className="px-4 py-2 border text-center">{tasks.matrix[v]?.assigned ?? 0}</td>)}
                <td className="px-4 py-2 border text-center font-semibold">{tasks.totalAssigned}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border font-medium">Completed</td>
                {VISA_TYPES.map((v) => <td key={v} className="px-4 py-2 border text-center">{tasks.matrix[v]?.completed ?? 0}</td>)}
                <td className="px-4 py-2 border text-center font-semibold">{tasks.completed}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border font-medium">Pending</td>
                {VISA_TYPES.map((v) => <td key={v} className="px-4 py-2 border text-center">{tasks.matrix[v]?.pending ?? 0}</td>)}
                <td className="px-4 py-2 border text-center font-semibold">{tasks.pending}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-2 border font-medium">Productivity %</td>
                {VISA_TYPES.map((v) => (
                  <td key={v} className={`px-4 py-2 border text-center font-semibold ${productivityClass(tasks.matrix[v]?.productivity ?? 0)}`}>
                    {tasks.matrix[v]?.productivity ?? 0}%
                  </td>
                ))}
                <td className={`px-4 py-2 border text-center font-semibold ${productivityClass(tasks.productivity)}`}>{tasks.productivity}%</td>
              </tr>
            </tbody>
          </table>
          {tasks.unclassified > 0 && (
            <p className="text-xs text-gray-400 py-2">{tasks.unclassified} task(s) aren&apos;t linked to a visa type yet and are excluded from the breakdown above (included in the totals).</p>
          )}
        </div>

        {/* Tasks by branch */}
        <div className="overflow-x-auto px-6 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">By branch</p>
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold text-gray-600 border">Metric</th>
                {tasks.byBranch.map((b) => <th key={b.branchId} className="px-4 py-2 text-center font-semibold text-gray-600 border">{b.location}</th>)}
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border font-medium">Total task assigned</td>
                {tasks.byBranch.map((b) => <td key={b.branchId} className="px-4 py-2 border text-center">{b.assigned}</td>)}
                <td className="px-4 py-2 border text-center font-semibold">{tasks.totalAssigned}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border font-medium">Completed</td>
                {tasks.byBranch.map((b) => <td key={b.branchId} className="px-4 py-2 border text-center">{b.completed}</td>)}
                <td className="px-4 py-2 border text-center font-semibold">{tasks.completed}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border font-medium">Pending</td>
                {tasks.byBranch.map((b) => <td key={b.branchId} className="px-4 py-2 border text-center">{b.pending}</td>)}
                <td className="px-4 py-2 border text-center font-semibold">{tasks.pending}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-2 border font-medium">Productivity %</td>
                {tasks.byBranch.map((b) => (
                  <td key={b.branchId} className={`px-4 py-2 border text-center font-semibold ${productivityClass(b.productivity)}`}>
                    {b.productivity}%
                  </td>
                ))}
                <td className={`px-4 py-2 border text-center font-semibold ${productivityClass(tasks.productivity)}`}>{tasks.productivity}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Assign task quick action */}
        <form onSubmit={submitTask} className="p-6 pt-4 border-t mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end print:hidden">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Client / Case</label>
            <SearchableSelect
              value={taskForm.opportunityKey}
              onChange={(e) => setTaskForm((f) => ({ ...f, opportunityKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select a won client</option>
              {wonClientOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.name} — {o.visaType}</option>
              ))}
            </SearchableSelect>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Task</label>
            <input
              type="text"
              value={taskForm.task}
              onChange={(e) => setTaskForm((f) => ({ ...f, task: e.target.value }))}
              placeholder="e.g. Collect documents"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assign to</label>
            <SearchableSelect
              value={taskForm.asignTo}
              onChange={(e) => setTaskForm((f) => ({ ...f, asignTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => <option key={emp.id} value={String(emp.id)}>{emp.name}</option>)}
            </SearchableSelect>
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button
              type="submit"
              disabled={taskSubmitting}
              className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-md text-sm flex items-center gap-1 hover:bg-[var(--cmg-blue-dark)] disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" /> Assign Task
            </button>
          </div>
        </form>
      </section>

      {/* Total Operation Staff */}
      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 pb-0 flex items-center gap-2">
          <UserCog className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Total Operation Staff</h2>
            <p className="text-sm text-gray-500">Headcount by location</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {staff.byLocation.map((loc) => (
            <div key={loc.branchId} className="border-2 border-emerald-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">{loc.location}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{loc.count}</p>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 text-right text-sm text-gray-600">Total operation staff: <span className="font-semibold text-gray-900">{staff.total}</span></div>
      </section>

      {/* Calls Request Summary */}
      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 pb-0 flex items-center gap-2">
          <Phone className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Calls Request Summary</h2>
            <p className="text-sm text-gray-500">Call volume, escalations &amp; productivity by location</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCard('Total calls', calls.total, <Phone className="h-6 w-6 text-indigo-500" />, 'border-indigo-500')}
          {statCard('Completed', calls.completed, <Phone className="h-6 w-6 text-green-500" />, 'border-green-500')}
          {statCard('High escalation', calls.highEscalation, <Phone className="h-6 w-6 text-red-500" />, 'border-red-500')}
          {statCard('Pending', calls.pending, <Phone className="h-6 w-6 text-yellow-500" />, 'border-yellow-500')}
          {statCard('Overall productivity', `${calls.productivity}%`, <Phone className="h-6 w-6 text-purple-500" />, 'border-purple-500')}
        </div>
        <div className="overflow-x-auto px-6">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold text-gray-600 border">Location</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Total call</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Completed</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">High escalation call</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Pending</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-600 border">Productivity %</th>
              </tr>
            </thead>
            <tbody>
              {calls.byLocation.map((loc) => (
                <tr key={loc.branchId}>
                  <td className="px-4 py-2 border font-medium">{loc.location}</td>
                  <td className="px-4 py-2 border text-center">{loc.total}</td>
                  <td className="px-4 py-2 border text-center">{loc.completed}</td>
                  <td className="px-4 py-2 border text-center">{loc.highEscalation}</td>
                  <td className="px-4 py-2 border text-center">{loc.pending}</td>
                  <td className={`px-4 py-2 border text-center font-semibold ${productivityClass(loc.productivity)}`}>{loc.productivity}%</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2 border">Total</td>
                <td className="px-4 py-2 border text-center">{calls.total}</td>
                <td className="px-4 py-2 border text-center">{calls.completed}</td>
                <td className="px-4 py-2 border text-center">{calls.highEscalation}</td>
                <td className="px-4 py-2 border text-center">{calls.pending}</td>
                <td className={`px-4 py-2 border text-center ${productivityClass(calls.productivity)}`}>{calls.productivity}%</td>
              </tr>
            </tbody>
          </table>
          <div className="flex items-center gap-4 py-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-400 inline-block" /> ≥ 80% productivity</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-400 inline-block" /> 50–79%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-400 inline-block" /> &lt; 50%</span>
          </div>
        </div>

        {/* Log a call quick action */}
        <form onSubmit={submitCallRequest} className="p-6 pt-4 border-t grid grid-cols-1 md:grid-cols-5 gap-3 items-end print:hidden">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
            <SearchableSelect
              value={callForm.branchId}
              onChange={(e) => setCallForm((f) => ({ ...f, branchId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select branch</option>
              {branches.map((b) => <option key={b.id} value={String(b.id)}>{b.location}</option>)}
            </SearchableSelect>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Client (optional)</label>
            <SearchableSelect
              value={callForm.leadId}
              onChange={(e) => setCallForm((f) => ({ ...f, leadId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">General / unlinked call</option>
              {wonClientOptions.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
            </SearchableSelect>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <input
                type="checkbox"
                checked={callForm.isHighEscalation}
                onChange={(e) => setCallForm((f) => ({ ...f, isHighEscalation: e.target.checked }))}
              />
              High escalation
            </label>
          </div>
          <div>
            <button
              type="submit"
              disabled={callSubmitting || !callForm.branchId}
              className="w-full px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-md text-sm flex items-center justify-center gap-1 hover:bg-[var(--cmg-blue-dark)] disabled:opacity-50"
            >
              <PhoneCall className="h-4 w-4" /> Log Call
            </button>
          </div>
        </form>

        {/* Recent calls */}
        {callRequests.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent call requests</h3>
            <div className="space-y-2">
              {callRequests.map((cr) => (
                <div key={cr.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                  <div>
                    <span className="font-medium">{cr.lead ? `${cr.lead.fname} ${cr.lead.lname}` : 'General call'}</span>
                    {Number(cr.is_high_escalation) === 1 && <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">High escalation</span>}
                    <span className="ml-2 text-xs text-gray-400">{new Date(cr.requested_at).toLocaleString()}</span>
                  </div>
                  {cr.status === 'completed' ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Completed</span>
                  ) : (
                    <button onClick={() => markCallCompleted(cr.id)} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full print:hidden">
                      Mark Completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
