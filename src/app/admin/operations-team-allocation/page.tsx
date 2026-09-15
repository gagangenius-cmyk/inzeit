'use client';

import { useEffect, useState } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { Users } from 'lucide-react';

interface AllocationEmployee {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: number;
  roleName: string;
  roleType: string;
  branch: number | null;
  branchName: string | null;
  region: number | null;
  regionName: string | null;
  status: number;
}

interface LookupOption {
  id: number;
  name: string;
  type?: string;
}

export default function OperationsTeamAllocationPage() {
  const [employees, setEmployees] = useState<AllocationEmployee[]>([]);
  const [roles, setRoles] = useState<LookupOption[]>([]);
  const [branches, setBranches] = useState<LookupOption[]>([]);
  const [regions, setRegions] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleType, setRoleType] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [status, setStatus] = useState('');

  const [allocateBranch, setAllocateBranch] = useState('');
  const [allocateRegion, setAllocateRegion] = useState('');
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { sorted: sortedEmployees, sortKey, sortDirection, toggleSort } = useSortableData(employees, {
    name: (e) => e.name,
    role: (e) => e.roleName,
    branch: (e) => e.branchName,
    region: (e) => e.regionName,
    status: (e) => e.status,
  });

  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(employees);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleType) params.set('roleType', roleType);
      if (branchFilter) params.set('branch', branchFilter);
      if (regionFilter) params.set('region', regionFilter);
      if (status) params.set('status', status);

      const res = await fetch(`/api/admin/operations/team-allocation?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load team allocation list');
      setEmployees(json.data || []);
      setRoles(json.filters?.roles || []);
      setBranches(json.filters?.branches || []);
      setRegions(json.filters?.regions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team allocation list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchData, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleType, branchFilter, regionFilter, status]);

  const applyAllocation = async () => {
    if (!allocateBranch && !allocateRegion) {
      setMessage({ type: 'error', text: 'Pick a branch or region to allocate to.' });
      return;
    }
    setApplying(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/operations/team-allocation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: Array.from(selectedIds),
          branch: allocateBranch || undefined,
          region: allocateRegion || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update allocation');
      setMessage({ type: 'success', text: `Updated ${json.updated} employee(s).` });
      clear();
      setAllocateBranch('');
      setAllocateRegion('');
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update allocation' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team / Employee Allocation</h1>
        <p className="text-gray-600 mt-2">
          Process Coordinator, Team Leader, CPO, Assistant Branch Manager, and Sr Branch Co-ordinator staff — filter and
          bulk-allocate them to a branch or region.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search by name, email, mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <SearchableSelect value={roleType} onChange={(e) => setRoleType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.type}>{r.name}</option>
            ))}
          </SearchableSelect>
          <SearchableSelect value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </SearchableSelect>
          <SearchableSelect value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </SearchableSelect>
          <SearchableSelect value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SearchableSelect>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Select all ({employees.length})
        </div>
        <SortButtonRow
          options={[
            ['name', 'Name'],
            ['role', 'Role'],
            ['branch', 'Branch'],
            ['region', 'Region'],
            ['status', 'Status'],
          ] as const}
          activeKey={sortKey}
          direction={sortDirection}
          onSort={toggleSort}
        />
        <RecordList
          loading={loading}
          isEmpty={!loading && sortedEmployees.length === 0}
          emptyIcon={Users}
          emptyTitle="No staff found"
          emptyDescription="Try changing filters or search terms."
        >
          {sortedEmployees.map((employee) => (
            <RecordCard
              key={employee.id}
              avatar={
                <input
                  type="checkbox"
                  checked={isSelected(employee.id)}
                  onChange={(e) => toggleOne(employee.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              }
              avatarColorClass="from-gray-100 to-gray-100"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{employee.name}</span>}
              titleBadges={
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {employee.status === 1 ? 'Active' : 'Inactive'}
                </span>
              }
              stats={[
                { label: 'Role', value: employee.roleName },
                { label: 'Branch', value: employee.branchName || '—' },
                { label: 'Region', value: employee.regionName || '—' },
                { label: 'Contact', value: employee.mobile || employee.email || '—' },
              ]}
            />
          ))}
        </RecordList>
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 bg-gray-900 text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium whitespace-nowrap">{selectedIds.size} selected</span>
          <SearchableSelect
            value={allocateBranch}
            onChange={(e) => setAllocateBranch(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm text-gray-900"
          >
            <option value="">Allocate to branch…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </SearchableSelect>
          <SearchableSelect
            value={allocateRegion}
            onChange={(e) => setAllocateRegion(e.target.value)}
            className="px-3 py-1.5 rounded-md text-sm text-gray-900"
          >
            <option value="">Allocate to region…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </SearchableSelect>
          <button
            onClick={applyAllocation}
            disabled={applying}
            className="px-3 py-1.5 bg-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {applying ? 'Applying…' : 'Apply'}
          </button>
          <button onClick={clear} disabled={applying} className="px-2 py-1.5 text-gray-300 hover:text-white text-sm disabled:opacity-50">
            Clear
          </button>
        </div>
      )}

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
