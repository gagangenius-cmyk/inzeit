'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Filter,
  ArrowUpRight,
  Phone,
  Mail
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ReportData {
  reportType: string
  period: { startDate: string; endDate: string }
  filters: { branch: string; region: string; employee: string }
  data: any
  generatedAt: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ReportingDashboard() {
  const { currencyCode } = useAuth()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('leads')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [branch, setBranch] = useState('')
  const [region, setRegion] = useState('')
  const [employee, setEmployee] = useState('')

  useEffect(() => {
    // Set default dates to last 30 days
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
    setEndDate(today.toISOString().split('T')[0])
  }, [])

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate,
        endDate,
        branch,
        region,
        employee
      })

      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'leads': return <Users className="h-5 w-5" />
      case 'appointments': return <Calendar className="h-5 w-5" />
      case 'payments': return <DollarSign className="h-5 w-5" />
      case 'employees': return <Users className="h-5 w-5" />
      case 'performance': return <TrendingUp className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getReportTitle = (type: string) => {
    switch (type) {
      case 'leads': return 'Lead Management Report'
      case 'appointments': return 'Appointment Report'
      case 'payments': return 'Payment Report'
      case 'employees': return 'Employee Report'
      case 'performance': return 'Performance Report'
      default: return 'General Report'
    }
  }

  const renderReportContent = () => {
    if (!reportData) return null

    const { data, reportType } = reportData

    switch (reportType) {
      case 'leads':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalLeads}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Leads</p>
                    <p className="text-2xl font-bold text-green-600">{data.newLeads}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Converted</p>
                    <p className="text-2xl font-bold text-purple-600">{data.convertedLeads}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-orange-600">{data.conversionRate}%</p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'appointments':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalAppointments}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{data.completedAppointments}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{data.pendingAppointments}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'payments':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalPayments}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">{currencyCode} {data.totalAmount.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Payment</p>
                    <p className="text-2xl font-bold text-purple-600">{currencyCode} {data.averagePayment.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'performance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leads
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Appointments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.performance?.map((emp: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{emp.employeeName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{emp.leadCount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{emp.appointmentCount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{emp.paymentCount}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{currencyCode} {emp.totalRevenue.toFixed(2)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue: {currencyCode} {data.totalRevenue?.toFixed(2)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )

      default:
        return <div className="text-center text-gray-500">No data available for this report type</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and view comprehensive reports</p>
        </div>
        <Button onClick={generateReport} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Report Type</label>
              <SearchableSelect
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="leads">Leads Report</option>
                <option value="appointments">Appointments Report</option>
                <option value="payments">Payments Report</option>
                <option value="employees">Employees Report</option>
                <option value="performance">Performance Report</option>
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <SearchableSelect
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Branches</option>
                <option value="1">Dubai</option>
                <option value="2">Abu Dhabi</option>
                <option value="3">Sharjah</option>
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <SearchableSelect
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Regions</option>
                <option value="1">North</option>
                <option value="2">South</option>
                <option value="3">East</option>
              </SearchableSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                {getReportIcon(reportData.reportType)}
                <span className="ml-2">{getReportTitle(reportData.reportType)}</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {new Date(reportData.generatedAt).toLocaleString()}
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderReportContent()}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
