'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3, Users, CheckCircle, XCircle, Clock, RefreshCw,
  Facebook, AlertTriangle, TrendingUp, Settings, ArrowRight,
  Activity
} from 'lucide-react';

interface Stats {
  todayCount: number;
  weekCount: number;
  delivered: number;
  failed: number;
  pending: number;
  recentLeads: Array<{
    id: number; full_name: string; email: string; phone: string;
    campaign_name: string; created_at: string; delivery_status: string;
  }>;
  recentFailures: Array<{
    id: number; meta_lead_id: number; full_name: string;
    last_error: string; retry_count: number; updated_at: string;
  }>;
  campaignCounts: Array<{ campaign_name: string; count: number }>;
}

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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function MetaLeadsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/meta-leads/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      setStats(await res.json());
    } catch {
      setMessage('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const syncCampaigns = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/meta-leads/sync-campaigns', { method: 'POST' });
      const data = await res.json();
      setMessage(res.ok ? `Synced ${data.synced} campaigns successfully.` : `Sync failed: ${data.error}`);
      if (res.ok) loadStats();
    } catch { setMessage('Campaign sync request failed'); }
    finally { setSyncing(false); }
  };

  const retryFailed = async () => {
    setRetrying(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/meta-leads/retry-failed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      setMessage(`Retry complete: ${data.succeeded}/${data.retried} succeeded.`);
      loadStats();
    } catch { setMessage('Retry request failed'); }
    finally { setRetrying(false); }
  };

  const statCards = [
    { label: 'Leads Today', value: stats?.todayCount ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Leads This Week', value: stats?.weekCount ?? 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Delivered to CRM', value: stats?.delivered ?? 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Failed Deliveries', value: stats?.failed ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending / Retrying', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Facebook className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Meta Lead Ads</h1>
            <p className="text-sm text-gray-500">Facebook Lead Ads → CRM integration dashboard</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={syncCampaigns}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Activity className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Campaigns
          </button>
          <button
            onClick={retryFailed}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            Retry Failed
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('failed') || message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Nav links */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: '/admin/meta-leads/leads', label: 'All Leads', icon: Users },
          { href: '/admin/meta-leads/campaigns', label: 'Campaigns', icon: BarChart3 },
          { href: '/admin/meta-leads/mappings', label: 'Field Mappings', icon: ArrowRight },
          { href: '/admin/meta-leads/settings', label: 'Settings', icon: Settings },
          { href: '/admin/meta-leads/logs', label: 'Delivery Logs', icon: Activity },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map(card => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '—' : card.value.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="font-medium text-gray-900">Recent Leads</h2>
            <Link href="/admin/meta-leads/leads" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : (stats?.recentLeads ?? []).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No leads yet</div>
            ) : (
              (stats?.recentLeads ?? []).map(lead => (
                <div key={lead.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{lead.full_name || '—'}</div>
                    <div className="truncate text-xs text-gray-500">{lead.email || lead.phone || '—'}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={lead.delivery_status} />
                    <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campaign counts */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="font-medium text-gray-900">Leads by Campaign</h2>
            <Link href="/admin/meta-leads/campaigns" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : (stats?.campaignCounts ?? []).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No campaign data yet</div>
            ) : (
              (stats?.campaignCounts ?? []).map(c => (
                <div key={c.campaign_name} className="flex items-center justify-between px-4 py-2.5">
                  <span className="truncate text-sm text-gray-700">{c.campaign_name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {c.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Failures */}
        {(stats?.recentFailures ?? []).length > 0 && (
          <div className="rounded-xl border border-red-100 bg-white lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-red-100 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h2 className="font-medium text-gray-900">Recent Delivery Failures</h2>
              <Link href="/admin/meta-leads/logs" className="ml-auto text-xs text-blue-600 hover:underline">View logs</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(stats?.recentFailures ?? []).map(f => (
                <div key={f.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{f.full_name || `Lead #${f.meta_lead_id}`}</div>
                    <div className="mt-0.5 truncate text-xs text-red-600">{f.last_error || 'Unknown error'}</div>
                  </div>
                  <div className="shrink-0 text-xs text-gray-400">Retry #{f.retry_count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
