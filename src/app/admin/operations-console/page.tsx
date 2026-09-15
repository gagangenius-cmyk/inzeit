'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, Ban, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import EmployeePicker, { type EmployeeResult } from '@/components/admin/EmployeePicker';

interface LeadSearchResult {
  id: string | number;
  title: string;
  subtitle?: string | null;
  type: string;
}

interface CaseRow {
  id: number;
  opportunityName: string;
  serviceType: string | null;
  operationsStatus: string;
  operationsStatusUpdatedAt: string | null;
  operationsStatusUpdatedByName: string | null;
}

const STATUS_OPTIONS = ['Active', 'Closed', 'Refund', 'On Hold', 'Visa Approved'] as const;

function LeadPicker({ onSelect }: { onSelect: (lead: { id: number; label: string }) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = await res.json();
        setResults((data.results || []).filter((r: LeadSearchResult) => r.type === 'Lead'));
      } catch { setResults([]); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search a lead by name, email or phone…"
          className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.length === 0 && <div className="px-4 py-2 text-sm text-slate-500">No leads found</div>}
          {results.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect({ id: Number(lead.id), label: lead.title || `Lead #${lead.id}` }); setQuery(''); setResults([]); setOpen(false); }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{lead.title}</span>
              {lead.subtitle && <span className="ml-2 text-xs text-slate-500">{lead.subtitle}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CaseTransferPanel() {
  const [lead, setLead] = useState<{ id: number; label: string } | null>(null);
  const [currentOfficer, setCurrentOfficer] = useState<string>('');
  const [target, setTarget] = useState<EmployeeResult | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!lead) { setCurrentOfficer(''); return; }
    fetch(`/api/admin/operations/case-transfer?leadId=${lead.id}`)
      .then((r) => r.json())
      .then((d) => setCurrentOfficer(d.case?.caseOfficerName || 'Unassigned'))
      .catch(() => setCurrentOfficer(''));
  }, [lead]);

  const handleTransfer = async () => {
    if (!lead || !target) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/operations/case-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, toEmployeeId: target.id, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Transfer failed');
      setMessage({ type: 'success', text: `Case transferred to ${target.name}.` });
      setCurrentOfficer(target.name);
      setTarget(null);
      setReason('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Transfer failed' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Case Transfer</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">Manually transfer a case to another Operations Manager or team member.</p>

      <div className="mt-4 space-y-3">
        <LeadPicker onSelect={setLead} />
        {lead && (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium text-slate-900">{lead.label}</span>
            <span className="ml-2 text-slate-500">Current case officer: {currentOfficer || '…'}</span>
          </div>
        )}
        {lead && (
          <>
            <EmployeePicker onSelect={setTarget} placeholder="Search transfer-to employee…" />
            {target && <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">Transferring to: <span className="font-semibold">{target.name}</span></div>}
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleTransfer}
              disabled={!target || isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Transferring…' : 'Transfer Case'}
            </button>
          </>
        )}
        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>
        )}
      </div>
    </div>
  );
}

function CaseStatusPanel() {
  const [lead, setLead] = useState<{ id: number; label: string } | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCases = (leadId: number) => {
    fetch(`/api/admin/operations/case-status?leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => setCases(d.cases || []))
      .catch(() => setCases([]));
  };

  useEffect(() => {
    if (!lead) { setCases([]); return; }
    loadCases(lead.id);
  }, [lead]);

  const handleStatusChange = async (opportunityId: number, status: string) => {
    setMessage(null);
    try {
      const res = await fetch('/api/admin/operations/case-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setMessage({ type: 'success', text: 'Case status updated.' });
      if (lead) loadCases(lead.id);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Case Status Management</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">Set a case to Close, Refund, On Hold, or Visa Approved.</p>

      <div className="mt-4 space-y-3">
        <LeadPicker onSelect={setLead} />
        {lead && cases.length === 0 && <p className="text-sm text-slate-500">No opportunities/cases found for {lead.label}.</p>}
        {cases.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <div>
              <span className="font-medium text-slate-900">{c.opportunityName || `Case #${c.id}`}</span>
              {c.serviceType && <span className="ml-2 text-xs text-slate-500">{c.serviceType}</span>}
              {c.operationsStatusUpdatedByName && (
                <span className="ml-2 text-xs text-slate-400">last updated by {c.operationsStatusUpdatedByName}</span>
              )}
            </div>
            <select
              value={c.operationsStatus}
              onChange={(e) => handleStatusChange(c.id, e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
        {message && <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>}
      </div>
    </div>
  );
}

function AccessControlPanel() {
  const [target, setTarget] = useState<EmployeeResult | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [log, setLog] = useState<Array<{ id: number; employeeName: string; action: string; reason: string | null; actorName: string; createdAt: string }>>([]);

  const loadLog = () => {
    fetch('/api/admin/operations/access-control')
      .then((r) => r.json())
      .then((d) => setLog(d.log || []))
      .catch(() => setLog([]));
  };

  useEffect(() => { loadLog(); }, []);

  const handleAction = async (action: 'freeze' | 'restore') => {
    if (!target) return;
    setMessage(null);
    try {
      const res = await fetch('/api/admin/operations/access-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: target.id, action, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      setMessage({ type: 'success', text: `${target.name}'s CRM access has been ${action === 'freeze' ? 'frozen' : 'restored'}.` });
      setTarget(null);
      setReason('');
      loadLog();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <Ban className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">CRM Access Control</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">Freeze or restore a user&apos;s CRM access when required.</p>

      <div className="mt-4 space-y-3">
        <EmployeePicker onSelect={setTarget} placeholder="Search employee…" />
        {target && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium text-slate-900">{target.name}</span>
            <span className="text-slate-500">{target.status === 1 ? 'Active' : 'Frozen'}</span>
          </div>
        )}
        {target && (
          <>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAction('freeze')}
                disabled={target.status !== 1}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" /> Freeze Access
              </button>
              <button
                type="button"
                onClick={() => handleAction('restore')}
                disabled={target.status === 1}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Restore Access
              </button>
            </div>
          </>
        )}
        {message && <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Recent access changes</h3>
        <div className="mt-2 space-y-1">
          {log.length === 0 && <p className="text-sm text-slate-400">No access changes yet.</p>}
          {log.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <span className="font-medium text-slate-900">{entry.employeeName}</span>
                <span className="ml-1 text-slate-500">{entry.action === 'frozen' ? 'access frozen' : 'access restored'} by {entry.actorName}</span>
              </span>
              <span className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OperationsConsolePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operations Manager Console</h1>
        <p className="mt-1 text-sm text-slate-500">Case transfer, case status, and CRM access control rights for Operations Managers.</p>
        <p className="mt-1 text-xs text-slate-400">
          Task reassignment lives on <a href="/admin/all-task-list" className="text-blue-600 hover:underline">All Tasks</a>; attendance management is on the <a href="/admin/attendance" className="text-blue-600 hover:underline">Attendance</a> page.
        </p>
      </div>
      <CaseTransferPanel />
      <CaseStatusPanel />
      <AccessControlPanel />
    </div>
  );
}
