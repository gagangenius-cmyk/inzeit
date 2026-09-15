'use client';

import { useEffect, useState } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { RefreshCw, BarChart3, Building2, Coffee, User } from 'lucide-react';

interface SummaryRow {
  branch_id: number | null;
  branch_name: string | null;
  department_id: number | null;
  department_name: string | null;
  headcount: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  half_day_count: number;
  leave_count: number;
}

interface DetailRow {
  employee_id: number;
  employee_name: string;
  branch_id: number | null;
  branch_name: string | null;
  department_id: number | null;
  department_name: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  break_count: number;
  total_break_minutes: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const firstOfMonthIso = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
};

export default function AttendanceReportPage() {
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [detail, setDetail] = useState<DetailRow[]>([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const { sorted: sortedSummary, sortKey: summarySortKey, sortDirection: summarySortDirection, toggleSort: toggleSummarySort } = useSortableData(
    summary,
    {
      branch: (row) => row.branch_name,
      department: (row) => row.department_name,
      headcount: (row) => row.headcount,
      present: (row) => row.present_count,
      absent: (row) => row.absent_count,
      late: (row) => row.late_count,
      halfDay: (row) => row.half_day_count,
      leave: (row) => row.leave_count,
    },
  );
  const { sorted: sortedDetail, sortKey: detailSortKey, sortDirection: detailSortDirection, toggleSort: toggleDetailSort } = useSortableData(
    detail,
    {
      employee: (row) => row.employee_name,
      date: (row) => row.date,
      checkIn: (row) => row.check_in,
      checkOut: (row) => row.check_out,
      status: (row) => row.status,
      breakCount: (row) => row.break_count,
      breakMinutes: (row) => row.total_break_minutes,
    },
  );
  const [scope, setScope] = useState<'branch' | 'company'>('branch');
  const [dateFrom, setDateFrom] = useState(firstOfMonthIso());
  const [dateTo, setDateTo] = useState(todayIso());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Weekly-off configuration - drives leave-duration math
  // (calculateWorkingDays); previously hardcoded to "no weekend exclusion at
  // all". Read-only for anyone who can view this report; saving requires
  // hr.config server-side (this widget doesn't hide itself from viewers who
  // lack it - a 403 on save is enough, matching how most of this app's
  // simpler admin widgets handle write-permission gating).
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [showWeeklyOffEditor, setShowWeeklyOffEditor] = useState(false);
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0]);
  const [weeklyOffSaving, setWeeklyOffSaving] = useState(false);
  const [weeklyOffMessage, setWeeklyOffMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWeeklyOffDays = async () => {
    try {
      const res = await fetch('/api/admin/hr/attendance-settings');
      const json = await res.json();
      if (res.ok) setWeeklyOffDays(json.days || [0]);
    } catch {
      // Non-critical - the report itself still works without this loading.
    }
  };

  const toggleWeeklyOffDay = (day: number) => {
    setWeeklyOffDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)));
  };

  const saveWeeklyOffDays = async () => {
    setWeeklyOffSaving(true);
    setWeeklyOffMessage(null);
    try {
      const res = await fetch('/api/admin/hr/attendance-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: weeklyOffDays }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');
      setWeeklyOffDays(json.days);
      setWeeklyOffMessage({ type: 'success', text: 'Weekly off days updated.' });
    } catch (err) {
      setWeeklyOffMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setWeeklyOffSaving(false);
    }
  };

  useEffect(() => { loadWeeklyOffDays(); }, []);

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`/api/admin/hr/attendance-report?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setSummary(json.summary || []);
        setDetail(json.detail || []);
        setDetailTotal(json.detailTotal ?? (json.detail || []).length);
        setScope(json.scope || 'branch');
      } else {
        setError(json.error || 'Failed to load attendance report');
      }
    } catch {
      setError('Failed to load attendance report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = summary.reduce(
    (acc, row) => ({
      headcount: acc.headcount + Number(row.headcount || 0),
      present: acc.present + Number(row.present_count || 0),
      absent: acc.absent + Number(row.absent_count || 0),
      late: acc.late + Number(row.late_count || 0),
      leave: acc.leave + Number(row.leave_count || 0),
    }),
    { headcount: 0, present: 0, absent: 0, late: 0, leave: 0 }
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <BarChart3 className="h-6 w-6 text-blue-600" /> Attendance Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {scope === 'company' ? 'Company-wide attendance, branch and department wise.' : 'Attendance for your branch.'}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-slate-700">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={() => setShowWeeklyOffEditor((v) => !v)}
          className="ml-auto text-sm font-medium text-blue-600 hover:underline"
        >
          {showWeeklyOffEditor ? 'Hide' : 'Weekly Off Settings'}
        </button>
      </div>

      {showWeeklyOffEditor && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-900">Weekly off days</p>
          <p className="mt-1 text-xs text-slate-500">
            Days excluded from leave-duration calculations company-wide (e.g. a leave request spanning these days won't count them against the employee's balance).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeeklyOffDay(day)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  weeklyOffDays.includes(day)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={saveWeeklyOffDays}
              disabled={weeklyOffSaving || weeklyOffDays.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {weeklyOffSaving ? 'Saving…' : 'Save'}
            </button>
            {weeklyOffMessage && (
              <span className={`text-sm ${weeklyOffMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {weeklyOffMessage.text}
              </span>
            )}
          </div>
        </div>
      )}

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Headcount</p><p className="text-lg font-semibold text-slate-900">{totals.headcount}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Present</p><p className="text-lg font-semibold text-emerald-600">{totals.present}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Absent</p><p className="text-lg font-semibold text-red-600">{totals.absent}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Late</p><p className="text-lg font-semibold text-amber-600">{totals.late}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">On Leave</p><p className="text-lg font-semibold text-slate-900">{totals.leave}</p></div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <SortButtonRow
          options={[
            ['branch', 'Branch'],
            ['department', 'Department'],
            ['headcount', 'Headcount'],
            ['present', 'Present'],
            ['absent', 'Absent'],
            ['late', 'Late'],
            ['halfDay', 'Half-Day'],
            ['leave', 'Leave'],
          ] as const}
          activeKey={summarySortKey}
          direction={summarySortDirection}
          onSort={toggleSummarySort}
        />
        <RecordList
          loading={isLoading}
          isEmpty={!isLoading && sortedSummary.length === 0}
          emptyIcon={BarChart3}
          emptyTitle="No attendance data for this range"
        >
          {sortedSummary.map((row, index) => (
            <RecordCard
              key={`${row.branch_id}-${row.department_id}-${index}`}
              avatar={<Building2 className="h-4 w-4" />}
              avatarColorClass="from-blue-600 to-cyan-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{row.branch_name || '—'}</span>}
              titleBadges={<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{row.department_name || '—'}</span>}
              stats={[
                { label: 'Headcount', value: row.headcount },
                { label: 'Present', value: <span className="text-emerald-600">{row.present_count}</span> },
                { label: 'Absent', value: <span className="text-red-600">{row.absent_count}</span> },
                { label: 'Late', value: <span className="text-amber-600">{row.late_count}</span> },
                { label: 'Half-Day', value: row.half_day_count },
                { label: 'Leave', value: row.leave_count },
              ]}
            />
          ))}
        </RecordList>
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Coffee className="h-5 w-5 text-blue-600" /> Attendance &amp; Break Detail
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Per-day check-in/check-out and total break time for each {scope === 'company' ? 'employee' : 'counselor/staff member'} in range.
        </p>
      </div>

      {detailTotal > detail.length && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Showing {detail.length.toLocaleString()} of {detailTotal.toLocaleString()} records — narrow your date range to see the rest.
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <SortButtonRow
          options={[
            ['employee', 'Employee'],
            ['date', 'Date'],
            ['checkIn', 'Check In'],
            ['checkOut', 'Check Out'],
            ['status', 'Status'],
            ['breakCount', 'Breaks'],
            ['breakMinutes', 'Break Time'],
          ] as const}
          activeKey={detailSortKey}
          direction={detailSortDirection}
          onSort={toggleDetailSort}
        />
        <RecordList
          loading={isLoading}
          isEmpty={!isLoading && sortedDetail.length === 0}
          emptyIcon={Coffee}
          emptyTitle="No attendance detail for this range"
        >
          {sortedDetail.map((row, index) => (
            <RecordCard
              key={`${row.employee_id}-${row.date}-${index}`}
              avatar={<User className="h-4 w-4" />}
              avatarColorClass="from-indigo-600 to-purple-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{row.employee_name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{row.department_name || row.branch_name || '—'}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    row.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                    row.status === 'Absent' ? 'bg-red-100 text-red-800' :
                    row.status === 'Late' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {row.status}
                  </span>
                </>
              }
              stats={[
                { label: 'Date', value: new Date(row.date).toLocaleDateString() },
                { label: 'Check In', value: row.check_in || '—' },
                { label: 'Check Out', value: row.check_out || '—' },
                { label: 'Breaks Taken', value: row.break_count },
                { label: 'Total Break Time', value: row.total_break_minutes > 0 ? `${row.total_break_minutes} min` : '—' },
              ]}
            />
          ))}
        </RecordList>
      </div>
    </div>
  );
}
