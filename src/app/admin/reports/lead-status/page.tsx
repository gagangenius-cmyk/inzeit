'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useRouter } from 'next/navigation';
import {
  Users, TrendingUp, Calendar, DollarSign, Globe,
  Filter, Search, Download, Eye, BarChart3,
  MapPin, Phone, Mail, Building, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

interface LeadData {
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
  country_interest: string;
  country_interest_label?: string;
  service_interest: string;
  service_interest_label?: string;
  market_source: string;
  market_source_label?: string;
  priority: string;
  status: string;
  regdate: string;
  payTotal: number;
  payBalance: number;
  dmEmployeeByASSIGNTo?: { id: number; name: string };
  dmBranch?: { id: number; name: string };
}

interface Statistics {
  totalLeads: number;
  newLeads: number;
  activeLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  pendingRevenue: number;
  topCountries: Array<{ country: string; count: number }>;
  topServices: Array<{ service: string; count: number }>;
  monthlyTrends: Array<{ month: string; leads: number; revenue: number }>;
}

export default function LeadStatusReport() {
  const router = useRouter();
  const { currencyCode } = useAuth();
  const formatCurrency = (value: number) => {
    try {
      return new Intl.NumberFormat('en-AE', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(value);
    } catch {
      return `${currencyCode} ${Number(value || 0).toLocaleString()}`;
    }
  };
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    country: '',
    service: '',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  // Stats cards aggregate over a broad sample, independent of the paginated
  // table below — fetched once on mount, not on every filter/search change.
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Used to fetch up to 10,000 full lead rows to the browser just to
      // reduce() these totals/breakdowns client-side - now a single real SQL
      // aggregate (/api/reports?type=leads), scoped and cached the same way
      // as every other report.
      const res = await fetch('/api/reports?type=leads');
      if (res.ok) {
        const json = await res.json();
        setStatistics(json.data as Statistics);
      }
    } catch (error) {
      console.error('Error fetching report statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearchTerm, filters.status, filters.priority, filters.country, filters.service, filters.dateFrom, filters.dateTo]);

  const fetchLeadsTable = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.country) params.set('countryInterest', filters.country);
      if (filters.service) params.set('serviceInterest', filters.service);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/leads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, pages: data.pagination?.pages ?? 0 }));
      }
    } catch (error) {
      console.error('Error fetching leads table:', error);
    } finally {
      setTableLoading(false);
    }
  };


  const { sorted: sortedLeads, sortKey: leadSortKey, sortDirection: leadSortDirection, toggleSort: toggleLeadSort } = useSortableData(
    leads,
    {
      lead: (lead) => `${lead.fname || ''} ${lead.lname || ''}`,
      contact: (lead) => lead.email || lead.phone,
      interest: (lead) => lead.country_interest_label || lead.country_interest,
      status: (lead) => lead.status,
      assignedTo: (lead) => lead.dmEmployeeByASSIGNTo?.name,
      revenue: (lead) => lead.payTotal,
    },
  );

  const [exporting, setExporting] = useState(false);
  const exportToExcel = async () => {
    // The table itself is now paginated (20 rows/page) — export fetches every
    // row matching the current filters fresh, rather than relying on an
    // always-loaded 10,000-row array just in case the button gets clicked.
    setExporting(true);
    try {
      const params = new URLSearchParams({ limit: '10000' });
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.country) params.set('countryInterest', filters.country);
      if (filters.service) params.set('serviceInterest', filters.service);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/leads?${params}`);
      const data = res.ok ? await res.json() : { leads: [] };
      const exportLeads: LeadData[] = data.leads || [];

      const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'Service', 'Status', 'Priority', 'Registration Date', 'Total Payment', 'Balance'];
      const csvContent = [
        headers.join(','),
        ...exportLeads.map(lead => [
          lead.id,
          `${lead.fname} ${lead.lname}`,
          lead.email,
          lead.phone,
          lead.country_interest_label || lead.country_interest,
          lead.service_interest_label || lead.service_interest,
          lead.status,
          lead.priority,
          lead.regdate,
          lead.payTotal,
          lead.payBalance
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Lead Status Report</h1>
              <p className="text-gray-600 mt-2">Comprehensive analysis of leads from CrmcForumLeads table</p>
            </div>
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalLeads}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Leads</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.newLeads}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(statistics.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(statistics.pendingRevenue)}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
            {statistics?.topCountries.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <Globe className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">{item.country}</span>
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{item.count}</span>
              </div>
            ))}
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
            {statistics?.topServices.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-700">{item.service}</span>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search leads..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <SearchableSelect
                value={filters.status}
                onChange={(e) => { setFilters({...filters, status: e.target.value}); setPagination((prev) => ({ ...prev, page: 1 })); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Converted">Converted</option>
                <option value="Closed">Closed</option>
              </SearchableSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <SearchableSelect
                value={filters.priority}
                onChange={(e) => { setFilters({...filters, priority: e.target.value}); setPagination((prev) => ({ ...prev, page: 1 })); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </SearchableSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <SearchableSelect
                value={filters.country}
                onChange={(e) => { setFilters({...filters, country: e.target.value}); setPagination((prev) => ({ ...prev, page: 1 })); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Countries</option>
                {statistics?.topCountries.map(country => (
                  <option key={country.country} value={country.country}>{country.country}</option>
                ))}
              </SearchableSelect>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Leads ({pagination.total})</h3>
          </div>
          <div className="p-4">
            <SortButtonRow
              options={[
                ['lead', 'Lead'],
                ['contact', 'Contact'],
                ['interest', 'Interest'],
                ['status', 'Status'],
                ['assignedTo', 'Assigned To'],
                ['revenue', 'Revenue'],
              ] as const}
              activeKey={leadSortKey}
              direction={leadSortDirection}
              onSort={toggleLeadSort}
            />
            <RecordList loading={tableLoading} isEmpty={!tableLoading && sortedLeads.length === 0} emptyIcon={Users} emptyTitle="No leads found">
              {sortedLeads.map((lead) => (
                <RecordCard
                  key={lead.id}
                  avatar={<Users className="h-4 w-4" />}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{lead.fname} {lead.lname}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">ID: {lead.id}</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        lead.status === 'New' ? 'bg-green-100 text-green-800' :
                        lead.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'Converted' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                    </>
                  }
                  metaItems={[{ icon: Mail, text: `${lead.email || '—'} · ${lead.phone || '—'}`, key: 'contact' }]}
                  stats={[
                    { label: 'Interest', value: lead.country_interest_label || lead.country_interest || '—', sub: lead.service_interest_label || lead.service_interest },
                    { label: 'Assigned To', value: lead.dmEmployeeByASSIGNTo?.name || 'Unassigned' },
                    { label: 'Revenue', value: formatCurrency(Number(lead.payTotal || 0)), sub: `Balance: ${formatCurrency(Number(lead.payBalance || 0))}` },
                  ]}
                  actions={[
                    { key: 'view', icon: Eye, label: 'View', onClick: () => setSelectedLead(lead) },
                  ]}
                />
              ))}
            </RecordList>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {tableLoading ? 'Loading…' : `Page ${pagination.page} of ${Math.max(pagination.pages, 1)} — ${pagination.total} leads`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1 || tableLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages || prev.page, prev.page + 1) }))}
                disabled={pagination.page >= pagination.pages || tableLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
