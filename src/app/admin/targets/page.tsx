'use client';

import { useEffect, useMemo, useState } from 'react';
import { Target, TrendingUp, Wallet, ChevronRight, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type TargetType = 'new_leads' | 'collection';

interface OrgEmployee {
  id: number;
  name: string;
  managerId: number | null;
  branch: number | null;
  roleId: number | null;
  roleName: string | null;
}

interface EmployeeTarget {
  id: number;
  employeeId: number;
  targetMonth: string;
  targetType: TargetType;
  meetingsTarget: number | null;
  appointmentsTarget: number | null;
  salesRevenueTarget: number | null;
  collectionTarget: number | null;
  notes: string | null;
}

interface TargetProgress {
  meetingsActual: number;
  appointmentsActual: number;
  salesRevenueActual: number;
  collectionActual: number;
}

const thisMonth = () => new Date().toISOString().slice(0, 7);

function ProgressBar({ actual, target, label }: { actual: number; target: number | null; label: string }) {
  if (target === null || target === 0) return null;
  const pct = Math.min(100, Math.round((actual / target) * 100));
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-[var(--dmc-muted)]">
        <span>{label}</span>
        <span>{actual.toLocaleString()} / {target.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[var(--dmc-green)] to-[var(--dmc-gold)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TargetsPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [targets, setTargets] = useState<EmployeeTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Cascading drill-down path: an array of selected employee ids, root to leaf.
  const [path, setPath] = useState<number[]>([]);
  const [month, setMonth] = useState(thisMonth());
  const [targetType, setTargetType] = useState<TargetType>('new_leads');
  const [form, setForm] = useState({ meetings: '', appointments: '', salesRevenue: '', collection: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<TargetProgress | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [hierarchyRes, targetsRes] = await Promise.all([
        fetch('/api/targets/hierarchy'),
        fetch(`/api/targets?month=${month}`),
      ]);
      const hierarchyJson = await hierarchyRes.json();
      const targetsJson = await targetsRes.json();
      if (!hierarchyRes.ok || !hierarchyJson.success) throw new Error(hierarchyJson.error || 'Failed to load org hierarchy');
      if (!targetsRes.ok || !targetsJson.success) throw new Error(targetsJson.error || 'Failed to load targets');
      setEmployees(hierarchyJson.employees || []);
      setTargets(targetsJson.targets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [month]);

  const topLevel = useMemo(() => employees.filter((e) => e.managerId === null), [employees]);
  const childrenOf = (id: number) => employees.filter((e) => e.managerId === id);

  const selectedEmployee = path.length > 0 ? employees.find((e) => e.id === path[path.length - 1]) : null;
  const isLeaf = selectedEmployee ? childrenOf(selectedEmployee.id).length === 0 : false;

  const existingTarget = selectedEmployee
    ? targets.find((t) => t.employeeId === selectedEmployee.id && t.targetType === targetType)
    : undefined;

  useEffect(() => {
    setForm({
      meetings: existingTarget?.meetingsTarget?.toString() || '',
      appointments: existingTarget?.appointmentsTarget?.toString() || '',
      salesRevenue: existingTarget?.salesRevenueTarget?.toString() || '',
      collection: existingTarget?.collectionTarget?.toString() || '',
      notes: existingTarget?.notes || '',
    });
  }, [existingTarget?.id, targetType, selectedEmployee?.id]);

  useEffect(() => {
    if (!selectedEmployee) { setProgress(null); return; }
    fetch(`/api/targets/progress?employeeId=${selectedEmployee.id}&month=${month}`)
      .then((r) => r.json())
      .then((j) => setProgress(j.success ? j.progress : null))
      .catch(() => setProgress(null));
  }, [selectedEmployee?.id, month]);

  const pickAt = (level: number, id: number) => {
    setPath((current) => [...current.slice(0, level), id]);
  };

  const save = async () => {
    if (!selectedEmployee) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/targets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          targetMonth: month,
          targetType,
          meetingsTarget: targetType === 'new_leads' && form.meetings ? Number(form.meetings) : null,
          appointmentsTarget: targetType === 'new_leads' && form.appointments ? Number(form.appointments) : null,
          salesRevenueTarget: targetType === 'new_leads' && form.salesRevenue ? Number(form.salesRevenue) : null,
          collectionTarget: targetType === 'collection' && form.collection ? Number(form.collection) : null,
          notes: form.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save target');
      setNotice(`Target saved for ${selectedEmployee.name}`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save target');
    } finally { setSaving(false); }
  };

  const removeTarget = async (id: number) => {
    if (!confirm('Delete this target?')) return;
    try {
      const res = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete target');
    }
  };

  const levels: OrgEmployee[][] = [topLevel];
  for (let i = 0; i < path.length; i += 1) {
    const kids = childrenOf(path[i]);
    if (kids.length > 0) levels.push(kids);
  }

  return (
    <main className="min-h-[60vh] bg-[var(--dmc-green-softer)] p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--dmc-ink)]">
              <Target className="h-6 w-6 text-[var(--dmc-green)]" /> Monthly Targets
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--dmc-muted)]">
              Pick a manager, drill into their team, and set a monthly target for meetings, appointments,
              and sales revenue - or switch to a balance recovery / collection target instead.
            </p>
          </div>
          <label className="text-sm font-medium text-[var(--dmc-ink)]">
            Month
            <input type="month" className="ml-2 rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={month} onChange={(e) => { setMonth(e.target.value); setPath([]); }} />
          </label>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}

        <section className="rounded-2xl border border-[var(--dmc-border)] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-[var(--dmc-ink)]">Select who this target is for</h2>
          {loading ? <p className="text-sm text-[var(--dmc-muted)]">Loading org chart…</p> : (
            <div className="space-y-3">
              {levels.map((level, levelIndex) => (
                <div key={levelIndex} className="flex flex-wrap items-center gap-2">
                  {levelIndex > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--dmc-muted)]" />}
                  {level.map((emp) => {
                    const selected = path[levelIndex] === emp.id;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => pickAt(levelIndex, emp.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selected ? 'border-[var(--dmc-green)] bg-[var(--dmc-green)] text-white' : 'border-[var(--dmc-border)] text-[var(--dmc-ink)] hover:bg-[var(--dmc-green-soft)]'}`}
                      >
                        {emp.name} <span className="opacity-70">· {emp.roleName}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              {levels.length === 0 && <p className="text-sm text-[var(--dmc-muted)]">No active employees found.</p>}
            </div>
          )}
        </section>

        {selectedEmployee && (
          <section className="rounded-2xl border border-[var(--dmc-border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-[var(--dmc-ink)]">
                Target for {selectedEmployee.name} <span className="text-sm font-normal text-[var(--dmc-muted)]">({selectedEmployee.roleName})</span>
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setTargetType('new_leads')} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${targetType === 'new_leads' ? 'bg-[var(--dmc-green)] text-white' : 'bg-slate-100 text-[var(--dmc-ink)]'}`}>
                  <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> New Leads
                </button>
                <button onClick={() => setTargetType('collection')} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${targetType === 'collection' ? 'bg-[var(--dmc-green)] text-white' : 'bg-slate-100 text-[var(--dmc-ink)]'}`}>
                  <Wallet className="mr-1 inline h-3.5 w-3.5" /> Balance Recovery / Collection
                </button>
              </div>
            </div>

            {!isLeaf && (
              <p className="mb-4 rounded-lg bg-[var(--dmc-green-soft)] p-3 text-xs text-[var(--dmc-green-dark)]">
                {selectedEmployee.name} has their own team - you can still set a target directly for them, or pick one of their reports above.
              </p>
            )}

            {targetType === 'new_leads' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="block text-xs font-medium text-[var(--dmc-muted)]">
                  Meetings target (this month)
                  <input type="number" min="0" className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={form.meetings} onChange={(e) => setForm({ ...form, meetings: e.target.value })} />
                  {progress && <ProgressBar actual={progress.meetingsActual} target={form.meetings ? Number(form.meetings) : null} label="Achieved so far" />}
                </label>
                <label className="block text-xs font-medium text-[var(--dmc-muted)]">
                  Appointments target (this month)
                  <input type="number" min="0" className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={form.appointments} onChange={(e) => setForm({ ...form, appointments: e.target.value })} />
                  {progress && <ProgressBar actual={progress.appointmentsActual} target={form.appointments ? Number(form.appointments) : null} label="Achieved so far" />}
                </label>
                <label className="block text-xs font-medium text-[var(--dmc-muted)]">
                  Sales revenue target (this month)
                  <input type="number" min="0" className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={form.salesRevenue} onChange={(e) => setForm({ ...form, salesRevenue: e.target.value })} />
                  {progress && <ProgressBar actual={progress.salesRevenueActual} target={form.salesRevenue ? Number(form.salesRevenue) : null} label="Achieved so far" />}
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="block text-xs font-medium text-[var(--dmc-muted)] sm:col-span-1">
                  Collection target (this month)
                  <input type="number" min="0" className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} />
                  {progress && <ProgressBar actual={progress.collectionActual} target={form.collection ? Number(form.collection) : null} label="Collected so far" />}
                </label>
              </div>
            )}

            <label className="mt-4 block text-xs font-medium text-[var(--dmc-muted)]">
              Notes (optional)
              <textarea className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={save} disabled={saving} className="rounded-full bg-[var(--dmc-green)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving…' : existingTarget ? 'Update target' : 'Save target'}
              </button>
              {existingTarget && (
                <button onClick={() => removeTarget(existingTarget.id)} className="flex items-center gap-1 rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[var(--dmc-border)] bg-white shadow-sm">
          <h2 className="border-b border-[var(--dmc-border)] p-4 font-semibold text-[var(--dmc-ink)]">All targets for {month}</h2>
          {targets.length === 0 ? (
            <p className="p-6 text-sm text-[var(--dmc-muted)]">No targets set for this month yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--dmc-border)]">
              {targets.map((t) => {
                const emp = employees.find((e) => e.id === t.employeeId);
                return (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                    <div>
                      <span className="font-medium text-[var(--dmc-ink)]">{emp?.name || `Employee #${t.employeeId}`}</span>
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t.targetType === 'new_leads' ? 'New Leads' : 'Collection'}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--dmc-muted)]">
                      {t.meetingsTarget !== null && <span>Meetings: {t.meetingsTarget}</span>}
                      {t.appointmentsTarget !== null && <span>Appointments: {t.appointmentsTarget}</span>}
                      {t.salesRevenueTarget !== null && <span>Revenue: {t.salesRevenueTarget.toLocaleString()}</span>}
                      {t.collectionTarget !== null && <span>Collection: {t.collectionTarget.toLocaleString()}</span>}
                    </div>
                    <button onClick={() => removeTarget(t.id)} className="rounded-full p-1.5 text-red-500 hover:bg-red-50"><X className="h-3.5 w-3.5" /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
