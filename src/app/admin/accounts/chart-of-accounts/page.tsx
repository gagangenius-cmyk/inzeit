'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { Pencil, Power, Trash2, Landmark } from 'lucide-react';

interface CoaAccount {
  id: number; code: string; name: string; group_name: string; nature: 'DR' | 'CR'; status: number;
}

const emptyForm = { code: '', name: '', group_name: '', nature: 'DR' as 'DR' | 'CR' };

export default function ChartOfAccountsPage() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);

  const [accounts, setAccounts] = useState<CoaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CoaAccount | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/accounts/coa');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load chart of accounts');
      setAccounts(result.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, CoaAccount[]>();
    accounts.forEach((a) => {
      if (!map.has(a.group_name)) map.set(a.group_name, []);
      map.get(a.group_name)!.push(a);
    });
    return Array.from(map.entries()).sort((a, b) => a[1][0]?.code.localeCompare(b[1][0]?.code || '') || 0);
  }, [accounts]);

  const openAdd = () => { setFormData(emptyForm); setFormError(''); setShowAddModal(true); };
  const openEdit = (a: CoaAccount) => {
    setFormData({ code: a.code, name: a.name, group_name: a.group_name, nature: a.nature });
    setFormError('');
    setEditingAccount(a);
  };
  const closeForm = () => { setShowAddModal(false); setEditingAccount(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormBusy(true);
    try {
      const isEdit = !!editingAccount;
      const body = isEdit ? { id: editingAccount!.id, ...formData } : formData;
      const res = await fetch('/api/admin/accounts/coa', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) { setFormError(result.error || 'Failed to save'); return; }
      closeForm();
      load();
    } catch {
      setFormError('Network error');
    } finally {
      setFormBusy(false);
    }
  };

  const handleToggleStatus = async (a: CoaAccount) => {
    await fetch('/api/admin/accounts/coa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, status: a.status === 1 ? 0 : 1 }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this account? This only works if no expenses reference it.')) return;
    const res = await fetch(`/api/admin/accounts/coa?id=${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (res.ok) load();
    else alert(result.error || 'Failed to delete');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600 mt-1">Revenue, cost, and expense account codes used across Expenses and P&amp;L</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          + Add Account
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([groupName, groupAccounts]) => (
            <AccountGroupTable
              key={groupName}
              groupName={groupName}
              accounts={groupAccounts}
              canDelete={canDelete}
              openEdit={openEdit}
              handleToggleStatus={handleToggleStatus}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {(showAddModal || !!editingAccount) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text" required disabled={!!editingAccount}
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                  placeholder="e.g. 5008"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
                <input
                  type="text" required
                  value={formData.group_name}
                  onChange={(e) => setFormData((p) => ({ ...p, group_name: e.target.value }))}
                  placeholder="e.g. Operating"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nature</label>
                <SearchableSelect
                  value={formData.nature}
                  onChange={(e) => setFormData((p) => ({ ...p, nature: e.target.value as 'DR' | 'CR' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="DR">Debit (DR)</option>
                  <option value="CR">Credit (CR)</option>
                </SearchableSelect>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formBusy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {formBusy ? 'Saving…' : editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountGroupTable({
  groupName,
  accounts,
  canDelete,
  openEdit,
  handleToggleStatus,
  handleDelete,
}: {
  groupName: string;
  accounts: CoaAccount[];
  canDelete: boolean;
  openEdit: (a: CoaAccount) => void;
  handleToggleStatus: (a: CoaAccount) => void;
  handleDelete: (id: number) => void;
}) {
  const { sorted: sortedAccounts, sortKey, sortDirection, toggleSort } = useSortableData(
    accounts,
    {
      code: (a) => a.code,
      name: (a) => a.name,
      nature: (a) => a.nature,
      status: (a) => a.status,
    },
  );

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <div className="px-3 py-2">
        <h3 className="text-sm font-semibold text-gray-700">{groupName}</h3>
      </div>
      <SortButtonRow
        options={[
          ['code', 'Code'],
          ['name', 'Name'],
          ['nature', 'Nature'],
          ['status', 'Status'],
        ] as const}
        activeKey={sortKey}
        direction={sortDirection}
        onSort={toggleSort}
      />
      <RecordList isEmpty={false}>
        {sortedAccounts.map((a) => (
          <RecordCard
            key={a.id}
            avatar={<Landmark className="h-4 w-4" />}
            avatarColorClass="from-slate-600 to-gray-400"
            title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{a.name}</span>}
            titleBadges={
              <>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-600">{a.code}</span>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${a.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {a.status === 1 ? 'Active' : 'Inactive'}
                </span>
              </>
            }
            stats={[{ label: 'Nature', value: a.nature }]}
            actions={[
              { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => openEdit(a), colorClass: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
              { key: 'toggle', icon: Power, label: a.status === 1 ? 'Deactivate' : 'Activate', onClick: () => handleToggleStatus(a) },
              { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(a.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
            ]}
          />
        ))}
      </RecordList>
    </div>
  );
}
