'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useRouter } from 'next/navigation';
import {
  FileText, DollarSign, TrendingUp, Calendar, CheckCircle,
  XCircle, Clock, Filter, Search, Download, Eye,
  Users, Building, AlertCircle, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ContractData {
  id: number;
  leadId: number;
  contract: string;
  unsigned_contract: string;
  new_contract: string | null;
  ar_contract: string;
  garys: string | null;
  verify: number;
  remarks: string | null;
  verify_by: number;
  verify_date: string | null;
  batch_id: number;
  wp_batch_id: number;
  vendor_id: number;
  vendor_name?: string | null;
  vendor?: string | null;
  employer_id: number;
  old_crm_ag_id: number;
  payment_status: number;
  dmcForumLeads?: {
    id: number;
    fname: string;
    lname: string;
    email: string;
    phone: string;
    country_interest: string;
    country_interest_label?: string;
    service_interest: string;
    service_interest_label?: string;
    payTotal: number;
    payBalance: number;
  };
}

interface ContractStatistics {
  totalContracts: number;
  verifiedContracts: number;
  pendingContracts: number;
  rejectedContracts: number;
  totalValue: number;
  paidValue: number;
  pendingValue: number;
  verificationRate: number;
  contractsByStatus: Array<{ status: string; count: number; value: number }>;
  monthlyContracts: Array<{ month: string; contracts: number; value: number }>;
  topVendors: Array<{ vendor: string; contracts: number }>;
}

export default function FinanceReport() {
  const router = useRouter();
  const { currencyCode } = useAuth();
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [statistics, setStatistics] = useState<ContractStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    verificationStatus: '',
    paymentStatus: '',
    batchId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(Number(value || 0));
    } catch {
      return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
    }
  };

  useEffect(() => {
    fetchContractData();
  }, [dateRange, filters.verificationStatus, filters.paymentStatus]);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      
      // Fetch real finance data from API
      const response = await fetch(`/api/reports/finance?dateRange=${dateRange}&verificationStatus=${filters.verificationStatus}&paymentStatus=${filters.paymentStatus}`);
      if (!response.ok) {
        throw new Error('Failed to fetch finance data');
      }
      
      const data = await response.json();
      setContracts(data.contracts || []);
      setStatistics(data.statistics || null);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setContracts([]);
      setStatistics(calculateStatistics([]));
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (contractsData: ContractData[]): ContractStatistics => {
    const totalContracts = contractsData.length;
    const verifiedContracts = contractsData.filter(c => c.verify === 1).length;
    const pendingContracts = contractsData.filter(c => c.verify === 0).length;
    const rejectedContracts = contractsData.filter(c => c.verify === 2).length;
    
    const totalValue = contractsData.reduce((sum, contract) => sum + Number(contract.dmcForumLeads?.payTotal || 0), 0);
    const paidValue = contractsData.reduce((sum, contract) => 
      sum + Number(contract.dmcForumLeads?.payTotal || 0) - Number(contract.dmcForumLeads?.payBalance || 0), 0
    );
    const pendingValue = contractsData.reduce((sum, contract) => sum + Number(contract.dmcForumLeads?.payBalance || 0), 0);
    
    const verificationRate = totalContracts > 0 ? (verifiedContracts / totalContracts) * 100 : 0;

    // Group by verification status
    const contractsByStatus = [
      { status: 'Verified', count: verifiedContracts, value: contractsData.filter(c => c.verify === 1).reduce((sum, c) => sum + Number(c.dmcForumLeads?.payTotal || 0), 0) },
      { status: 'Pending', count: pendingContracts, value: contractsData.filter(c => c.verify === 0).reduce((sum, c) => sum + Number(c.dmcForumLeads?.payTotal || 0), 0) },
      { status: 'Rejected', count: rejectedContracts, value: contractsData.filter(c => c.verify === 2).reduce((sum, c) => sum + Number(c.dmcForumLeads?.payTotal || 0), 0) }
    ];

    const monthlyMap: Record<string, { month: string; contracts: number; value: number }> = {};
    contractsData.forEach(contract => {
      const date = new Date(contract.verify_date || Date.now());
      const month = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyMap[month]) monthlyMap[month] = { month, contracts: 0, value: 0 };
      monthlyMap[month].contracts += 1;
      monthlyMap[month].value += Number(contract.dmcForumLeads?.payTotal || 0);
    });
    const monthlyContracts = Object.values(monthlyMap).slice(-6);

    const vendorMap: Record<string, number> = {};
    contractsData.forEach(contract => {
      const vendor = contract.vendor_name || contract.vendor || 'Unassigned';
      vendorMap[vendor] = (vendorMap[vendor] || 0) + 1;
    });
    const topVendors = Object.entries(vendorMap)
      .map(([vendor, contracts]) => ({ vendor, contracts }))
      .sort((a, b) => b.contracts - a.contracts)
      .slice(0, 5);

    return {
      totalContracts,
      verifiedContracts,
      pendingContracts,
      rejectedContracts,
      totalValue,
      paidValue,
      pendingValue,
      verificationRate,
      contractsByStatus,
      monthlyContracts,
      topVendors
    };
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = `${contract.contract} ${contract.dmcForumLeads?.fname} ${contract.dmcForumLeads?.lname}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerification = !filters.verificationStatus || 
      (filters.verificationStatus === 'verified' && contract.verify === 1) ||
      (filters.verificationStatus === 'pending' && contract.verify === 0) ||
      (filters.verificationStatus === 'rejected' && contract.verify === 2);
    const matchesPayment = !filters.paymentStatus || contract.payment_status === parseInt(filters.paymentStatus);
    const matchesBatch = !filters.batchId || contract.batch_id === parseInt(filters.batchId);
    
    return matchesSearch && matchesVerification && matchesPayment && matchesBatch;
  });

  const { sorted: sortedContracts, sortKey: contractSortKey, sortDirection: contractSortDirection, toggleSort: toggleContractSort } = useSortableData(
    filteredContracts,
    {
      contract: (c) => c.contract,
      lead: (c) => `${c.dmcForumLeads?.fname || ''} ${c.dmcForumLeads?.lname || ''}`,
      service: (c) => c.dmcForumLeads?.service_interest_label || c.dmcForumLeads?.service_interest,
      verification: (c) => c.verify,
      payment: (c) => c.payment_status,
      value: (c) => c.dmcForumLeads?.payTotal,
    },
  );

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Contract ID', 'Lead Name', 'Email', 'Country', 'Service', 'Contract', 'Verification Status', 'Payment Status', 'Total Value', 'Balance', 'Verify Date'];
    const csvContent = [
      headers.join(','),
      ...filteredContracts.map(contract => [
        contract.id,
        `${contract.dmcForumLeads?.fname} ${contract.dmcForumLeads?.lname}`,
        contract.dmcForumLeads?.email,
        contract.dmcForumLeads?.country_interest_label || contract.dmcForumLeads?.country_interest,
        contract.dmcForumLeads?.service_interest_label || contract.dmcForumLeads?.service_interest,
        contract.contract,
        contract.verify === 1 ? 'Verified' : contract.verify === 2 ? 'Rejected' : 'Pending',
        contract.payment_status === 1 ? 'Paid' : contract.payment_status === 2 ? 'Unpaid' : 'Partial',
        contract.dmcForumLeads?.payTotal || 0,
        contract.dmcForumLeads?.payBalance || 0,
        contract.verify_date || 'N/A'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contracts-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getVerificationStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-red-100 text-red-800';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-[60vh]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contracts & Finance Report</h1>
              <p className="text-gray-600 mt-2">Financial analysis of contracts from CrmcForumLeadsContracts table</p>
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contracts</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalContracts}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.verifiedContracts}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verification Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{statistics.verificationRate.toFixed(1)}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Contracts by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contracts by Status</h3>
            {statistics?.contractsByStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  {item.status === 'Verified' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                  {item.status === 'Pending' && <Clock className="w-4 h-4 text-yellow-500 mr-2" />}
                  {item.status === 'Rejected' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}
                  <span className="text-gray-700">{item.status}</span>
                </div>
                <div className="text-right">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm mr-2">{item.count}</span>
                  <span className="text-sm text-gray-600">{formatCurrency(item.value)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Vendors</h3>
            {statistics?.topVendors.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Building className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">{item.vendor}</span>
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{item.contracts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search contracts..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <SearchableSelect
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </SearchableSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
              <SearchableSelect
                value={filters.verificationStatus}
                onChange={(e) => setFilters({...filters, verificationStatus: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="1">Verified</option>
                <option value="0">Pending</option>
                <option value="2">Rejected</option>
              </SearchableSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <SearchableSelect
                value={filters.paymentStatus}
                onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Payment Status</option>
                <option value="1">Paid</option>
                <option value="2">Unpaid</option>
                <option value="0">Partial</option>
              </SearchableSelect>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Contracts ({filteredContracts.length})</h3>
          </div>
          <div className="p-4">
            <SortButtonRow
              options={[
                ['contract', 'Contract'],
                ['lead', 'Lead'],
                ['service', 'Service'],
                ['verification', 'Verification'],
                ['payment', 'Payment'],
                ['value', 'Value'],
              ] as const}
              activeKey={contractSortKey}
              direction={contractSortDirection}
              onSort={toggleContractSort}
            />
            <RecordList isEmpty={sortedContracts.length === 0}>
              {sortedContracts.map((contract) => (
                <RecordCard
                  key={contract.id}
                  avatar={<FileText className="h-4 w-4" />}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{contract.contract}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">ID: {contract.id}</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerificationStatusColor(contract.verify)}`}>
                        {contract.verify === 1 ? 'Verified' : contract.verify === 2 ? 'Rejected' : 'Pending'}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(contract.payment_status)}`}>
                        {contract.payment_status === 1 ? 'Paid' : contract.payment_status === 2 ? 'Unpaid' : 'Partial'}
                      </span>
                    </>
                  }
                  metaItems={[{ icon: Users, text: `${contract.dmcForumLeads?.fname || ''} ${contract.dmcForumLeads?.lname || ''} · ${contract.dmcForumLeads?.email || ''}`, key: 'lead' }]}
                  stats={[
                    { label: 'Service', value: contract.dmcForumLeads?.service_interest_label || contract.dmcForumLeads?.service_interest || '—' },
                    { label: 'Country', value: contract.dmcForumLeads?.country_interest_label || contract.dmcForumLeads?.country_interest || '—' },
                    { label: 'Value', value: formatCurrency(Number(contract.dmcForumLeads?.payTotal || 0)), sub: `Balance: ${formatCurrency(Number(contract.dmcForumLeads?.payBalance || 0))}` },
                    ...(contract.verify_date ? [{ label: 'Verified On', value: contract.verify_date }] : []),
                  ]}
                  actions={[
                    { key: 'view', icon: Eye, label: 'View', onClick: () => setSelectedContract(contract) },
                  ]}
                />
              ))}
            </RecordList>
          </div>
        </div>
      </div>
    </div>
  );
}
