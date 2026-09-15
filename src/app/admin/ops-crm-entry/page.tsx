'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-simple';
import { RecordCard, RecordList } from '@/components/shared/ResponsiveRecordList';
import {
  Search,
  Users,
  RefreshCw,
  Plus,
  X,
  FileText,
  ClipboardList,
  StickyNote,
  CheckCircle,
} from 'lucide-react';

interface CrmEntryRow {
  id: number;
  leadId: number;
  opportunityId: number | null;
  entry_type: string;
  source: string | null;
  category: string | null;
  sub_category: string | null;
  service: string | null;
  budget: string | null;
  timeline: string | null;
  expectations: string | null;
  urgency: 'low' | 'medium' | 'high';
  status: string;
  fname: string | null;
  lname: string | null;
  email: string | null;
  mobile: string | null;
  phone: string | null;
  assignedToName: string | null;
  created_at: string;
  updated_at: string;
  documentCount: number;
  documentApprovedCount: number;
  milestoneCount: number;
  milestoneCompletedCount: number;
}

interface CrmEntryDetail extends CrmEntryRow {
  requirements: { id: number; requirement: string }[];
  documents: { id: number; document_type: string; status: string; file_url: string | null }[];
  milestones: { id: number; phase: string; status: string; due_date: string | null; completed_date: string | null; notes: string | null }[];
  notes: { id: number; note: string; created_at: string; createdByName: string | null }[];
}

const STATUS_LABELS: Record<string, string> = {
  initial_contact: 'Initial Contact',
  qualification: 'Qualification',
  consultation: 'Consultation',
  proposal: 'Proposal',
  agreement: 'Agreement',
  onboarding: 'Onboarding',
  completed: 'Completed',
};
const STATUS_ORDER = Object.keys(STATUS_LABELS);

const URGENCY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const emptyNewEntry = { leadId: '', entry_type: 'Direct Inquiry', source: '', service: '', budget: '', timeline: '', urgency: 'medium', expectations: '' };

