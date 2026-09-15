'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { DollarSign, TrendingUp, CreditCard, Building, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface RevenueData {
  month: string;
  totalRevenue: number;
  programRevenue: number;
  serviceRevenue: number;
  consultationRevenue: number;
  growth: number;
}

interface BranchRevenue {
  branch: string;
  revenue: number;
  target: number;
  achievement: number;
  growthRate: number;
}

interface ProgramRevenue {
  program: string;
  revenue: number;
  percentage: number;
  growth: number;
}

export default function TotalRevenueReport() {
  const { currencyCode } = useAuth();
  const [monthlyData, setMonthlyData] = useState<RevenueData[]>([]);
  const [branchData, setBranchData] = useState<BranchRevenue[]>([]);
  const [programData, setProgramData] = useState<ProgramRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    generateReport();
  }, [period]);

  const generateReport = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMonthlyData([
        { month: 'Jan', totalRevenue: 1250000, programRevenue: 750000, serviceRevenue: 350000, consultationRevenue: 150000, growth: 8.5 },
        { month: 'Feb', totalRevenue: 1180000, programRevenue: 680000, serviceRevenue: 320000, consultationRevenue: 180000, growth: -5.6 },
        { month: 'Mar', totalRevenue: 1420000, programRevenue: 850000, serviceRevenue: 380000, consultationRevenue: 190000, growth: 20.3 },
        { month: 'Apr', totalRevenue: 1380000, programRevenue: 820000, serviceRevenue: 370000, consultationRevenue: 190000, growth: -2.8 },
        { month: 'May', totalRevenue: 1550000, programRevenue: 920000, serviceRevenue: 420000, consultationRevenue: 210000, growth: 12.3 },
        { month: 'Jun', totalRevenue: 1620000, programRevenue: 980000, serviceRevenue: 440000, consultationRevenue: 200000, growth: 4.5 }
      ]);

      setBranchData([
        { branch: 'Delhi', revenue: 2850000, target: 2500000, achievement: 114, growthRate: 15.2 },
        { branch: 'Mumbai', revenue: 2420000, target: 2300000, achievement: 105.2, growthRate: 8.7 },
        { branch: 'Bangalore', revenue: 1980000, target: 2000000, achievement: 99, growthRate: 3.4 },
        { branch: 'Chennai', revenue: 1650000, target: 1700000, achievement: 97.1, growthRate: -2.1 },
        { branch: 'Kolkata', revenue: 1120000, target: 1200000, achievement: 93.3, growthRate: -5.8 }
      ]);

      setProgramData([
        { program: 'Student Visa', revenue: 2850000, percentage: 35.2, growth: 12.5 },
        { program: 'Work Permit', revenue: 2240000, percentage: 27.6, growth: 8.3 },
        { program: 'Business Visa', revenue: 1680000, percentage: 20.7, growth: -3.2 },
        { program: 'Visit Visa', revenue: 980000, percentage: 12.1, growth: 15.8 },
        { program: 'Immigration', revenue: 360000, percentage: 4.4, growth: 6.7 }
      ]);
      setLoading(false);
    }, 1500);
  };

  const revenueTrendData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Total Revenue',
        data: monthlyData.map(d => d.totalRevenue),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 2,
      },
      {
        label: 'Program Revenue',
        data: monthlyData.map(d => d.programRevenue),
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 2,
      },
      {
        label: 'Service Revenue',
        data: monthlyData.map(d => d.serviceRevenue),
        backgroundColor: '#F59E0B',
        borderColor: '#F59E0B',
        borderWidth: 2,
      }
    ]
  };

  const growthData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'Growth Rate (%)',
        data: monthlyData.map(d => d.growth),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const programPieData = {
    labels: programData.map(d => d.program),
    datasets: [
      {
        data: programData.map(d => d.revenue),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderWidth: 1,
      }
    ]
  };

  const branchPerformanceData = {
    labels: branchData.map(d => d.branch),
    datasets: [
      {
        label: 'Actual Revenue',
        data: branchData.map(d => d.revenue),
        backgroundColor: '#3B82F6',
      },
      {
        label: 'Target Revenue',
        data: branchData.map(d => d.target),
        backgroundColor: '#E5E7EB',
      }
    ]
  };

  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.totalRevenue, 0);
  const avgGrowth = monthlyData.reduce((sum, d) => sum + d.growth, 0) / monthlyData.length;
  const bestMonth = monthlyData.reduce((max, d) => d.totalRevenue > max.totalRevenue ? d : max, monthlyData[0]);

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
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyCode} {(totalRevenue / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Avg Growth</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Best Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {bestMonth.month}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Top Program</p>
              <p className="text-lg font-bold text-gray-900">
                Student Visa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Period</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-lg ${period === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('quarterly')}
              className={`px-4 py-2 rounded-lg ${period === 'quarterly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-4 py-2 rounded-lg ${period === 'yearly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
          <div className="h-80">
            <Line data={revenueTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Growth Rate Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Rate</h3>
          <div className="h-80">
            <Bar data={growthData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Program Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Revenue Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Program</h3>
          <div className="h-80">
            <Pie 
              data={programPieData} 
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

        {/* Branch Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance</h3>
          <div className="h-80">
            <Bar data={branchPerformanceData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Program Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {programData.map((program, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{program.program}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(program.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{program.percentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`text-sm font-medium ${program.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {program.growth >= 0 ? '+' : ''}{program.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Branch Achievement</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achievement</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {branchData.map((branch, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(branch.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(branch.target / 1000).toFixed(0)}K</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`text-sm font-medium ${branch.achievement >= 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {branch.achievement}%
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
