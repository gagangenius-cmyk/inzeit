'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import {
  BarChart3, Download, Filter, Search, Calendar,
  FileText, TrendingUp, Users, DollarSign, Eye,
  Building2, MapPin, Target, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Lead {
  id: number;
  fname: string;
  mname: string;
  lname: string;
  email: string;
  phone: string;
  mobile: string;
  nationality: string;
  address: string;
  dob: string;
  gender: string;
  id_number: string;
  id_expiry: string;
  country_interest: string;
  country_interest_label?: string;
  service_interest: string;
  service_interest_label?: string;
  market_source: string;
  appointment: string;
  followup: string;
  folowuptime: string;
  followupstat: number;
  enquiry: string;
  convet: string;
  priority: string;
  status: string;
  regdate: string;
  assignTo: number;
  branch: number;
  region: number;
  payTotal: number;
  paidYet: number;
  payBalance: number;
  lead_remark: string;
  created: string;
  lead_quality: string;
  dmEmployeeByASSIGNTo?: { id: number; name: string };
  dmEmployeeByCoUNSILOR?: { id: number; name: string };
  dmBranch?: { id: number; name: string };
}

interface BranchPerformance {
  id: number;
  name: string;
  region: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  revenue: number;
  target: number;
  achievementRate: number;
  counselors: number;
  activeCounselors: number;
}

export default function BranchPerformanceReport() {
  const { currencyCode } = useAuth();
  const [branches, setBranches] = useState<BranchPerformance[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchPerformance | null>(null);
  const [dateRange, setDateRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(Number(value || 0));
    } catch {
      return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
    }
  };

  useEffect(() => {
    fetchBranchData();
  }, [dateRange]);

  const fetchBranchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/branch-performance?dateRange=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch branch data');
      }
      
      const data = await response.json();
      setBranches(data.branches || []);
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching branch data:', error);
      setBranches([]);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Properly typed function parameter
  const handleBranchClick = (branch: BranchPerformance) => {
    setSelectedBranch(branch);
  };

  // ✅ FIXED: Properly typed function parameter
  const handleLeadView = (lead: Lead) => {
    console.log('Viewing lead:', lead.fname, lead.lname);
    // Navigate to lead details or open modal
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBranchLeads = (branchId: number) => {
    // ✅ FIXED: Properly typed parameter in filter
    return leads.filter((lead: Lead) => lead.branch === branchId);
  };

  const { sorted: sortedBranchLeads, sortKey: branchLeadSortKey, sortDirection: branchLeadSortDirection, toggleSort: toggleBranchLeadSort } = useSortableData(
    selectedBranch ? getBranchLeads(selectedBranch.id) : [],
    {
      lead: (lead: Lead) => `${lead.fname || ''} ${lead.lname || ''}`,
      service: (lead: Lead) => lead.service_interest_label || lead.service_interest,
      status: (lead: Lead) => lead.status,
      counselor: (lead: Lead) => lead.dmEmployeeByASSIGNTo?.name,
      revenue: (lead: Lead) => lead.payTotal,
    },
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Branch Performance Report</h1>
        <p className="text-gray-600 mt-1">Analyze branch performance metrics and lead conversion data</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <SearchableSelect
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </SearchableSelect>
          </div>

          <div className="flex items-center space-x-2">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Branch Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        {filteredBranches.map((branch) => (
          <div
            key={branch.id}
            onClick={() => handleBranchClick(branch)}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  branch.achievementRate >= 100 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {branch.achievementRate >= 100 ? 'On Target' : 'Below Target'}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{branch.name}</h3>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {branch.region}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Conversion Rate</p>
                  <p className="text-lg font-bold text-gray-900">{branch.conversionRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Achievement</p>
                  <p className="text-lg font-bold text-gray-900">{branch.achievementRate}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{branch.totalLeads} leads</span>
                <span>{formatCurrency(branch.revenue)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{branch.activeCounselors}/{branch.counselors} counselors</span>
                <span>{branch.convertedLeads} converted</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Branch Details */}
      {selectedBranch && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedBranch.name} - Recent Leads
          </h2>
          
          <SortButtonRow
            options={[
              ['lead', 'Lead'],
              ['service', 'Service'],
              ['status', 'Status'],
              ['counselor', 'Counselor'],
              ['revenue', 'Revenue'],
            ] as const}
            activeKey={branchLeadSortKey}
            direction={branchLeadSortDirection}
            onSort={toggleBranchLeadSort}
          />
          <RecordList isEmpty={sortedBranchLeads.length === 0}>
            {sortedBranchLeads.map((lead: Lead) => (
              <RecordCard
                key={lead.id}
                avatar={<Users className="h-4 w-4" />}
                avatarColorClass="from-blue-600 to-cyan-400"
                title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{lead.fname} {lead.lname}</span>}
                titleBadges={
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lead.status === 'Converted'
                      ? 'bg-green-100 text-green-800'
                      : lead.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.status}
                  </span>
                }
                metaItems={[{ icon: Search, text: lead.email, key: 'email' }]}
                stats={[
                  { label: 'Service', value: lead.service_interest_label || lead.service_interest },
                  { label: 'Counselor', value: lead.dmEmployeeByASSIGNTo?.name || 'Unassigned' },
                  { label: 'Revenue', value: formatCurrency(lead.payTotal) },
                ]}
                actions={[
                  { key: 'view', icon: Eye, label: 'View', onClick: () => handleLeadView(lead) },
                ]}
              />
            ))}
          </RecordList>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Branches</p>
              <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Conversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {(branches.reduce((acc, b) => acc + b.conversionRate, 0) / branches.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${branches.reduce((acc, b) => acc + b.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Counselors</p>
              <p className="text-2xl font-bold text-gray-900">
                {branches.reduce((acc, b) => acc + b.activeCounselors, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
