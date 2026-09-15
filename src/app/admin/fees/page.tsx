'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import type { CrmFeeAttributes } from '@/models/CrmFee';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2, Receipt } from 'lucide-react';

interface LookupItem { id: number; name: string; }
interface LookupData {
  programs: LookupItem[];
  countries: LookupItem[];
  programTypes: LookupItem[];
  branches: LookupItem[];
}

export default function FeesManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [fees, setFees] = useState<CrmFeeAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFee, setSelectedFee] = useState<CrmFeeAttributes | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lookup, setLookup] = useState<LookupData>({ programs: [], countries: [], programTypes: [], branches: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    service: '',
    country: '',
    branch: ''
  });

  // Load lookup data once
  useEffect(() => {
    fetch('/api/admin/lookup')
      .then(r => r.json())
      .then(d => setLookup(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchFees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.status, filters.service, filters.country, filters.branch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchFees();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.status !== '' && { status: filters.status }),
        ...(filters.service !== '' && { service: filters.service }),
        ...(filters.country !== '' && { country: filters.country }),
        ...(filters.branch !== '' && { branch: filters.branch })
      });

      const response = await fetch(`/api/admin/fees?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFees(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching fees:', data.error);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFee = (fee: CrmFeeAttributes) => {
    setSelectedFee(fee);
    setShowModal(true);
  };

  const handleEditFee = (fee: CrmFeeAttributes) => {
    setSelectedFee(fee);
    setShowEditModal(true);
  };

  const handleDeleteFee = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/fees?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchFees();
      } else {
        const error = await response.json();
        window.toast.error('Error deleting fee: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting fee:', error);
      window.toast.error('Error deleting fee');
    }
  };

  const handleAddFee = async (feeData: Partial<CrmFeeAttributes>) => {
    try {
      const response = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeData),
      });
      if (response.ok) {
        setShowAddModal(false);
        fetchFees();
      } else {
        const error = await response.json();
        window.toast.error('Error adding fee: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding fee:', error);
      window.toast.error('Error adding fee');
    }
  };

  const handleUpdateFee = async (feeData: Partial<CrmFeeAttributes>) => {
    if (!selectedFee) return;
    try {
      const response = await fetch('/api/admin/fees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedFee.id, ...feeData }),
      });
      if (response.ok) {
        setShowEditModal(false);
        setSelectedFee(null);
        fetchFees();
      } else {
        const error = await response.json();
        window.toast.error('Error updating fee: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating fee:', error);
      window.toast.error('Error updating fee');
    }
  };

  const getStatusColor = (status: number) =>
    status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  const programName = (id: number | null | undefined) =>
    lookup.programs.find(p => p.id === id)?.name || (id ? `#${id}` : 'N/A');
  const countryName = (id: number | null | undefined) =>
    lookup.countries.find(c => c.id === id)?.name || (id ? `#${id}` : 'N/A');
  const branchName = (id: number | null | undefined) =>
    lookup.branches.find(b => b.id === id)?.name || (id ? `#${id}` : 'N/A');

  const { sorted: sortedFees, sortKey: feeSortKey, sortDirection: feeSortDirection, toggleSort: toggleFeeSort } = useSortableData(
    fees,
    {
      id: (f) => f.id,
      program: (f) => programName(f.service),
      country: (f) => countryName(f.country),
      branch: (f) => branchName(f.branch),
      currency: (f) => f.currency,
      upfront: (f) => f.upfront,
      profFee: (f) => f.prof_fee,
      status: (f) => f.status,
    },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fees Management</h1>
          <p className="text-gray-600 mt-2">Manage fees per branch, program, and country</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Fee
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search fees..."
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
          <SearchableSelect
            value={filters.service}
            onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Programs</option>
            {lookup.programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SearchableSelect>
          <SearchableSelect
            value={filters.country}
            onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Countries</option>
            {lookup.countries.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SearchableSelect>
          <SearchableSelect
            value={filters.branch}
            onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {lookup.branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </SearchableSelect>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <SortButtonRow
          options={[
            ['id', 'ID'],
            ['program', 'Program'],
            ['country', 'Country'],
            ['branch', 'Branch'],
            ['currency', 'Currency'],
            ['upfront', 'Upfront'],
            ['profFee', 'Prof Fee'],
            ['status', 'Status'],
          ] as const}
          activeKey={feeSortKey}
          direction={feeSortDirection}
          onSort={toggleFeeSort}
        />
        <RecordList isEmpty={sortedFees.length === 0} emptyIcon={Receipt} emptyTitle="No fees found">
          {sortedFees.map((fee: CrmFeeAttributes) => (
            <RecordCard
              key={fee.id}
              avatar={<Receipt className="h-4 w-4" />}
              avatarColorClass="from-slate-600 to-gray-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{programName(fee.service)}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{fee.id}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                    {fee.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </>
              }
              stats={[
                { label: 'Country', value: countryName(fee.country) },
                { label: 'Branch', value: branchName(fee.branch) },
                { label: 'Currency', value: fee.currency || 'N/A' },
                { label: 'Upfront', value: fee.upfront },
                { label: 'Prof Fee', value: fee.prof_fee },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewFee(fee) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => handleEditFee(fee) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDeleteFee(fee.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>

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
            >Previous</button>
            <span className="px-3 py-1 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Fee Details Modal */}
      {showModal && selectedFee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Fee Details</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                  <div className="space-y-1.5">
                    <p><span className="font-medium">Fee ID:</span> {selectedFee.id}</p>
                    <p><span className="font-medium">Program:</span> {programName(selectedFee.service)}</p>
                    <p><span className="font-medium">Country:</span> {countryName(selectedFee.country)}</p>
                    <p><span className="font-medium">Branch:</span> {branchName(selectedFee.branch)}</p>
                    <p><span className="font-medium">Currency:</span> {selectedFee.currency || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {selectedFee.status === 1 ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Monthly Fees</h4>
                  <div className="space-y-1.5">
                    <p><span className="font-medium">Upfront:</span> {selectedFee.upfront}</p>
                    <p><span className="font-medium">Professional Fee:</span> {selectedFee.prof_fee}</p>
                    <p><span className="font-medium">First Month:</span> {selectedFee.firstMonth}</p>
                    <p><span className="font-medium">Second Month:</span> {selectedFee.secondMonth}</p>
                    <p><span className="font-medium">Third Month:</span> {selectedFee.thirdMonth}</p>
                    <p><span className="font-medium">Prof Fee Month:</span> {selectedFee.prof_fee_month}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Stage Fees</h4>
                  <div className="space-y-1.5">
                    <p><span className="font-medium">First Stage:</span> {selectedFee.firstStage}</p>
                    <p><span className="font-medium">Second Stage:</span> {selectedFee.secondStage}</p>
                    <p><span className="font-medium">Third Stage:</span> {selectedFee.thirdStage}</p>
                    <p><span className="font-medium">Fourth Stage:</span> {selectedFee.forthStage}</p>
                    <p><span className="font-medium">Fifth Stage:</span> {selectedFee.fifthStage || 0}</p>
                    <p><span className="font-medium">Prof Fee Stage:</span> {selectedFee.prof_fee_stage}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">Close</button>
              <button onClick={() => { setShowModal(false); handleEditFee(selectedFee); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Edit Fee</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Fee Modal */}
      {showAddModal && (
        <FeeFormModal
          title="Add New Fee"
          lookup={lookup}
          onSubmit={handleAddFee}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Fee Modal */}
      {showEditModal && selectedFee && (
        <FeeFormModal
          title="Edit Fee"
          initialData={selectedFee}
          lookup={lookup}
          onSubmit={handleUpdateFee}
          onClose={() => { setShowEditModal(false); setSelectedFee(null); }}
        />
      )}
    </div>
  );
}

// Fee Form Modal Component
interface FeeFormModalProps {
  title: string;
  initialData?: CrmFeeAttributes | null;
  lookup: LookupData;
  onSubmit: (data: Partial<CrmFeeAttributes>) => void;
  onClose: () => void;
}

function FeeFormModal({ title, initialData, lookup, onSubmit, onClose }: FeeFormModalProps) {
  const [formData, setFormData] = useState({
    service: initialData?.service ?? null,
    country: initialData?.country ?? null,
    branch: initialData?.branch ?? null,
    currency: initialData?.currency ?? null,
    upfront: initialData?.upfront ?? 0,
    prof_fee: initialData?.prof_fee ?? 0,
    firstMonth: initialData?.firstMonth ?? 0,
    secondMonth: initialData?.secondMonth ?? 0,
    thirdMonth: initialData?.thirdMonth ?? 0,
    prof_fee_month: initialData?.prof_fee_month ?? 0,
    firstStage: initialData?.firstStage ?? 0,
    secondStage: initialData?.secondStage ?? 0,
    thirdStage: initialData?.thirdStage ?? 0,
    forthStage: initialData?.forthStage ?? 0,
    fifthStage: initialData?.fifthStage ?? 0,
    prof_fee_stage: initialData?.prof_fee_stage ?? 0,
    status: initialData?.status ?? 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inp = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500";
  const lbl = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-3/4 shadow-lg rounded-lg bg-white mb-10 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Program (service) dropdown */}
            <div>
              <label className={lbl}>Program</label>
              <SearchableSelect
                value={formData.service ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, service: e.target.value ? Number(e.target.value) : null }))}
                className={inp}
              >
                <option value="">Select Program</option>
                {lookup.programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </SearchableSelect>
            </div>
            {/* Country dropdown */}
            <div>
              <label className={lbl}>Country</label>
              <SearchableSelect
                value={formData.country ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, country: e.target.value ? Number(e.target.value) : null }))}
                className={inp}
              >
                <option value="">Select Country</option>
                {lookup.countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SearchableSelect>
            </div>
            {/* Branch dropdown */}
            <div>
              <label className={lbl}>Branch</label>
              <SearchableSelect
                value={formData.branch ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value ? Number(e.target.value) : null }))}
                className={inp}
              >
                <option value="">Select Branch</option>
                {lookup.branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </SearchableSelect>
            </div>
            {/* Currency — kept as number ID (FK to crm_currency) */}
            <div>
              <label className={lbl}>Currency ID</label>
              <input
                type="number"
                value={formData.currency ?? ''}
                onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Currency ID"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Upfront *</label>
              <input type="number" step="0.01" required value={formData.upfront}
                onChange={e => setFormData(prev => ({ ...prev, upfront: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Professional Fee *</label>
              <input type="number" step="0.01" required value={formData.prof_fee}
                onChange={e => setFormData(prev => ({ ...prev, prof_fee: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>First Month *</label>
              <input type="number" step="0.01" required value={formData.firstMonth}
                onChange={e => setFormData(prev => ({ ...prev, firstMonth: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Second Month *</label>
              <input type="number" step="0.01" required value={formData.secondMonth}
                onChange={e => setFormData(prev => ({ ...prev, secondMonth: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Third Month *</label>
              <input type="number" step="0.01" required value={formData.thirdMonth}
                onChange={e => setFormData(prev => ({ ...prev, thirdMonth: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Prof Fee Month *</label>
              <input type="number" step="0.01" required value={formData.prof_fee_month}
                onChange={e => setFormData(prev => ({ ...prev, prof_fee_month: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>First Stage *</label>
              <input type="number" step="0.01" required value={formData.firstStage}
                onChange={e => setFormData(prev => ({ ...prev, firstStage: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Second Stage *</label>
              <input type="number" step="0.01" required value={formData.secondStage}
                onChange={e => setFormData(prev => ({ ...prev, secondStage: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Third Stage *</label>
              <input type="number" step="0.01" required value={formData.thirdStage}
                onChange={e => setFormData(prev => ({ ...prev, thirdStage: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Fourth Stage *</label>
              <input type="number" step="0.01" required value={formData.forthStage}
                onChange={e => setFormData(prev => ({ ...prev, forthStage: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Fifth Stage</label>
              <input type="number" step="0.01" value={formData.fifthStage}
                onChange={e => setFormData(prev => ({ ...prev, fifthStage: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Prof Fee Stage *</label>
              <input type="number" step="0.01" required value={formData.prof_fee_stage}
                onChange={e => setFormData(prev => ({ ...prev, prof_fee_stage: parseFloat(e.target.value) || 0 }))}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Status *</label>
              <SearchableSelect required value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                className={inp}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </SearchableSelect>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {initialData ? 'Update Fee' : 'Add Fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
