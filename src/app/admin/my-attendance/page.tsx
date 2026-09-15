'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { Clock, Coffee, RefreshCw, LogIn, LogOut } from 'lucide-react';

interface AttendanceRow {
  attendance_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  overtime_hours?: number;
}

interface BreakRow {
  break_id: string;
  break_type: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
}

const breakTypes = ['Lunch Break', 'Prayer Break', 'Short Break'] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatClock = (hours: number, minutes: number) => {
  const date = new Date(1970, 0, 1, hours, minutes);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const storedClock = (value: string | null) => {
  if (!value) return null;
  const match = String(value).match(/(?:T|\s|^)(\d{2}):(\d{2})(?::\d{2})?/);
  if (!match) return null;
  return formatClock(Number(match[1]), Number(match[2]));
};

const displayTime = (value: string | null) => {
  if (!value) return '-';
  const stored = storedClock(value);
  if (stored) return stored;
  const text = String(value);
  const date = text.includes('T') || text.includes(' ')
    ? new Date(text)
    : new Date(`1970-01-01T${text}`);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const displayDateTime = (value: string | null) => {
  if (!value) return '-';
  const stored = storedClock(value);
  if (stored) return stored;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const timeToMs = (date: string, value: string | null) => {
  if (!value) return null;
  const text = String(value);
  const dateTimeMatch = text.match(/(\d{4})-(\d{2})-(\d{2}).*?(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dateTimeMatch) {
    return new Date(
      Number(dateTimeMatch[1]),
      Number(dateTimeMatch[2]) - 1,
      Number(dateTimeMatch[3]),
      Number(dateTimeMatch[4]),
      Number(dateTimeMatch[5]),
      Number(dateTimeMatch[6] || 0),
    ).getTime();
  }
  const parsed = text.includes('T') || text.includes(' ')
    ? new Date(text)
    : new Date(`${date}T${text}`);
  const ms = parsed.getTime();
  return Number.isNaN(ms) ? null : ms;
};

const minutesLabel = (minutes: number | null) => {
  if (minutes == null) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${String(mins).padStart(2, '0')}m` : `${mins}m`;
};

export default function MyAttendancePage() {
  const [today, setToday] = useState<AttendanceRow | null>(null);
  const [breaks, setBreaks] = useState<BreakRow[]>([]);
  const [history, setHistory] = useState<AttendanceRow[]>([]);
  const { sorted: sortedHistory, sortKey: historySortKey, sortDirection: historySortDirection, toggleSort: toggleHistorySort } = useSortableData(
    history,
    {
      date: (row) => row.date,
      in: (row) => row.check_in,
      out: (row) => row.check_out,
      status: (row) => row.status,
    },
  );
  const [breakType, setBreakType] = useState<typeof breakTypes[number]>('Lunch Break');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hr/self/attendance?limit=14');
      const json = await res.json();
      if (res.ok) {
        setToday(json.today || null);
        setBreaks(json.breaks || []);
        setHistory(json.history || []);
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to load attendance' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load attendance' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeBreak = useMemo(() => breaks.find((entry) => !entry.end_time) || null, [breaks]);
  const isClockedIn = Boolean(today?.check_in && !today?.check_out);

  const elapsedLabel = useMemo(() => {
    if (!today?.check_in) return '00:00:00';
    const startMs = timeToMs(today.date, today.check_in);
    const endMs = today.check_out ? timeToMs(today.date, today.check_out) : now;
    if (!startMs || !endMs) return '00:00:00';
    const totalSeconds = Math.floor(Math.max(endMs - startMs, 0) / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }, [today, now]);

  const hoursToday = useMemo(() => {
    if (!today?.check_in) return '0h 00m';
    const startMs = timeToMs(today.date, today.check_in);
    const endMs = today.check_out ? timeToMs(today.date, today.check_out) : now;
    if (!startMs || !endMs) return '0h 00m';
    const breakMs = breaks.reduce((sum, entry) => sum + (entry.duration_minutes || 0) * 60 * 1000, 0);
    const netMs = Math.max(endMs - startMs - breakMs, 0);
    const totalMinutes = Math.floor(netMs / 60000);
    return `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, '0')}m`;
  }, [today, breaks, now]);

  const runAction = async (body: Record<string, unknown>) => {
    setIsBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/hr/self/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        setToday(json.attendance ?? json.today ?? null);
        setBreaks(json.breaks || []);
        await load();
      } else {
        setMessage({ type: 'error', text: json.error || 'Action failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Action failed' });
    } finally {
      setIsBusy(false);
    }
  };

  const breakDurationLabel = (entry: BreakRow) => {
    if (entry.duration_minutes != null) return minutesLabel(entry.duration_minutes);
    const startMs = timeToMs(today?.date || new Date().toISOString().slice(0, 10), entry.start_time);
    if (!startMs) return 'in progress';
    const totalMinutes = Math.max(Math.floor((now - startMs) / 60000), 0);
    return `${minutesLabel(totalMinutes)} active`;
  };

  const statusLabel = activeBreak
    ? `On ${activeBreak.break_type}`
    : isClockedIn
      ? 'Clocked In'
      : today?.check_out
        ? 'Clocked Out'
        : 'Not Clocked In';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading attendance…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance &amp; Breaks</h1>
        <p className="mt-1 text-sm text-slate-500">Clock in, take your breaks, and manage your workday.</p>
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Today&apos;s Status</p>
          <p className="mt-1 text-lg font-semibold text-blue-600">{statusLabel}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clock In</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{displayTime(today?.check_in || null)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clock Out</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{displayTime(today?.check_out || null)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hours Today</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{hoursToday}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Breaks Taken</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{breaks.filter((entry) => entry.end_time).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Clock In / Clock Out</h2>
          <p className="mt-1 text-xs text-slate-500">Start and end your workday. Your timer runs live while you&apos;re clocked in.</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="font-mono text-3xl font-bold text-slate-900">{elapsedLabel}</span>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>In: <strong className="text-slate-700">{displayTime(today?.check_in || null)}</strong></span>
                <span>Out: <strong className="text-slate-700">{displayTime(today?.check_out || null)}</strong></span>
              </div>
            </div>
            {isClockedIn ? (
              <button
                onClick={() => runAction({ action: 'clock-out' })}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" /> Clock Out
              </button>
            ) : (
              <button
                onClick={() => runAction({ action: 'clock-in' })}
                disabled={isBusy || Boolean(today?.check_out)}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" /> Clock In
              </button>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Breaks</h3>
            <p className="mt-1 text-xs text-slate-500">Log lunch, prayer, or short breaks. These pause your working time, not your clock-in record.</p>
            <div className="mt-3 flex items-center gap-2">
              <select
                value={breakType}
                onChange={(e) => setBreakType(e.target.value as typeof breakTypes[number])}
                disabled={Boolean(activeBreak)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {breakTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              {activeBreak ? (
                <button
                  onClick={() => runAction({ action: 'break-end' })}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <Coffee className="h-4 w-4" /> End Break
                </button>
              ) : (
                <button
                  onClick={() => runAction({ action: 'break-start', break_type: breakType })}
                  disabled={isBusy || !isClockedIn}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  <Coffee className="h-4 w-4" /> Start Break
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Today&apos;s Break Log</h3>
            <div className="mt-2">
              <RecordList isEmpty={breaks.length === 0} emptyTitle="No breaks logged yet today.">
                {breaks.map((entry) => (
                  <RecordCard
                    key={entry.break_id}
                    avatar={<Coffee className="h-4 w-4" />}
                    avatarColorClass="from-amber-600 to-yellow-400"
                    title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{entry.break_type}</span>}
                    stats={[
                      { label: 'Start', value: displayDateTime(entry.start_time) },
                      { label: 'End', value: entry.end_time ? displayDateTime(entry.end_time) : 'in progress' },
                      { label: 'Duration', value: breakDurationLabel(entry) },
                    ]}
                  />
                ))}
              </RecordList>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Clock className="h-4 w-4 text-slate-400" /> Attendance History
          </h2>
          <p className="mt-1 text-xs text-slate-500">Your last several days — clock-in time, clock-out time, and total hours.</p>
          <div className="mt-3">
            <SortButtonRow
              options={[
                ['date', 'Date'],
                ['in', 'In'],
                ['out', 'Out'],
                ['status', 'Status'],
              ] as const}
              activeKey={historySortKey}
              direction={historySortDirection}
              onSort={toggleHistorySort}
            />
            <RecordList isEmpty={sortedHistory.length === 0} emptyTitle="No attendance records yet.">
              {sortedHistory.map((row) => (
                <RecordCard
                  key={row.attendance_id}
                  avatar={<Clock className="h-4 w-4" />}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{row.date}</span>}
                  titleBadges={<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{row.status}</span>}
                  stats={[
                    { label: 'In', value: displayTime(row.check_in) },
                    { label: 'Out', value: displayTime(row.check_out) },
                  ]}
                />
              ))}
            </RecordList>
          </div>
        </div>
      </div>
    </div>
  );
}
