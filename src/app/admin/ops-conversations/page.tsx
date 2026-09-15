'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-simple';
import { RecordCard, RecordList } from '@/components/shared/ResponsiveRecordList';
import {
  Search,
  MessageSquare,
  Calendar,
  RefreshCw,
  Eye,
  PhoneCall,
  Mail,
  Phone,
} from 'lucide-react';

interface ConversationRow {
  id: number;
  module: string;
  leadId: number;
  opportunityId: number | null;
  leadName: string;
  email: string;
  phone: string;
  caseOfficerName: string;
  updatedAt: string;
  conversation: {
    conversationDate: string | null;
    type: string;
    status: string;
    followUpDate: string | null;
    text: string;
    followUpRemarks: string;
  };
}

const MODULE_LABELS: Record<string, string> = {
  'skill-canada': 'Skill Canada',
  'skill-australia': 'Skill Australia',
  'poland-visa': 'Poland Visa',
  'eip-canada': 'EIP Canada',
  'visit-visa': 'Visit Visa',
};

const ConversationOps: React.FC = () => {
  const router = useRouter();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/admin/operations/conversations?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load conversations');
      setRows(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const getTypeIcon = (type: string) => {
    if (/email/i.test(type)) return <Mail className="h-4 w-4 text-orange-500" />;
    if (/walk/i.test(type)) return <Phone className="h-4 w-4 text-purple-500" />;
    return <PhoneCall className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'closed') return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
    if (normalized === 'open') return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
    if (!status) return <Badge className="bg-gray-100 text-gray-500">—</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
  };

  const filtered = rows.filter((row) => {
    const matchesModule = selectedModule === 'all' || row.module === selectedModule;
    const matchesStatus = selectedStatus === 'all' || row.conversation.status.toLowerCase() === selectedStatus;
    return matchesModule && matchesStatus;
  });

  const stats = {
    total: rows.length,
    open: rows.filter((r) => r.conversation.status.toLowerCase() === 'open').length,
    closed: rows.filter((r) => r.conversation.status.toLowerCase() === 'closed').length,
    withFollowUp: rows.filter((r) => r.conversation.followUpDate).length,
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
          <h1 className="text-3xl font-bold text-gray-900">Conversation Operations</h1>
          <p className="text-gray-600 mt-2">Conversation entries logged in each client's operations case</p>
        </div>
        <Button variant="outline" onClick={fetchConversations} className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.open}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.closed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Follow-up Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.withFollowUp}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by client name, email, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {Object.entries(MODULE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg shadow p-4">
        <RecordList
          isEmpty={filtered.length === 0}
          emptyIcon={MessageSquare}
          emptyTitle="No conversation entries found"
          emptyDescription="Conversations are logged from the client's operations case (Skill Canada, Skill Australia, Poland Visa, EIP Canada, or Visit Visa wizards)."
        >
          {filtered.map((row) => (
            <RecordCard
              key={`${row.module}-${row.id}`}
              avatar={getTypeIcon(row.conversation.type)}
              avatarColorClass="from-blue-600 to-cyan-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{row.leadName}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{MODULE_LABELS[row.module] || row.module}</span>
                  {getStatusBadge(row.conversation.status)}
                </>
              }
              metaItems={[{ icon: Mail, text: `${row.email}${row.email && row.phone ? ' · ' : ''}${row.phone}`, key: 'contact' }]}
              stats={[
                { label: 'Type', value: row.conversation.type || '—' },
                { label: 'Date', value: row.conversation.conversationDate ? new Date(row.conversation.conversationDate).toLocaleDateString() : '—' },
                { label: 'Follow-up', value: row.conversation.followUpDate ? <span className="text-amber-600">{new Date(row.conversation.followUpDate).toLocaleDateString()}</span> : '—' },
                { label: 'Case Officer', value: row.caseOfficerName || '—' },
              ]}
              extra={row.conversation.text ? <p className="mt-2 text-sm text-gray-600" title={row.conversation.text}>{row.conversation.text}</p> : undefined}
              actions={[
                { key: 'view', icon: Eye, label: 'View Lead', onClick: () => router.push(`/admin/leads/${row.leadId}/edit`) },
              ]}
            />
          ))}
        </RecordList>
      </div>
    </div>
  );
};

export default ConversationOps;
