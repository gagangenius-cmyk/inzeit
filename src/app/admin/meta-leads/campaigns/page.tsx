'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { Search, RefreshCw, Activity, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective: string;
  daily_budget: number;
  lifetime_budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  leads_count: number;
  last_synced_at: string;
}

interface Pagination { page: number; limit: number; total: number; pages: number; }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    DELETED: 'bg-red-100 text-red-700',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function MetaCampaignsPage() {
  const [rows, setRows]         = useState<Campaign[]>([]);
  const { sorted: sortedRows, sortKey: campaignSortKey, sortDirection: campaignSortDirection, toggleSort: toggleCampaignSort } = useSortableData(
    rows,
    {
      campaign: (c) => c.campaign_name,
      status: (c) => c.status,
      leads: (c) => c.leads_count,
      spend: (c) => c.spend,
      impressions: (c) => c.impressions,
      clicks: (c) => c.clicks,
      lastSynced: (c) => c.last_synced_at,
    },
  );
  const [pagination, setPag]    = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [syncing, setSyncing]   = useState(false);
  const [msg, setMsg]           = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/meta-leads/campaigns?${params}`);
      const data = await res.json();
      setRows(data.data ?? []);
      setPag(data.pagination ?? { page: 1, limit: 20, total: 0, pages: 0 });
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  const syncCampaigns = async () => {
    setSyncing(true); setMsg('');
    try {
      const res = await fetch('/api/admin/meta-leads/sync-campaigns', { method: 'POST' });
      const data = await res.json();
      setMsg(res.ok ? `Synced ${data.synced} campaigns.` : `Error: ${data.error}`);
      if (res.ok) load(1);
    } finally { setSyncing(false); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Meta Campaigns</h1>
        <button
          onClick={syncCampaigns} disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Activity className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          Sync from Meta
        </button>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-2 text-sm ${msg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>
      )}

      <div className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..."
            className="h-9 w-64 rounded-lg border border-gray-300 pl-8 pr-3 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => load(pagination.page)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <SortButtonRow
          options={[
            ['campaign', 'Campaign'],
            ['status', 'Status'],
            ['leads', 'Leads'],
            ['spend', 'Spend'],
            ['impressions', 'Impressions'],
            ['clicks', 'Clicks'],
            ['lastSynced', 'Last Synced'],
          ] as const}
          activeKey={campaignSortKey}
          direction={campaignSortDirection}
          onSort={toggleCampaignSort}
        />
        <RecordList
          loading={loading}
          isEmpty={!loading && sortedRows.length === 0}
          emptyIcon={Megaphone}
          emptyTitle="No campaigns yet"
          emptyDescription='Use "Sync from Meta" to import campaigns.'
        >
          {sortedRows.map(c => (
            <RecordCard
              key={c.campaign_id}
              avatar={<Megaphone className="h-4 w-4" />}
              avatarColorClass="from-indigo-600 to-purple-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{c.campaign_name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{c.campaign_id}</span>
                  <StatusBadge status={c.status || 'UNKNOWN'} />
                </>
              }
              stats={[
                { label: 'Leads', value: <span className="text-blue-700">{c.leads_count}</span> },
                { label: 'Spend', value: c.spend > 0 ? `$${Number(c.spend).toFixed(2)}` : '—' },
                { label: 'Impressions', value: c.impressions ? Number(c.impressions).toLocaleString() : '—' },
                { label: 'Clicks', value: c.clicks ? Number(c.clicks).toLocaleString() : '—' },
              ]}
              metaItems={[{ icon: RefreshCw, text: `Last synced: ${c.last_synced_at ? new Date(c.last_synced_at).toLocaleString() : '—'}`, key: 'synced' }]}
            />
          ))}
        </RecordList>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
          <div className="flex gap-1">
            <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)} className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
