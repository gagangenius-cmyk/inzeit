// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  BarChart3
} from 'lucide-react'

interface DashboardStats {
  todayLeads: number
  totalLeads: number
  todayAppointments: number
  pendingAppointments: number
  followupLeads: number
  newLeads: number
}

interface RecentLead {
  id: number
  fname: string
  lname: string
  email: string
  phone: string
  status: string
  created: string
  assignedEmployee?: {
    id: number
    name: string
  }
  branchInfo?: {
    id: number
    name: string
  }
}

interface Appointment {
  id: number
  date: string
  appointtime: string
  lead?: {
    id: number
    fname: string
    lname: string
    phone: string
  }
}

interface DashboardData {
  success: boolean
  data: {
    stats: {
      totalLeads: number
      todayLeads: number
      weekLeads: number
      monthLeads: number
      totalAppointments: number
      todayAppointments: number
      totalEmployees: number
      totalBranches: number
      totalPayments: number
      leadTrend: string
      conversionRate: string
    }
    recentLeads: Array<{
      id: number
      fname: string
      lname: string
      email: string
      phone: string
      status: string
      priority: string
      country_interest: string
      service_interest: string
      created: string
    }>
    statusBreakdown: Array<{
      status: string
      count: number
      percentage: string
    }>
    notifications: Array<{
      id: number
      type: string
      message: string
      time: string
      read: boolean
    }>
    graphData: {
      leadTrend: Array<{
        date: string
        leads: number
      }>
      statusDistribution: Array<{
        name: string
        value: number
        color: string
      }>
    }
    verification: {
      databaseConnection: string
      lastUpdated: string
      dataIntegrity: string
      totalRecords: number
      tablesAccessible: string[]
    }
  }
}

export default function DashboardLayout({ user }: { user: any }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data for user:', user.id, user.type)
      const response = await fetch(`/api/admin/dashboard?userId=${user.id}&userType=${user.type}`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dashboard data received:', data)
        if (data.success) {
          setDashboardData(data)
        } else {
          console.error('❌ Dashboard API error:', data.error)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error loading dashboard data</div>
      </div>
    )
  }

  const { data } = dashboardData || {}
  const stats = data?.stats || {}
  const recentLeads = data?.recentLeads || []
  const todayAppointments = data?.todayAppointments || []
  const statusBreakdown = data?.statusBreakdown || []
  const notifications = data?.notifications || []
  const graphData = data?.graphData || {}
  const verification = data?.verification || {}

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}</p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            {user.type}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {user.branchInfo?.name || 'No Branch'}
          </Badge>
        </div>
      </div>

      {/* Database Verification Status */}
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-3">📊 Database Connection Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-sm">
            <span className="font-medium text-green-700">Connection:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${verification.databaseConnection === 'working' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {verification.databaseConnection || 'Unknown'}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-green-700">Total Records:</span>
            <span className="ml-2 font-bold text-green-800">{verification.totalRecords || 0}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium text-green-700">Data Integrity:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${verification.dataIntegrity === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {verification.dataIntegrity || 'Unknown'}
            </span>
          </div>
        </div>
        <p className="text-xs text-green-600 mt-2">
          Last Updated: {verification.lastUpdated ? new Date(verification.lastUpdated).toLocaleString() : 'Unknown'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalLeads || 0}</p>
                <p className="text-sm text-gray-600">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
                <p className="text-sm text-gray-600">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                <p className="text-sm text-gray-600">Today's Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingAppointments}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.followupLeads}</p>
                <p className="text-sm text-gray-600">Followups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold">{stats.newLeads}</p>
                <p className="text-sm text-gray-600">New Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{lead.fname} {lead.lname}</p>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                    <p className="text-sm text-gray-600">{lead.phone}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={lead.status === 'new' ? 'default' : 'secondary'}
                      className="mb-2"
                    >
                      {lead.status}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {new Date(lead.created).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Leads
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>🔔 Real-time Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${
                      notification.type === 'lead' ? 'bg-blue-500' :
                      notification.type === 'appointment' ? 'bg-green-500' :
                      notification.type === 'payment' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.time).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button variant="outline" size="sm" className="ml-2">
                        Mark as Read
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Lead Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusBreakdown.length > 0 ? (
                statusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{item.count}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.percentage}%)</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No status data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">
                        {appointment.lead?.fname} {appointment.lead?.lname}
                      </p>
                      <p className="text-sm text-gray-600">{appointment.lead?.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{appointment.appointtime}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(appointment.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Appointments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
