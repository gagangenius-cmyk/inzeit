'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  TrendingUp,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  Target,
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Receipt,
  User,
  Shield,
  Timer,
  Award,
  Settings,
  Bell,
  AlertTriangle,
  Info,
  RefreshCw,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Eye,
  Languages,
  TrendingDown as TrendingDownIcon
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface ContractAnalytics {
  totalContracts: number
  activeContracts: number
  signedContracts: number
  pendingContracts: number
  expiredContracts: number
  totalRevenue: number
  pendingRevenue: number
  averageContractValue: number
  averageSigningTime: number
  completionRate: number
  rejectionRate: number
  monthlyStats: Array<{
    month: string
    contracts: number
    revenue: number
    signed: number
    pending: number
  }>
  contractTypes: Array<{
    type: string
    count: number
    revenue: number
    percentage: number
  }>
  countryStats: Array<{
    country: string
    contracts: number
    revenue: number
    percentage: number
  }>
  languageStats: Array<{
    language: string
    contracts: number
    revenue: number
    percentage: number
  }>
  signingMethods: Array<{
    method: string
    contracts: number
    percentage: number
    averageTime: number
  }>
  performanceMetrics: Array<{
    metric: string
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }>
  topPerformers: Array<{
    name: string
    role: string
    contracts: number
    revenue: number
    completionRate: number
  }>
}

