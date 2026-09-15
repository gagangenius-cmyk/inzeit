'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { TrendingUp, Users, DollarSign, Target, Clock, Calendar, Filter, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface AnalyticsData {
  period: string;
  leads: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
  satisfaction: number;
}

interface FunnelData {
  stage: string;
  count: number;
  conversion: number;
  value: number;
}

interface KPIData {
  name: string;
  value: number;
  target: number;
  change: number;
  trend: 'up' | 'down';
}

export default function ComprehensiveAnalyticsReport() {
  const { currencyCode } = useAuth();
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetrics, setSelectedMetrics] = useState(['all']);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateAnalytics();
  }, [timeRange, selectedMetrics]);

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalyticsData([
        { period: 'Jan', leads: 1245, conversions: 847, revenue: 2450000, cost: 420000, roi: 483, satisfaction: 87 },
        { period: 'Feb', leads: 1389, conversions: 923, revenue: 2680000, cost: 455000, roi: 489, satisfaction: 89 },
        { period: 'Mar', leads: 1456, conversions: 998, revenue: 2890000, cost: 478000, roi: 505, satisfaction: 91 },
        { period: 'Apr', leads: 1523, conversions: 1056, revenue: 3120000, cost: 492000, roi: 534, satisfaction: 88 },
        { period: 'May', leads: 1678, conversions: 1189, revenue: 3450000, cost: 518000, roi: 566, satisfaction: 92 },
        { period: 'Jun', leads: 1789, conversions: 1278, revenue: 3780000, cost: 534000, roi: 607, satisfaction: 94 }
      ]);

      setFunnelData([
        { stage: 'Website Visitors', count: 45678, conversion: 100, value: 0 },
        { stage: 'Lead Generation', count: 1789, conversion: 3.9, value: 1789 },
        { stage: 'Qualified Leads', count: 1234, conversion: 69.0, value: 1234 },
        { stage: 'Opportunities', count: 856, conversion: 69.4, value: 856 },
        { stage: 'Proposals', count: 623, conversion: 72.8, value: 623 },
        { stage: 'Closed Deals', count: 445, conversion: 71.4, value: 445 }
      ]);

      setKpiData([
        { name: 'Lead to Conversion', value: 71.4, target: 75, change: 4.2, trend: 'up' },
        { name: 'Average Deal Value', value: 8492, target: 8000, change: 6.2, trend: 'up' },
        { name: 'Sales Cycle', value: 28, target: 25, change: -3.1, trend: 'down' },
        { name: 'Customer Satisfaction', value: 91.5, target: 90, change: 2.8, trend: 'up' },
        { name: 'Marketing ROI', value: 607, target: 500, change: 21.4, trend: 'up' },
        { name: 'Cost per Acquisition', value: 418, target: 450, change: -7.1, trend: 'down' }
      ]);
    } catch (error) {
      console.error('Error generating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const performanceData = {
    labels: analyticsData.map(d => d.period),
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData.map(d => d.revenue),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Conversions',
        data: analyticsData.map(d => d.conversions),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const roiData = {
    labels: analyticsData.map(d => d.period),
    datasets: [
      {
        label: 'ROI (%)',
        data: analyticsData.map(d => d.roi),
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
        borderWidth: 2
      }
    ]
  };

  const funnelChartData = {
    labels: funnelData.map(d => d.stage),
    datasets: [
      {
        label: 'Count',
        data: funnelData.map(d => d.count),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280']
      }
    ]
  };

  const totalRevenue = analyticsData.reduce((sum, d) => sum + d.revenue, 0);
  const totalConversions = analyticsData.reduce((sum, d) => sum + d.conversions, 0);
  const avgROI = analyticsData.reduce((sum, d) => sum + d.roi, 0) / analyticsData.length;
  const avgSatisfaction = analyticsData.reduce((sum, d) => sum + d.satisfaction, 0) / analyticsData.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comprehensive Analytics</h2>
            <p className="text-gray-600 mt-1">Deep insights into business performance and trends</p>
          </div>
          <div className="flex items-center space-x-4">
            <SearchableSelect
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </SearchableSelect>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{kpi.name}</h3>
              <div className={`flex items-center ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
                <span className="text-sm font-medium">{Math.abs(kpi.change)}%</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {kpi.name.includes('$') ? `${currencyCode} ${kpi.value.toLocaleString()}` :
                   kpi.name.includes('%') ? `${kpi.value}%` : 
                   kpi.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Target: {kpi.target}</p>
              </div>
              <div className="w-16 h-16">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
                  <div 
                    className={`absolute top-0 left-0 w-16 h-16 rounded-full border-4 ${
                      kpi.value >= kpi.target ? 'border-green-500' : 'border-yellow-500'
                    }`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + (kpi.value / kpi.target) * 50}% 0%, ${50 + (kpi.value / kpi.target) * 50}% 100%, 50% 100%)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium">{Math.round((kpi.value / kpi.target) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Conversions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Conversions Trend</h3>
          <div className="h-80">
            <Line data={performanceData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* ROI Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing ROI Analysis</h3>
          <div className="h-80">
            <Bar data={roiData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Sales Funnel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sales Funnel Analysis</h3>
        </div>
        <div className="p-6">
          <div className="h-80 mb-6">
            <Bar data={funnelChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funnelData.map((stage, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stage.stage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stage.count.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stage.conversion}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stage.value > 0 ? `${currencyCode} ${stage.value.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 mr-3" />
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-2xl font-bold">{currencyCode} {(totalRevenue / 1000000).toFixed(2)}M</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center">
            <Users className="w-8 h-8 mr-3" />
            <div>
              <p className="text-sm opacity-90">Total Conversions</p>
              <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center">
            <Target className="w-8 h-8 mr-3" />
            <div>
              <p className="text-sm opacity-90">Average ROI</p>
              <p className="text-2xl font-bold">{avgROI.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 mr-3" />
            <div>
              <p className="text-sm opacity-90">Satisfaction</p>
              <p className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
