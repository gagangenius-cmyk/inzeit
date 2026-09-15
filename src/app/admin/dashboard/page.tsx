'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  GraduationCap,
  Building,
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
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalOperations: number;
  activeOperations: number;
  completedOperations: number;
  totalLeads: number;
  convertedLeads: number;
  pendingTasks: number;
  upcomingAppointments: number;
  recentActivities: number;
  recentLeads: Array<{
    id: number;
    name: string;
    email: string;
    status: string;
    date: string;
    assignedTo: string;
  }>;
  branchPerformance: Array<{
    branch: string;
    leads: number;
    conversion: string;
  }>;
  topEmployees: Array<{
    name: string;
    leads: number;
    conversion: string;
  }>;
  completionRate: number;
  totalEmployees: number;
  totalRevenue: number;
  totalPaidAmount: number;
  totalBalance: number;
  // Already computed by /api/admin/dashboard but never rendered anywhere on
  // this page until now - monthlyLeads/statusBreakdown backed real charts
  // below; branchPerformance/topEmployees (declared above) backed the two
  // tables below.
  monthlyLeads: Array<{ month: string; count: number }>;
  statusBreakdown: Array<{ name: string; value: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOperations: 0,
    activeOperations: 0,
    completedOperations: 0,
    totalLeads: 0,
    convertedLeads: 0,
    pendingTasks: 0,
    upcomingAppointments: 0,
    recentActivities: 0,
    recentLeads: [],
    branchPerformance: [],
    topEmployees: [],
    completionRate: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    totalPaidAmount: 0,
    totalBalance: 0,
    monthlyLeads: [],
    statusBreakdown: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600">Comprehensive overview of operations and performance metrics</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">Error loading dashboard</p>
              <p className="text-gray-600 text-sm mt-2">{error}</p>
              <Button onClick={fetchDashboardData} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Total Operations</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.totalOperations.toLocaleString()}</div>
                  <p className="text-blue-100">All time operations</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Active Operations</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.activeOperations.toLocaleString()}</div>
                  <p className="text-green-100">Currently in progress</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Completed Operations</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.completedOperations.toLocaleString()}</div>
                  <p className="text-purple-100">Successfully completed</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Total Leads</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.totalLeads.toLocaleString()}</div>
                  <p className="text-orange-100">All registered leads</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Converted Leads</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.convertedLeads.toLocaleString()}</div>
                  <p className="text-teal-100">Successfully converted</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.pendingTasks.toLocaleString()}</div>
                  <p className="text-red-100">Require attention</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.upcomingAppointments.toLocaleString()}</div>
                  <p className="text-indigo-100">Scheduled appointments</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">{stats.recentActivities.toLocaleString()}</div>
                  <p className="text-cyan-100">Recent system activities</p>
                </CardContent>
              </Card>
            </div>

            {/* Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">AED {stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-emerald-100">Total revenue from all leads</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Paid Amount</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">AED {stats.totalPaidAmount.toLocaleString()}</div>
                  <p className="text-blue-100">Total amount paid by clients</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Outstanding Balance</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold">AED {stats.totalBalance.toLocaleString()}</div>
                  <p className="text-amber-100">Total balance pending</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button className="w-full">
                  <Users className="mr-2 h-5 w-5" />
                  Manage Leads
                </Button>
                <Button className="w-full">
                  <Calendar className="mr-2 h-5 w-5" />
                  View Calendar
                </Button>
                <Button className="w-full">
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Reports
                </Button>
                <Button className="w-full">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </CardContent>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <Button className="text-blue-600 hover:text-blue-700">
                  <Activity className="mr-2 h-4 w-4" />
                  View All Activities
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentLeads.length > 0 ? (
                    stats.recentLeads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        {lead.status === 'converted' ? (
                          <Award className="mr-3 text-yellow-500" />
                        ) : lead.status === 'contacted' ? (
                          <Phone className="mr-3 text-blue-500" />
                        ) : (
                          <CheckCircle className="mr-3 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {lead.status === 'converted' ? 'Lead converted' : 
                             lead.status === 'contacted' ? 'Follow-up completed' : 
                             'New lead created'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lead.name} - {lead.assignedTo || 'Unassigned'}
                          </p>
                          <p className="text-xs text-gray-500">{lead.date}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">No recent activities found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <CardHeader>
                  <CardTitle>Lead Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      {stats.totalLeads > 0 ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                    <div 
                      className="bg-green-600 h-4 rounded-full"
                      style={{ width: `${stats.totalLeads > 0 ? ((stats.convertedLeads / stats.totalLeads) * 100) : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {stats.convertedLeads} of {stats.totalLeads} operations completed
                  </div>
                </CardContent>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <CardHeader>
                  <CardTitle>Operations Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {stats.totalOperations > 0 ? ((stats.completedOperations / stats.totalOperations) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${stats.totalOperations > 0 ? ((stats.completedOperations / stats.totalOperations) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {stats.completedOperations} of {stats.totalOperations} operations completed
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Operations</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {stats.activeOperations} of {stats.totalOperations} operations active
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                    <div 
                      className="bg-orange-600 h-4 rounded-full"
                      style={{ width: `${stats.totalOperations > 0 ? ((stats.activeOperations / stats.totalOperations) * 100) : 0}%` }}
                    ></div>
                  </div>
                </CardContent>
            </div>
          </div>

          {/* Monthly Lead Trend + Status Distribution - both already
              computed by /api/admin/dashboard (stats.monthlyLeads /
              stats.statusBreakdown) but never rendered anywhere on this
              page until now. recharts (aliased Re* to avoid colliding with
              the same-named lucide-react icons already imported above),
              matching the library already used by most of the other role
              dashboards (Branch Manager/Counselor/HR/Digital Marketing). */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <CardHeader>
                <CardTitle>Monthly Lead Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {stats.monthlyLeads.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">No lead data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyLeads}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" name="Leads" stroke="#2563eb" fill="#93c5fd" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <CardHeader>
                <CardTitle>Lead Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {stats.statusBreakdown.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">No lead data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={stats.statusBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry: any) => `${entry.name}: ${entry.value}`}
                        >
                          {stats.statusBreakdown.map((_, index) => (
                            <Cell key={index} fill={['#35AE22', '#289018', '#50C835', '#1C6B10', '#B8DFB0', '#0891b2'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </div>
          </div>

          {/* Branch Performance + Top Employees - same story: computed
              server-side already, never surfaced in the UI. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <CardHeader>
                <CardTitle>Branch Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.branchPerformance.length === 0 ? (
                  <p className="text-sm text-gray-500">No branch data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.branchPerformance.map((row) => (
                      <div key={row.branch} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0">
                        <span className="font-medium text-gray-900">{row.branch}</span>
                        <span className="text-gray-600">{row.leads} leads</span>
                        <span className="font-semibold text-green-600">{row.conversion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <CardHeader>
                <CardTitle>Top Employees</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topEmployees.length === 0 ? (
                  <p className="text-sm text-gray-500">No employee data yet</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topEmployees.map((row) => (
                      <div key={row.name} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0">
                        <span className="font-medium text-gray-900">{row.name}</span>
                        <span className="text-gray-600">{row.leads} leads</span>
                        <span className="font-semibold text-green-600">{row.conversion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>
          </div>
        </>
        )}
      </div>
    </>
  );
}
