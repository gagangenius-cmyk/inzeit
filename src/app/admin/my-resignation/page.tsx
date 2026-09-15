'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

const noticePeriods = [15, 30, 60, 90];
const reasonOptions = [
  'Better career opportunity',
  'Higher studies',
  'Relocation',
  'Personal reasons',
  'Health reasons',
  'Compensation',
  'Other',
];

const stages = ['Submitted', 'Under Review', 'Acknowledged', 'Exit Process'] as const;

interface ExitRequest {
  exit_request_id: string;
  status: string;
  workflow_stage: typeof stages[number];
  submitted_at: string;
  requested_lwd: string | null;
  notice_period_days: number | null;
  branch_snapshot: string | null;
  reason_category: string | null;
  additional_comments: string | null;
}

export default function MyResignationPage() {
  const [profileBranch, setProfileBranch] = useState('');
  const [existing, setExisting] = useState<ExitRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    requested_lwd: '',
    notice_period_days: 30,
    reason_category: reasonOptions[0],
    additional_comments: '',
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const [profileRes, statusRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/hr/exit/my-status'),
      ]);
      const profileJson = await profileRes.json();
      const statusJson = await statusRes.json();
      if (profileRes.ok) setProfileBranch(profileJson.profile?.branchName || '');
      if (statusRes.ok) setExisting(statusJson.request || null);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load resignation status' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.requested_lwd) {
      setMessage({ type: 'error', text: 'Proposed last working day is required' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/hr/exit/resign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch_snapshot: profileBranch }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Resignation submitted to HR.' });
        await load();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to submit resignation' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit resignation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!existing) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/hr/exit/${existing.exit_request_id}/withdraw`, { method: 'PUT' });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Resignation withdrawn.' });
        await load();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to withdraw resignation' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to withdraw resignation' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  const hasActiveResignation = existing && existing.status !== 'Withdrawn' && existing.status !== 'Rejected';
  const canWithdraw = hasActiveResignation && existing!.workflow_stage !== 'Acknowledged' && existing!.workflow_stage !== 'Exit Process';
  const currentStageIndex = existing ? stages.indexOf(existing.workflow_stage) : -1;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resignation</h1>
        <p className="mt-1 text-sm text-slate-500">This starts a formal process with HR. Please review your notice period before submitting.</p>
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {hasActiveResignation ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Resignation Status
          </h2>
          <div className="mt-4 flex items-center justify-between">
            {stages.map((stage, index) => (
              <div key={stage} className="flex flex-1 flex-col items-center text-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${index <= currentStageIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {index + 1}
                </div>
                <span className={`mt-1 text-xs ${index <= currentStageIndex ? 'text-slate-900' : 'text-slate-400'}`}>{stage}</span>
              </div>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Submitted On</dt><dd className="text-slate-900">{new Date(existing!.submitted_at).toLocaleDateString()}</dd></div>
            <div><dt className="text-slate-500">Last Working Day</dt><dd className="text-slate-900">{existing!.requested_lwd || '—'}</dd></div>
            <div><dt className="text-slate-500">Notice Period</dt><dd className="text-slate-900">{existing!.notice_period_days || 30} days</dd></div>
            <div><dt className="text-slate-500">Branch</dt><dd className="text-slate-900">{existing!.branch_snapshot || '—'}</dd></div>
            <div><dt className="text-slate-500">Reason</dt><dd className="text-slate-900">{existing!.reason_category || '—'}</dd></div>
          </dl>

          {canWithdraw && (
            <button
              onClick={handleWithdraw}
              disabled={isSubmitting}
              className="mt-6 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Withdraw Resignation
            </button>
          )}
          {!canWithdraw && (
            <p className="mt-4 text-xs text-slate-500">Your resignation has been acknowledged. Please speak with HR directly about any changes.</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Proposed Last Working Day</label>
              <input
                type="date"
                value={form.requested_lwd}
                onChange={(e) => setForm((f) => ({ ...f, requested_lwd: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Notice Period</label>
                <select
                  value={form.notice_period_days}
                  onChange={(e) => setForm((f) => ({ ...f, notice_period_days: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {noticePeriods.map((days) => <option key={days} value={days}>{days} days{days === 30 ? ' (standard)' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Branch / Entity</label>
                <input
                  type="text"
                  value={profileBranch}
                  readOnly
                  className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Reason for Leaving</label>
              <select
                value={form.reason_category}
                onChange={(e) => setForm((f) => ({ ...f, reason_category: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {reasonOptions.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Additional Comments (optional)</label>
              <textarea
                value={form.additional_comments}
                onChange={(e) => setForm((f) => ({ ...f, additional_comments: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              Per your Client Service Agreement / Employee Handbook, standard notice period is 30 days unless otherwise stated in your offer letter. Submitting here notifies HR and your reporting manager immediately.
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Resignation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
