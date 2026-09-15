'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';

type Candidate = Record<string, string | number | null>;
type ExitRequest = Record<string, string | number | null>;

const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Request failed');
  return json;
};

export default function HRJoiningExitFlow({ mode }: { mode: 'joining' | 'exit' }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [exits, setExits] = useState<ExitRequest[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const reload = async () => {
    setLoading(true);
    try {
      if (mode === 'joining') setCandidates((await request('/api/hr/recruitment/candidates')).candidates || []);
      else setExits((await request('/api/hr/exit/requests')).requests || []);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load workflow records'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, [mode]);
  const submitCandidate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (submitting) return; setSubmitting(true); const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await request('/api/hr/recruitment/candidates', { method: 'POST', body: JSON.stringify(data) }); event.currentTarget.reset(); setMessage('Candidate added to the recruitment pipeline.'); reload(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to add candidate'); } finally { setSubmitting(false); }
  };
  const submitExit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (submitting) return; setSubmitting(true); const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await request('/api/hr/exit/resign', { method: 'POST', body: JSON.stringify(data) }); event.currentTarget.reset(); setMessage('Resignation submitted for approval.'); reload(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit resignation'); } finally { setSubmitting(false); }
  };
  const updateStatus = async (id: string, status: string) => {
    try { await request(`/api/hr/recruitment/candidates/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, interview_outcome: status === 'Selected' ? 'Pass' : undefined }) }); setMessage(`Candidate marked ${status}.`); reload(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update candidate'); }
  };
  const submitOffer = async (id: string) => {
    const offer_salary = window.prompt('Monthly offer salary'); const offer_designation = window.prompt('Offer designation');
    if (!offer_salary || !offer_designation) return;
    const offer_letter_url = window.prompt('Offer letter URL (optional - paste a link to the generated/uploaded offer letter, e.g. from the Letters module)') || undefined;
    try { await request(`/api/hr/recruitment/candidates/${id}/offer`, { method: 'POST', body: JSON.stringify({ offer_salary, offer_designation, offer_letter_url }) }); setMessage('Offer submitted to Director of Sales for approval.'); reload(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit offer'); }
  };
  const approveOffer = async (id: string) => {
    try { await request(`/api/hr/recruitment/candidates/${id}/offer/approve`, { method: 'PUT', body: '{}' }); setMessage('Offer approved. The acceptance link is now available to the candidate.'); reload(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Only Director of Sales can approve this offer'); }
  };
  const onboard = async (id: string) => {
    const company_email = window.prompt('Company email for this employee'); if (!company_email) return;
    try { await request(`/api/hr/recruitment/onboard/${id}`, { method: 'POST', body: JSON.stringify({ company_email }) }); setMessage('Onboarding complete; welcome message and CRM ID have been queued.'); reload(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to onboard candidate'); }
  };
  const reviewExit = async (id: string, approved: boolean) => {
    const approved_lwd = approved ? window.prompt('Approved last working date (YYYY-MM-DD)') || undefined : undefined;
    try { await request(`/api/hr/exit/${id}/${approved ? 'approve' : 'reject'}`, { method: 'PUT', body: JSON.stringify({ approved_lwd }) }); setMessage(approved ? 'Exit request approved.' : 'Exit request rejected.'); reload(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to review exit request'); }
  };
  const { sorted: sortedCandidates, sortKey: candidateSortKey, sortDirection: candidateSortDirection, toggleSort: toggleCandidateSort } = useSortableData(
    candidates,
    { candidate: (c) => c.full_name, position: (c) => c.applied_position, status: (c) => c.status, interview: (c) => c.interview_outcome },
  );
  const { sorted: sortedExits, sortKey: exitSortKey, sortDirection: exitSortDirection, toggleSort: toggleExitSort } = useSortableData(
    exits,
    { employee: (x) => x.employee_name || x.employee_id, type: (x) => x.exit_type, requestedLwd: (x) => x.requested_lwd, status: (x) => x.status },
  );
  return <div className="space-y-6 p-4 sm:p-6">
    <div><h1 className="text-2xl font-bold text-slate-950">{mode === 'joining' ? 'Recruitment & Joining Flow' : 'Exit Flow'}</h1><p className="mt-1 text-sm text-slate-600">{mode === 'joining' ? 'Track applicants from application through Director of Sales offer approval and CRM onboarding.' : 'Manage resignations and terminations through approval, exit interview, and F&F handover.'}</p></div>
    {message && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</div>}
    {mode === 'joining' ? <>
      <form onSubmit={submitCandidate} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"><input name="full_name" required placeholder="Candidate full name" className="rounded border p-2"/><input name="email" required type="email" placeholder="Email" className="rounded border p-2"/><input name="phone" placeholder="Phone" className="rounded border p-2"/><input name="applied_position" required placeholder="Applied position" className="rounded border p-2"/><input name="source" placeholder="Source" className="rounded border p-2"/><input name="applied_date" type="date" className="rounded border p-2"/><button disabled={submitting} className="rounded bg-emerald-700 px-4 py-2 font-medium text-white disabled:opacity-50">{submitting ? 'Adding...' : 'Add candidate'}</button></form>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><SortableTh label="Candidate" sortKey="candidate" activeKey={candidateSortKey} direction={candidateSortDirection} onSort={toggleCandidateSort} className="p-3" /><SortableTh label="Position" sortKey="position" activeKey={candidateSortKey} direction={candidateSortDirection} onSort={toggleCandidateSort} className="p-3" /><SortableTh label="Status" sortKey="status" activeKey={candidateSortKey} direction={candidateSortDirection} onSort={toggleCandidateSort} className="p-3" /><SortableTh label="Interview" sortKey="interview" activeKey={candidateSortKey} direction={candidateSortDirection} onSort={toggleCandidateSort} className="p-3" /><th className="p-3">Action</th></tr></thead><tbody>{sortedCandidates.map((c) => <tr key={String(c.candidate_id)} className="border-t"><td className="p-3"><div className="font-medium">{c.full_name}</div><div className="text-slate-500">{c.email}</div></td><td className="p-3">{c.applied_position}</td><td className="p-3">{c.status}</td><td className="p-3">{c.interview_outcome}</td><td className="space-x-2 p-3"><button onClick={() => updateStatus(String(c.candidate_id), 'Interviewed')} className="text-emerald-700">Interviewed</button><button onClick={() => updateStatus(String(c.candidate_id), 'Selected')} className="text-emerald-700">Select</button><button onClick={() => submitOffer(String(c.candidate_id))} className="text-emerald-700">Offer</button><button onClick={() => approveOffer(String(c.candidate_id))} className="text-emerald-700">DOS approve</button><button onClick={() => onboard(String(c.candidate_id))} className="text-emerald-700">Onboard</button><button onClick={() => updateStatus(String(c.candidate_id), 'Rejected')} className="text-red-700">Reject</button></td></tr>)}{!loading && !candidates.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No candidates yet.</td></tr>}</tbody></table></div>
    </> : <>
      <form onSubmit={submitExit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"><input name="employee_id" required placeholder="Employee ID" className="rounded border p-2"/><input name="requested_lwd" type="date" className="rounded border p-2"/><input name="reason" required placeholder="Resignation reason" className="rounded border p-2"/><input name="notes" placeholder="Notes" className="rounded border p-2"/><button disabled={submitting} className="rounded bg-emerald-700 px-4 py-2 font-medium text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit resignation'}</button></form>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><SortableTh label="Employee" sortKey="employee" activeKey={exitSortKey} direction={exitSortDirection} onSort={toggleExitSort} className="p-3" /><SortableTh label="Type" sortKey="type" activeKey={exitSortKey} direction={exitSortDirection} onSort={toggleExitSort} className="p-3" /><SortableTh label="Requested LWD" sortKey="requestedLwd" activeKey={exitSortKey} direction={exitSortDirection} onSort={toggleExitSort} className="p-3" /><SortableTh label="Status" sortKey="status" activeKey={exitSortKey} direction={exitSortDirection} onSort={toggleExitSort} className="p-3" /><th className="p-3">F&F / action</th></tr></thead><tbody>{sortedExits.map((x) => <tr key={String(x.exit_request_id)} className="border-t"><td className="p-3">{x.employee_name || x.employee_id}</td><td className="p-3">{x.exit_type}</td><td className="p-3">{x.requested_lwd || '—'}</td><td className="p-3">{x.status}</td><td className="space-x-2 p-3">{x.fnf_email_status} <button onClick={() => reviewExit(String(x.exit_request_id), true)} className="text-emerald-700">Approve</button><button onClick={() => reviewExit(String(x.exit_request_id), false)} className="text-red-700">Reject</button></td></tr>)}{!loading && !exits.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No exit requests yet.</td></tr>}</tbody></table></div>
    </>}
  </div>;
}
