'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, Clock, XCircle, Search, RefreshCw, AlertCircle } from 'lucide-react';

interface Contract {
  id: number;
  leadId: number;
  leadName: string;
  contractNumber: string;
  type: string;
  status: 'draft' | 'pending' | 'signed' | 'cancelled';
  amount: string;
  currency: string;
  createdDate: string;
  signedDate?: string;
  counsilorName: string;
  branchName: string;
  fileName: string;
  fileSize: string;
  paymentStatus: number;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

const STATUS_COLOR: Record<string, string> = {
  signed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  signed: <CheckCircle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
  draft: <FileText className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const { sorted: sortedContracts, sortKey: contractSortKey, sortDirection: contractSortDirection, toggleSort: toggleContractSort } = useSortableData(
    contracts,
    {
      contractNumber: (c) => c.contractNumber,
      client: (c) => c.leadName,
      counselor: (c) => c.counsilorName,
      branch: (c) => c.branchName,
      status: (c) => c.status,
      created: (c) => c.createdDate,
      signed: (c) => c.signedDate,
    },
  );
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/contracts?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setContracts(data.contracts || []);
      setPagination(data.pagination || null);
    } catch (e: any) {
      setError(e.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const signed = contracts.filter(c => c.status === 'signed').length;
  const pending = contracts.filter(c => c.status === 'pending').length;
  const draft = contracts.filter(c => c.status === 'draft').length;

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all client contracts and agreements</p>
        </div>
        <button onClick={fetchContracts} className="flex items-center gap-2 px-4 py-2 bg-[#2A2620] text-white rounded-lg hover:bg-[#1C1812] text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contracts', value: pagination?.total ?? contracts.length, color: 'blue', icon: <FileText className="w-5 h-5" /> },
          { label: 'Signed', value: signed, color: 'green', icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Pending', value: pending, color: 'yellow', icon: <Clock className="w-5 h-5" /> },
          { label: 'Drafts', value: draft, color: 'gray', icon: <FileText className="w-5 h-5" /> },
        ].map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${card.color}-50 text-${card.color}-600`}>
              {card.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by lead name or contract number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-[#2A2620] focus:border-transparent"
          />
        </div>
        <SearchableSelect
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-[#2A2620]"
        >
          <option value="">All Status</option>
          <option value="signed">Signed</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
        </SearchableSelect>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-lg">
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin" /> Loading contracts…
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <FileText className="w-8 h-8" />
            <span>No contracts found</span>
          </div>
        ) : (
          <div className="p-4">
            <SortButtonRow
              options={[
                ['contractNumber', 'Contract #'],
                ['client', 'Client / Lead'],
                ['counselor', 'Counselor'],
                ['branch', 'Branch'],
                ['status', 'Status'],
                ['created', 'Created'],
                ['signed', 'Signed'],
              ] as const}
              activeKey={contractSortKey}
              direction={contractSortDirection}
              onSort={toggleContractSort}
            />
            <RecordList isEmpty={false}>
              {sortedContracts.map(c => (
                <RecordCard
                  key={c.id}
                  avatar={<FileText className="h-4 w-4" />}
                  avatarColorClass="from-emerald-600 to-green-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{c.leadName}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{c.contractNumber}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_ICON[c.status]}
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </>
                  }
                  stats={[
                    { label: 'Lead', value: `#${c.leadId}` },
                    { label: 'Counselor', value: c.counsilorName },
                    { label: 'Branch', value: c.branchName },
                    { label: 'Created', value: c.createdDate ? new Date(c.createdDate).toLocaleDateString() : '—' },
                    { label: 'Signed', value: c.signedDate ? new Date(c.signedDate).toLocaleDateString() : '—' },
                    { label: 'File', value: c.fileName ? <span className="text-[#2A2620]">{c.fileSize}</span> : <span className="text-gray-400">No file</span> },
                  ]}
                />
              ))}
            </RecordList>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
