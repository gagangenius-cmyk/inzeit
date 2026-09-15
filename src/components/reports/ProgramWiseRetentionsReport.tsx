'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Target, TrendingUp, Users, Award, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ProgramRetention {
  program: string;
  totalClients: number;
  retainedClients: number;
  retentionRate: number;
  revenue: number;
  avgRetentionTime: number;
  monthlyData: {
    month: string;
    retained: number;
    churned: number;
    rate: number;
  }[];
}

interface RetentionMetrics {
  period: string;
  overallRate: number;
  newClients: number;
  retainedClients: number;
  churnedClients: number;
}

export default function ProgramWiseRetentionsReport() {
  const { currencyCode } = useAuth();
  const [programData, setProgramData] = useState<ProgramRetention[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<RetentionMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    generateReport();
  }, [selectedProgram, timeRange]);

  const generateReport = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProgramData([
        {
          program: 'Student Visa',
          totalClients: 450,
          retainedClients: 387,
          retentionRate: 86.0,
          revenue: 2850000,
          avgRetentionTime: 18,
          monthlyData: [
            { month: 'Jan', retained: 62, churned: 8, rate: 88.6 },
            { month: 'Feb', retained: 58, churned: 7, rate: 89.2 },
            { month: 'Mar', retained: 65, churned: 5, rate: 92.9 },
            { month: 'Apr', retained: 61, churned: 9, rate: 87.1 },
            { month: 'May', retained: 68, churned: 6, rate: 91.9 },
            { month: 'Jun', retained: 63, churned: 7, rate: 90.0 }
          ]
        },
        {
          program: 'Work Permit',
          totalClients: 320,
          retainedClients: 268,
          retentionRate: 83.8,
          revenue: 2240000,
          avgRetentionTime: 24,
          monthlyData: [
            { month: 'Jan', retained: 45, churned: 8, rate: 84.9 },
            { month: 'Feb', retained: 42, churned: 10, rate: 80.8 },
            { month: 'Mar', retained: 48, churned: 7, rate: 87.3 },
            { month: 'Apr', retained: 44, churned: 9, rate: 83.0 },
            { month: 'May', retained: 51, churned: 6, rate: 89.5 },
            { month: 'Jun', retained: 38, churned: 8, rate: 82.6 }
          ]
        },
        {
          program: 'Business Visa',
          totalClients: 180,
          retainedClients: 142,
          retentionRate: 78.9,
          revenue: 1680000,
          avgRetentionTime: 36,
          monthlyData: [
            { month: 'Jan', retained: 25, churned: 7, rate: 78.1 },
            { month: 'Feb', retained: 22, churned: 8, rate: 73.3 },
            { month: 'Mar', retained: 28, churned: 5, rate: 84.8 },
            { month: 'Apr', retained: 24, churned: 9, rate: 72.7 },
            { month: 'May', retained: 26, churned: 6, rate: 81.3 },
            { month: 'Jun', retained: 17, churned: 7, rate: 70.8 }
          ]
        },
        {
          program: 'Visit Visa',
          totalClients: 280,
          retainedClients: 245,
          retentionRate: 87.5,
          revenue: 980000,
          avgRetentionTime: 6,
          monthlyData: [
            { month: 'Jan', retained: 42, churned: 5, rate: 89.4 },
            { month: 'Feb', retained: 38, churned: 7, rate: 84.4 },
            { month: 'Mar', retained: 45, churned: 4, rate: 91.8 },
            { month: 'Apr', retained: 41, churned: 8, rate: 83.7 },
            { month: 'May', retained: 44, churned: 5, rate: 89.8 },
            { month: 'Jun', retained: 35, churned: 6, rate: 85.4 }
          ]
        },
        {
          program: 'Immigration',
          totalClients: 95,
          retainedClients: 78,
          retentionRate: 82.1,
          revenue: 360000,
          avgRetentionTime: 48,
          monthlyData: [
            { month: 'Jan', retained: 14, churned: 3, rate: 82.4 },
            { month: 'Feb', retained: 12, churned: 4, rate: 75.0 },
            { month: 'Mar', retained: 15, churned: 2, rate: 88.2 },
            { month: 'Apr', retained: 13, churned: 5, rate: 72.2 },
            { month: 'May', retained: 14, churned: 3, rate: 82.4 },
            { month: 'Jun', retained: 10, churned: 4, rate: 71.4 }
          ]
        }
      ]);

      setMonthlyMetrics([
        { period: 'Jan', overallRate: 84.6, newClients: 68, retainedClients: 188, churnedClients: 34 },
        { period: 'Feb', overallRate: 82.3, newClients: 72, retainedClients: 172, churnedClients: 37 },
        { period: 'Mar', overallRate: 88.9, newClients: 85, retainedClients: 201, churnedClients: 25 },
        { period: 'Apr', overallRate: 81.7, newClients: 78, retainedClients: 183, churnedClients: 41 },
        { period: 'May', overallRate: 87.0, newClients: 92, retainedClients: 203, churnedClients: 30 },
        { period: 'Jun', overallRate: 83.6, newClients: 65, retainedClients: 163, churnedClients: 32 }
      ]);
      setLoading(false);
    }, 1500);
  };

  const programComparisonData = {
    labels: programData.map(d => d.program),
    datasets: [
      {
        label: 'Retention Rate (%)',
        data: programData.map(d => d.retentionRate),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 2,
      }
    ]
  };

  const revenueRetentionData = {
    labels: programData.map(d => d.program),
    datasets: [
      {
        label: 'Revenue',
        data: programData.map(d => d.revenue),
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 2,
      }
    ]
  };

  const monthlyTrendData = {
    labels: monthlyMetrics.map(d => d.period),
    datasets: [
      {
        label: 'Overall Retention Rate (%)',
        data: monthlyMetrics.map(d => d.overallRate),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const clientFlowData = {
    labels: monthlyMetrics.map(d => d.period),
    datasets: [
      {
        label: 'New Clients',
        data: monthlyMetrics.map(d => d.newClients),
        backgroundColor: '#3B82F6',
      },
      {
        label: 'Retained Clients',
        data: monthlyMetrics.map(d => d.retainedClients),
        backgroundColor: '#10B981',
      },
      {
        label: 'Churned Clients',
        data: monthlyMetrics.map(d => d.churnedClients),
        backgroundColor: '#EF4444',
      }
    ]
  };

  const filteredProgramData = selectedProgram === 'all' ? programData : programData.filter(d => d.program === selectedProgram);
  const totalClients = programData.reduce((sum, d) => sum + d.totalClients, 0);
  const totalRetained = programData.reduce((sum, d) => sum + d.retainedClients, 0);
  const overallRetentionRate = (totalRetained / totalClients) * 100;
  const totalRevenue = programData.reduce((sum, d) => sum + d.revenue, 0);

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
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalClients.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Retained</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalRetained.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallRetentionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyCode} {(totalRevenue / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <div className="flex space-x-4">
            <SearchableSelect
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Programs</option>
              {programData.map(program => (
                <option key={program.program} value={program.program}>{program.program}</option>
              ))}
            </SearchableSelect>
            <SearchableSelect
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Retention Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Retention Rates</h3>
          <div className="h-80">
            <Bar data={programComparisonData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Revenue by Program */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Program</h3>
          <div className="h-80">
            <Bar data={revenueRetentionData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Retention Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Retention Trend</h3>
          <div className="h-80">
            <Line data={monthlyTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Client Flow */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Flow Analysis</h3>
          <div className="h-80">
            <Bar data={clientFlowData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Detailed Program Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Program Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Clients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retained</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Retention Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProgramData.map((program, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{program.program}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.totalClients}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.retainedClients}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-24">
                        <div 
                          className={`h-2 rounded-full ${
                            program.retentionRate >= 85 ? 'bg-green-600' : 
                            program.retentionRate >= 75 ? 'bg-yellow-600' : 'bg-red-600'
                          }`} 
                          style={{ width: `${program.retentionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{program.retentionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(program.revenue / 1000).toFixed(0)}K</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {program.avgRetentionTime} months
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
