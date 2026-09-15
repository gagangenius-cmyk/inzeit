'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import EmployeePicker, { type EmployeeResult } from '@/components/admin/EmployeePicker';

// Designations a case can be transferred to from Operations Management.
// This drives the checkbox filter below — checking one or more narrows the
// employee picker to people carrying that exact crm_role.name. Selecting
// none searches across all roles (unchanged EmployeePicker behaviour).
export const CASE_TRANSFER_DESIGNATIONS = [
  'Case Officer',
  'Team Leader',
  'CPO',
  'Assistant Branch Manager',
  'Sr Branch Co-ordinator',
  'Audit Manager',
  'Sr Team Lead',
] as const;

interface CaseTransferModalProps {
  leadId: number;
  leadLabel: string;
  onClose: () => void;
  onTransferred: (newOfficerName: string, toEmployeeId: number) => void;
}

export default function CaseTransferModal({ leadId, leadLabel, onClose, onTransferred }: CaseTransferModalProps) {
  const [currentOfficer, setCurrentOfficer] = useState('…');
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [target, setTarget] = useState<EmployeeResult | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/operations/case-transfer?leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setCurrentOfficer(d.case?.caseOfficerName || 'Unassigned'); })
      .catch(() => { if (!cancelled) setCurrentOfficer('Unassigned'); });
    return () => { cancelled = true; };
  }, [leadId]);

  const toggleDesignation = (designation: string) => {
    setSelectedDesignations((prev) =>
      prev.includes(designation) ? prev.filter((d) => d !== designation) : [...prev, designation]
    );
    setTarget(null);
  };

  const handleTransfer = async () => {
    if (!target) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/operations/case-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, toEmployeeId: target.id, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Transfer failed');
      setMessage({ type: 'success', text: `Case transferred to ${target.name}.` });
      setCurrentOfficer(target.name);
      onTransferred(target.name, target.id);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Transfer failed' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Transfer Case</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
          <span className="font-medium text-slate-900">{leadLabel}</span>
          <span className="ml-2 text-slate-500">Current case officer: {currentOfficer}</span>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Transfer to designation</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CASE_TRANSFER_DESIGNATIONS.map((designation) => (
              <label key={designation} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedDesignations.includes(designation)}
                  onChange={() => toggleDesignation(designation)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {designation}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {selectedDesignations.length > 0
              ? 'Search below is limited to the checked designation(s).'
              : 'Leave unchecked to search across all designations.'}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <EmployeePicker
            key={selectedDesignations.join(',')}
            onSelect={setTarget}
            roles={selectedDesignations}
            placeholder={
              selectedDesignations.length ? `Search ${selectedDesignations.join(', ')}…` : 'Search any employee…'
            }
          />
          {target && (
            <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Transferring to: <span className="font-semibold">{target.name}</span>
              {target.roleName && <span className="ml-1 text-blue-600">({target.roleName})</span>}
            </div>
          )}
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {message?.type === 'success' ? 'Close' : 'Cancel'}
            </button>
            {message?.type !== 'success' && (
              <button
                type="button"
                onClick={handleTransfer}
                disabled={!target || isSaving}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Transferring…' : 'Transfer Case'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