const CRMEntryOps: React.FC = () => {
  const [rows, setRows] = useState<CrmEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CrmEntryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEntry, setNewEntry] = useState(emptyNewEntry);
  const [creating, setCreating] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      const res = await fetch(`/api/admin/crm-entries?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load CRM entries');
      setRows(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CRM entries');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const loadDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/crm-entries/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setDetail(json.data);
    } catch {
      window.toast?.error('Failed to load entry detail');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id);
    loadDetail(id);
  };

  const handleAddNote = async (entryId: number) => {
    if (!noteDraft.trim()) return;
    try {
      const res = await fetch(`/api/admin/crm-entries/${entryId}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteDraft.trim() }),
      });
      if (!res.ok) throw new Error();
      setNoteDraft('');
      loadDetail(entryId);
    } catch {
      window.toast?.error('Failed to add note');
    }
  };

  const handleCreate = async () => {
    if (!newEntry.leadId) { window.toast?.warning('Lead ID is required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/crm-entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEntry, leadId: Number(newEntry.leadId) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create entry');
      window.toast?.success('CRM entry created');
      setShowCreateModal(false);
      setNewEntry(emptyNewEntry);
      fetchRows();
    } catch (err) {
      window.toast?.error(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setCreating(false);
    }
  };

  const stats = {
    total: rows.length,
    inProgress: rows.filter((r) => !['completed'].includes(r.status)).length,
    completed: rows.filter((r) => r.status === 'completed').length,
    highUrgency: rows.filter((r) => r.urgency === 'high').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Entry Operations</h1>
          <p className="text-gray-600 mt-2">Client acquisition intake: requirements, documents, and milestones per case</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchRows} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 flex items-center">
            <Plus className="h-4 w-4 mr-2" /> New Entry
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.inProgress}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Urgency</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.highUrgency}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search by name, email, mobile, or service..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg shadow p-4">
        <RecordList
          isEmpty={rows.length === 0}
          emptyIcon={Users}
          emptyTitle="No CRM entries yet"
          emptyDescription='Click "New Entry" to log a client&apos;s acquisition intake.'
        >
          {rows.map((row) => {
            const expanded = expandedId === row.id;
            return (
              <RecordCard
                key={row.id}
                className="cursor-pointer"
                avatar={<span className="text-sm font-semibold">{expanded ? '-' : '+'}</span>}
                avatarColorClass="from-blue-600 to-cyan-400"
                title={
                  <button type="button" onClick={() => toggleExpand(row.id)} className="min-w-0 break-words text-left text-base font-bold text-gray-950" aria-expanded={expanded}>
                    {[row.fname, row.lname].filter(Boolean).join(' ') || `Lead ${row.leadId}`}
                  </button>
                }
                titleBadges={
                  <>
                    <Badge className={URGENCY_COLORS[row.urgency]}>{row.urgency}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">{STATUS_LABELS[row.status] || row.status}</Badge>
                  </>
                }
                metaItems={[{ icon: Search, text: `${row.email || ''}${row.email && (row.mobile || row.phone) ? ' · ' : ''}${row.mobile || row.phone || ''}`, key: 'contact' }]}
                stats={[
                  { label: 'Entry Type / Service', value: `${row.entry_type}${row.service ? ` · ${row.service}` : ''}` },
                  { label: 'Budget / Timeline', value: `${row.budget || '—'}${row.timeline ? ` · ${row.timeline}` : ''}` },
                  { label: 'Documents', value: <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{row.documentApprovedCount}/{row.documentCount}</span> },
                ]}
                actions={[
                  { key: 'toggle', icon: expanded ? X : ClipboardList, label: expanded ? 'Collapse' : 'Expand', onClick: () => toggleExpand(row.id) },
                ]}
                extra={expanded ? (
                  detailLoading ? (
                    <div className="mt-3 text-sm text-gray-500">Loading...</div>
                  ) : detail && detail.id === row.id ? (
                    <div className="mt-3 grid grid-cols-1 gap-4 rounded-lg bg-blue-50/40 p-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Requirements</p>
                        {detail.requirements.length === 0 && <p className="text-sm text-gray-400">None recorded</p>}
                        <ul className="text-sm list-disc list-inside space-y-0.5">
                          {detail.requirements.map((r) => <li key={r.id}>{r.requirement}</li>)}
                        </ul>
                        {detail.expectations && <p className="text-xs text-gray-500 mt-2">Expectations: {detail.expectations}</p>}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Documents</p>
                        {detail.documents.length === 0 && <p className="text-sm text-gray-400">No documents tracked</p>}
                        <div className="space-y-1">
                          {detail.documents.map((d) => (
                            <div key={d.id} className="flex items-center justify-between text-sm">
                              <span>{d.document_type}</span>
                              <Badge className={d.status === 'approved' ? 'bg-green-100 text-green-800' : d.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}>{d.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Milestones</p>
                        {detail.milestones.length === 0 && <p className="text-sm text-gray-400">No milestones tracked</p>}
                        <div className="space-y-1">
                          {detail.milestones.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-sm">
                              <span>{m.phase}</span>
                              <Badge className={m.status === 'completed' ? 'bg-green-100 text-green-800' : m.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}>{m.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2 flex items-center gap-1"><StickyNote className="h-3.5 w-3.5" /> Notes</p>
                        <div className="space-y-1 max-h-28 overflow-y-auto mb-2">
                          {detail.notes.length === 0 && <p className="text-sm text-gray-400">No notes yet</p>}
                          {detail.notes.map((n) => (
                            <div key={n.id} className="text-xs text-gray-600 border-b border-gray-100 pb-1">
                              <span className="font-medium">{n.createdByName || 'Someone'}:</span> {n.note}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note..." className="text-xs h-8" onClick={(e) => e.stopPropagation()} />
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAddNote(row.id); }} className="h-8">Add</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-red-500">Failed to load detail.</p>
                  )
                ) : undefined}
              />
            );
          })}
        </RecordList>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New CRM Entry</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead ID *</label>
                <input type="number" value={newEntry.leadId} onChange={(e) => setNewEntry((f) => ({ ...f, leadId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
                  <select value={newEntry.entry_type} onChange={(e) => setNewEntry((f) => ({ ...f, entry_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {['Direct Inquiry', 'Referral', 'Walk-in', 'Website', 'Campaign'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select value={newEntry.urgency} onChange={(e) => setNewEntry((f) => ({ ...f, urgency: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {['low', 'medium', 'high'].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <input value={newEntry.service} onChange={(e) => setNewEntry((f) => ({ ...f, service: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input value={newEntry.budget} onChange={(e) => setNewEntry((f) => ({ ...f, budget: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                  <input value={newEntry.timeline} onChange={(e) => setNewEntry((f) => ({ ...f, timeline: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expectations</label>
                <textarea value={newEntry.expectations} onChange={(e) => setNewEntry((f) => ({ ...f, expectations: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} className="bg-blue-600 hover:bg-blue-700">{creating ? 'Creating...' : 'Create Entry'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMEntryOps;
