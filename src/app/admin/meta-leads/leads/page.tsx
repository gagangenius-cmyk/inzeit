'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect, useCallback } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, UserRound } from 'lucide-react';

interface Lead {
  id: number;
  meta_lead_id: string;
  full_name: string;
  email: string;
  phone: string;
  campaign_name: string;
  form_name: string;
  created_at: string;
  delivery_status: string;
  retry_count: number;
  last_error: string;
}

interface LeadDetail {
  lead: {
    id: number;
    meta_lead_id: string;
    full_name: string;
    email: string;
    phone: string;
    campaign_name: string;
    form_name: string;
    page_id: string;
    form_id: string;
    campaign_id: string;
    ad_id: string;
    adset_id: string;
    raw_lead_data: Record<string, unknown>;
    normalized_lead_data: Record<string, unknown>;
    meta_created_time: string;
    created_at: string;
  };
  deliveries: Array<{
    id: number;
    status: string;
    response_status: number;
    last_error: string;
    retry_count: number;
    next_retry_at: string;
    delivered_at: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface Pagination { page: number; limit: number; total: number; pages: number; }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    retry_scheduled: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    processing: 'bg-blue-100 text-blue-800',
    no_delivery: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function MetaLeadsPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const { sorted: sortedLeads, sortKey: leadSortKey, sortDirection: leadSortDirection, toggleSort: toggleLeadSort } = useSortableData(
    leads,
    {
      name: (l) => l.full_name,
      contact: (l) => l.email || l.phone,
      campaign: (l) => l.campaign_name,
      received: (l) => l.created_at,
      status: (l) => l.delivery_status,
      retries: (l) => l.retry_count,
    },
  );
  const [pagination, setPag]    = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [detail, setDetail]     = useState<LeadDetail | null>(null);
  const [detailLoading, setDL]  = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [msg, setMsg]           = useState('');

  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (dateFrom)    params.set('dateFrom', dateFrom);
    if (dateTo)      params.set('dateTo', dateTo);
    try {
      const res = await fetch(`/api/admin/meta-leads?${params}`);
      const data = await res.json();
      setLeads(data.data ?? []);
      setPag(data.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
    } finally { setLoading(false); }
  }, [debouncedSearch, statusFilter, dateFrom, dateTo]);

  useEffect(() => { load(1); }, [load]);

  const openDetail = async (id: number) => {
    setDL(true);
    try {
      const res = await fetch(`/api/admin/meta-leads/${id}`);
      if (res.ok) setDetail(await res.json());
    } finally { setDL(false); }
  };

