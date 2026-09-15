'use client';

import { useEffect, useState } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { Trash2, Plus, RefreshCw, CalendarDays } from 'lucide-react';

interface Holiday {
  holiday_id: string;
  holiday_date: string;
  name: string;
  branch_id: number | null;
  branchName: string | null;
}

interface Branch {
  id: number;
  name: string;
  branch: string;
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const { sorted: sortedHolidays, sortKey: holidaySortKey, sortDirection: holidaySortDirection, toggleSort: toggleHolidaySort } = useSortableData(
    holidays,
    {
      date: (h) => h.holiday_date,
      name: (h) => h.name,
      scope: (h) => h.branchName || 'Company-wide',
    },
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ holiday_date: '', name: '', branch_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/hr/holidays');
      const json = await res.json();
      if (res.ok) setHolidays(json.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetch('/api/branches').then((res) => res.json()).then((json) => setBranches(json.branches || [])).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!form.holiday_date || !form.name.trim()) {
      setMessage({ type: 'error', text: 'Date and name are required' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/hr/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holiday_date: form.holiday_date, name: form.name.trim(), branch_id: form.branch_id || null }),
      });
      const json = await res.json();
      if (res.ok) {
        setForm({ holiday_date: '', name: '', branch_id: '' });
        await load();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to add holiday' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/hr/holidays/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Holiday List</h1>
        <p className="mt-1 text-sm text-slate-500">
          Public holidays per branch/region. Holidays inside a leave request&apos;s date range are
          automatically excluded from the day count. Leave the branch blank to apply company-wide.
        </p>
      </div>

      {message && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message.text}</div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Add Holiday</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">Date</label>
            <input type="date" value={form.holiday_date} onChange={(e) => setForm((f) => ({ ...f, holiday_date: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. National Day"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Branch (blank = all)</label>
            <select value={form.branch_id} onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Company-wide</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.branch}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleAdd} disabled={isSubmitting}
          className="mt-4 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" /> {isSubmitting ? 'Adding…' : 'Add Holiday'}
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : (
          <>
            <SortButtonRow
              options={[
                ['date', 'Date'],
                ['name', 'Name'],
                ['scope', 'Scope'],
              ] as const}
              activeKey={holidaySortKey}
              direction={holidaySortDirection}
              onSort={toggleHolidaySort}
            />
            <RecordList isEmpty={holidays.length === 0} emptyIcon={CalendarDays} emptyTitle="No holidays configured yet">
              {sortedHolidays.map((h) => (
                <RecordCard
                  key={h.holiday_id}
                  avatar={<CalendarDays className="h-4 w-4" />}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{h.name}</span>}
                  titleBadges={<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{h.branchName || 'Company-wide'}</span>}
                  stats={[
                    { label: 'Date', value: new Date(h.holiday_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  ]}
                  actions={[
                    { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(h.holiday_id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' },
                  ]}
                />
              ))}
            </RecordList>
          </>
        )}
      </div>
    </div>
  );
}
