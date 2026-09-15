'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmBranch, CrmBranchAttributes } from '@/models';
import type { CrmRegionAttributes } from '@/models/CrmRegion';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2, Building2, Mail } from 'lucide-react';

export default function BranchesManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [branches, setBranches] = useState<CrmBranchAttributes[]>([]);
  const { sorted: sortedBranches, sortKey: branchSortKey, sortDirection: branchSortDirection, toggleSort: toggleBranchSort } = useSortableData(
    branches,
    {
      name: (b) => b.name,
      code: (b) => b.branch,
      email: (b) => b.email,
      mobile: (b) => b.mobile,
      website: (b) => b.website,
      status: (b) => b.status,
    },
  );
  const [regions, setRegions] = useState<CrmRegionAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<CrmBranchAttributes | null>(null);
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
    region: '',
    status: ''
  });
  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(branches);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [pagination.page, pagination.limit, filters.region, filters.status]);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/admin/regions?limit=1000');
      const data = await response.json();
      if (response.ok) {
        setRegions(data.data);
      } else {
        console.error('Error fetching regions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchBranches();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.region && { region: filters.region }),
        ...(filters.status !== '' && { status: filters.status })
      });

      const response = await fetch(`/api/admin/branches?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBranches(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching branches:', data.error);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBranch = (branch: CrmBranchAttributes) => {
    setSelectedBranch(branch);
    setShowModal(true);
  };

  const handleEditBranch = (branch: CrmBranchAttributes) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/branches?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBranches();
      } else {
        const error = await response.json();
        window.toast.error('Error deleting branch: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      window.toast.error('Error deleting branch');
    }
  };

  const handleAddBranch = async (branchData: Partial<CrmBranchAttributes>) => {
    try {
      const response = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData),
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchBranches();
      } else {
        const error = await response.json();
        window.toast.error('Error adding branch: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding branch:', error);
      window.toast.error('Error adding branch');
    }
  };

  const handleUpdateBranch = async (branchData: Partial<CrmBranchAttributes>) => {
    if (!selectedBranch) return;

    try {
      const response = await fetch('/api/admin/branches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedBranch.id, ...branchData }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedBranch(null);
        fetchBranches();
      } else {
        const error = await response.json();
        window.toast.error('Error updating branch: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      window.toast.error('Error updating branch');
    }
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const setBulkStatus = async (status: 0 | 1) => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch('/api/admin/branches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      ));
      clear();
      fetchBranches();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch(`/api/admin/branches?id=${id}`, { method: 'DELETE' })
      ));
      clear();
      fetchBranches();
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
          <h1 className="text-3xl font-bold text-gray-900">Branches Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all branches</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Branch
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search branches by name, code, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect 
            value={filters.region}
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Regions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </SearchableSelect>
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

      {/* Branches Table */}
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
            ['name', 'Branch'],
            ['code', 'Code'],
            ['email', 'Email'],
            ['mobile', 'Mobile'],
            ['website', 'Website'],
            ['status', 'Status'],
          ] as const}
          activeKey={branchSortKey}
          direction={branchSortDirection}
          onSort={toggleBranchSort}
        />
        <RecordList isEmpty={false}>
          {sortedBranches.map((branch: CrmBranchAttributes) => (
            <RecordCard
              key={branch.id}
              avatar={
                <input
                  type="checkbox"
                  checked={isSelected(branch.id)}
                  onChange={(e) => toggleOne(branch.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              }
              avatarColorClass="from-gray-100 to-gray-100"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{branch.name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{branch.branch}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(branch.status)}`}>
                    {branch.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </>
              }
              metaItems={[
                { icon: Building2, text: branch.ar_name || '—', key: 'arname' },
                { icon: Mail, text: `${branch.email || '—'} · ${branch.mobile || '—'}`, key: 'contact' },
              ]}
              stats={[
                { label: 'Abbreviation', value: branch.abbrv || '—' },
                { label: 'Website', value: branch.website ? <a href={`http://${branch.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{branch.website}</a> : '—' },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewBranch(branch) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => handleEditBranch(branch) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDeleteBranch(branch.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
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
        entityLabel="branch"
        deleteConfirmMessage={`Delete ${selectedIds.size} branch(es)? This cannot be undone.`}
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

      {/* Branch Details Modal */}
      {showModal && selectedBranch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Branch Details</h3>
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
                    <p><span className="font-medium">Branch Name:</span> {selectedBranch.name}</p>
                    <p><span className="font-medium">Arabic Name:</span> {selectedBranch.ar_name}</p>
                    <p><span className="font-medium">Branch Code:</span> {selectedBranch.branch}</p>
                    <p><span className="font-medium">Abbreviation:</span> {selectedBranch.abbrv}</p>
                    <p><span className="font-medium">Region:</span> {regions.find((r) => r.id === selectedBranch.region)?.name || selectedBranch.region}</p>
                    <p><span className="font-medium">License / GST Number:</span> {selectedBranch.license_number || 'Not set'}</p>
                    <p><span className="font-medium">VAT/GST %:</span> {selectedBranch.vat_gst_percent ?? 'Not set'}</p>
                    <p><span className="font-medium">Status:</span> {selectedBranch.status === 1 ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Contact Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Email:</span> {selectedBranch.email}</p>
                    <p><span className="font-medium">Mobile:</span> {selectedBranch.mobile}</p>
                    <p><span className="font-medium">Website:</span> 
                      <a
                        href={`http://${selectedBranch.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        {selectedBranch.website}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Address Information</h4>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">English Address:</span></p>
                    <p className="mt-1 text-gray-600">{selectedBranch.address}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Arabic Address:</span></p>
                    <p className="mt-1 text-gray-600" style={{ direction: 'rtl' }}>
                      {selectedBranch.ar_address}
                    </p>
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
                  handleEditBranch(selectedBranch);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddModal && (
        <BranchFormModal
          title="Add New Branch"
          regions={regions}
          onSubmit={handleAddBranch}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Branch Modal */}
      {showEditModal && selectedBranch && (
        <BranchFormModal
          title="Edit Branch"
          initialData={selectedBranch}
          regions={regions}
          onSubmit={handleUpdateBranch}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBranch(null);
          }}
        />
      )}
    </div>
  );
}

