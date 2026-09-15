'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { DollarSign, TrendingUp, Calendar, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface RetentionData {
  month: string;
  approved: number;
  retained: number;
  pending: number;
  conversionRate: number;
}

interface BranchRetention {
  branch: string;
  totalApproved: number;
  totalRetained: number;
  retentionRate: number;
  averageAmount: number;
}

export default function ApprovedRetainedAmountReport() {
  const { currencyCode } = useAuth();
  const [monthlyData, setMonthlyData] = useState<RetentionData[]>([]);
  const [branchData, setBranchData] = useState<BranchRetention[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    generateReport();
  }, [timeRange]);

  const generateReport = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMonthlyData([
        { month: 'Jan', approved: 450000, retained: 380000, pending: 70000, conversionRate: 84.4 },
        { month: 'Feb', approved: 520000, retained: 445000, pending: 75000, conversionRate: 85.6 },
        { month: 'Mar', approved: 480000, retained: 410000, pending: 70000, conversionRate: 85.4 },
        { month: 'Apr', approved: 610000, retained: 525000, pending: 85000, conversionRate: 86.1 },
        { month: 'May', approved: 580000, retained: 495000, pending: 85000, conversionRate: 85.3 },
        { month: 'Jun', approved: 650000, retained: 560000, pending: 90000, conversionRate: 86.2 }
      ]);

      setBranchData([
        { branch: 'Delhi', totalApproved: 1250000, totalRetained: 1080000, retentionRate: 86.4, averageAmount: 45000 },
        { branch: 'Mumbai', totalApproved: 980000, totalRetained: 835000, retentionRate: 85.2, averageAmount: 42000 },
        { branch: 'Bangalore', totalApproved: 750000, totalRetained: 645000, retentionRate: 86.0, averageAmount: 38000 },
        { branch: 'Chennai', totalApproved: 620000, totalRetained: 525000, retentionRate: 84.7, averageAmount: 35000 },
        { branch: 'Kolkata', totalApproved: 410000, totalRetained: 345000, retentionRate: 84.1, averageAmount: 32000 }
      ]);
      setLoading(false);
    }, 1500);
  };

  const monthlyChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Approved Amount',
        data: monthlyData.map(d => d.approved),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1,
      },
      {
        label: 'Retained Amount',
        data: monthlyData.map(d => d.retained),
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 1,
      },
      {
        label: 'Pending Amount',
        data: monthlyData.map(d => d.pending),
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
        borderWidth: 1,
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

  const branchChartData = {
    labels: branchData.map(d => d.branch),
    datasets: [
      {
        label: 'Total Approved',
        data: branchData.map(d => d.totalApproved),
        backgroundColor: '#3B82F6',
      },
      {
        label: 'Total Retained',
        data: branchData.map(d => d.totalRetained),
        backgroundColor: '#10B981',
      }
    ]
  };

  const totalApproved = monthlyData.reduce((sum, d) => sum + d.approved, 0);
  const totalRetained = monthlyData.reduce((sum, d) => sum + d.retained, 0);
  const totalPending = monthlyData.reduce((sum, d) => sum + d.pending, 0);
  const avgConversionRate = monthlyData.reduce((sum, d) => sum + d.conversionRate, 0) / monthlyData.length;

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
            <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyCode} {(totalApproved / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Retained</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyCode} {(totalRetained / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyCode} {(totalPending / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Avg Conversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgConversionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Report Period</h3>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Amount Trends</h3>
          <div className="h-80">
            <Bar data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Conversion Rate Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate Trend</h3>
          <div className="h-80">
            <Line data={conversionRateData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Branch Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Branch Performance</h3>
        </div>
        <div className="p-6">
          <div className="h-80 mb-6">
            <Bar data={branchChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Approved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Retained</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {branchData.map((branch, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(branch.totalApproved / 1000).toFixed(0)}K</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(branch.totalRetained / 1000).toFixed(0)}K</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.retentionRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {branch.averageAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
