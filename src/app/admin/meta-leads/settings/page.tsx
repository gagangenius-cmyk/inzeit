'use client';

import { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle, Zap, Activity } from 'lucide-react';

interface Settings {
  id: number;
  is_enabled: number;
  page_id: string | null;
  page_name: string | null;
  ad_account_id: string | null;
  graph_api_version: string;
  default_branch: string | null;
  default_lead_source: string;
  default_utm_source: string;
  last_webhook_at: string | null;
  last_campaign_sync_at: string | null;
  updated_at: string;
}

interface EnvStatus {
  appId: string;
  appSecret: string;
  webhookVerifyToken: string;
  pageAccessToken: string;
  graphApiVersion: string;
  crmEndpoint: string;
}

export default function MetaSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [env, setEnv]           = useState<EnvStatus | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testingCrm, setTestingCrm]   = useState(false);
  const [testingMeta, setTestingMeta] = useState(false);
  const [msg, setMsg]           = useState('');
  const [form, setForm]         = useState({
    is_enabled: 0,
    page_id: '',
    page_name: '',
    ad_account_id: '',
    graph_api_version: 'v21.0',
    default_branch: '',
    default_lead_source: 'Facebook Lead Ads',
    default_utm_source: 'Facebook Lead Ads',
  });

  useEffect(() => {
    fetch('/api/admin/meta-leads/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data.settings);
        setEnv(data.envStatus);
        if (data.settings) {
          setForm({
            is_enabled: data.settings.is_enabled,
            page_id: data.settings.page_id || '',
            page_name: data.settings.page_name || '',
            ad_account_id: data.settings.ad_account_id || '',
            graph_api_version: data.settings.graph_api_version || 'v21.0',
            default_branch: data.settings.default_branch || '',
            default_lead_source: data.settings.default_lead_source || 'Facebook Lead Ads',
            default_utm_source: data.settings.default_utm_source || 'Facebook Lead Ads',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    const res = await fetch('/api/admin/meta-leads/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setMsg(res.ok ? 'Settings saved.' : 'Failed to save settings.');
    setSaving(false);
  };

  const testCrm = async () => {
    setTestingCrm(true); setMsg('');
    const res = await fetch('/api/admin/meta-leads/test-crm', { method: 'POST' });
    const data = await res.json();
    setMsg(data.success
      ? `CRM test successful! HTTP ${data.status}.`
      : `CRM test failed: ${data.error || `HTTP ${data.status}`}`);
    setTestingCrm(false);
  };

  const testMeta = async () => {
    setTestingMeta(true); setMsg('');
    const res = await fetch('/api/admin/meta-leads/test-meta', { method: 'POST' });
    const data = await res.json();
    setMsg(data.ok ? `Meta API: ${data.message}` : `Meta API error: ${data.message}`);
    setTestingMeta(false);
  };

  if (loading) return <div className="p-6 text-gray-400">Loading settings...</div>;

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/meta`
    : '/api/webhooks/meta';

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Meta Lead Ads — Settings</h1>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm ${msg.includes('failed') || msg.includes('error') || msg.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* Env Status */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-medium text-gray-900">Environment Variables</h2>
        <p className="text-xs text-gray-500">Tokens are only shown as set/missing — never exposed.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {env && Object.entries(env).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {val?.startsWith('✓') ? (
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              )}
              <span className="font-mono text-xs text-gray-500">{key}:</span>
              <span className={`text-xs ${val?.startsWith('✓') ? 'text-green-700' : 'text-red-600'}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook URL */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2">
        <h2 className="font-medium text-gray-900">Webhook Callback URL</h2>
        <p className="text-xs text-gray-500">Configure this URL in Meta Business → App → Webhooks → Page → leadgen</p>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <code className="flex-1 text-sm text-gray-800 break-all">{webhookUrl}</code>
          <button onClick={() => navigator.clipboard.writeText(webhookUrl)}
            className="shrink-0 rounded px-2 py-0.5 text-xs bg-gray-200 hover:bg-gray-300">Copy</button>
        </div>
        {settings?.last_webhook_at && (
          <p className="text-xs text-gray-500">Last webhook received: {new Date(settings.last_webhook_at).toLocaleString()}</p>
        )}
        {settings?.last_campaign_sync_at && (
          <p className="text-xs text-gray-500">Last campaign sync: {new Date(settings.last_campaign_sync_at).toLocaleString()}</p>
        )}
      </div>

      {/* Settings Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="font-medium text-gray-900">Integration Settings</h2>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_enabled" checked={form.is_enabled === 1}
            onChange={e => setForm(p => ({ ...p, is_enabled: e.target.checked ? 1 : 0 }))}
            className="h-4 w-4 rounded" />
          <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">Enable Meta Lead Ads Integration</label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { key: 'page_id', label: 'Facebook Page ID' },
            { key: 'page_name', label: 'Page Name (display only)' },
            { key: 'ad_account_id', label: 'Ad Account ID (without act_ prefix)' },
            { key: 'graph_api_version', label: 'Graph API Version (e.g. v21.0)' },
            { key: 'default_branch', label: 'Default Branch (for CRM)' },
            { key: 'default_lead_source', label: 'Default Lead Source' },
            { key: 'default_utm_source', label: 'Default UTM Source' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
              <input
                value={(form as Record<string, unknown>)[key] as string || ''}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Test Connections */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <h2 className="font-medium text-gray-900">Connection Tests</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={testMeta} disabled={testingMeta}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60">
            <Zap className={`h-4 w-4 ${testingMeta ? 'animate-spin' : ''}`} />
            Test Meta API Connection
          </button>
          <button onClick={testCrm} disabled={testingCrm}
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-60">
            <Activity className={`h-4 w-4 ${testingCrm ? 'animate-spin' : ''}`} />
            Test CRM Delivery (sends sample payload)
          </button>
        </div>
        <p className="text-xs text-gray-400">CRM test sends a clearly-labeled test record. Confirm it arrives in your CRM and delete it afterward.</p>
      </div>
    </div>
  );
}
