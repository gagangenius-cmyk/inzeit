'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmSourceAttributes } from '@/models';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function MarketSourcesManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [sources, setSources] = useState<CrmSourceAttributes[]>([]);
  const { sorted: sortedSources, sortKey: sourceSortKey, sortDirection: sourceSortDirection, toggleSort: toggleSourceSort } = useSortableData(
    sources,
    {
      id: (s) => s.id,
      name: (s) => s.name,
      status: (s) => s.status,
    },
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<CrmSourceAttributes | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({ status: '' });
  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(sources);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    fetchSources();
  }, [pagination.page, pagination.limit, filters.status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchSources();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status !== '' && { status: filters.status })
      });

      const response = await fetch(`/api/admin/market-sources?${params}`);
      const result = await response.json();

      if (response.ok) {
        setSources(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      } else {
        console.error('Failed to fetch sources:', result.error);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSource = (source: CrmSourceAttributes) => {
    setSelectedSource(source);
    setShowModal(true);
  };

  const handleEditSource = (source: CrmSourceAttributes) => {
    setSelectedSource(source);
    setShowEditModal(true);
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    try {
      const response = await fetch(`/api/admin/market-sources?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchSources();
      } else {
        const result = await response.json();
        window.toast.error('Failed to delete source: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      window.toast.error('Failed to delete source');
    }
  };

  const handleAddSource = async (data: Partial<CrmSourceAttributes>) => {
    try {
      const response = await fetch('/api/admin/market-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowAddModal(false);
        fetchSources();
      } else {
        const result = await response.json();
        window.toast.error('Error adding source: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding source:', error);
      window.toast.error('Error adding source');
    }
  };

  const handleUpdateSource = async (data: Partial<CrmSourceAttributes>) => {
    if (!selectedSource) return;
    try {
      const response = await fetch('/api/admin/market-sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedSource.id, ...data }),
      });
      if (response.ok) {
        setShowEditModal(false);
        setSelectedSource(null);
        fetchSources();
      } else {
        const result = await response.json();
        window.toast.error('Error updating source: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating source:', error);
      window.toast.error('Error updating source');
    }
  };

  const handlePageChange = (newPage: number) => setPagination(prev => ({ ...prev, page: newPage }));
  const handleLimitChange = (newLimit: number) => setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  const handleFilterChange = (value: string) => {
    setFilters({ status: value });
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSources();
  };

  const getStatusColor = (status: number) =>
    status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  const setBulkStatus = async (status: 0 | 1) => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch('/api/admin/market-sources', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      ));
      clear();
      fetchSources();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch(`/api/admin/market-sources?id=${id}`, { method: 'DELETE' })
      ));
      clear();
      fetchSources();
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
          <h1 className="text-3xl font-bold text-gray-900">Market Sources Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all market sources</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSources}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Source
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search sources by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect
            value={filters.status}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Sources Table */}
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
            ['name', 'Source Name'],
            ['status', 'Status'],
          ] as const}
          activeKey={sourceSortKey}
          direction={sourceSortDirection}
          onSort={toggleSourceSort}
        />
        <RecordList isEmpty={false}>
          {sortedSources.map((source) => (
            <RecordCard
              key={source.id}
              avatar={
                <input
                  type="checkbox"
                  checked={isSelected(source.id)}
                  onChange={(e) => toggleOne(source.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              }
              avatarColorClass="from-gray-100 to-gray-100"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{source.name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{source.id}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(source.status)}`}>
                    {source.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </>
              }
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewSource(source) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => handleEditSource(source) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDeleteSource(source.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
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
        entityLabel="source"
        deleteConfirmMessage={`Delete ${selectedIds.size} source(s)? This cannot be undone.`}
      />

      {/* Pagination Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <SearchableSelect
              value={pagination.limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </SearchableSelect>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
            <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) pageNum = i + 1;
                else if (pagination.page <= 3) pageNum = i + 1;
                else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                else pageNum = pagination.page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${pageNum === pagination.page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
          </div>
        </div>
      </div>

      {/* Source Details Modal */}
      {showModal && selectedSource && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Source Details</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <p><span className="font-medium">Source ID:</span> {selectedSource.id}</p>
              <p><span className="font-medium">Name:</span> {selectedSource.name}</p>
              <p><span className="font-medium">Status:</span> {selectedSource.status === 1 ? 'Active' : 'Inactive'}</p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setShowModal(false); handleEditSource(selectedSource); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <SourceFormModal
          title="Add New Source"
          onSubmit={handleAddSource}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Source Modal */}
      {showEditModal && selectedSource && (
        <SourceFormModal
          title="Edit Source"
          initialData={selectedSource}
          onSubmit={handleUpdateSource}
          onClose={() => { setShowEditModal(false); setSelectedSource(null); }}
        />
      )}
    </div>
  );
}

interface SourceFormModalProps {
  title: string;
  initialData?: CrmSourceAttributes | null;
  onSubmit: (data: Partial<CrmSourceAttributes>) => void;
  onClose: () => void;
}

function SourceFormModal({ title, initialData, onSubmit, onClose }: SourceFormModalProps) {
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
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Source Name *</label>
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
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
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
              {initialData ? 'Update Source' : 'Add Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
