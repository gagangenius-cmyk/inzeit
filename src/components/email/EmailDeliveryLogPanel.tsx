'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface DeliveryEntry {
  id: number;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  providerMessageId: string | null;
  error: string | null;
  createdAt: string;
}

// Surfaces src/lib/mailer.ts's delivery log - previously outbound email had
// no visibility anywhere in the app; a silently-failing send (bad address,
// Resend outage, expired API key) left no trace except whatever console.error
// happened to catch on the server.
export default function EmailDeliveryLogPanel() {
  const [entries, setEntries] = useState<DeliveryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'failed'>('failed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = filter === 'failed' ? '?status=failed&limit=100' : '?limit=100';
      const res = await fetch(`/api/admin/email-delivery-log${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load delivery log');
      setEntries(json.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delivery log');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Email Delivery Log
          </h2>
          <p className="mt-1 text-sm text-gray-500">Every outbound email attempt (offer letters, monthly reports, client-portal notices, template sends) and whether it actually went through.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'failed')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="failed">Failed only</option>
            <option value="all">All sends</option>
          </select>
          <button onClick={load} className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && <p className="p-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="p-6 text-sm text-gray-500">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="flex items-center gap-2 p-6 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {filter === 'failed' ? 'No failed sends.' : 'No email activity recorded yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Recipient</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-500">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{entry.recipient}</td>
                  <td className="px-4 py-2">{entry.subject}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-500" title={entry.error || ''}>{entry.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
