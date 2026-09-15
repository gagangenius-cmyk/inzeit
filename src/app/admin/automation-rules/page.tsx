'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Play, Zap } from 'lucide-react';

interface TriggerFieldDef { key: string; label: string; type: string; default: number; min?: number }
interface TriggerDef { id: string; label: string; description: string; entityType: string; configFields: TriggerFieldDef[] }
interface ActionDef { id: string; label: string; hasConfig: boolean }
interface AutomationAction { type: string; config?: { message?: string; priority?: string } }
interface AutomationRule {
  id: number;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions: Array<{ field: string; operator: string; value: string | number }>;
  actions: AutomationAction[];
  isActive: boolean;
  updatedAt: string;
}
interface RuleRun {
  id: number;
  ruleId: number;
  ruleName: string;
  entityType: string;
  entityId: number;
  status: 'matched' | 'failed';
  detail: string | null;
  executedAt: string;
}

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [triggerDefinitions, setTriggerDefinitions] = useState<TriggerDef[]>([]);
  const [actionDefinitions, setActionDefinitions] = useState<ActionDef[]>([]);
  const [runs, setRuns] = useState<RuleRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [runNowBusy, setRunNowBusy] = useState(false);
  const [runNowSummary, setRunNowSummary] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, runsRes] = await Promise.all([
        fetch('/api/admin/automation-rules'),
        fetch('/api/admin/automation-rules/runs?limit=25'),
      ]);
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules);
        setTriggerDefinitions(data.triggerDefinitions);
        setActionDefinitions(data.actionDefinitions);
      }
      if (runsRes.ok) {
        const data = await runsRes.json();
        setRuns(data.runs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (rule: AutomationRule) => {
    const res = await fetch(`/api/admin/automation-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    if (res.ok) load();
    else window.toast?.error('Failed to update rule status');
  };

  const deleteRule = async (rule: AutomationRule) => {
    if (!confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/automation-rules/${rule.id}`, { method: 'DELETE' });
    if (res.ok) load();
    else window.toast?.error('Failed to delete rule');
  };

  const runNow = async (dryRun: boolean, ruleId?: number) => {
    setRunNowBusy(true);
    setRunNowSummary(null);
    try {
      const res = await fetch('/api/admin/automation-rules/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, ruleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRunNowSummary(
          `Scanned ${data.scanned}, matched ${data.matched}${dryRun ? '' : `, executed ${data.executed}, skipped ${data.skipped}, failed ${data.failed}`}.`
        );
        if (!dryRun) load();
      } else {
        window.toast?.error(data.error || 'Run failed');
      }
    } finally {
      setRunNowBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--cmg-blue)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--cmg-ink)] flex items-center gap-2">
            <Zap className="w-7 h-7 text-[var(--dmc-gold)]" /> Automation Rules
          </h1>
          <p className="text-[var(--cmg-muted)] mt-2">
            Trigger-based rules that notify staff or create follow-ups automatically — no code change needed to add a new one.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => runNow(true)}
            disabled={runNowBusy}
            className="px-4 py-2 border border-[var(--cmg-border)] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Preview (dry run)
          </button>
          <button
            onClick={() => {
              setShowFormModal(true);
              setEditingRule(null);
            }}
            className="flex items-center gap-2 bg-[var(--cmg-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--cmg-blue-dark)] transition-colors"
          >
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </div>
      </div>

      {runNowSummary && (
        <div className="bg-[var(--cmg-blue-soft)] text-[var(--cmg-ink)] px-4 py-3 rounded-lg text-sm">{runNowSummary}</div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        {rules.length === 0 ? (
          <p className="text-[var(--cmg-muted)] text-sm py-8 text-center">No automation rules yet. Create one to get started.</p>
        ) : (
          <div className="divide-y divide-[var(--cmg-border)]">
            {rules.map((rule) => {
              const trigger = triggerDefinitions.find((t) => t.id === rule.triggerType);
              return (
                <div key={rule.id} className="py-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--cmg-ink)]">{rule.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--cmg-muted)] mt-1">{trigger?.label || rule.triggerType}</p>
                    {rule.description && <p className="text-sm text-[var(--cmg-muted)] mt-1">{rule.description}</p>}
                    <p className="text-xs text-[var(--cmg-muted)] mt-2">
                      Actions: {rule.actions.map((a) => actionDefinitions.find((d) => d.id === a.type)?.label || a.type).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => runNow(false, rule.id)} title="Run now" className="p-2 rounded-md hover:bg-gray-100 text-[var(--cmg-blue)]">
                      <Play className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(rule)} className="px-3 py-1.5 text-xs font-semibold border border-[var(--cmg-border)] rounded-md hover:bg-gray-50">
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => { setEditingRule(rule); setShowFormModal(true); }} className="p-2 rounded-md hover:bg-gray-100 text-[var(--cmg-blue)]">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRule(rule)} className="p-2 rounded-md hover:bg-red-50 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold text-[var(--cmg-ink)] mb-3">Recent Runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-[var(--cmg-muted)]">No runs logged yet — rules execute every 30 minutes, or use "Run now" above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--cmg-muted)] border-b border-[var(--cmg-border)]">
                  <th className="py-2 pr-4">Rule</th>
                  <th className="py-2 pr-4">Entity</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">When</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-[var(--cmg-border)] last:border-0">
                    <td className="py-2 pr-4">{run.ruleName}</td>
                    <td className="py-2 pr-4">{run.entityType} #{run.entityId}</td>
                    <td className="py-2 pr-4">
                      <span className={run.status === 'matched' ? 'text-green-700' : 'text-red-700'}>{run.status}</span>
                    </td>
                    <td className="py-2 pr-4 text-[var(--cmg-muted)]">{new Date(run.executedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showFormModal && (
        <RuleFormModal
          triggerDefinitions={triggerDefinitions}
          actionDefinitions={actionDefinitions}
          initialRule={editingRule}
          onClose={() => { setShowFormModal(false); setEditingRule(null); }}
          onSaved={() => { setShowFormModal(false); setEditingRule(null); load(); }}
        />
      )}
    </div>
  );
}

function RuleFormModal({
  triggerDefinitions,
  actionDefinitions,
  initialRule,
  onClose,
  onSaved,
}: {
  triggerDefinitions: TriggerDef[];
  actionDefinitions: ActionDef[];
  initialRule: AutomationRule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [triggerType, setTriggerType] = useState(initialRule?.triggerType || triggerDefinitions[0]?.id || '');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, number>>(
    (initialRule?.triggerConfig as Record<string, number>) || {}
  );
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set(initialRule?.actions.map((a) => a.type) || [])
  );
  const [followUpMessage, setFollowUpMessage] = useState(
    initialRule?.actions.find((a) => a.type === 'create_follow_up')?.config?.message || ''
  );
  const [isActive, setIsActive] = useState(initialRule?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const trigger = triggerDefinitions.find((t) => t.id === triggerType);

  const toggleAction = (id: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActions.size) {
      window.toast?.error('Select at least one action');
      return;
    }
    setSaving(true);
    try {
      const actions: AutomationAction[] = Array.from(selectedActions).map((type) =>
        type === 'create_follow_up' && followUpMessage
          ? { type, config: { message: followUpMessage } }
          : { type }
      );
      const payload = { name, description: description || null, triggerType, triggerConfig, conditions: [], actions, isActive };
      const res = await fetch(
        initialRule ? `/api/admin/automation-rules/${initialRule.id}` : '/api/admin/automation-rules',
        {
          method: initialRule ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        window.toast?.error(data.error || 'Failed to save rule');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-[var(--cmg-ink)] mb-4">{initialRule ? 'Edit Rule' : 'New Automation Rule'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--cmg-ink)]">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-[var(--cmg-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)]"
              placeholder="e.g. Escalate leads untouched for 3 days"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--cmg-ink)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-[var(--cmg-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--cmg-ink)]">Trigger *</label>
            <select
              required
              value={triggerType}
              onChange={(e) => { setTriggerType(e.target.value); setTriggerConfig({}); }}
              className="mt-1 block w-full px-3 py-2 border border-[var(--cmg-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)]"
            >
              {triggerDefinitions.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            {trigger && <p className="text-xs text-[var(--cmg-muted)] mt-1">{trigger.description}</p>}
          </div>
          {trigger?.configFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-[var(--cmg-ink)]">{field.label}</label>
              <input
                type="number"
                min={field.min}
                value={triggerConfig[field.key] ?? field.default}
                onChange={(e) => setTriggerConfig((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                className="mt-1 block w-32 px-3 py-2 border border-[var(--cmg-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)]"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-[var(--cmg-ink)] mb-2">Actions * (select at least one)</label>
            <div className="space-y-2">
              {actionDefinitions.map((action) => (
                <div key={action.id}>
                  <label className="flex items-center gap-2 text-sm text-[var(--cmg-ink)]">
                    <input type="checkbox" checked={selectedActions.has(action.id)} onChange={() => toggleAction(action.id)} />
                    {action.label}
                  </label>
                  {action.id === 'create_follow_up' && selectedActions.has('create_follow_up') && (
                    <input
                      value={followUpMessage}
                      onChange={(e) => setFollowUpMessage(e.target.value)}
                      placeholder="Follow-up message (optional — defaults to a standard message)"
                      className="mt-1 ml-6 block w-[calc(100%-1.5rem)] px-3 py-2 border border-[var(--cmg-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cmg-blue)]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--cmg-ink)]">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] disabled:opacity-50">
              {saving ? 'Saving...' : initialRule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
