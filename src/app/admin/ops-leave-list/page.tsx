'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-simple';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Eye,
  Ban,
} from 'lucide-react';

interface LeaveRequest {
  leave_id: string;
  employee_id: string;
  employee_name: string | null;
  manager_id: string | null;
  manager_name: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: string | number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  workflow_status: string;
  reason: string | null;
  medical_certificate_required: number;
  document_url: string | null;
  applied_at: string;
  manager_status: 'Pending' | 'Approved' | 'Rejected';
  manager_reviewed_at: string | null;
  manager_comment: string | null;
  hr_status: 'Pending' | 'Confirmed' | 'Overridden';
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Hajj Leave', 'Bereavement Leave', 'Unpaid Leave', 'Compensatory Leave'];

const OpsLeaveList: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      const res = await fetch(`/api/admin/hr/leave?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load leave requests');
      setRequests(json.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleReview = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    setActionBusy(leaveId);
    try {
      const res = await fetch('/api/admin/hr/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leave_id: leaveId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update leave request');
      window.toast?.success(`Leave request ${status.toLowerCase()}.`);
      fetchRequests();
    } catch (err) {
      window.toast?.error(err instanceof Error ? err.message : 'Failed to update leave request');
    } finally {
      setActionBusy(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'Rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'Cancelled': return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case 'Confirmed': return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'Overridden': return <Badge className="bg-orange-100 text-orange-800">Overridden</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const filteredRequests = requests.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term
      || (r.employee_name || '').toLowerCase().includes(term)
      || r.leave_type.toLowerCase().includes(term)
      || (r.reason || '').toLowerCase().includes(term);
    const matchesLeaveType = selectedLeaveType === 'all' || r.leave_type === selectedLeaveType;
    return matchesSearch && matchesLeaveType;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'Pending').length,
    approved: requests.filter((r) => r.status === 'Approved').length,
    rejected: requests.filter((r) => r.status === 'Rejected').length,
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
          <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-2">Employee leave applications and their manager/HR approval status</p>
        </div>
        <Button variant="outline" onClick={fetchRequests} className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.pending}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.approved}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.rejected}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by employee, leave type, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Leave Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leave Types</SelectItem>
                  {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredRequests.map((req) => (
          <Card key={req.leave_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{req.employee_name || `Employee #${req.employee_id}`}</h3>
                  <p className="text-sm text-gray-600">{req.leave_type} &middot; {req.days_requested} day(s)</p>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Leave Period</p>
                  <p className="font-medium">{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reason</p>
                  <p className="font-medium">{req.reason || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Manager</p>
                  <p className="font-medium">{req.manager_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Applied</p>
                  <p className="font-medium">{req.applied_at ? new Date(req.applied_at).toLocaleDateString() : '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Manager Approval</p>
                  {getStatusBadge(req.manager_status)}
                  {req.manager_comment && <p className="text-xs text-gray-500 mt-1">{req.manager_comment}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">HR Status</p>
                  {getStatusBadge(req.hr_status)}
                  {req.review_notes && <p className="text-xs text-gray-500 mt-1">{req.review_notes}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Supporting Document</p>
                  {req.document_url ? (
                    <a href={req.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 text-sm">
                      <Eye className="h-4 w-4" /> View document
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{req.medical_certificate_required ? 'Required, not uploaded' : 'None required'}</span>
                  )}
                </div>
              </div>

              {req.status === 'Pending' && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    size="sm" variant="outline"
                    disabled={actionBusy === req.leave_id}
                    onClick={() => handleReview(req.leave_id, 'Rejected')}
                    className="flex items-center text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={actionBusy === req.leave_id}
                    onClick={() => handleReview(req.leave_id, 'Approved')}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpsLeaveList;
