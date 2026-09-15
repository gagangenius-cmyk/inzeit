'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Users, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface BranchData {
  branch: string;
  total: number;
  active: number;
  onHold: number;
  visaGranted: number;
  closed: number;
  conversionRate: number;
}

export default function BranchLeadStatusReport() {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData([
        {
          branch: 'Delhi',
          total: 245,
          active: 120,
          onHold: 35,
          visaGranted: 67,
          closed: 23,
          conversionRate: 27.3
        },
        {
          branch: 'Mumbai',
          total: 189,
          active: 95,
          onHold: 28,
          visaGranted: 45,
          closed: 21,
          conversionRate: 23.8
        },
        {
          branch: 'Bangalore',
          total: 156,
          active: 78,
          onHold: 22,
          visaGranted: 38,
          closed: 18,
          conversionRate: 24.4
        },
        {
          branch: 'Chennai',
          total: 134,
          active: 68,
          onHold: 19,
          visaGranted: 32,
          closed: 15,
          conversionRate: 23.9
        },
        {
          branch: 'Kolkata',
          total: 98,
          active: 52,
          onHold: 15,
          visaGranted: 21,
          closed: 10,
          conversionRate: 21.4
        }
      ]);
      setLoading(false);
    }, 1500);
  };

  const statusData = [
    { name: 'Active', value: data.reduce((sum, d) => sum + d.active, 0), color: '#3B82F6' },
    { name: 'On Hold', value: data.reduce((sum, d) => sum + d.onHold, 0), color: '#F59E0B' },
    { name: 'Visa Granted', value: data.reduce((sum, d) => sum + d.visaGranted, 0), color: '#10B981' },
    { name: 'Closed', value: data.reduce((sum, d) => sum + d.closed, 0), color: '#6B7280' }
  ];

  const filteredData = selectedBranch === 'all' ? data : data.filter(d => d.branch === selectedBranch);

  const branchChartData = {
    labels: filteredData.map(d => d.branch),
    datasets: [
      {
        label: 'Active',
        data: filteredData.map(d => d.active),
        backgroundColor: '#3B82F6',
        stack: 'Stack 0',
      },
      {
        label: 'On Hold',
        data: filteredData.map(d => d.onHold),
        backgroundColor: '#F59E0B',
        stack: 'Stack 0',
      },
      {
        label: 'Visa Granted',
        data: filteredData.map(d => d.visaGranted),
        backgroundColor: '#10B981',
        stack: 'Stack 0',
      },
      {
        label: 'Closed',
        data: filteredData.map(d => d.closed),
        backgroundColor: '#6B7280',
        stack: 'Stack 0',
      }
    ]
  };

  const pieChartData = {
    labels: statusData.map(d => d.name),
    datasets: [
      {
        data: statusData.map(d => d.value),
        backgroundColor: statusData.map(d => d.color),
        borderWidth: 1,
      }
    ]
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.reduce((sum, d) => sum + d.total, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Visa Granted</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.reduce((sum, d) => sum + d.visaGranted, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Avg Conversion</p>
              <p className="text-2xl font-bold text-gray-900">
                {(data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.reduce((sum, d) => sum + d.onHold, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch-wise Status Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch-wise Lead Status</h3>
          <div className="h-80">
            <Bar data={branchChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Status Distribution</h3>
          <div className="h-80">
            <Pie 
              data={pieChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(0);
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Branch Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Hold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visa Granted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((branch, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.active}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.onHold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.visaGranted}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.closed}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
