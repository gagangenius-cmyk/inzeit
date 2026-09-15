'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { CrmAccountsAttributes } from '@/models';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2, Landmark } from 'lucide-react';

const emptyAccountForm = {
  account_no: '',
  bank_address: '',
  bank_beneficiary: '',
  bank_name: '',
  iban: '',
  branch_id: '',
};

export default function AccountsManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [accounts, setAccounts] = useState<CrmAccountsAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<CrmAccountsAttributes | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CrmAccountsAttributes | null>(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [accountFormError, setAccountFormError] = useState('');
  const [accountFormBusy, setAccountFormBusy] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/accounts?limit=100');
      const data = await response.json();
      if (response.ok) {
        setAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account =>
    account.account_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bank_beneficiary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { sorted: sortedAccounts, sortKey: accountSortKey, sortDirection: accountSortDirection, toggleSort: toggleAccountSort } = useSortableData(
    filteredAccounts,
    {
      accountNo: (a) => a.account_no,
      bankName: (a) => a.bank_name,
      beneficiary: (a) => a.bank_beneficiary,
      iban: (a) => a.iban,
      branch: (a) => a.branch_id,
    },
  );

  const handleViewAccount = (account: CrmAccountsAttributes) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm(emptyAccountForm);
    setAccountFormError('');
    setShowAddModal(true);
  };

  const openEditAccount = (account: CrmAccountsAttributes) => {
    setEditingAccount(account);
    setAccountForm({
      account_no: account.account_no || '',
      bank_address: account.bank_address || '',
      bank_beneficiary: account.bank_beneficiary || '',
      bank_name: account.bank_name || '',
      iban: account.iban || '',
      branch_id: account.branch_id || '',
    });
    setAccountFormError('');
    setShowAddModal(true);
  };

  const closeAccountForm = () => {
    setShowAddModal(false);
    setEditingAccount(null);
    setAccountForm(emptyAccountForm);
    setAccountFormError('');
  };

  const handleSaveAccount = async () => {
    setAccountFormError('');
    if (!accountForm.account_no.trim() || !accountForm.bank_name.trim()) {
      setAccountFormError('Account number and bank name are required');
      return;
    }
    setAccountFormBusy(true);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAccount ? { id: editingAccount.id, ...accountForm } : accountForm),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAccountFormError(result.error || 'Failed to save account');
        return;
      }
      await fetchAccounts();
      closeAccountForm();
    } catch {
      setAccountFormError('Network error while saving account');
    } finally {
      setAccountFormBusy(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    await fetch(`/api/admin/accounts?id=${id}`, { method: 'DELETE' });
    await fetchAccounts();
    setShowModal(false);
    setSelectedAccount(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Accounts Management</h1>
          <p className="text-gray-600 mt-2">Manage bank accounts and financial information</p>
        </div>
        <button 
          onClick={openAddAccount}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Account
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search accounts by account number, bank name, or beneficiary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Banks</option>
            <option value="Emirates NBD">Emirates NBD</option>
            <option value="Abu Dhabi Commercial Bank">Abu Dhabi Commercial Bank</option>
            <option value="Sharjah Islamic Bank">Sharjah Islamic Bank</option>
          </SearchableSelect>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <SortButtonRow
          options={[
            ['accountNo', 'Account Number'],
            ['bankName', 'Bank Name'],
            ['beneficiary', 'Beneficiary'],
            ['iban', 'IBAN'],
            ['branch', 'Branch'],
          ] as const}
          activeKey={accountSortKey}
          direction={accountSortDirection}
          onSort={toggleAccountSort}
        />
        <RecordList isEmpty={false}>
          {sortedAccounts.map((account) => (
            <RecordCard
              key={account.id}
              avatar={<Landmark className="h-4 w-4" />}
              avatarColorClass="from-slate-600 to-gray-400"
              title={<span className="min-w-0 break-words font-mono text-base font-bold text-gray-950">{account.account_no}</span>}
              titleBadges={<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{account.bank_name}</span>}
              stats={[
                { label: 'Beneficiary', value: account.bank_beneficiary },
                { label: 'IBAN', value: <span className="font-mono">{account.iban}</span> },
                { label: 'Branch', value: account.branch_id },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewAccount(account) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => openEditAccount(account) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => { setSelectedAccount(account); setShowModal(true); }, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>

      {/* Account Details Modal */}
      {showModal && selectedAccount && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Account Details</h3>
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
                  <h4 className="font-semibold text-gray-700">Account Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Account Number:</span></p>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedAccount.account_no}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Bank Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Bank Name:</span> {selectedAccount.bank_name}</p>
                    <p><span className="font-medium">Beneficiary:</span> {selectedAccount.bank_beneficiary}</p>
                    <p><span className="font-medium">Branch:</span> {selectedAccount.branch_id}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">IBAN Information</h4>
                  <div className="mt-2">
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedAccount.iban}</p>
                  </div>
                </div>
                {selectedAccount.bank_address && (
                  <div>
                    <h4 className="font-semibold text-gray-700">Bank Address</h4>
                    <p className="mt-1">{selectedAccount.bank_address}</p>
                  </div>
                )}
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
                onClick={() => openEditAccount(selectedAccount)}
                className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] transition-colors"
              >
                Edit Account
              </button>
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to delete this account?`)) {
                    handleDeleteAccount(selectedAccount.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
              <button
                onClick={closeAccountForm}
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
                  <label htmlFor="accountNo" className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="accountNo"
                    value={accountForm.account_no}
                    onChange={(e) => setAccountForm({ ...accountForm, account_no: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    value={accountForm.bank_name}
                    onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <label htmlFor="beneficiary" className="block text-sm font-medium text-gray-700">
                    Beneficiary
                  </label>
                  <input
                    type="text"
                    id="beneficiary"
                    value={accountForm.bank_beneficiary}
                    onChange={(e) => setAccountForm({ ...accountForm, bank_beneficiary: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter beneficiary name"
                  />
                </div>
                <div>
                  <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
                    IBAN
                  </label>
                  <input
                    type="text"
                    id="iban"
                    value={accountForm.iban}
                    onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="Enter IBAN"
                  />
                </div>
                <div>
                  <label htmlFor="branchId" className="block text-sm font-medium text-gray-700">
                    Branch
                  </label>
                  <input
                    type="text"
                    id="branchId"
                    value={accountForm.branch_id}
                    onChange={(e) => setAccountForm({ ...accountForm, branch_id: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter branch name"
                  />
                </div>
                <div>
                  <label htmlFor="bankAddress" className="block text-sm font-medium text-gray-700">
                    Bank Address
                  </label>
                  <textarea
                    id="bankAddress"
                    rows={3}
                    value={accountForm.bank_address}
                    onChange={(e) => setAccountForm({ ...accountForm, bank_address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter bank address"
                  />
                </div>
              </div>
              {accountFormError && <p className="mt-4 text-sm text-red-600">{accountFormError}</p>}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeAccountForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAccount}
                disabled={accountFormBusy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {accountFormBusy ? 'Saving...' : editingAccount ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