export default function ContractAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ContractAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30days')
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, selectedMetric])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const databaseAnalytics: ContractAnalytics = {
        totalContracts: 156,
        activeContracts: 89,
        signedContracts: 45,
        pendingContracts: 22,
        expiredContracts: 8,
        totalRevenue: 1250000,
        pendingRevenue: 350000,
        averageContractValue: 8000,
        averageSigningTime: 4.5,
        completionRate: 78.5,
        rejectionRate: 12.3,
        monthlyStats: [
          { month: 'Jan', contracts: 12, revenue: 96000, signed: 8, pending: 4 },
          { month: 'Feb', contracts: 15, revenue: 120000, signed: 10, pending: 5 },
          { month: 'Mar', contracts: 18, revenue: 144000, signed: 12, pending: 6 },
          { month: 'Apr', contracts: 14, revenue: 112000, signed: 9, pending: 5 },
          { month: 'May', contracts: 20, revenue: 160000, signed: 14, pending: 6 },
          { month: 'Jun', contracts: 16, revenue: 128000, signed: 11, pending: 5 }
        ],
        contractTypes: [
          { type: 'Business Immigration', count: 45, revenue: 450000, percentage: 28.8 },
          { type: 'Student Visa', count: 38, revenue: 304000, percentage: 24.4 },
          { type: 'Work Permit', count: 32, revenue: 256000, percentage: 20.5 },
          { type: 'Visit Visa', count: 28, revenue: 168000, percentage: 13.4 },
          { type: 'Family Sponsorship', count: 13, revenue: 78000, percentage: 6.2 }
        ],
        countryStats: [
          { country: 'Canada', contracts: 78, revenue: 624000, percentage: 49.9 },
          { country: 'Australia', contracts: 34, revenue: 272000, percentage: 21.8 },
          { country: 'UK', contracts: 22, revenue: 176000, percentage: 14.1 },
          { country: 'USA', contracts: 12, revenue: 96000, percentage: 7.7 },
          { country: 'Europe', contracts: 10, revenue: 82000, percentage: 6.4 }
        ],
        languageStats: [
          { language: 'English', contracts: 98, revenue: 784000, percentage: 62.8 },
          { language: 'Arabic', contracts: 28, revenue: 224000, percentage: 17.9 },
          { language: 'Bilingual', contracts: 30, revenue: 242000, percentage: 19.4 }
        ],
        signingMethods: [
          { method: 'Electronic', contracts: 89, percentage: 57.1, averageTime: 2.5 },
          { method: 'Digital Certificate', contracts: 45, percentage: 28.8, averageTime: 4.2 },
          { method: 'Wet Ink', contracts: 12, percentage: 7.7, averageTime: 8.5 },
          { method: 'Hybrid', contracts: 10, percentage: 6.4, averageTime: 6.8 }
        ],
        performanceMetrics: [
          { metric: 'Contract Generation', value: 156, change: 12.5, trend: 'up' },
          { metric: 'Completion Rate', value: 78.5, change: 3.2, trend: 'up' },
          { metric: 'Average Value', value: 8000, change: -2.1, trend: 'down' },
          { metric: 'Signing Time', value: 4.5, change: -8.3, trend: 'down' }
        ],
        topPerformers: [
          { name: 'Alice Johnson', role: 'Senior Consultant', contracts: 45, revenue: 450000, completionRate: 92.5 },
          { name: 'Bob Smith', role: 'Business Specialist', contracts: 38, revenue: 380000, completionRate: 87.3 },
          { name: 'Carol Davis', role: 'Student Advisor', contracts: 32, revenue: 256000, completionRate: 89.1 },
          { name: 'David Wilson', role: 'Work Permit Expert', contracts: 28, revenue: 224000, completionRate: 85.7 }
        ]
      }

      setAnalytics([] as any);
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      case 'stable':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  if (!analytics) {
    return (
      <>
        <div className="text-center text-gray-500">
          No analytics data available
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contract Analytics</h1>
            <p className="text-gray-600">Comprehensive contract performance and revenue analytics</p>
          </div>
          <div className="flex space-x-2">
            <SearchableSelect
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </SearchableSelect>
            <Button variant="outline" onClick={() => setShowComparison(!showComparison)}>
              <BarChart className="h-4 w-4 mr-2" />
              {showComparison ? 'Hide' : 'Show'} Comparison
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Contracts</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalContracts)}</p>
                  <div className="flex items-center mt-2">
                    {getTrendIcon('up')}
                    <span className="text-sm text-green-500 ml-1">12.5% from last period</span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
                  <div className="flex items-center mt-2">
                    {getTrendIcon('up')}
                    <span className="text-sm text-green-500 ml-1">8.3% from last period</span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
                  <div className="flex items-center mt-2">
                    {getTrendIcon('up')}
                    <span className="text-sm text-green-500 ml-1">3.2% from last period</span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg text-purple-600">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Average Contract Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.averageContractValue)}</p>
                  <div className="flex items-center mt-2">
                    {getTrendIcon('down')}
                    <span className="text-sm text-red-500 ml-1">2.1% from last period</span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg text-yellow-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="contracts" stroke="#8884d8" name="Contracts" />
                    <Line type="monotone" dataKey="signed" stroke="#82ca9d" name="Signed" />
                    <Line type="monotone" dataKey="pending" stroke="#ffc658" name="Pending" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Contract Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analytics.contractTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.type}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.contractTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Types Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.contractTypes.map((type, index) => (
                  <div key={type.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <div>
                        <p className="font-medium text-gray-900">{type.type}</p>
                        <p className="text-sm text-gray-500">{type.count} contracts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(type.revenue)}</p>
                      <p className="text-sm text-gray-500">{type.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Country Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Country Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.countryStats.map((country) => (
                  <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{country.country}</p>
                        <p className="text-sm text-gray-500">{country.contracts} contracts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(country.revenue)}</p>
                      <p className="text-sm text-gray-500">{country.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Language Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.languageStats.map((lang) => (
                  <div key={lang.language} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Languages className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">{lang.language}</p>
                        <p className="text-sm text-gray-500">{lang.contracts} contracts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(lang.revenue)}</p>
                      <p className="text-sm text-gray-500">{lang.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.performanceMetrics.map((metric) => (
                <div key={metric.metric} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{metric.metric}</span>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.metric === 'Completion Rate' ? `${metric.value}%` :
                      metric.metric === 'Average Value' ? formatCurrency(metric.value) :
                        metric.metric === 'Signing Time' ? `${metric.value} days` :
                          formatNumber(metric.value)}
                  </p>
                  <p className={`text-sm mt-1 ${getTrendColor(metric.trend)}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analytics.topPerformers.map((performer) => (
                <div key={performer.name} className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full text-blue-600 mb-4">
                    <User className="h-8 w-8" />
                  </div>
                  <h3 className="font-medium text-gray-900">{performer.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{performer.role}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Contracts:</span>
                      <span className="font-medium">{performer.contracts}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Revenue:</span>
                      <span className="font-medium">{formatCurrency(performer.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Completion:</span>
                      <span className="font-medium">{performer.completionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Signing Methods Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Signing Methods Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.signingMethods.map((method) => (
                <div key={method.method} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{method.method}</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">{method.percentage}%</Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{method.contracts}</p>
                  <p className="text-sm text-gray-500 mt-1">Avg. {method.averageTime} days to sign</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

