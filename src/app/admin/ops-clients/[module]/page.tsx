'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useAuth } from '@/contexts/AuthContext';
import { getOperationsModule } from '@/lib/operationsModules';
import { Users, Search, RefreshCw, ExternalLink, Mail } from 'lucide-react';

interface ClientRow {
  leadId: number;
  opportunityId: number;
  fname: string | null;
  lname: string | null;
  email: string | null;
  mobile: string | null;
  phone: string | null;
  leadStatus: string | null;
  opportunityStatus: string | null;
  branch: number | null;
  branchName: string | null;
  counselorName: string | null;
  agreementNumber: string | null;
  retentionDate: string | null;
}

export default function OperationsModuleClientListPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const moduleKey = String(params?.module || '');
  const moduleInfo = getOperationsModule(moduleKey);

  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ module: moduleKey, limit: '500' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/operations/search?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load clients');
      setRows(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, search ? 350 : 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, search]);

  const branchOptions = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((row) => {
      if (row.branch != null) seen.set(String(row.branch), row.branchName || `Branch ${row.branch}`);
    });
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  }, [rows]);

  const statusOptions = useMemo(() => {
    const seen = new Set<string>();
    rows.forEach((row) => {
      const status = row.opportunityStatus || row.leadStatus;
      if (status) seen.add(status);
    });
    return Array.from(seen);
  }, [rows]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    if (branchFilter && String(row.branch || '') !== branchFilter) return false;
    if (statusFilter && (row.opportunityStatus || row.leadStatus) !== statusFilter) return false;
    return true;
  }), [rows, branchFilter, statusFilter]);

  const { sorted: sortedRows, sortKey, sortDirection, toggleSort } = useSortableData(
    filteredRows,
    {
      name: (row: ClientRow) => `${row.fname || ''} ${row.lname || ''}`,
      contact: (row: ClientRow) => row.email || row.mobile || row.phone,
      branch: (row: ClientRow) => row.branchName,
      counselor: (row: ClientRow) => row.counselorName,
      status: (row: ClientRow) => row.opportunityStatus || row.leadStatus,
      agreement: (row: ClientRow) => row.agreementNumber,
      retained: (row: ClientRow) => row.retentionDate,
    },
  );

  const openCase = (row: ClientRow) => {
    if (!moduleInfo) return;
    const clientName = [row.fname, row.lname].filter(Boolean).join(' ').trim() || 'Client';
    const url = new URLSearchParams({
      leadId: String(row.leadId),
      opportunityId: String(row.opportunityId),
      clientName,
    });
    router.push(`${moduleInfo.wizardRoute}?${url.toString()}`);
  };

  if (!moduleInfo) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Unknown operations module: {moduleKey}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> {moduleInfo.label} — Clients
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Every won/retained client tagged to this program. Open a client to work their case in the operations wizard.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, agreement number, email, or phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <SearchableSelect value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Branches</option>
          {branchOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SearchableSelect>
        <SearchableSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Statuses</option>
          {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </SearchableSelect>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4">
          <SortButtonRow
            options={[
              ['name', 'Client'],
              ['contact', 'Contact'],
              ['branch', 'Branch'],
              ['counselor', 'Counselor'],
              ['status', 'Status'],
              ['agreement', 'Agreement'],
              ['retained', 'Retained'],
            ] as const}
            activeKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          />
          <RecordList
            loading={loading}
            isEmpty={!loading && sortedRows.length === 0}
            emptyIcon={Users}
            emptyTitle={`No ${moduleInfo.label} clients found`}
          >
            {sortedRows.map((row) => (
              <RecordCard
                key={`${row.leadId}-${row.opportunityId}`}
                avatar={<Users className="h-4 w-4" />}
                avatarColorClass="from-blue-600 to-cyan-400"
                title={
                  <button onClick={() => openCase(row)} className="min-w-0 break-words text-left text-base font-bold text-blue-700 hover:underline">
                    {[row.fname, row.lname].filter(Boolean).join(' ') || `Lead ${row.leadId}`}
                  </button>
                }
                titleBadges={
                  <>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Lead #{row.leadId}</span>
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">{row.opportunityStatus || row.leadStatus || '—'}</span>
                  </>
                }
                metaItems={[{ icon: Mail, text: `${row.email || '—'} · ${row.mobile || row.phone || '—'}`, key: 'contact' }]}
                stats={[
                  { label: 'Branch', value: row.branchName || '—' },
                  { label: 'Counselor', value: row.counselorName || '—' },
                  { label: 'Agreement', value: row.agreementNumber || '—' },
                  { label: 'Retained', value: row.retentionDate ? new Date(row.retentionDate).toLocaleDateString() : '—' },
                ]}
                actions={[
                  { key: 'open', icon: ExternalLink, label: 'Open Case', onClick: () => openCase(row), colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                ]}
              />
            ))}
          </RecordList>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
          Showing {sortedRows.length} of {rows.length} {moduleInfo.label} clients
        </div>
      </div>
    </div>
  );
}
