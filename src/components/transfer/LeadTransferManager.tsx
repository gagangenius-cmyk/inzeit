'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { useState, useEffect } from 'react';
import {
  Users, CheckCircle, XCircle, Clock,
  Search, Eye, Plus,
  TrendingUp, BarChart3, Settings,
  UserCheck, UserX, RefreshCw, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LeadTransferRequest {
  id: string;
  leadId: number;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  fromEmployeeName: string;
  toEmployeeName: string;
  approverName?: string;
  reason: string;
  reassignmentType: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  notes?: string;
}

interface BranchManagerRow {
  id: number;
  name: string;
  branch: string;
  type: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export default function LeadTransferManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'managers' | 'analytics'>('requests');
  const [transferRequests, setTransferRequests] = useState<LeadTransferRequest[]>([]);
  const [branchManagers, setBranchManagers] = useState<BranchManagerRow[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeadTransferRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newRequest, setNewRequest] = useState({
    leadId: '', fromEmployeeId: '', toEmployeeId: '', reassignmentType: 'manual', reason: '',
  });

  const mapRow = (row: any): LeadTransferRequest => ({
    id: String(row.id),
    leadId: row.leadId,
    leadName: `${row.lead_fname || ''} ${row.lead_lname || ''}`.trim() || `Lead #${row.leadId}`,
    leadEmail: row.lead_email || '',
    leadPhone: row.lead_mobile,
    fromEmployeeName: row.from_employee_name || 'Unknown',
    toEmployeeName: row.to_employee_name || 'Unknown',
    approverName: row.approved_employee_name,
    reason: row.reason,
    reassignmentType: row.reassignmentType,
    status: row.status,
    requestedAt: row.createdAt,
    approvedAt: row.approvedAt,
    notes: row.notes,
  });

  const load = async () => {
    setIsLoading(true);
    try {
      const [reqRes, mgrRes] = await Promise.all([
        fetch('/api/lead-reassignments-working'),
        fetch('/api/admin/counselors'),
      ]);
      const reqJson = await reqRes.json();
      if (reqJson.success) setTransferRequests((reqJson.data || []).map(mapRow));

      const mgrJson = await mgrRes.json();
      const managers = (mgrJson.counselors || []).filter((c: any) => {
        const type = String(c.type || '').toLowerCase();
        return type.includes('branch manager') || type.includes('team leader') || type.includes('area manager');
      });
      setBranchManagers(managers);
    } catch (error) {
      console.error('Error loading lead transfers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true);
    try {
      await fetch(`/api/lead-reassignments-working?id=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', approvedBy: user?.id }),
      });
      load();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    setLoading(true);
    try {
      await fetch(`/api/lead-reassignments-working?id=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', approvedBy: user?.id, notes: reason }),
      });
      load();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.leadId || !newRequest.fromEmployeeId || !newRequest.toEmployeeId || !newRequest.reason) {
      window.toast.warning('Lead ID, from/to employee, and reason are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lead-reassignments-working', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: Number(newRequest.leadId),
          fromEmployeeId: Number(newRequest.fromEmployeeId),
          toEmployeeId: Number(newRequest.toEmployeeId),
          reassignmentType: newRequest.reassignmentType,
          reason: newRequest.reason,
          previousStatus: 'assigned',
          newStatus: 'assigned',
          createdBy: user?.id || 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create transfer request');
      setShowRequestModal(false);
      setNewRequest({ leadId: '', fromEmployeeId: '', toEmployeeId: '', reassignmentType: 'manual', reason: '' });
      load();
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to create transfer request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredRequests = transferRequests.filter(request => {
    const matchesSearch = !searchTerm ||
      request.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leadEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const { sorted: sortedRequests, sortKey: transferSortKey, sortDirection: transferSortDirection, toggleSort: toggleTransferSort } = useSortableData(
    filteredRequests,
    {
      lead: (r) => r.leadName,
      from: (r) => r.fromEmployeeName,
      to: (r) => r.toEmployeeName,
      reason: (r) => r.reason,
      type: (r) => r.reassignmentType,
      status: (r) => r.status,
      requested: (r) => r.requestedAt,
    },
  );

  const statistics = {
    totalRequests: transferRequests.length,
    pendingRequests: transferRequests.filter(r => r.status === 'pending').length,
    approvedRequests: transferRequests.filter(r => r.status === 'approved').length,
    rejectedRequests: transferRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lead Transfer Requests</h2>
            <p className="text-gray-600 mt-1">Requests to reassign leads between counsellors</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowRequestModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> New Transfer Request
            </button>
            <button onClick={load} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Requests</p><p className="text-2xl font-bold text-gray-900">{statistics.totalRequests}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-600">Pending</p><p className="text-2xl font-bold text-gray-900">{statistics.pendingRequests}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-600">Approved</p><p className="text-2xl font-bold text-gray-900">{statistics.approvedRequests}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg"><XCircle className="w-6 h-6 text-red-600" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-600">Rejected</p><p className="text-2xl font-bold text-gray-900">{statistics.rejectedRequests}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button onClick={() => setActiveTab('requests')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center"><Users className="w-4 h-4 mr-2" />Transfer Requests</div>
            </button>
            <button onClick={() => setActiveTab('managers')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'managers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center"><Settings className="w-4 h-4 mr-2" />Branch Managers</div>
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center"><BarChart3 className="w-4 h-4 mr-2" />Analytics</div>
            </button>
          </nav>
        </div>

        {activeTab === 'requests' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input type="text" placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <SearchableSelect value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </SearchableSelect>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableTh label="Lead" sortKey="lead" activeKey={transferSortKey} direction={transferSortDirection} onSort={toggleTransferSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="From" sortKey="from" activeKey={transferSortKey} direction={transferSortDirection} onSort={toggleTransferSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="To" sortKey="to" activeKey={transferSortKey} direction={transferSortDirection} onSort={toggleTransferSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Reason" sortKey="reason" activeKey={transferSortKey} direction={transferSortDirection} onSort={toggleTransferSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Type" sortKey="type" activeKey={transferSortKey} direction={transferSortDirection} onSort={toggleTransferSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Status" sortKey="status" activeKey={transferSortKey} direction={transferSortDirection} onSort={toggleTransferSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Requested" sortKey="requested" activeKey={transferSortKey} direction={transferSortDirection} onSort={toggleTransferSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">{isLoading ? 'Loading...' : 'No transfer requests found.'}</td></tr>
                  )}
                  {sortedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.leadName}</div>
                        <div className="text-sm text-gray-500">{request.leadEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.fromEmployeeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.toEmployeeName}</td>
                      <td className="px-6 py-4"><div className="max-w-xs truncate" title={request.reason}>{request.reason}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{request.reassignmentType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>{request.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(request.requestedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => setSelectedRequest(request)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                          {request.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveRequest(request.id)} disabled={loading} className="text-green-600 hover:text-green-800"><UserCheck className="w-4 h-4" /></button>
                              <button
                                onClick={() => { const reason = prompt('Please enter rejection reason:'); if (reason) handleRejectRequest(request.id, reason); }}
                                disabled={loading} className="text-red-600 hover:text-red-800"
                              ><UserX className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'managers' && (
          <div className="p-6">
            {branchManagers.length === 0 && <p className="text-sm text-gray-400">No branch managers found.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branchManagers.map((manager) => (
                <div key={manager.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{manager.name}</h3>
                  <p className="text-sm text-gray-500">{manager.branch}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div><span className="text-gray-600">Total Leads:</span> <span className="font-medium text-gray-900">{manager.totalLeads}</span></div>
                    <div><span className="text-gray-600">Converted:</span> <span className="font-medium text-gray-900">{manager.convertedLeads}</span></div>
                    <div><span className="text-gray-600">Conversion:</span> <span className="font-medium text-gray-900">{manager.conversionRate}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                  <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Requests</p><p className="text-2xl font-bold text-gray-900">{statistics.totalRequests}</p></div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg"><TrendingUp className="w-6 h-6 text-green-600" /></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.totalRequests > 0 ? ((statistics.approvedRequests / statistics.totalRequests) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Request Details</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Lead</h4>
                <p className="text-sm text-gray-900">{selectedRequest.leadName}</p>
                <p className="text-sm text-gray-600">{selectedRequest.leadEmail}</p>
                {selectedRequest.leadPhone && <p className="text-sm text-gray-600">{selectedRequest.leadPhone}</p>}
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Transfer</h4>
                <p className="text-sm text-gray-600">From: <span className="text-gray-900 font-medium">{selectedRequest.fromEmployeeName}</span></p>
                <p className="text-sm text-gray-600">To: <span className="text-gray-900 font-medium">{selectedRequest.toEmployeeName}</span></p>
                <p className="text-sm text-gray-600">Type: <span className="text-gray-900 font-medium capitalize">{selectedRequest.reassignmentType}</span></p>
              </div>
              <div className="md:col-span-2">
                <h4 className="text-md font-medium text-gray-900 mb-2">Reason</h4>
                <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
              </div>
              {selectedRequest.notes && (
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg"><p className="text-sm text-gray-900">{selectedRequest.notes}</p></div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">New Transfer Request</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead ID</label>
                <input type="number" value={newRequest.leadId} onChange={(e) => setNewRequest(f => ({ ...f, leadId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Employee ID</label>
                  <input type="number" value={newRequest.fromEmployeeId} onChange={(e) => setNewRequest(f => ({ ...f, fromEmployeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Employee ID</label>
                  <input type="number" value={newRequest.toEmployeeId} onChange={(e) => setNewRequest(f => ({ ...f, toEmployeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <SearchableSelect value={newRequest.reassignmentType} onChange={(e) => setNewRequest(f => ({ ...f, reassignmentType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="manual">Manual</option>
                  <option value="escalation">Escalation</option>
                  <option value="specialist_required">Specialist Required</option>
                  <option value="capacity_issue">Capacity Issue</option>
                </SearchableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={newRequest.reason} onChange={(e) => setNewRequest(f => ({ ...f, reason: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button onClick={() => setShowRequestModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateRequest} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
