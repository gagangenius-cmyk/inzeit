'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmEmployerAttributes } from '@/models';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2, Briefcase, Mail } from 'lucide-react';

export default function EmployersManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [employers, setEmployers] = useState<CrmEmployerAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState<CrmEmployerAttributes | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployer, setNewEmployer] = useState({
    name: '',
    email: '',
    mobile: '',
    paddress: '',
    vendor_id: 1,
    status: 1,
    website: '',
    company_name: '',
    created_by: 1,
  });

  useEffect(() => {
    fetchEmployers();
  }, []);

  const normalizeEmployer = (employer: CrmEmployerAttributes): CrmEmployerAttributes => ({
    ...employer,
    name: employer.name || '',
    email: employer.email || '',
    mobile: employer.mobile || '',
    website: employer.website || '',
    company_name: employer.company_name || '',
    created: employer.created ? new Date(employer.created) : new Date(),
  });

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/employers?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch employers');
      }
      const result = await response.json();
      setEmployers((result.data || []).map(normalizeEmployer));
    } catch (error) {
      console.error('Failed to load employers:', error);
      setEmployers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployers = employers.filter(employer =>
    (employer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { sorted: sortedEmployers, sortKey: employerSortKey, sortDirection: employerSortDirection, toggleSort: toggleEmployerSort } = useSortableData(
    filteredEmployers,
    {
      id: (e) => e.id,
      name: (e) => e.name,
      company: (e) => e.company_name,
      email: (e) => e.email,
      mobile: (e) => e.mobile,
      website: (e) => e.website,
      status: (e) => e.status,
    },
  );

  const handleViewEmployer = (employer: CrmEmployerAttributes) => {
    setSelectedEmployer(employer);
    setShowModal(true);
  };

  const handleAddEmployer = async () => {
    if (newEmployer.name && newEmployer.company_name) {
      await fetch('/api/admin/employers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEmployer,
          name: newEmployer.name.trim(),
          email: newEmployer.email.trim(),
          mobile: newEmployer.mobile.trim(),
          paddress: newEmployer.paddress.trim(),
          website: newEmployer.website.trim(),
          company_name: newEmployer.company_name.trim(),
        }),
      });
      await fetchEmployers();
      setNewEmployer({
        name: '',
        email: '',
        mobile: '',
        paddress: '',
        vendor_id: 1,
        status: 1,
        website: '',
        company_name: '',
        created_by: 1,
      });
      setShowAddModal(false);
    }
  };

  const handleEditEmployer = async (id: number, updatedEmployer: Partial<CrmEmployerAttributes>) => {
    await fetch('/api/admin/employers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updatedEmployer }),
    });
    await fetchEmployers();
    setShowModal(false);
    setSelectedEmployer(null);
  };

  const handleDeleteEmployer = async (id: number) => {
    await fetch(`/api/admin/employers?id=${id}`, { method: 'DELETE' });
    await fetchEmployers();
    setShowModal(false);
    setSelectedEmployer(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Employers Management</h1>
          <p className="text-gray-600 mt-2">Manage employer information and partnerships</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Employer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search employers by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Vendors</option>
            <option value="1">Vendor 1</option>
            <option value="2">Vendor 2</option>
            <option value="3">Vendor 3</option>
          </SearchableSelect>
          <SearchableSelect className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
        </div>
      </div>

      {/* Employers Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <SortButtonRow
          options={[
            ['id', 'ID'],
            ['name', 'Name'],
            ['company', 'Company'],
            ['email', 'Email'],
            ['mobile', 'Mobile'],
            ['website', 'Website'],
            ['status', 'Status'],
          ] as const}
          activeKey={employerSortKey}
          direction={employerSortDirection}
          onSort={toggleEmployerSort}
        />
        <RecordList isEmpty={false}>
          {sortedEmployers.map((employer) => (
            <RecordCard
              key={employer.id}
              avatar={<Briefcase className="h-4 w-4" />}
              avatarColorClass="from-blue-600 to-cyan-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{employer.name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{employer.id}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employer.status)}`}>
                    {getStatusText(employer.status)}
                  </span>
                </>
              }
              metaItems={[{ icon: Mail, text: `${employer.email || '—'} · ${employer.mobile || '—'}`, key: 'contact' }]}
              stats={[
                { label: 'Company', value: employer.company_name || '—' },
                { label: 'Website', value: employer.website ? <a href={`http://${employer.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{employer.website}</a> : '—' },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewEmployer(employer) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => {} },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => { setSelectedEmployer(employer); setShowModal(true); }, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>

      {/* Employer Details Modal */}
      {showModal && selectedEmployer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Employer Details</h3>
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
                  <h4 className="font-semibold text-gray-700">Personal Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">ID:</span> #{selectedEmployer.id}</p>
                    <p><span className="font-medium">Name:</span> {selectedEmployer.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedEmployer.email}</p>
                    <p><span className="font-medium">Mobile:</span> {selectedEmployer.mobile}</p>
                    <p><span className="font-medium">Status:</span> {getStatusText(selectedEmployer.status)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Company Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Company Name:</span> {selectedEmployer.company_name}</p>
                    <p><span className="font-medium">Website:</span> 
                      <a
                        href={`http://${selectedEmployer.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {selectedEmployer.website}
                      </a>
                    </p>
                    <p><span className="font-medium">Vendor ID:</span> #{selectedEmployer.vendor_id}</p>
                  </div>
                </div>
              </div>
              {selectedEmployer.paddress && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700">Address</h4>
                  <p className="mt-1">{selectedEmployer.paddress}</p>
                </div>
              )}
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700">Created Information</h4>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Created Date:</span> {selectedEmployer.created.toLocaleDateString()}</p>
                  <p><span className="font-medium">Created By:</span> User #{selectedEmployer.created_by}</p>
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
                  const newName = prompt('Enter new employer name:', selectedEmployer.name);
                  const newStatus = prompt('Enter status (1 for Active, 0 for Inactive):', selectedEmployer.status.toString());
                  if (newName && newName.trim() && newStatus) {
                    handleEditEmployer(selectedEmployer.id, { name: newName.trim(), status: parseInt(newStatus) });
                  }
                }}
                className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] transition-colors"
              >
                Edit Employer
              </button>
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedEmployer.name}?`)) {
                    handleDeleteEmployer(selectedEmployer.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Employer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add New Employer</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employerName" className="block text-sm font-medium text-gray-700">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    id="employerName"
                    value={newEmployer.name}
                    onChange={(e) => setNewEmployer({ ...newEmployer, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter employer name"
                  />
                </div>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={newEmployer.company_name}
                    onChange={(e) => setNewEmployer({ ...newEmployer, company_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label htmlFor="employerEmail" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="employerEmail"
                    value={newEmployer.email}
                    onChange={(e) => setNewEmployer({ ...newEmployer, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label htmlFor="employerMobile" className="block text-sm font-medium text-gray-700">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    id="employerMobile"
                    value={newEmployer.mobile}
                    onChange={(e) => setNewEmployer({ ...newEmployer, mobile: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter mobile number"
                  />
                </div>
                <div>
                  <label htmlFor="employerWebsite" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    id="employerWebsite"
                    value={newEmployer.website}
                    onChange={(e) => setNewEmployer({ ...newEmployer, website: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter website URL"
                  />
                </div>
                <div>
                  <label htmlFor="vendorId" className="block text-sm font-medium text-gray-700">
                    Vendor
                  </label>
                  <SearchableSelect
                    id="vendorId"
                    value={newEmployer.vendor_id}
                    onChange={(e) => setNewEmployer({ ...newEmployer, vendor_id: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={1}>Vendor 1</option>
                    <option value={2}>Vendor 2</option>
                    <option value={3}>Vendor 3</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label htmlFor="employerStatus" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <SearchableSelect
                    id="employerStatus"
                    value={newEmployer.status}
                    onChange={(e) => setNewEmployer({ ...newEmployer, status: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </SearchableSelect>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="employerAddress" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  id="employerAddress"
                  rows={3}
                  value={newEmployer.paddress}
                  onChange={(e) => setNewEmployer({ ...newEmployer, paddress: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEmployer({
                    name: '',
                    email: '',
                    mobile: '',
                    paddress: '',
                    vendor_id: 1,
                    status: 1,
                    website: '',
                    company_name: '',
                    created_by: 1,
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddEmployer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Employer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
