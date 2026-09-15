'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import {
  Users, ArrowRightLeft, Calendar, Clock, CheckCircle, XCircle,
  AlertTriangle, RefreshCw, Eye, Edit, Trash2, Plus, Save,
  Search, Filter, Download, Mail, Phone, MapPin
} from 'lucide-react';

interface Lead {
  id: number;
  fname: string;
  lname: string;
  email: string;
  mobile: string;
  phone: string;
  assignTo: number;
  status: string;
  service_interest: string;
  nationality: string;
  address: string;
  created: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Reassignment {
  id: number;
  leadId: number;
  fromEmployeeId: number;
  toEmployeeId: number;
  reassignmentType: string;
  reason: string;
  previousStatus: string;
  newStatus: string;
  reassignmentDate: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: number | null;
  approvedAt: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  lead_fname: string;
  lead_lname: string;
  lead_email: string;
  lead_mobile: string;
  from_employee_name: string;
  to_employee_name: string;
}

export default function LeadReassignmentWorking() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reassignments, setReassignments] = useState<Reassignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    leadId: '',
    fromEmployeeId: '',
    toEmployeeId: '',
    reassignmentType: 'manual',
    reason: '',
    previousStatus: '',
    newStatus: '',
    notes: '',
    autoApprove: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads
      const leadsResponse = await fetch('/api/leads');
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData.data || []);
      }

      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.data || []);
      }

      // Fetch reassignments
      const reassignmentsResponse = await fetch('/api/lead-reassignments-working');
      if (reassignmentsResponse.ok) {
        const reassignmentsData = await reassignmentsResponse.json();
        setReassignments(reassignmentsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReassignment = async () => {
    try {
      // Validate form
      if (!formData.leadId || !formData.fromEmployeeId || !formData.toEmployeeId || !formData.reason) {
        window.toast.error('Please fill in all required fields');
        return;
      }

      const selectedLeadData = leads.find(l => l.id === parseInt(formData.leadId));
      if (!selectedLeadData) {
        window.toast.error('Lead not found');
        return;
      }

      const payload = {
        ...formData,
        leadId: parseInt(formData.leadId),
        fromEmployeeId: parseInt(formData.fromEmployeeId),
        toEmployeeId: parseInt(formData.toEmployeeId),
        previousStatus: selectedLeadData.status,
        newStatus: selectedLeadData.status,
        createdBy: 1 // Should come from auth context
      };

      const response = await fetch('/api/lead-reassignments-working', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        window.toast.success('Reassignment created successfully!');
        setShowCreateForm(false);
        setFormData({
          leadId: '',
          fromEmployeeId: '',
          toEmployeeId: '',
          reassignmentType: 'manual',
          reason: '',
          previousStatus: '',
          newStatus: '',
          notes: '',
          autoApprove: false
        });
        fetchData();
      } else {
        const error = await response.json();
        window.toast.error('Failed to create reassignment: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating reassignment:', error);
      window.toast.error('Failed to create reassignment');
    }
  };

  const handleApproveReassignment = async (reassignmentId: number) => {
    try {
      const response = await fetch(`/api/lead-reassignments-working?id=${reassignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          approvedBy: 1 // Should come from auth context
        })
      });

      if (response.ok) {
        window.toast.success('Reassignment approved successfully!');
        fetchData();
      } else {
        const error = await response.json();
        window.toast.error('Failed to approve reassignment: ' + error.error);
      }
    } catch (error) {
      console.error('Error approving reassignment:', error);
      window.toast.error('Failed to approve reassignment');
    }
  };

  const handleRejectReassignment = async (reassignmentId: number) => {
    try {
      const response = await fetch(`/api/lead-reassignments-working?id=${reassignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          approvedBy: 1 // Should come from auth context
        })
      });

      if (response.ok) {
        window.toast.success('Reassignment rejected successfully!');
        fetchData();
      } else {
        const error = await response.json();
        window.toast.error('Failed to reject reassignment: ' + error.error);
      }
    } catch (error) {
      console.error('Error rejecting reassignment:', error);
      window.toast.error('Failed to reject reassignment');
    }
  };

  const handleDeleteReassignment = async (reassignmentId: number) => {
    if (!confirm('Are you sure you want to delete this reassignment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lead-reassignments-working?id=${reassignmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        window.toast.success('Reassignment deleted successfully!');
        fetchData();
      } else {
        const error = await response.json();
        window.toast.error('Failed to delete reassignment: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting reassignment:', error);
      window.toast.error('Failed to delete reassignment');
    }
  };

  const filteredReassignments = reassignments.filter(reassignment => {
    const matchesSearch = 
      reassignment.lead_fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reassignment.lead_lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reassignment.from_employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reassignment.to_employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reassignment.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || reassignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading lead reassignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Reassignment Management</h1>
          <p className="text-gray-600 mt-1">Manage lead reassignments and track status</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Reassignment
          </button>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reassignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <SearchableSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reassignments</p>
              <p className="text-2xl font-bold text-gray-900">{reassignments.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reassignments.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {reassignments.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {reassignments.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Reassignments Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReassignments.map((reassignment) => (
                <tr key={reassignment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reassignment.lead_fname} {reassignment.lead_lname}
                      </div>
                      <div className="text-sm text-gray-500">{reassignment.lead_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reassignment.from_employee_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reassignment.to_employee_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {reassignment.reassignmentType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs" title={reassignment.reason}>
                      {reassignment.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      reassignment.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : reassignment.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reassignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reassignment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {reassignment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveReassignment(reassignment.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRejectReassignment(reassignment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteReassignment(reassignment.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Reassignment Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Reassignment</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead *</label>
                  <SearchableSelect
                    value={formData.leadId}
                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Lead</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.fname} {lead.lname} - {lead.service_interest}
                      </option>
                    ))}
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Employee *</label>
                  <SearchableSelect
                    value={formData.fromEmployeeId}
                    onChange={(e) => setFormData({ ...formData, fromEmployeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.role}
                      </option>
                    ))}
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Employee *</label>
                  <SearchableSelect
                    value={formData.toEmployeeId}
                    onChange={(e) => setFormData({ ...formData, toEmployeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.role}
                      </option>
                    ))}
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reassignment Type</label>
                  <SearchableSelect
                    value={formData.reassignmentType}
                    onChange={(e) => setFormData({ ...formData, reassignmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                    <option value="escalation">Escalation</option>
                    <option value="transfer">Transfer</option>
                    <option value="reallocation">Reallocation</option>
                  </SearchableSelect>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reassignment reason..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes (optional)..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={formData.autoApprove}
                  onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="autoApprove" className="text-sm text-gray-700">
                  Auto-approve and update lead assignment
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReassignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
