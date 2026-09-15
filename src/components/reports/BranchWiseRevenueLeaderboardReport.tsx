'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Trophy, TrendingUp, TrendingDown, Target, Building, Award, Medal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface BranchPerformance {
  rank: number;
  branch: string;
  revenue: number;
  target: number;
  achievement: number;
  growth: number;
  clients: number;
  avgClientValue: number;
  previousRank: number;
  region: string;
}

interface RegionalSummary {
  region: string;
  totalRevenue: number;
  branches: number;
  avgPerformance: number;
  topBranch: string;
}

interface MonthlyTrend {
  month: string;
  topPerformer: string;
  revenue: number;
  growth: number;
}

export default function BranchWiseRevenueLeaderboardReport() {
  const { currencyCode } = useAuth();
  const [branchData, setBranchData] = useState<BranchPerformance[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalSummary[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    generateReport();
  }, [selectedRegion, sortBy]);
  const generateReport = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const branches: BranchPerformance[] = [
        { rank: 1, branch: 'Delhi', revenue: 2850000, target: 2500000, achievement: 114, growth: 15.2, clients: 89, avgClientValue: 32000, previousRank: 2, region: 'North' },
        { rank: 2, branch: 'Mumbai', revenue: 2420000, target: 2300000, achievement: 105.2, growth: 8.7, clients: 76, avgClientValue: 31800, previousRank: 1, region: 'West' },
        { rank: 3, branch: 'Bangalore', revenue: 1980000, target: 2000000, achievement: 99, growth: 3.4, clients: 68, avgClientValue: 29100, previousRank: 3, region: 'South' },
        { rank: 4, branch: 'Chennai', revenue: 1650000, target: 1700000, achievement: 97.1, growth: -2.1, clients: 55, avgClientValue: 30000, previousRank: 4, region: 'South' },
        { rank: 5, branch: 'Kolkata', revenue: 1120000, target: 1200000, achievement: 93.3, growth: -5.8, clients: 42, avgClientValue: 26700, previousRank: 5, region: 'East' },
        { rank: 6, branch: 'Pune', revenue: 980000, target: 1000000, achievement: 98, growth: 12.3, clients: 38, avgClientValue: 25800, previousRank: 7, region: 'West' },
        { rank: 7, branch: 'Hyderabad', revenue: 890000, target: 950000, achievement: 93.7, growth: 6.8, clients: 35, avgClientValue: 25400, previousRank: 6, region: 'South' },
        { rank: 8, branch: 'Ahmedabad', revenue: 750000, target: 800000, achievement: 93.8, growth: 4.2, clients: 31, avgClientValue: 24200, previousRank: 9, region: 'West' },
        { rank: 9, branch: 'Jaipur', revenue: 680000, target: 700000, achievement: 97.1, growth: 8.9, clients: 28, avgClientValue: 24300, previousRank: 8, region: 'North' },
        { rank: 10, branch: 'Lucknow', revenue: 520000, target: 600000, achievement: 86.7, growth: -1.3, clients: 22, avgClientValue: 23600, previousRank: 10, region: 'North' }
      ];

      setBranchData(branches);
      setRegionalData([
        { region: 'North', totalRevenue: 4050000, branches: 3, avgPerformance: 99.3, topBranch: 'Delhi' },
        { region: 'West', totalRevenue: 4150000, branches: 3, avgPerformance: 99.0, topBranch: 'Mumbai' },
        { region: 'South', totalRevenue: 4520000, branches: 3, avgPerformance: 96.6, topBranch: 'Bangalore' },
        { region: 'East', totalRevenue: 1120000, branches: 1, avgPerformance: 93.3, topBranch: 'Kolkata' }
      ]);

      setMonthlyTrends([
        { month: 'Jan', topPerformer: 'Mumbai', revenue: 2180000, growth: 8.2 },
        { month: 'Feb', topPerformer: 'Delhi', revenue: 2350000, growth: 7.8 },
        { month: 'Mar', topPerformer: 'Delhi', revenue: 2420000, growth: 3.0 },
        { month: 'Apr', topPerformer: 'Mumbai', revenue: 2380000, growth: -1.6 },
        { month: 'May', topPerformer: 'Delhi', revenue: 2680000, growth: 12.6 },
        { month: 'Jun', topPerformer: 'Delhi', revenue: 2850000, growth: 6.3 }
      ]);
      setLoading(false);
    }, 1500);
  };

  const leaderboardData = {
    labels: branchData.slice(0, 5).map(d => d.branch),
    datasets: [
      {
        label: 'Revenue',
        data: branchData.slice(0, 5).map(d => d.revenue),
        backgroundColor: ['#FFD700', '#C0C0C0', '#CD7F32', '#3B82F6', '#10B981'],
        borderColor: ['#FFD700', '#C0C0C0', '#CD7F32', '#3B82F6', '#10B981'],
        borderWidth: 2,
      }
    ]
  };

  const achievementData = {
    labels: branchData.slice(0, 5).map(d => d.branch),
    datasets: [
      {
        label: 'Target Achievement (%)',
        data: branchData.slice(0, 5).map(d => d.achievement),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderWidth: 2,
      }
    ]
  };

  const regionalRevenueData = {
    labels: regionalData.map(d => d.region),
    datasets: [
      {
        label: 'Regional Revenue',
        data: regionalData.map(d => d.totalRevenue),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 2,
      }
    ]
  };

  const trendData = {
    labels: monthlyTrends.map(d => d.month),
    datasets: [
      {
        label: 'Top Performer Revenue',
        data: monthlyTrends.map(d => d.revenue),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const filteredData = selectedRegion === 'all' ? branchData : branchData.filter(d => d.region === selectedRegion);
  const sortedData = [...filteredData].sort((a, b) => {
    switch(sortBy) {
      case 'revenue': return b.revenue - a.revenue;
      case 'achievement': return b.achievement - a.achievement;
      case 'growth': return b.growth - a.growth;
      case 'clients': return b.clients - a.clients;
      default: return b.revenue - a.revenue;
    }
  });

  const totalRevenue = branchData.reduce((sum, d) => sum + d.revenue, 0);
  const totalTarget = branchData.reduce((sum, d) => sum + d.target, 0);
  const overallAchievement = (totalRevenue / totalTarget) * 100;
  const avgGrowth = branchData.reduce((sum, d) => sum + d.growth, 0) / branchData.length;

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</span>;
    }
  };

  const getRankChange = (current: number, previous: number) => {
    if (current < previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current > previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
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
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Top Performer</p>
              <p className="text-2xl font-bold text-gray-900">Delhi</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Overall Achievement</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallAchievement.toFixed(1)}%
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
            <Building className="w-8 h-8 text-purple-600 mr-3" />
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
          <h3 className="text-lg font-semibold text-gray-900">Filters & Sorting</h3>
          <div className="flex space-x-4">
            <SearchableSelect
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              {regionalData.map(region => (
                <option key={region.region} value={region.region}>{region.region}</option>
              ))}
            </SearchableSelect>
            <SearchableSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="achievement">Sort by Achievement</option>
              <option value="growth">Sort by Growth</option>
              <option value="clients">Sort by Clients</option>
            </SearchableSelect>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Leaderboard */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Revenue Leaders</h3>
          <div className="h-80">
            <Bar data={leaderboardData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Achievement Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Achievement (%)</h3>
          <div className="h-80">
            <Bar data={achievementData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Regional Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Revenue</h3>
          <div className="h-80">
            <Bar data={regionalRevenueData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Top Performer Trends</h3>
          <div className="h-80">
            <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Detailed Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Complete Leaderboard</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Client Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((branch) => (
                <tr key={branch.branch} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankIcon(branch.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.region}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(branch.revenue / 1000).toFixed(0)}K</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {(branch.target / 1000).toFixed(0)}K</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-20">
                        <div 
                          className={`h-2 rounded-full ${
                            branch.achievement >= 100 ? 'bg-green-600' : 
                            branch.achievement >= 90 ? 'bg-yellow-600' : 'bg-red-600'
                          }`} 
                          style={{ width: `${Math.min(branch.achievement, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{branch.achievement}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${branch.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {branch.growth >= 0 ? '+' : ''}{branch.growth}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.clients}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencyCode} {branch.avgClientValue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRankChange(branch.rank, branch.previousRank)}
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
