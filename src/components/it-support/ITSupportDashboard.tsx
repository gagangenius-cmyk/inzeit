'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { useDebounce } from '@/hooks/useDebounce';
import { Plus, RefreshCw, Search, Clock, AlertTriangle, Wrench, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RaiseTicketModal from './RaiseTicketModal';
import TicketDetailPanel from './TicketDetailPanel';
import { ITSupportDashboardStats, ITSupportTicketRow } from './types';
import { WORKFLOW_STATUS_BADGE, PRIORITY_BADGE, FILTER_TABS, formatDateTime } from './statusStyles';

export default function ITSupportDashboard({ scope }: { scope: 'all' | 'mine' }) {
  const { token, hasPermission } = useAuth();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  // CEO/IT (and anyone else with full view-all rights) see every ticket on
  // "My Tickets" too, not just ones they personally raised — mirrors the
  // scoping in ITSupportService.listTickets.
  const seesAllOnMineTab = scope === 'mine' && hasPermission('it.view');

  const [stats, setStats] = useState<ITSupportDashboardStats | null>(null);
  const [tickets, setTickets] = useState<ITSupportTicketRow[]>([]);
  const { sorted: sortedTickets, sortKey: ticketSortKey, sortDirection: ticketSortDirection, toggleSort: toggleTicketSort } = useSortableData(
    tickets,
    {
      ticket: (t) => t.ticket_number || t.title,
      category: (t) => t.category,
      priority: (t) => t.priority,
      status: (t) => t.workflow_status,
      tat: (t) => t.due_at,
      branch: (t) => t.branch_name || t.branch_id,
    },
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tab = FILTER_TABS.find((item) => item.label === activeTab);
      const params = new URLSearchParams();
      if (tab?.workflowStatus) params.set('tab', tab.workflowStatus);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (scope === 'mine') params.set('mine', '1');

      const [statsRes, ticketsRes] = await Promise.all([
        fetch('/api/admin/it-support/dashboard', { headers: authHeaders }),
        fetch(`/api/admin/it-support/tickets?${params.toString()}`, { headers: authHeaders }),
      ]);
      const statsData = await statsRes.json();
      const ticketsData = await ticketsRes.json();
      if (!statsRes.ok) throw new Error(statsData.error || 'Failed to load dashboard');
      if (!ticketsRes.ok) throw new Error(ticketsData.error || 'Failed to load tickets');
      setStats(statsData);
      setTickets(ticketsData.tickets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load IT Support data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, scope, token]);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    { label: 'Open tickets', value: stats?.openTickets ?? 0, icon: <Wrench className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'Overdue (TAT breached)', value: stats?.overdueTickets ?? 0, icon: <AlertTriangle className="h-5 w-5 text-rose-600" />, bg: 'bg-rose-50' },
    { label: 'Awaiting IT action', value: stats?.awaitingItAction ?? 0, icon: <Clock className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50' },
    { label: 'Resolved / closed', value: stats?.resolvedClosed ?? 0, icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{scope === 'mine' ? 'My Tickets' : 'IT Support Dashboard'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {scope === 'mine' ? (seesAllOnMineTab ? 'All tickets across the company' : 'Tickets you have raised') : 'Overview of IT support activity'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setShowRaiseModal(true)} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            <Plus className="h-4 w-4" /> Raise a ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} flex items-center gap-3 rounded-lg p-4`}>
            {card.icon}
            <div>
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.label ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket # or title…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh label="Ticket" sortKey="ticket" activeKey={ticketSortKey} direction={ticketSortDirection} onSort={toggleTicketSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
                <SortableTh label="Category" sortKey="category" activeKey={ticketSortKey} direction={ticketSortDirection} onSort={toggleTicketSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
                <SortableTh label="Priority" sortKey="priority" activeKey={ticketSortKey} direction={ticketSortDirection} onSort={toggleTicketSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
                <SortableTh label="Status" sortKey="status" activeKey={ticketSortKey} direction={ticketSortDirection} onSort={toggleTicketSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
                <SortableTh label="TAT" sortKey="tat" activeKey={ticketSortKey} direction={ticketSortDirection} onSort={toggleTicketSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
                <SortableTh label="Branch" sortKey="branch" activeKey={ticketSortKey} direction={ticketSortDirection} onSort={toggleTicketSort} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">Loading…</td></tr>
              )}
              {!loading && sortedTickets.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">No tickets found.</td></tr>
              )}
              {!loading && sortedTickets.map((ticket) => {
                const overdue = ticket.status === 'Open' && new Date(ticket.due_at).getTime() < Date.now();
                return (
                  <tr key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-slate-900">{ticket.ticket_number || '—'}</p>
                      <p className="text-slate-500">{ticket.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ticket.category}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${PRIORITY_BADGE[ticket.priority] || ''}`}>{ticket.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${WORKFLOW_STATUS_BADGE[ticket.workflow_status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {ticket.workflow_status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${overdue ? 'font-medium text-rose-600' : 'text-slate-600'}`}>
                      {overdue ? `Overdue · ${formatDateTime(ticket.due_at)}` : formatDateTime(ticket.due_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ticket.branch_name || `#${ticket.branch_id}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showRaiseModal && (
        <RaiseTicketModal
          onClose={() => setShowRaiseModal(false)}
          onCreated={() => { setShowRaiseModal(false); load(); }}
        />
      )}

      {selectedTicketId && (
        <TicketDetailPanel
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
