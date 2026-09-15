'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CalendarDays } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { uploadFileToBlob } from '@/lib/uploadToBlob';

interface LeaveBalance {
  leave_type: string;
  entitlement_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

interface LeaveRequest {
  leave_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  reason: string | null;
  applied_at: string;
}

interface EmployeeOption {
  id: number;
  name: string;
}

const statusClass = (status: string) => {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Rejected') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'Cancelled') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

export default function MyLeavePage() {
  const { user, hasPermission } = useAuth();
  const canApplyForOthers = hasPermission('hr.view') || hasPermission('hr.create') || hasPermission('hr.update');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);

  // HR can apply for anyone (including themselves); everyone else only ever
  // sees/applies for their own record - default the picker to "self" either way.
  useEffect(() => {
    if (user?.id) setSelectedEmployeeId((current) => current ?? Number(user.id));
    if (!canApplyForOthers) return;
    fetch('/api/admin/employees?limit=500')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json?.data) setEmployees(json.data.map((e: { id: number; name: string }) => ({ id: e.id, name: e.name }))); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, canApplyForOthers]);

  const load = async () => {
    if (canApplyForOthers && !selectedEmployeeId) return;
    setIsLoading(true);
    try {
      const params = canApplyForOthers && selectedEmployeeId ? `?employee_id=${selectedEmployeeId}` : '';
      const res = await fetch(`/api/hr/self/leave${params}`);
      const json = await res.json();
      if (res.ok) {
        setBalances(json.balances || []);
        setRequests(json.requests || []);
        const types: string[] = json.leaveTypes || [];
        setLeaveTypes(types);
        setForm((f) => (f.leave_type || !types.length ? f : { ...f, leave_type: types[0] }));
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to load leave data' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load leave data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedEmployeeId]);

  const [daysRequested, setDaysRequested] = useState(0);

  useEffect(() => {
    if (!form.start_date || !form.end_date) { setDaysRequested(0); return; }
    let cancelled = false;
    const employeeParam = canApplyForOthers && selectedEmployeeId ? `&employee_id=${selectedEmployeeId}` : '';
    fetch(`/api/hr/self/leave/preview?start_date=${form.start_date}&end_date=${form.end_date}${employeeParam}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled) setDaysRequested(json.daysRequested || 0); })
      .catch(() => { if (!cancelled) setDaysRequested(0); });
    return () => { cancelled = true; };
  }, [form.start_date, form.end_date, selectedEmployeeId, canApplyForOthers]);

  const handleSubmit = async () => {
    if (!form.start_date || !form.end_date) {
      setMessage({ type: 'error', text: 'Start date and end date are required' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      let documentUrl = '';
      if (documentFile) {
        setIsUploadingDocument(true);
        try {
          const safeName = documentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const employeeIdForPath = canApplyForOthers && selectedEmployeeId ? selectedEmployeeId : user?.id;
          const blob = await uploadFileToBlob(documentFile, `leave-documents/${employeeIdForPath}/${Date.now()}_${safeName}`);
          documentUrl = blob.url;
        } finally {
          setIsUploadingDocument(false);
        }
      }

      const isEditing = Boolean(editingLeaveId);
      const res = await fetch('/api/hr/self/leave', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(isEditing ? { leave_id: editingLeaveId } : {}),
          ...(documentUrl ? { document_url: documentUrl } : {}),
          ...(canApplyForOthers && selectedEmployeeId ? { employee_id: String(selectedEmployeeId) } : {}),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: isEditing ? 'Leave application updated.' : 'Leave application submitted.' });
        setForm({ leave_type: leaveTypes[0], start_date: '', end_date: '', reason: '' });
        setDocumentFile(null);
        setEditingLeaveId(null);
        await load();
      } else {
        setMessage({ type: 'error', text: json.error || `Failed to ${isEditing ? 'update' : 'submit'} leave application` });
      }
    } catch {
      setMessage({ type: 'error', text: `Failed to ${editingLeaveId ? 'update' : 'submit'} leave application` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditingRequest = (request: LeaveRequest) => {
    setEditingLeaveId(request.leave_id);
    setForm({
      leave_type: request.leave_type,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason || '',
    });
    setDocumentFile(null);
    setMessage(null);
  };

  const cancelEditing = () => {
    setEditingLeaveId(null);
    setForm({ leave_type: leaveTypes[0] || '', start_date: '', end_date: '', reason: '' });
    setDocumentFile(null);
  };

  const relevantBalances = balances.filter((balance) => leaveTypes.includes(balance.leave_type));

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading leave application…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Application</h1>
        <p className="mt-1 text-sm text-slate-500">Submit a new leave request for your manager&apos;s approval.</p>
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {relevantBalances.map((balance) => (
          <div key={balance.leave_type} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{balance.leave_type}</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{balance.remaining_days} days</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{editingLeaveId ? 'Edit Leave Application' : 'Apply for Leave'}</h2>
            {editingLeaveId && (
              <button onClick={cancelEditing} className="text-xs font-medium text-slate-500 hover:text-slate-700">
                Cancel edit
              </button>
            )}
          </div>
          <div className="mt-4 space-y-4">
            {canApplyForOthers && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Applying For</label>
                <SearchableSelect
                  value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {user?.id && !employees.some((employee) => employee.id === Number(user.id)) && (
                    <option value={String(user.id)}>{user.name} (You)</option>
                  )}
                  {employees.map((employee) => (
                    <option key={employee.id} value={String(employee.id)}>
                      {employee.id === Number(user?.id) ? `${employee.name} (You)` : employee.name}
                    </option>
                  ))}
                </SearchableSelect>
                <p className="mt-1 text-xs text-slate-500">HR can apply for any employee, including themselves.</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Leave Type</label>
              <select
                value={form.leave_type}
                onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {leaveTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
            {daysRequested > 0 && (
              <p className="text-xs text-slate-500">{daysRequested} day(s) requested</p>
            )}
            {form.leave_type === 'Sick Leave' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Medical Certificate {daysRequested > 3 && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {daysRequested > 3
                    ? 'Required for sick leave longer than 3 days — attach a doctor\'s note or medical certificate.'
                    : 'Optional for sick leave of 3 days or less.'}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={3}
                placeholder="Briefly describe the reason for your leave"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploadingDocument
                ? 'Uploading document…'
                : isSubmitting
                  ? (editingLeaveId ? 'Updating…' : 'Submitting…')
                  : (editingLeaveId ? 'Update Application' : 'Submit Application')}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            {canApplyForOthers && selectedEmployeeId && selectedEmployeeId !== Number(user?.id)
              ? `${employees.find((employee) => employee.id === selectedEmployeeId)?.name || 'Employee'}'s Leave Applications`
              : 'My Leave Applications'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Track the status of everything submitted for this person.</p>
          <div className="mt-3 space-y-3">
            {requests.length === 0 && <p className="text-sm text-slate-400">No leave applications yet.</p>}
            {requests.map((request) => (
              <div key={request.leave_id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{request.leave_type}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(request.status)}`}>{request.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{request.start_date} – {request.end_date} ({request.days_requested} days)</p>
                {request.reason && <p className="mt-1 text-xs text-slate-500">{request.reason}</p>}
                {request.status === 'Pending' && (
                  <button
                    onClick={() => startEditingRequest(request)}
                    className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