  const retryDelivery = async (deliveryId: number) => {
    setRetrying(true); setMsg('');
    try {
      const res = await fetch('/api/admin/meta-leads/retry-failed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId }),
      });
      const data = await res.json();
      setMsg(data.succeeded > 0 ? 'Retry succeeded.' : `Retry failed: ${data.error || 'CRM rejected'}`);
      if (detail) { const d = await (await fetch(`/api/admin/meta-leads/${detail.lead.id}`)).json(); setDetail(d); }
      load(pagination.page);
    } finally { setRetrying(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Meta Leads</h1>
        <button onClick={() => load(pagination.page)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-2 text-sm ${msg.includes('failed') || msg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="h-9 rounded-lg border border-gray-300 pl-8 pr-3 text-sm focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <SearchableSelect value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="retry_scheduled">Retry Scheduled</option>
          <option value="pending">Pending</option>
          <option value="no_delivery">No Delivery</option>
        </SearchableSelect>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-2 text-sm focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <SortButtonRow
          options={[
            ['name', 'Name'],
            ['contact', 'Email / Phone'],
            ['campaign', 'Campaign'],
            ['received', 'Received'],
            ['status', 'CRM Status'],
            ['retries', 'Retries'],
          ] as const}
          activeKey={leadSortKey}
          direction={leadSortDirection}
          onSort={toggleLeadSort}
        />
        <RecordList
          loading={loading}
          isEmpty={!loading && sortedLeads.length === 0}
          emptyIcon={UserRound}
          emptyTitle="No leads found"
        >
          {sortedLeads.map(lead => (
            <RecordCard
              key={lead.id}
              avatar={<UserRound className="h-4 w-4" />}
              avatarColorClass="from-indigo-600 to-purple-400"
              title={
                <button onClick={() => openDetail(lead.id)} className="min-w-0 break-words text-left text-base font-bold text-gray-950 hover:text-blue-700 hover:underline">
                  {lead.full_name || '—'}
                </button>
              }
              titleBadges={<StatusBadge status={lead.delivery_status} />}
              metaItems={[{ icon: Search, text: `${lead.email || '—'} · ${lead.phone || '—'}`, key: 'contact' }]}
              stats={[
                { label: 'Campaign', value: lead.campaign_name || '—' },
                { label: 'Received', value: new Date(lead.created_at).toLocaleString() },
                { label: 'Retries', value: lead.retry_count || 0 },
              ]}
              actions={[
                { key: 'view', icon: Search, label: 'View Detail', onClick: () => openDetail(lead.id) },
              ]}
            />
          ))}
        </RecordList>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}
              className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}
              className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDetail(null)} />
          <div className="w-full max-w-xl overflow-y-auto bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
              <h2 className="font-semibold text-gray-900">Lead Detail</h2>
              <button onClick={() => setDetail(null)} className="rounded p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className="px-5 py-8 text-center text-gray-400">Loading...</div>
            ) : detail && (
              <div className="divide-y divide-gray-100">
                {/* Basic info */}
                <div className="px-5 py-4 space-y-1.5">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Contact</h3>
                  {[
                    ['Name', detail.lead.full_name],
                    ['Email', detail.lead.email],
                    ['Phone', detail.lead.phone],
                    ['Campaign', detail.lead.campaign_name],
                    ['Form', detail.lead.form_name],
                    ['Meta Lead ID', detail.lead.meta_lead_id],
                    ['Received', detail.lead.created_at ? new Date(detail.lead.created_at).toLocaleString() : ''],
                  ].map(([label, value]) => value ? (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="w-28 shrink-0 text-gray-500">{label}</span>
                      <span className="text-gray-900 break-all">{value}</span>
                    </div>
                  ) : null)}
                </div>

                {/* CRM Payload */}
                <div className="px-5 py-4">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Normalized CRM Payload</h3>
                  <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                    {JSON.stringify(detail.lead.normalized_lead_data, null, 2)}
                  </pre>
                </div>

                {/* Raw Meta Data */}
                <div className="px-5 py-4">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Raw Meta Field Data</h3>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                    {JSON.stringify((detail.lead.raw_lead_data as {field_data?: unknown})?.field_data ?? detail.lead.raw_lead_data, null, 2)}
                  </pre>
                </div>

                {/* Delivery History */}
                <div className="px-5 py-4">
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Delivery Attempts</h3>
                  {detail.deliveries.length === 0 ? (
                    <p className="text-sm text-gray-400">No delivery attempts yet</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.deliveries.map(d => (
                        <div key={d.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <StatusBadge status={d.status} />
                            <div className="flex items-center gap-2">
                              {d.response_status && <span className="text-xs text-gray-500">HTTP {d.response_status}</span>}
                              {['failed','retry_scheduled'].includes(d.status) && (
                                <button
                                  onClick={() => retryDelivery(d.id)}
                                  disabled={retrying}
                                  className="rounded bg-orange-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-60"
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                          </div>
                          {d.last_error && <p className="mt-1 text-xs text-red-600">{d.last_error}</p>}
                          <p className="mt-1 text-xs text-gray-400">
                            {d.delivered_at ? `Delivered: ${new Date(d.delivered_at).toLocaleString()}` : `Updated: ${new Date(d.updated_at).toLocaleString()}`}
                            {d.next_retry_at && ` · Next retry: ${new Date(d.next_retry_at).toLocaleString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