// Branch Form Modal Component
interface BranchFormModalProps {
  title: string;
  initialData?: CrmBranchAttributes | null;
  regions: CrmRegionAttributes[];
  onSubmit: (data: Partial<CrmBranchAttributes>) => void;
  onClose: () => void;
}

function BranchFormModal({ title, initialData, regions, onSubmit, onClose }: BranchFormModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    ar_name: initialData?.ar_name || '',
    branch: initialData?.branch || '',
    region: initialData?.region || 0,
    abbrv: initialData?.abbrv || '',
    address: initialData?.address || '',
    ar_address: initialData?.ar_address || '',
    email: initialData?.email || '',
    mobile: initialData?.mobile || '',
    website: initialData?.website || '',
    status: initialData?.status ?? 1,
    license_number: initialData?.license_number || '',
    vat_gst_percent: initialData?.vat_gst_percent ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      vat_gst_percent: formData.vat_gst_percent === '' ? null : Number(formData.vat_gst_percent),
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
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
              <label className="block text-sm font-medium text-gray-700">Branch Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Arabic Name *</label>
              <input
                type="text"
                required
                value={formData.ar_name}
                onChange={(e) => setFormData(prev => ({ ...prev, ar_name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch Code *</label>
              <input
                type="text"
                required
                value={formData.branch}
                onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Abbreviation *</label>
              <input
                type="text"
                required
                value={formData.abbrv}
                onChange={(e) => setFormData(prev => ({ ...prev, abbrv: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region *</label>
              <SearchableSelect
                required
                value={formData.region || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, region: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>-- Select Region --</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </SearchableSelect>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile *</label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">License Number / GST Number (TRN for UAE, GSTIN for India)</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                placeholder="e.g. 36AAGCD8611D2ZU for India GST"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">VAT/GST %</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 5 for UAE VAT, 18 for India GST"
                value={formData.vat_gst_percent}
                onChange={(e) => setFormData(prev => ({ ...prev, vat_gst_percent: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Website *</label>
              <input
                type="text"
                required
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">English Address *</label>
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Arabic Address *</label>
              <textarea
                required
                rows={3}
                value={formData.ar_address}
                onChange={(e) => setFormData(prev => ({ ...prev, ar_address: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                style={{ direction: 'rtl' }}
              />
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
              {initialData ? 'Update Branch' : 'Add Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
