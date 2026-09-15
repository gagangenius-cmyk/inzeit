'use client';

import { useEffect, useState } from 'react';
import { UserCheck, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Employee = { id: number; name: string; email: string | null; present: number };

export default function LeadAssignmentAvailabilityPage() {
  const { user } = useAuth();
  const [branchId, setBranchId] = useState(() => Number((user as { branch?: number } | null)?.branch || 1));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadEmployees = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/attendance/presence?branchId=${branchId}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load employees');
      setEmployees(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load employees');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadEmployees(); }, [branchId]);

  const togglePresence = async (employee: Employee) => {
    setUpdating(employee.id); setError('');
    try {
      const response = await fetch('/api/admin/attendance/presence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id, present: !employee.present }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to update availability');
      setEmployees((current) => current.map((item) => item.id === employee.id ? { ...item, present: employee.present ? 0 : 1 } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update availability');
    } finally { setUpdating(null); }
  };

  const presentCount = employees.filter((employee) => Boolean(employee.present)).length;
  return (
    <main className="min-h-[60vh] bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-slate-900">Lead Assignment Availability</h1><p className="mt-1 text-sm text-slate-600">Turn employees on only when they are present in the office. New leads rotate among enabled employees.</p></div>
          <label className="text-sm font-medium text-slate-700">Branch<input className="ml-2 w-20 rounded border p-2" min="1" type="number" value={branchId} onChange={(event) => setBranchId(Number(event.target.value) || 1)} /></label>
        </div>
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><UserCheck className="mr-2 inline h-5 w-5" />{presentCount} of {employees.length} employees are available for automatic lead assignment today.</div>
        {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {loading ? <p className="p-6 text-sm text-slate-500">Loading employees…</p> : employees.length === 0 ? <p className="p-6 text-sm text-slate-500">No active employees found for this branch.</p> : employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between border-b p-4 last:border-0"><div><p className="font-medium text-slate-900">{employee.name}</p><p className="text-sm text-slate-500">{employee.email || `Employee #${employee.id}`}</p></div><button disabled={updating === employee.id} onClick={() => togglePresence(employee)} className={`rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 ${employee.present ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{updating === employee.id ? 'Updating…' : employee.present ? 'Present — Assigned' : 'Absent — Disabled'}</button></div>
          ))}
        </section>
      </div>
    </main>
  );
}
