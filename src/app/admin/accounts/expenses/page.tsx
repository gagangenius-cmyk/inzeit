'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo, isFinanceOrAccounts } from '@/lib/roleChecks';
import { uploadFileToBlob } from '@/lib/uploadToBlob';
import { Receipt, CheckCircle, RotateCcw, Trash2 } from 'lucide-react';

interface ExpenseRow {
  id: number; date: string; particular: string; amount: number; vat: number; total: number;
  branchId: number; branch: string; coaAccountId: number | null; coaCode: string | null; coaName: string | null;
  addedBy: string; receipt: string; approved: boolean;
}
interface CoaAccount { id: number; code: string; name: string; group_name: string; status: number; }
interface BranchOption { id: number; name: string; }

const fmtAed = (v: number) => `AED ${Number(v || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`;
const emptyFilters = { dateFrom: '', dateTo: '', branchId: '', coaAccountId: '', approved: '' };
const emptyForm = { branch: '', coa_account_id: '', amount: '', date: new Date().toISOString().slice(0, 10), particular: '', remark: '' };

export default function ExpensesPage() {
  const { user } = useAuth();
  const canManage = isCeo(user as any) || isFinanceOrAccounts(user as any);

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const { sorted: sortedRows, sortKey: expenseSortKey, sortDirection: expenseSortDirection, toggleSort: toggleExpenseSort } = useSortableData(
    rows,
    {
      date: (r) => r.date,
      particular: (r) => r.particular,
      account: (r) => (r.coaCode ? `${r.coaCode} - ${r.coaName}` : ''),
      branch: (r) => r.branch,
      amount: (r) => r.amount,
      vat: (r) => r.vat,
      total: (r) => r.total,
      status: (r) => (r.approved ? 'Approved' : 'Pending'),
    },
  );
  const [coaAccounts, setCoaAccounts] = useState<CoaAccount[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [amountCurrency, setAmountCurrency] = useState('AED');

  useEffect(() => {
    fetch('/api/lead-filter-options')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json?.branches) setBranches(json.branches.map((b: any) => ({ id: Number(b.value), name: b.label }))); })
      .catch(() => {});
    fetch('/api/admin/accounts/coa')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json?.data) setCoaAccounts(json.data.filter((a: CoaAccount) => a.status === 1)); })
      .catch(() => {});
  }, []);

  // Amount currency follows the selected branch's country (e.g. Dubai -> AED,
  // India -> INR), same branch -> currency mapping used across Sales Report/PNL.
  useEffect(() => {
    if (!formData.branch) { setAmountCurrency('AED'); return; }
    let cancelled = false;
    fetch(`/api/branch-currency?branchId=${formData.branch}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (!cancelled) setAmountCurrency(json?.currencyCode || 'AED'); })
      .catch(() => { if (!cancelled) setAmountCurrency('AED'); });
    return () => { cancelled = true; };
  }, [formData.branch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.branchId && { branchId: filters.branchId }),
        ...(filters.coaAccountId && { coaAccountId: filters.coaAccountId }),
        ...(filters.approved && { approved: filters.approved }),
      });
      const res = await fetch(`/api/admin/accounts/expenses?${params}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load expenses');
      setRows(result.data);
      setPagination((p) => ({ ...p, total: result.pagination.total, totalPages: result.pagination.totalPages }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setFormData(emptyForm); setFormError(''); setAttachment(null); setShowAddModal(true); };
  const closeForm = () => setShowAddModal(false);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const blob = await uploadFileToBlob(file, `expenses/${Date.now()}-${file.name}`);
      setAttachment({ url: blob.url, name: file.name });
    } catch {
      setFormError('Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormBusy(true);
    try {
      const res = await fetch('/api/admin/accounts/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
          coa_account_id: formData.coa_account_id || null,
          receipt: attachment?.url || '',
        }),
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

  const handleApprove = async (id: number, approve: boolean) => {
    await fetch('/api/admin/accounts/expenses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_approval: approve ? 1 : 0, mgmt_approval: approve ? 1 : 0 }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    const res = await fetch(`/api/admin/accounts/expenses?id=${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Branch expenses tagged to the Chart of Accounts, with auto-calculated VAT</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          + Add Expense
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>From</span>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span>To</span>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <SearchableSelect value={filters.branchId} onChange={(e) => setFilters((f) => ({ ...f, branchId: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </SearchableSelect>
          <SearchableSelect value={filters.coaAccountId} onChange={(e) => setFilters((f) => ({ ...f, coaAccountId: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Accounts</option>
            {coaAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
          </SearchableSelect>
          <SearchableSelect value={filters.approved} onChange={(e) => setFilters((f) => ({ ...f, approved: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Status</option>
            <option value="yes">Approved</option>
            <option value="no">Pending</option>
          </SearchableSelect>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="p-4">
            <SortButtonRow
              options={[
                ['date', 'Date'],
                ['particular', 'Particular'],
                ['account', 'Account'],
                ['branch', 'Branch'],
                ['amount', 'Amount'],
                ['vat', 'VAT'],
                ['total', 'Total'],
                ['status', 'Status'],
              ] as const}
              activeKey={expenseSortKey}
              direction={expenseSortDirection}
              onSort={toggleExpenseSort}
            />
            <RecordList isEmpty={sortedRows.length === 0} emptyIcon={Receipt} emptyTitle="No expenses found">
              {sortedRows.map((r) => (
                <RecordCard
                  key={r.id}
                  avatar={<Receipt className="h-4 w-4" />}
                  avatarColorClass="from-slate-600 to-gray-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{r.particular}</span>}
                  titleBadges={
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.approved ? 'Approved' : 'Pending'}
                    </span>
                  }
                  stats={[
                    { label: 'Date', value: r.date },
                    { label: 'Account', value: r.coaCode ? `${r.coaCode} - ${r.coaName}` : '—' },
                    { label: 'Branch', value: r.branch },
                    { label: 'Amount', value: fmtAed(r.amount) },
                    { label: 'VAT', value: <span className="text-orange-600">{fmtAed(r.vat)}</span> },
                    { label: 'Total', value: <span className="font-bold">{fmtAed(r.total)}</span> },
                  ]}
                  actions={[
                    { key: 'approve', icon: CheckCircle, label: 'Approve', onClick: () => handleApprove(r.id, true), colorClass: 'bg-green-50 text-green-700 hover:bg-green-100', hidden: !(canManage && !r.approved) },
                    { key: 'revoke', icon: RotateCcw, label: 'Revoke', onClick: () => handleApprove(r.id, false), colorClass: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', hidden: !(canManage && r.approved) },
                    { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(r.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !isCeo(user as any) },
                  ]}
                />
              ))}
            </RecordList>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>{pagination.total} total</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
            <button onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Add Expense</h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                <SearchableSelect value={formData.branch} onChange={(e) => setFormData((p) => ({ ...p, branch: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                  <option value="">Select branch</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </SearchableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account (COA)</label>
                <SearchableSelect value={formData.coa_account_id} onChange={(e) => setFormData((p) => ({ ...p, coa_account_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Uncategorized</option>
                  {coaAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name} ({a.group_name})</option>)}
                </SearchableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({amountCurrency}) *</label>
                <input type="number" required min="0" step="0.01" value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <p className="text-xs text-gray-400 mt-1">Currency follows the selected branch. VAT is calculated automatically from the branch's tax rate.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" required value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Vendor *</label>
                <input type="text" required value={formData.particular}
                  onChange={(e) => setFormData((p) => ({ ...p, particular: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                <input type="file" onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="w-full text-sm" />
                {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
                {attachment && <p className="text-xs text-green-600 mt-1">Uploaded: {attachment.name}</p>}
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formBusy || uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {formBusy ? 'Saving…' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
