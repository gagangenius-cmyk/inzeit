'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Route, Shuffle, Target, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type AssignmentMode = 'round_robin' | 'specific_employee';

interface AssignmentRule {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  branchIds: number[];
  sourceIds: number[];
  priorities: string[];
  leadQualities: string[];
  countryInterestIds: number[];
  serviceInterestIds: number[];
  assignmentMode: AssignmentMode;
  employeeIds: number[];
}

interface RefBranch { id: number; name: string; abbrv: string | null }
interface RefSource { id: number; name: string }
interface RefEmployee { id: number; name: string; branch: number | null; branchName: string | null }

const emptyForm = (sortOrder: number): Omit<AssignmentRule, 'id'> => ({
  name: '',
  description: '',
  isActive: true,
  sortOrder,
  branchIds: [],
  sourceIds: [],
  priorities: [],
  leadQualities: [],
  countryInterestIds: [],
  serviceInterestIds: [],
  assignmentMode: 'round_robin',
  employeeIds: [],
});

function csvToList(value: string): string[] {
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

export default function AssignmentRulesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('transfers.manage') || hasPermission('all');

  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [branches, setBranches] = useState<RefBranch[]>([]);
  const [sources, setSources] = useState<RefSource[]>([]);
  const [employees, setEmployees] = useState<RefEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Omit<AssignmentRule, 'id'> & { id?: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState({ branchId: 0, sourceId: 0, priority: '', leadQuality: '' });
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);

  const employeeName = (id: number) => employees.find((e) => e.id === id)?.name || `#${id}`;
  const branchName = (id: number) => branches.find((b) => b.id === id)?.name || `#${id}`;
  const sourceName = (id: number) => sources.find((s) => s.id === id)?.name || `#${id}`;

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [rulesRes, refRes] = await Promise.all([
        fetch('/api/assignment-rules'),
        fetch('/api/assignment-rules/reference-data'),
      ]);
      const rulesJson = await rulesRes.json();
      const refJson = await refRes.json();
      if (!rulesRes.ok || !rulesJson.success) throw new Error(rulesJson.error || 'Failed to load assignment rules');
      if (!refRes.ok || !refJson.success) throw new Error(refJson.error || 'Failed to load reference data');
      setRules(rulesJson.rules || []);
      setBranches(refJson.branches || []);
      setSources(refJson.sources || []);
      setEmployees(refJson.employees || []);
      if (!preview.branchId && refJson.branches?.[0]) {
        setPreview((p) => ({ ...p, branchId: refJson.branches[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment rules');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rules.length) return;
    const reordered = [...rules];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setRules(reordered);
    await fetch('/api/assignment-rules/reorder', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reordered.map((r) => r.id) }),
    });
  };

  const toggleActive = async (rule: AssignmentRule) => {
    setRules((current) => current.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)));
    await fetch(`/api/assignment-rules/${rule.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
  };

  const remove = async (rule: AssignmentRule) => {
    if (!confirm(`Delete assignment rule "${rule.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/assignment-rules/${rule.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete rule');
      setNotice(`Deleted "${rule.name}"`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true); setError('');
    try {
      const payload = { ...editing };
      const isNew = editing.id === undefined;
      const res = await fetch(isNew ? '/api/assignment-rules' : `/api/assignment-rules/${editing.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save rule');
      setNotice(isNew ? 'Assignment rule created' : 'Assignment rule updated');
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally { setSaving(false); }
  };

  const runPreview = async () => {
    setPreviewing(true); setPreviewResult(null); setError('');
    try {
      const res = await fetch('/api/assignment-rules/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: preview.branchId,
          sourceId: preview.sourceId || null,
          priority: preview.priority || null,
          leadQuality: preview.leadQuality || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Preview failed');
      setPreviewResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally { setPreviewing(false); }
  };

  const toggleId = (list: number[], id: number) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]);

  if (!canManage) {
    return (
      <main className="min-h-[60vh] p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--dmc-border)] bg-white p-8 text-center shadow-sm">
          <p className="text-[var(--dmc-ink)]">You don&apos;t have permission to manage lead assignment rules.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] bg-[var(--dmc-green-softer)] p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--dmc-ink)]">
              <Route className="h-6 w-6 text-[var(--dmc-green)]" /> Lead Assignment Rules
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--dmc-muted)]">
              Ordered routing rules (source, priority, quality, branch) that decide who a new lead goes to,
              evaluated top to bottom - the first active rule that matches wins. A lead that matches no rule
              (or whose rule&apos;s queue is empty right now) falls back to the branch&apos;s own round robin.
            </p>
          </div>
          <button
            onClick={() => setEditing(emptyForm(rules.length))}
            className="flex items-center gap-2 rounded-full bg-[var(--dmc-green)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--dmc-green-dark)]"
          >
            <Plus className="h-4 w-4" /> New Rule
          </button>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}

        <section className="rounded-2xl border border-[var(--dmc-border)] bg-white shadow-sm">
          {loading ? (
            <p className="p-6 text-sm text-[var(--dmc-muted)]">Loading rules…</p>
          ) : rules.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--dmc-muted)]">
              No assignment rules yet. Every new lead currently falls straight to the branch&apos;s round robin.
              Create a rule to route by source, priority, or lead quality first.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--dmc-border)]">
              {rules.map((rule, index) => (
                <li key={rule.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-1 text-[var(--dmc-muted)] hover:bg-[var(--dmc-green-soft)] disabled:opacity-30">
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-semibold text-[var(--dmc-muted)]">{index + 1}</span>
                      <button disabled={index === rules.length - 1} onClick={() => move(index, 1)} className="rounded p-1 text-[var(--dmc-muted)] hover:bg-[var(--dmc-green-soft)] disabled:opacity-30">
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[var(--dmc-ink)]">{rule.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-[var(--dmc-green-soft)] px-2 py-0.5 text-xs font-medium text-[var(--dmc-green-dark)]">
                          {rule.assignmentMode === 'round_robin' ? <Shuffle className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                          {rule.assignmentMode === 'round_robin' ? 'Round robin' : 'Specific owner'}
                        </span>
                      </div>
                      {rule.description && <p className="mt-1 text-sm text-[var(--dmc-muted)]">{rule.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        {rule.branchIds.map((id) => <span key={`b${id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Branch: {branchName(id)}</span>)}
                        {rule.sourceIds.map((id) => <span key={`s${id}`} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Source: {sourceName(id)}</span>)}
                        {rule.priorities.map((p) => <span key={`p${p}`} className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Priority: {p}</span>)}
                        {rule.leadQualities.map((q) => <span key={`q${q}`} className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">Quality: {q}</span>)}
                        {rule.branchIds.length + rule.sourceIds.length + rule.priorities.length + rule.leadQualities.length === 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">Matches every lead</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--dmc-muted)]">
                        <Users className="h-3.5 w-3.5" /> {rule.employeeIds.map(employeeName).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    <label className="flex items-center gap-1.5 text-xs text-[var(--dmc-muted)]">
                      <input type="checkbox" checked={rule.isActive} onChange={() => toggleActive(rule)} /> Active
                    </label>
                    <button onClick={() => setEditing(rule)} className="rounded-full border border-[var(--dmc-border)] px-3 py-1.5 text-xs font-medium text-[var(--dmc-ink)] hover:bg-[var(--dmc-green-soft)]">Edit</button>
                    <button onClick={() => remove(rule)} className="rounded-full border border-red-200 p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--dmc-border)] bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-[var(--dmc-ink)]">Test a lead</h2>
          <p className="mb-4 text-sm text-[var(--dmc-muted)]">See which rule would fire (and who would receive it) for a hypothetical lead, without consuming a round-robin turn.</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-[var(--dmc-muted)]">
              Branch
              <select className="mt-1 block rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={preview.branchId} onChange={(e) => setPreview((p) => ({ ...p, branchId: Number(e.target.value) }))}>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-[var(--dmc-muted)]">
              Source
              <select className="mt-1 block rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={preview.sourceId} onChange={(e) => setPreview((p) => ({ ...p, sourceId: Number(e.target.value) }))}>
                <option value={0}>Any</option>
                {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-[var(--dmc-muted)]">
              Priority
              <input className="mt-1 block w-32 rounded-lg border border-[var(--dmc-border)] p-2 text-sm" placeholder="e.g. P1" value={preview.priority} onChange={(e) => setPreview((p) => ({ ...p, priority: e.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--dmc-muted)]">
              Lead quality
              <input className="mt-1 block w-32 rounded-lg border border-[var(--dmc-border)] p-2 text-sm" placeholder="e.g. Hot" value={preview.leadQuality} onChange={(e) => setPreview((p) => ({ ...p, leadQuality: e.target.value }))} />
            </label>
            <button onClick={runPreview} disabled={previewing || !preview.branchId} className="rounded-full bg-[var(--dmc-gold)] px-4 py-2 text-sm font-semibold text-[var(--dmc-ink)] shadow-sm disabled:opacity-50">
              {previewing ? 'Testing…' : 'Preview'}
            </button>
          </div>
          {previewResult && (
            <div className="mt-4 rounded-xl border border-[var(--dmc-border)] bg-[var(--dmc-green-softer)] p-4 text-sm">
              <p><strong>Matched rule:</strong> {previewResult.matchedRule?.name || 'None - falls back to branch round robin'}</p>
              <p><strong>Would be assigned to:</strong> {employeeName(previewResult.assignment.assignedEmployeeId)} (candidate pool: {previewResult.assignment.candidateCount})</p>
              <p className="text-xs text-[var(--dmc-muted)]">Strategy: {previewResult.assignment.strategy}</p>
            </div>
          )}
        </section>
      </div>

      {editing && (
        <RuleEditorModal
          editing={editing}
          setEditing={setEditing}
          branches={branches}
          sources={sources}
          employees={employees}
          toggleId={toggleId}
          onSave={save}
          saving={saving}
        />
      )}
    </main>
  );
}

function RuleEditorModal({
  editing, setEditing, branches, sources, employees, toggleId, onSave, saving,
}: {
  editing: Omit<AssignmentRule, 'id'> & { id?: number };
  setEditing: (v: (Omit<AssignmentRule, 'id'> & { id?: number }) | null) => void;
  branches: RefBranch[];
  sources: RefSource[];
  employees: RefEmployee[];
  toggleId: (list: number[], id: number) => number[];
  onSave: () => void;
  saving: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, RefEmployee[]>();
    employees.forEach((e) => {
      const key = e.branchName || 'Unassigned branch';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [employees]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--dmc-ink)]">{editing.id ? 'Edit assignment rule' : 'New assignment rule'}</h2>
          <button onClick={() => setEditing(null)} className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-[var(--dmc-ink)]">
            Rule name
            <input className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Meta leads to Digital team" />
          </label>
          <label className="block text-sm font-medium text-[var(--dmc-ink)]">
            Description (optional)
            <textarea className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </label>

          <div>
            <p className="mb-1 text-sm font-medium text-[var(--dmc-ink)]">Conditions (leave a group empty to match any)</p>
            <p className="mb-2 text-xs text-[var(--dmc-muted)]">Branch</p>
            <div className="flex flex-wrap gap-2">
              {branches.map((b) => (
                <label key={b.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${editing.branchIds.includes(b.id) ? 'border-[var(--dmc-green)] bg-[var(--dmc-green-soft)] text-[var(--dmc-green-dark)]' : 'border-[var(--dmc-border)] text-[var(--dmc-muted)]'}`}>
                  <input type="checkbox" className="hidden" checked={editing.branchIds.includes(b.id)} onChange={() => setEditing({ ...editing, branchIds: toggleId(editing.branchIds, b.id) })} />
                  {b.name}
                </label>
              ))}
            </div>
            <p className="mb-2 mt-3 text-xs text-[var(--dmc-muted)]">Source</p>
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {sources.map((s) => (
                <label key={s.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${editing.sourceIds.includes(s.id) ? 'border-[var(--dmc-green)] bg-[var(--dmc-green-soft)] text-[var(--dmc-green-dark)]' : 'border-[var(--dmc-border)] text-[var(--dmc-muted)]'}`}>
                  <input type="checkbox" className="hidden" checked={editing.sourceIds.includes(s.id)} onChange={() => setEditing({ ...editing, sourceIds: toggleId(editing.sourceIds, s.id) })} />
                  {s.name}
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium text-[var(--dmc-muted)]">
                Priority (comma-separated, e.g. P1,P2)
                <input className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={editing.priorities.join(', ')} onChange={(e) => setEditing({ ...editing, priorities: csvToList(e.target.value) })} />
              </label>
              <label className="block text-xs font-medium text-[var(--dmc-muted)]">
                Lead quality (comma-separated, e.g. Hot,Warm)
                <input className="mt-1 w-full rounded-lg border border-[var(--dmc-border)] p-2 text-sm" value={editing.leadQualities.join(', ')} onChange={(e) => setEditing({ ...editing, leadQualities: csvToList(e.target.value) })} />
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--dmc-ink)]">Assignment</p>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={editing.assignmentMode === 'round_robin'} onChange={() => setEditing({ ...editing, assignmentMode: 'round_robin' })} /> Round robin across a queue
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={editing.assignmentMode === 'specific_employee'} onChange={() => setEditing({ ...editing, assignmentMode: 'specific_employee', employeeIds: editing.employeeIds.slice(0, 1) })} /> Always to one person
              </label>
            </div>
            <div className="mt-3 max-h-48 space-y-3 overflow-y-auto rounded-lg border border-[var(--dmc-border)] p-3">
              {grouped.map(([branchLabel, list]) => (
                <div key={branchLabel}>
                  <p className="mb-1 text-xs font-semibold text-[var(--dmc-muted)]">{branchLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((emp) => {
                      const selected = editing.employeeIds.includes(emp.id);
                      return (
                        <label key={emp.id} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${selected ? 'border-[var(--dmc-green)] bg-[var(--dmc-green-soft)] text-[var(--dmc-green-dark)]' : 'border-[var(--dmc-border)] text-[var(--dmc-muted)]'}`}>
                          <input
                            type={editing.assignmentMode === 'specific_employee' ? 'radio' : 'checkbox'}
                            className="hidden"
                            checked={selected}
                            onChange={() => setEditing({
                              ...editing,
                              employeeIds: editing.assignmentMode === 'specific_employee' ? [emp.id] : toggleId(editing.employeeIds, emp.id),
                            })}
                          />
                          {emp.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setEditing(null)} className="rounded-full border border-[var(--dmc-border)] px-4 py-2 text-sm font-medium text-[var(--dmc-ink)]">Cancel</button>
          <button onClick={onSave} disabled={saving || !editing.name.trim() || editing.employeeIds.length === 0} className="rounded-full bg-[var(--dmc-green)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save rule'}
          </button>
        </div>
      </div>
    </div>
  );
}
