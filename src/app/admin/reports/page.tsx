'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import {
  BarChart3, Download, Filter, Search, Calendar,
  FileText, TrendingUp, Users, DollarSign, Eye
} from 'lucide-react';

export default function ReportsPage() {
  const [summary, setSummary] = useState({
    totalLeads: 0,
    newLeads: 0,
    activeLeads: 0,
    convertedLeads: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    conversionRate: 0,
    generatedAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [reports] = useState([
    {
      id: 1,
      name: 'Lead Status Report',
      description: 'Live lead status, revenue, country and service breakdown',
      type: 'lead-status',
      href: '/admin/reports/lead-status',
      format: 'Live'
    },
    {
      id: 2,
      name: 'Branch Performance',
      description: 'Branch conversion, counselor and revenue performance from leads',
      type: 'branch-performance',
      href: '/admin/reports/branch-performance',
      format: 'Live'
    },
    {
      id: 3,
      name: 'Finance Report',
      description: 'Lead contracts, receipts, balances and payment status',
      type: 'finance',
      href: '/admin/reports/finance',
      format: 'Live'
    },
    {
      id: 4,
      name: 'Lead Source Analytics',
      description: 'Lead source quality and conversion analytics',
      type: 'lead-source',
      href: '/admin/reports/lead-source-analytics',
      format: 'Live'
    }
  ]);

  const [selectedReport, setSelectedReport] = useState<typeof reports[0] | null>(null);
  const [dateRange, setDateRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLiveSummary();
  }, [dateRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date(end);
    if (dateRange === 'week') start.setDate(end.getDate() - 7);
    if (dateRange === 'month') start.setMonth(end.getMonth() - 1);
    if (dateRange === 'quarter') start.setMonth(end.getMonth() - 3);
    if (dateRange === 'year') start.setFullYear(end.getFullYear() - 1);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const fetchLiveSummary = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      const response = await fetch(`/api/reports?type=leads&startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch live report summary');
      const result = await response.json();
      setSummary({
        ...result.data,
        generatedAt: result.generatedAt
      });
    } catch (error) {
      console.error('Error loading live reports summary:', error);
      setSummary({
        totalLeads: 0,
        newLeads: 0,
        activeLeads: 0,
        convertedLeads: 0,
        totalRevenue: 0,
        pendingRevenue: 0,
        conversionRate: 0,
        generatedAt: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and view business reports and analytics</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reports..."
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
            <button
              onClick={fetchLiveSummary}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Refresh Live Data
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                  {report.format}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Source: Leads DB</span>
                <span>{report.format}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.href = report.href}
                  className="flex items-center px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                <button className="flex items-center px-3 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Live Leads</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : summary.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Converted</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : summary.convertedLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : `${summary.conversionRate}%`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
