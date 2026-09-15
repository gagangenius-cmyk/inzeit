'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmCampaigns, CrmCampaignsAttributes } from '@/models/CrmCampaigns';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { useDebounce } from '@/hooks/useDebounce';
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Megaphone } from 'lucide-react';

interface Campaign extends CrmCampaignsAttributes {}

export default function CampaignsManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ campaign: '', status: 1 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearchTerm]);

  const normalizeCampaign = (campaign: any): Campaign => ({
    ...campaign,
    created: campaign.created ? new Date(campaign.created) : new Date(),
  });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);

      const response = await fetch(`/api/admin/campaigns?${params}`);
      const data = await response.json();
      if (response.ok) {
        setCampaigns((data.data || []).map(normalizeCampaign));
        setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, totalPages: data.pagination?.totalPages ?? 0 }));
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const { sorted: sortedCampaigns, sortKey: campaignSortKey, sortDirection: campaignSortDirection, toggleSort: toggleCampaignSort } = useSortableData(
    campaigns,
    {
      id: (c) => c.id,
      name: (c) => c.campaign,
      created: (c) => c.created,
      createdBy: (c) => c.created_by,
      status: (c) => c.status,
    },
  );

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const handleAddCampaign = async () => {
    if (newCampaign.campaign.trim()) {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCampaign, campaign: newCampaign.campaign.trim() }),
      });
      if (!response.ok) return;
      await fetchCampaigns();
      setNewCampaign({ campaign: '', status: 1 });
      setShowAddModal(false);
    }
  };

  const handleEditCampaign = async (id: number, updatedName: string, updatedStatus: number) => {
    await fetch('/api/admin/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, campaign: updatedName, status: updatedStatus }),
    });
    await fetchCampaigns();
    setShowModal(false);
    setSelectedCampaign(null);
  };

  const handleDeleteCampaign = async (id: number) => {
    await fetch(`/api/admin/campaigns?id=${id}`, { method: 'DELETE' });
    await fetchCampaigns();
    setShowModal(false);
    setSelectedCampaign(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Campaigns Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all marketing campaigns</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Campaign
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search campaigns by name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <SortButtonRow
            options={[
              ['id', 'ID'],
              ['name', 'Campaign Name'],
              ['created', 'Created Date'],
              ['createdBy', 'Created By'],
              ['status', 'Status'],
            ] as const}
            activeKey={campaignSortKey}
            direction={campaignSortDirection}
            onSort={toggleCampaignSort}
          />
          <RecordList isEmpty={false}>
            {sortedCampaigns.map((campaign) => (
              <RecordCard
                key={campaign.id}
                avatar={<Megaphone className="h-4 w-4" />}
                avatarColorClass="from-indigo-600 to-purple-400"
                title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{campaign.campaign}</span>}
                titleBadges={
                  <>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{campaign.id}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </>
                }
                stats={[
                  { label: 'Created Date', value: campaign.created.toLocaleDateString() },
                  { label: 'Created By', value: `User #${campaign.created_by}` },
                ]}
                actions={[
                  { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewCampaign(campaign) },
                  { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => handleViewCampaign(campaign) },
                  { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => { setSelectedCampaign(campaign); setShowModal(true); }, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
                ]}
              />
            ))}
          </RecordList>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} — {pagination.total} campaigns
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages || prev.page, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Details Modal */}
      {showModal && selectedCampaign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Campaign Details</h3>
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
                  <h4 className="font-semibold text-gray-700">Campaign Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">ID:</span> #{selectedCampaign.id}</p>
                    <p><span className="font-medium">Name:</span> {selectedCampaign.campaign}</p>
                    <p><span className="font-medium">Created Date:</span> {selectedCampaign.created.toLocaleDateString()}</p>
                    <p><span className="font-medium">Created By:</span> User #{selectedCampaign.created_by}</p>
                    <p><span className="font-medium">Status:</span> {getStatusText(selectedCampaign.status)}</p>
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
                  const newName = prompt('Enter new campaign name:', selectedCampaign.campaign);
                  const newStatus = prompt('Enter status (1 for Active, 0 for Inactive):', selectedCampaign.status.toString());
                  if (newName && newName.trim() && newStatus) {
                    handleEditCampaign(selectedCampaign.id, newName.trim(), parseInt(newStatus));
                  }
                }}
                className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] transition-colors"
              >
                Edit Campaign
              </button>
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedCampaign.campaign}?`)) {
                    handleDeleteCampaign(selectedCampaign.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add New Campaign</h3>
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
                  <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    id="campaignName"
                    value={newCampaign.campaign}
                    onChange={(e) => setNewCampaign({ ...newCampaign, campaign: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <label htmlFor="campaignStatus" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <SearchableSelect
                    id="campaignStatus"
                    value={newCampaign.status}
                    onChange={(e) => setNewCampaign({ ...newCampaign, status: parseInt(e.target.value) })}
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
                  setNewCampaign({ campaign: '', status: 1 });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
