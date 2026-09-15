'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import type { CrmCurrencyAttributes } from '@/models/CrmCurrency';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2, Coins } from 'lucide-react';

const emptyForm = { country: '', currency_code: '', rate: 1, status: 1 };

export default function CurrencyPage() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [currencies, setCurrencies] = useState<CrmCurrencyAttributes[]>([]);
  const { sorted: sortedCurrencies, sortKey: currencySortKey, sortDirection: currencySortDirection, toggleSort: toggleCurrencySort } = useSortableData(
    currencies,
    {
      id: (c) => c.id,
      country: (c) => c.country,
      currencyCode: (c) => c.currency_code,
      rate: (c) => Number(c.rate),
      status: (c) => c.status,
    },
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CrmCurrencyAttributes | null>(null);
  const [viewingCurrency, setViewingCurrency] = useState<CrmCurrencyAttributes | null>(null);

  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(currencies);
  const [bulkBusy, setBulkBusy] = useState(false);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/currency?${params}`);
      const result = await res.json();
      if (res.ok) {
        setCurrencies(result.data);
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
  useEffect(() => { fetchCurrencies(); }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (pagination.page === 1) fetchCurrencies();
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

  const openEdit = (cur: CrmCurrencyAttributes) => {
    setFormData({ country: cur.country, currency_code: cur.currency_code, rate: cur.rate, status: cur.status });
    setFormError('');
    setEditingCurrency(cur);
  };

  const closeForm = () => {
    setShowAddModal(false);
    setEditingCurrency(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormBusy(true);
    try {
      const isEdit = !!editingCurrency;
      const body = isEdit ? { id: editingCurrency!.id, ...formData } : formData;
      const res = await fetch('/api/admin/currency', {
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
      fetchCurrencies();
    } catch {
      setFormError('Network error');
    } finally {
      setFormBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this currency? Fee records using this currency will also be deleted. This cannot be undone.')) return;
    const res = await fetch(`/api/admin/currency?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchCurrencies();
    else window.toast.error('Failed to delete currency');
  };

  const setBulkStatus = async (status: 0 | 1) => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch('/api/admin/currency', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      ));
      clear();
      fetchCurrencies();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkBusy(true);
    try {
      await Promise.all([...selectedIds].map((id) =>
        fetch(`/api/admin/currency?id=${id}`, { method: 'DELETE' })
      ));
      clear();
      fetchCurrencies();
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Currency Management</h1>
          <p className="text-gray-600 mt-1">Manage currencies and exchange rates</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchCurrencies}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Refresh
          </button>
          <button onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            + Add Currency
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by country or currency code..."
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
                ['country', 'Country'],
                ['currencyCode', 'Currency Code'],
                ['rate', 'Rate'],
                ['status', 'Status'],
              ] as const}
              activeKey={currencySortKey}
              direction={currencySortDirection}
              onSort={toggleCurrencySort}
            />
            <RecordList isEmpty={sortedCurrencies.length === 0} emptyIcon={Coins} emptyTitle="No currencies found">
              {sortedCurrencies.map(cur => (
                <RecordCard
                  key={cur.id}
                  avatar={
                    <input
                      type="checkbox"
                      checked={isSelected(cur.id)}
                      onChange={(e) => toggleOne(cur.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  }
                  avatarColorClass="from-gray-100 to-gray-100"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{cur.country}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">#{cur.id} · {cur.currency_code}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cur.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {cur.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </>
                  }
                  stats={[{ label: 'Rate', value: Number(cur.rate).toFixed(2) }]}
                  actions={[
                    { key: 'view', icon: Eye, label: 'View', onClick: () => setViewingCurrency(cur) },
                    { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => openEdit(cur) },
                    { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(cur.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
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
        entityLabel="currency"
        deleteConfirmMessage={`Delete ${selectedIds.size} currenc${selectedIds.size === 1 ? 'y' : 'ies'}? Fee records using ${selectedIds.size === 1 ? 'it' : 'them'} will also be deleted. This cannot be undone.`}
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

      {/* View Modal */}
      {viewingCurrency && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Currency Details</h3>
              <button onClick={() => setViewingCurrency(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <dl className="space-y-3 text-sm">
              {([
                ['ID', String(viewingCurrency.id)],
                ['Country', viewingCurrency.country],
                ['Currency Code', viewingCurrency.currency_code],
                ['Rate', Number(viewingCurrency.rate).toFixed(2)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="font-medium text-gray-500 w-32 shrink-0">{label}:</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              ))}
              <div className="flex gap-2">
                <dt className="font-medium text-gray-500 w-32 shrink-0">Status:</dt>
                <dd>
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${viewingCurrency.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {viewingCurrency.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setViewingCurrency(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Close</button>
              <button onClick={() => { setViewingCurrency(null); openEdit(viewingCurrency); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || !!editingCurrency) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                  placeholder="e.g. United Arab Emirates"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code *</label>
                <input
                  type="text"
                  required
                  value={formData.currency_code}
                  onChange={e => setFormData(p => ({ ...p, currency_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. AED"
                  maxLength={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.rate}
                  onChange={e => setFormData(p => ({ ...p, rate: parseFloat(e.target.value) || 0 }))}
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
                  {formBusy ? 'Saving…' : editingCurrency ? 'Update Currency' : 'Create Currency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
