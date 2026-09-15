'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Users, TrendingUp, Target, Globe, Phone, Mail } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface MonthlyLeads {
  month: string;
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  sources: {
    website: number;
    referral: number;
    social: number;
    email: number;
    phone: number;
    other: number;
  };
}

interface SourceData {
  source: string;
  leads: number;
  percentage: number;
  quality: number;
}

interface CountryData {
  country: string;
  leads: number;
  percentage: number;
  growth: number;
}

export default function MonthlyLeadsReceivedReport() {
  const [monthlyData, setMonthlyData] = useState<MonthlyLeads[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    generateReport();
  }, [selectedMonth]);

  const generateReport = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMonthlyData([
        { 
          month: 'Jan', 
          totalLeads: 245, 
          qualifiedLeads: 89, 
          conversionRate: 36.3,
          sources: { website: 98, referral: 49, social: 37, email: 24, phone: 24, other: 13 }
        },
        { 
          month: 'Feb', 
          totalLeads: 312, 
          qualifiedLeads: 118, 
          conversionRate: 37.8,
          sources: { website: 125, referral: 62, social: 47, email: 31, phone: 31, other: 16 }
        },
        { 
          month: 'Mar', 
          totalLeads: 289, 
          qualifiedLeads: 108, 
          conversionRate: 37.4,
          sources: { website: 116, referral: 58, social: 43, email: 29, phone: 29, other: 14 }
        },
        { 
          month: 'Apr', 
          totalLeads: 356, 
          qualifiedLeads: 142, 
          conversionRate: 39.9,
          sources: { website: 142, referral: 71, social: 54, email: 36, phone: 36, other: 17 }
        },
        { 
          month: 'May', 
          totalLeads: 423, 
          qualifiedLeads: 178, 
          conversionRate: 42.1,
          sources: { website: 169, referral: 85, social: 64, email: 42, phone: 42, other: 21 }
        },
        { 
          month: 'Jun', 
          totalLeads: 398, 
          qualifiedLeads: 165, 
          conversionRate: 41.5,
          sources: { website: 159, referral: 80, social: 60, email: 40, phone: 40, other: 19 }
        }
      ]);

      setSourceData([
        { source: 'Website', leads: 809, percentage: 38.2, quality: 85 },
        { source: 'Referral', leads: 405, percentage: 19.1, quality: 92 },
        { source: 'Social Media', leads: 305, percentage: 14.4, quality: 78 },
        { source: 'Email', leads: 202, percentage: 9.5, quality: 88 },
        { source: 'Phone', leads: 202, percentage: 9.5, quality: 95 },
        { source: 'Other', leads: 100, percentage: 4.7, quality: 72 }
      ]);

      setCountryData([
        { country: 'India', leads: 856, percentage: 40.4, growth: 12.5 },
        { country: 'USA', leads: 423, percentage: 20.0, growth: 8.3 },
        { country: 'Canada', leads: 312, percentage: 14.7, growth: 15.8 },
        { country: 'UK', leads: 245, percentage: 11.6, growth: -3.2 },
        { country: 'Australia', leads: 178, percentage: 8.4, growth: 6.7 },
        { country: 'Others', leads: 109, percentage: 5.1, growth: 2.1 }
      ]);
      setLoading(false);
    }, 1500);
  };

  const leadsTrendData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Total Leads',
        data: monthlyData.map(d => d.totalLeads),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 2,
      },
      {
        label: 'Qualified Leads',
        data: monthlyData.map(d => d.qualifiedLeads),
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 2,
      }
    ]
  };

  const conversionRateData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Conversion Rate (%)',
        data: monthlyData.map(d => d.conversionRate),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const sourcePieData = {
    labels: sourceData.map(d => d.source),
    datasets: [
      {
        data: sourceData.map(d => d.leads),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'],
        borderWidth: 1,
      }
    ]
  };

  const countryChartData = {
    labels: countryData.map(d => d.country),
    datasets: [
      {
        label: 'Leads by Country',
        data: countryData.map(d => d.leads),
        backgroundColor: '#3B82F6',
      }
    ]
  };

  const filteredMonthData = selectedMonth === 'all' ? monthlyData : monthlyData.filter(d => d.month === selectedMonth);
  const totalLeads = monthlyData.reduce((sum, d) => sum + d.totalLeads, 0);
  const totalQualified = monthlyData.reduce((sum, d) => sum + d.qualifiedLeads, 0);
  const avgConversionRate = monthlyData.reduce((sum, d) => sum + d.conversionRate, 0) / monthlyData.length;
  const bestMonth = monthlyData.reduce((max, d) => d.totalLeads > max.totalLeads ? d : max, monthlyData[0]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalLeads.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Qualified</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalQualified.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Avg Conversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgConversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Globe className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Best Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {bestMonth.month}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Select Month</h3>
          <SearchableSelect
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Months</option>
            {monthlyData.map(month => (
              <option key={month.month} value={month.month}>{month.month}</option>
            ))}
          </SearchableSelect>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Trend</h3>
          <div className="h-80">
            <Line data={leadsTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Conversion Rate Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate</h3>
          <div className="h-80">
            <Bar data={conversionRateData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Source and Country Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>
          <div className="h-80">
            <Pie 
              data={sourcePieData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Country Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads by Country</h3>
          <div className="h-80">
            <Bar data={countryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Source Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sourceData.map((source, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {source.source === 'Website' && <Globe className="w-4 h-4 mr-2 text-blue-600" />}
                        {source.source === 'Email' && <Mail className="w-4 h-4 mr-2 text-green-600" />}
                        {source.source === 'Phone' && <Phone className="w-4 h-4 mr-2 text-purple-600" />}
                        {source.source}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{source.leads}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{source.percentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${source.quality}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{source.quality}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Country Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Country Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countryData.map((country, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{country.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.leads}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.percentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`text-sm font-medium ${country.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {country.growth >= 0 ? '+' : ''}{country.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
