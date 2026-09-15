'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmB2b, CrmB2bAttributes } from '@/models';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2, Building2 } from 'lucide-react';

export default function B2BManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [b2bCompanies, setB2bCompanies] = useState<CrmB2bAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CrmB2bAttributes | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    status: 1,
    created_by: 1,
  });

  useEffect(() => {
    fetchB2bCompanies();
  }, []);

  const normalizeCompany = (company: any): CrmB2bAttributes => ({
    ...company,
    created: company.created ? new Date(company.created) : new Date(),
  });

  const fetchB2bCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/b2b?limit=100');
      const data = await response.json();
      if (response.ok) {
        setB2bCompanies((data.data || []).map(normalizeCompany));
      }
    } catch (error) {
      console.error('Error fetching B2B companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = b2bCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { sorted: sortedCompanies, sortKey: companySortKey, sortDirection: companySortDirection, toggleSort: toggleCompanySort } = useSortableData(
    filteredCompanies,
    {
      id: (c) => c.id,
      name: (c) => c.name,
      status: (c) => c.status,
      created: (c) => c.created,
      createdBy: (c) => c.created_by,
    },
  );

  const handleViewCompany = (company: CrmB2bAttributes) => {
    setSelectedCompany(company);
    setShowModal(true);
  };

  const handleAddCompany = async () => {
    if (newCompany.name.trim()) {
      const response = await fetch('/api/admin/b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCompany, name: newCompany.name.trim() }),
      });
      if (!response.ok) return;
      await fetchB2bCompanies();
      setNewCompany({
        name: '',
        status: 1,
        created_by: 1,
      });
      setShowAddModal(false);
    }
  };

  const handleEditCompany = async (id: number, updatedName: string, updatedStatus: number) => {
    await fetch('/api/admin/b2b', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: updatedName, status: updatedStatus }),
    });
    await fetchB2bCompanies();
    setShowModal(false);
    setSelectedCompany(null);
  };

  const handleDeleteCompany = async (id: number) => {
    await fetch(`/api/admin/b2b?id=${id}`, { method: 'DELETE' });
    await fetchB2bCompanies();
    setShowModal(false);
    setSelectedCompany(null);
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status: number) => {
    return status === 1 ? 'Active' : 'Inactive';
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
          <h1 className="text-3xl font-bold text-gray-900">B2B Management</h1>
          <p className="text-gray-600 mt-2">Manage B2B partnerships and collaborations</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add B2B Partner
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search B2B partners by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* B2B Companies Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <SortButtonRow
          options={[
            ['id', 'ID'],
            ['name', 'Company Name'],
            ['status', 'Status'],
            ['created', 'Created Date'],
            ['createdBy', 'Created By'],
          ] as const}
          activeKey={companySortKey}
          direction={companySortDirection}
          onSort={toggleCompanySort}
        />
        <RecordList isEmpty={false}>
          {sortedCompanies.map((company) => (
            <RecordCard
              key={company.id}
              avatar={<Building2 className="h-4 w-4" />}
              avatarColorClass="from-blue-600 to-cyan-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{company.name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{company.id}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status)}`}>
                    {getStatusText(company.status)}
                  </span>
                </>
              }
              stats={[
                { label: 'Created Date', value: company.created.toLocaleDateString() },
                { label: 'Created By', value: `User #${company.created_by}` },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewCompany(company) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => {} },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => { setSelectedCompany(company); setShowModal(true); }, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>

      {/* Company Details Modal */}
      {showModal && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">B2B Partner Details</h3>
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
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Company Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">ID:</span> #{selectedCompany.id}</p>
                    <p><span className="font-medium">Name:</span> {selectedCompany.name}</p>
                    <p><span className="font-medium">Status:</span> {getStatusText(selectedCompany.status)}</p>
                    <p><span className="font-medium">Created Date:</span> {selectedCompany.created.toLocaleDateString()}</p>
                    <p><span className="font-medium">Created By:</span> User #{selectedCompany.created_by}</p>
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
                  const newName = prompt('Enter new company name:', selectedCompany.name);
                  const newStatus = prompt('Enter status (1 for Active, 0 for Inactive):', selectedCompany.status.toString());
                  if (newName && newName.trim() && newStatus) {
                    handleEditCompany(selectedCompany.id, newName.trim(), parseInt(newStatus));
                  }
                }}
                className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] transition-colors"
              >
                Edit Company
              </button>
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedCompany.name}?`)) {
                    handleDeleteCompany(selectedCompany.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add New B2B Partner</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label htmlFor="companyStatus" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <SearchableSelect
                    id="companyStatus"
                    value={newCompany.status}
                    onChange={(e) => setNewCompany({ ...newCompany, status: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </SearchableSelect>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewCompany({
                    name: '',
                    status: 1,
                    created_by: 1,
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCompany}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
