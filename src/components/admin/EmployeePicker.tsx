'use client';

import { useEffect, useState } from 'react';

export interface EmployeeResult {
  id: number;
  name: string;
  email: string;
  status: number;
  roleName: string | null;
  departmentName: string | null;
}

function useDebouncedEmployeeSearch(query: string, roles?: string[]) {
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const rolesKey = (roles || []).join(',');
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: term });
        if (rolesKey) params.set('roles', rolesKey);
        const res = await fetch(`/api/admin/operations/employees-lookup?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        setResults(data.employees || []);
      } catch { setResults([]); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, rolesKey]);
  return results;
}

export default function EmployeePicker({
  onSelect,
  placeholder,
  roles,
}: {
  onSelect: (employee: EmployeeResult) => void;
  placeholder: string;
  /** Optional designation filter, e.g. ["Case Officer", "Team Leader"] — narrows results to matching role names. */
  roles?: string[];
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const results = useDebouncedEmployeeSearch(query, roles);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.length === 0 && <div className="px-4 py-2 text-sm text-slate-500">No employees found</div>}
          {results.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(emp); setQuery(''); setOpen(false); }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-medium text-slate-900">{emp.name}</span>
              <span className="ml-2 text-xs text-slate-500">{emp.roleName || 'No role'} · {emp.departmentName || 'No dept'}{emp.status !== 1 ? ' · Frozen' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
