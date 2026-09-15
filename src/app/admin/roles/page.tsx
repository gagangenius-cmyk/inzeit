'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmRole } from '@/models/CrmRole';
import type { CrmRoleAttributes } from '@/models/CrmRole';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function RolesManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [roles, setRoles] = useState<CrmRoleAttributes[]>([]);
  const { sorted: sortedRoles, sortKey: roleSortKey, sortDirection: roleSortDirection, toggleSort: toggleRoleSort } = useSortableData(
    roles,
    {
      name: (r) => r.name,
      type: (r) => r.type,
      hierarchy: (r) => r.hierarchy,
      departmentId: (r) => r.department_id,
      status: (r) => r.status,
    },
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<CrmRoleAttributes | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: ''
  });
  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(roles);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [pagination.page, pagination.limit, filters.status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchRoles();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status !== '' && { status: filters.status })
      });

      const response = await fetch(`/api/admin/roles?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRoles(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching roles:', data.error);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRole = (role: CrmRoleAttributes) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const handleEditRole = (role: CrmRoleAttributes) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('Are you sure you want to delete this role? This may affect associated employees.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRoles();
      } else {
        const error = await response.json();
        window.toast.error('Error deleting role: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      window.toast.error('Error deleting role');
    }
  };

  const handleAddRole = async (roleData: Partial<CrmRoleAttributes>) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchRoles();
      } else {
        const error = await response.json();
        window.toast.error('Error adding role: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding role:', error);
      window.toast.error('Error adding role');
    }
  };

  const handleUpdateRole = async (roleData: Partial<CrmRoleAttributes>) => {
    if (!selectedRole) return;

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedRole.id, ...roleData }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        const error = await response.json();
        window.toast.error('Error updating role: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      window.toast.error('Error updating role');
    }
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const setBulkStatus = async (status: 0 | 1) => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch('/api/admin/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      ));
      clear();
      fetchRoles();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch(`/api/admin/roles?id=${id}`, { method: 'DELETE' })
      ));
      clear();
      fetchRoles();
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all roles</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Role
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search roles by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Select all
        </div>
        <SortButtonRow
          options={[
            ['name', 'Role Name'],
            ['type', 'Type'],
            ['hierarchy', 'Hierarchy'],
            ['departmentId', 'Department ID'],
            ['status', 'Status'],
          ] as const}
          activeKey={roleSortKey}
          direction={roleSortDirection}
          onSort={toggleRoleSort}
        />
        <RecordList isEmpty={false}>
          {sortedRoles.map((role: CrmRoleAttributes) => (
            <RecordCard
              key={role.id}
              avatar={
                <input
                  type="checkbox"
                  checked={isSelected(role.id)}
                  onChange={(e) => toggleOne(role.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              }
              avatarColorClass="from-gray-100 to-gray-100"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{role.name}</span>}
              titleBadges={
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(role.status)}`}>
                  {role.status === 1 ? 'Active' : 'Inactive'}
                </span>
              }
              stats={[
                { label: 'Type', value: role.type },
                { label: 'Hierarchy', value: role.hierarchy },
                { label: 'Department ID', value: role.department_id },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewRole(role) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => handleEditRole(role) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDeleteRole(role.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onActivate={() => setBulkStatus(1)}
        onDeactivate={() => setBulkStatus(0)}
        onDelete={handleBulkDelete}
        onClear={clear}
        entityLabel="role"
        deleteConfirmMessage={`Delete ${selectedIds.size} role(s)? This may affect associated employees. This cannot be undone.`}
      />

      {/* Pagination */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Role Details Modal */}
      {showModal && selectedRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Role Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Basic Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Role ID:</span> {selectedRole.id}</p>
                    <p><span className="font-medium">Role Name:</span> {selectedRole.name}</p>
                    <p><span className="font-medium">Type:</span> {selectedRole.type}</p>
                    <p><span className="font-medium">Hierarchy:</span> {selectedRole.hierarchy}</p>
                    <p><span className="font-medium">Department ID:</span> {selectedRole.department_id}</p>
                    <p><span className="font-medium">Status:</span> {selectedRole.status === 1 ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  handleEditRole(selectedRole);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <RoleFormModal
          title="Add New Role"
          onSubmit={handleAddRole}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <RoleFormModal
          title="Edit Role"
          initialData={selectedRole}
          onSubmit={handleUpdateRole}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
}

// Role Form Modal Component
interface RoleFormModalProps {
  title: string;
  initialData?: CrmRoleAttributes | null;
  onSubmit: (data: Partial<CrmRoleAttributes>) => void;
  onClose: () => void;
}

function RoleFormModal({ title, initialData, onSubmit, onClose }: RoleFormModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || '',
    hierarchy: initialData?.hierarchy || 1,
    department_id: initialData?.department_id || 1,
    status: initialData?.status ?? 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <input
                type="text"
                required
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hierarchy *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.hierarchy}
                onChange={(e) => setFormData(prev => ({ ...prev, hierarchy: parseInt(e.target.value) || 1 }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department ID *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.department_id}
                onChange={(e) => setFormData(prev => ({ ...prev, department_id: parseInt(e.target.value) || 1 }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <SearchableSelect
                required
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </SearchableSelect>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initialData ? 'Update Role' : 'Add Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
