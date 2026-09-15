'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Globe2, Trash2 } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  flag: string | null;
  slogan_logo: string | null;
  status: number;
}

interface Mapping {
  id: number;
  country: number;
  type: number;
  program: number;
  countryName: string;
  typeName: string;
}

interface LookupItem { id: number; name: string; }
interface LookupData {
  programs: LookupItem[];
  countries: LookupItem[];
  programTypes: LookupItem[];
  branches: LookupItem[];
}

const emptyForm = { name: '', flag: '', slogan_logo: '', status: 1 };

export default function ProgramsManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [services, setServices] = useState<Service[]>([]);
  const { sorted: sortedServices, sortKey: serviceSortKey, sortDirection: serviceSortDirection, toggleSort: toggleServiceSort } = useSortableData(
    services,
    {
      id: (s) => s.id,
      name: (s) => s.name,
      flag: (s) => s.flag,
      sloganLogo: (s) => s.slogan_logo,
      status: (s) => s.status,
    },
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [mappingService, setMappingService] = useState<Service | null>(null);

  // Mapping modal state
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const { sorted: sortedMappings, sortKey: mappingSortKey, sortDirection: mappingSortDirection, toggleSort: toggleMappingSort } = useSortableData(
    mappings,
    {
      country: (m) => m.countryName || m.country,
      type: (m) => m.typeName || m.type,
    },
  );
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mapForm, setMapForm] = useState({ countryId: '', typeId: '' });
  const [mapError, setMapError] = useState('');
  const [mapBusy, setMapBusy] = useState(false);

  // Lookup data
  const [lookup, setLookup] = useState<LookupData>({ programs: [], countries: [], programTypes: [], branches: [] });

  // Form state
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  // Bulk actions
  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(services);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/lookup')
      .then(r => r.json())
      .then(d => setLookup(d))
      .catch(() => {});
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/programs?${params}`);
      const result = await res.json();
      if (res.ok) {
        setServices(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchServices(); }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (pagination.page === 1) fetchServices();
      else setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const openAdd = () => {
    setFormData(emptyForm);
    setFormError('');
    setShowAddModal(true);
  };

  const openEdit = (svc: Service) => {
    setFormData({ name: svc.name, flag: svc.flag || '', slogan_logo: svc.slogan_logo || '', status: svc.status });
    setFormError('');
    setEditingService(svc);
  };

  const closeForm = () => {
    setShowAddModal(false);
    setEditingService(null);
  };

  const openMappings = async (svc: Service) => {
    setMappingService(svc);
    setMapForm({ countryId: '', typeId: '' });
    setMapError('');
    setMappingLoading(true);
    try {
      const res = await fetch(`/api/admin/program-mappings?programId=${svc.id}`);
      const data = await res.json();
      setMappings(data.data || []);
    } finally {
      setMappingLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormBusy(true);
    try {
      const isEdit = !!editingService;
      const body = isEdit ? { id: editingService!.id, ...formData } : formData;
      const res = await fetch('/api/admin/programs', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Failed to save');
        return;
      }
      closeForm();
      fetchServices();
    } catch {
      setFormError('Network error');
    } finally {
      setFormBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this program? Existing country mappings and fees will not be removed.')) return;
    const res = await fetch(`/api/admin/programs?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchServices();
    else window.toast.error('Failed to delete program');
  };

  const setBulkStatus = async (status: 0 | 1) => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch('/api/admin/programs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      ));
      clear();
      fetchServices();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch(`/api/admin/programs?id=${id}`, { method: 'DELETE' })
      ));
      clear();
      fetchServices();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleAddMapping = async () => {
    if (!mapForm.countryId || !mapForm.typeId || !mappingService) return;
    setMapError('');
    setMapBusy(true);
    try {
      const res = await fetch('/api/admin/program-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: mappingService.id,
          countryId: Number(mapForm.countryId),
          typeId: Number(mapForm.typeId),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMapError(err.error || 'Failed to add mapping');
        return;
      }
      const res2 = await fetch(`/api/admin/program-mappings?programId=${mappingService.id}`);
      const data = await res2.json();
      setMappings(data.data || []);
      setMapForm({ countryId: '', typeId: '' });
    } catch {
      setMapError('Network error');
    } finally {
      setMapBusy(false);
    }
  };

  const handleRemoveMapping = async (id: number) => {
    const res = await fetch(`/api/admin/program-mappings?id=${id}`, { method: 'DELETE' });
    if (res.ok) setMappings(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Programs Management</h1>
          <p className="text-gray-600 mt-1">Manage programs and their country / type mappings</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchServices}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Refresh
          </button>
          <button onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            + Add Program
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <SearchableSelect
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="p-4">
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
                ['name', 'Program Name'],
                ['flag', 'Flag'],
                ['sloganLogo', 'Slogan/Logo'],
                ['status', 'Status'],
              ] as const}
              activeKey={serviceSortKey}
              direction={serviceSortDirection}
              onSort={toggleServiceSort}
            />
            <RecordList isEmpty={sortedServices.length === 0} emptyIcon={Globe2} emptyTitle="No programs found">
              {sortedServices.map(svc => (
                <RecordCard
                  key={svc.id}
                  avatar={
                    <input
                      type="checkbox"
                      checked={isSelected(svc.id)}
                      onChange={(e) => toggleOne(svc.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  }
                  avatarColorClass="from-gray-100 to-gray-100"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{svc.name}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{svc.id}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${svc.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {svc.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </>
                  }
                  stats={[
                    { label: 'Flag', value: svc.flag || '—' },
                    { label: 'Slogan/Logo', value: svc.slogan_logo || '—' },
                  ]}
                  actions={[
                    { key: 'view', icon: Eye, label: 'View', onClick: () => setViewingService(svc) },
                    { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => openEdit(svc) },
                    { key: 'map', icon: Globe2, label: 'Map Countries', onClick: () => openMappings(svc), colorClass: 'bg-green-50 text-green-700 hover:bg-green-100' },
                    { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(svc.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
                  ]}
                />
              ))}
            </RecordList>
          </div>
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onActivate={() => setBulkStatus(1)}
        onDeactivate={() => setBulkStatus(0)}
        onDelete={handleBulkDelete}
        onClear={clear}
        entityLabel="program"
        deleteConfirmMessage={`Delete ${selectedIds.size} program(s)? Existing country mappings and fees will not be removed. This cannot be undone.`}
      />

      {/* Pagination */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            Show
            <SearchableSelect
              value={pagination.limit}
              onChange={e => setPagination(p => ({ ...p, limit: Number(e.target.value), page: 1 }))}
              className="border border-gray-300 rounded px-2 py-1"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </SearchableSelect>
            entries &mdash; {pagination.total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewingService && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Program Details</h3>
              <button onClick={() => setViewingService(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <dl className="space-y-3 text-sm">
              {([
                ['ID', String(viewingService.id)],
                ['Name', viewingService.name],
                ['Flag', viewingService.flag || '—'],
                ['Slogan / Logo', viewingService.slogan_logo || '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="font-medium text-gray-500 w-28 shrink-0">{label}:</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              ))}
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500 w-28 shrink-0">Status:</dt>
                <dd>
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${viewingService.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {viewingService.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setViewingService(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Close</button>
              <button onClick={() => { setViewingService(null); openEdit(viewingService); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {(showAddModal || !!editingService) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingService ? 'Edit Program' : 'Add New Program'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Canada Express Entry"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flag</label>
                <input
                  type="text"
                  value={formData.flag}
                  onChange={e => setFormData(p => ({ ...p, flag: e.target.value }))}
                  placeholder="Flag identifier (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slogan / Logo</label>
                <input
                  type="text"
                  value={formData.slogan_logo}
                  onChange={e => setFormData(p => ({ ...p, slogan_logo: e.target.value }))}
                  placeholder="Slogan or logo URL (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <SearchableSelect
                  value={formData.status}
                  onChange={e => setFormData(p => ({ ...p, status: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </SearchableSelect>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formBusy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {formBusy ? 'Saving…' : editingService ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Map Countries Modal ── */}
      {mappingService && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Country &amp; Type Mappings</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Program: <span className="font-medium text-gray-700">{mappingService.name}</span>
                </p>
              </div>
              <button onClick={() => setMappingService(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Existing mappings list */}
            <div className="flex-1 overflow-auto mb-4 border border-gray-200 rounded-lg">
              {mappingLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : mappings.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  No mappings yet. Add one below.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <SortableTh label="Country" sortKey="country" activeKey={mappingSortKey} direction={mappingSortDirection} onSort={toggleMappingSort} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase" />
                      <SortableTh label="Program Type" sortKey="type" activeKey={mappingSortKey} direction={mappingSortDirection} onSort={toggleMappingSort} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase" />
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedMappings.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">{m.countryName || `Country #${m.country}`}</td>
                        <td className="px-4 py-2.5">{m.typeName || `Type #${m.type}`}</td>
                        <td className="px-4 py-2.5 text-right">
                          {canDelete && (
                            <button
                              onClick={() => handleRemoveMapping(m.id)}
                              className="text-xs text-red-600 hover:text-red-800 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Add new mapping form */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Add New Mapping</p>
              <div className="flex gap-2">
                <SearchableSelect
                  value={mapForm.countryId}
                  onChange={e => setMapForm(p => ({ ...p, countryId: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Country</option>
                  {lookup.countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </SearchableSelect>
                <SearchableSelect
                  value={mapForm.typeId}
                  onChange={e => setMapForm(p => ({ ...p, typeId: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Program Type</option>
                  {lookup.programTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </SearchableSelect>
                <button
                  onClick={handleAddMapping}
                  disabled={mapBusy || !mapForm.countryId || !mapForm.typeId}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
                >
                  {mapBusy ? 'Adding…' : 'Add'}
                </button>
              </div>
              {mapError && <p className="text-sm text-red-600 mt-2">{mapError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
