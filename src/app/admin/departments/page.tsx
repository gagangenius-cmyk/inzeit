'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmDepartment } from '@/models/CrmDepartment';
import type { CrmDepartmentAttributes } from '@/models/CrmDepartment';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function DepartmentsManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [departments, setDepartments] = useState<CrmDepartmentAttributes[]>([]);
  const { sorted: sortedDepartments, sortKey: departmentSortKey, sortDirection: departmentSortDirection, toggleSort: toggleDepartmentSort } = useSortableData(
    departments,
    {
      id: (d) => d.id,
      name: (d) => d.name,
      status: (d) => d.status,
    },
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<CrmDepartmentAttributes | null>(null);
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
  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(departments);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [pagination.page, pagination.limit, filters.status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchDepartments();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status !== '' && { status: filters.status })
      });

      const response = await fetch(`/api/admin/departments?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDepartments(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching departments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDepartment = (department: CrmDepartmentAttributes) => {
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const handleEditDepartment = (department: CrmDepartmentAttributes) => {
    setSelectedDepartment(department);
    setShowEditModal(true);
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/departments?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDepartments();
      } else {
        const error = await response.json();
        window.toast.error('Error deleting department: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      window.toast.error('Error deleting department');
    }
  };

  const handleAddDepartment = async (departmentData: Partial<CrmDepartmentAttributes>) => {
    try {
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchDepartments();
      } else {
        const error = await response.json();
        window.toast.error('Error adding department: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding department:', error);
      window.toast.error('Error adding department');
    }
  };

  const handleUpdateDepartment = async (departmentData: Partial<CrmDepartmentAttributes>) => {
    if (!selectedDepartment) return;

    try {
      const response = await fetch('/api/admin/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedDepartment.id, ...departmentData }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedDepartment(null);
        fetchDepartments();
      } else {
        const error = await response.json();
        window.toast.error('Error updating department: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating department:', error);
      window.toast.error('Error updating department');
    }
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const setBulkStatus = async (status: 0 | 1) => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch('/api/admin/departments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      ));
      clear();
      fetchDepartments();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch(`/api/admin/departments?id=${id}`, { method: 'DELETE' })
      ));
      clear();
      fetchDepartments();
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
          <h1 className="text-3xl font-bold text-gray-900">Departments Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all departments</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Department
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search departments by name..."
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

      {/* Departments Table */}
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
            ['id', 'ID'],
            ['name', 'Name'],
            ['status', 'Status'],
          ] as const}
          activeKey={departmentSortKey}
          direction={departmentSortDirection}
          onSort={toggleDepartmentSort}
        />
        <RecordList isEmpty={false}>
          {sortedDepartments.map((department: CrmDepartmentAttributes) => (
            <RecordCard
              key={department.id}
              avatar={
                <input
                  type="checkbox"
                  checked={isSelected(department.id)}
                  onChange={(e) => toggleOne(department.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              }
              avatarColorClass="from-gray-100 to-gray-100"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{department.name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{department.id}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(department.status)}`}>
                    {department.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </>
              }
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewDepartment(department) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => handleEditDepartment(department) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDeleteDepartment(department.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
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
        entityLabel="department"
        deleteConfirmMessage={`Delete ${selectedIds.size} department(s)? This cannot be undone.`}
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

      {/* Department Details Modal */}
      {showModal && selectedDepartment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Department Details</h3>
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
                    <p><span className="font-medium">Department ID:</span> {selectedDepartment.id}</p>
                    <p><span className="font-medium">Name:</span> {selectedDepartment.name}</p>
                    <p><span className="font-medium">Status:</span> {selectedDepartment.status === 1 ? 'Active' : 'Inactive'}</p>
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
                  handleEditDepartment(selectedDepartment);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <DepartmentFormModal
          title="Add New Department"
          onSubmit={handleAddDepartment}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <DepartmentFormModal
          title="Edit Department"
          initialData={selectedDepartment}
          onSubmit={handleUpdateDepartment}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDepartment(null);
          }}
        />
      )}
    </div>
  );
}

// Department Form Modal Component
interface DepartmentFormModalProps {
  title: string;
  initialData?: CrmDepartmentAttributes | null;
  onSubmit: (data: Partial<CrmDepartmentAttributes>) => void;
  onClose: () => void;
}

function DepartmentFormModal({ title, initialData, onSubmit, onClose }: DepartmentFormModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    status: initialData?.status ?? 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-3/4 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              {initialData ? 'Update Department' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
