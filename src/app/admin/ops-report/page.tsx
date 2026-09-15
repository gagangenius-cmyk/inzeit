'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { clientName, paymentDue, searchOperationCases, OperationsSearchRow } from '@/lib/operationsClient'
import { RecordCard, RecordList } from '@/components/shared/ResponsiveRecordList'
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  Globe,
  CheckCircle,
  Clock
} from 'lucide-react'

interface OpsReport {
  id: string
  reportType: string
  startDate: string
  endDate: string
  region: string
  ecaStatus: string
  totalApplications: number
  completedApplications: number
  pendingApplications: number
  insufficientApplications: number
  registeredApplications: number
  successRate: number
  averageProcessingTime: number
  topCountries: Array<{
    country: string
    count: number
    percentage: number
  }>
  monthlyTrends: Array<{
    month: string
    applications: number
    completed: number
    successRate: number
  }>
  createdAt: string
  generatedBy: string
}

const moduleLabels: Record<string, string> = {
  canada: 'Canada Application',
  australia: 'Australia Application',
  uk: 'UK Application',
  usa: 'USA Application',
  all: 'All Operations'
}

const reportModuleMap: Record<string, string | undefined> = {
  canada: 'skill-canada',
  australia: 'skill-australia',
  uk: 'business-uk',
  usa: 'business-usa',
  all: undefined
}

const toNumber = (value: number | string | null | undefined) => Number(value || 0)

const isCompleted = (row: OperationsSearchRow) => {
  const agreementStatus = String(row.agreementStatus || '').toLowerCase()
  const opportunityStatus = String(row.opportunityStatus || '').toLowerCase()
  const retentionStatus = String(row.retentionStatus || '').toLowerCase()

  return agreementStatus === 'signed' || opportunityStatus === 'completed' || retentionStatus === 'completed'
}

const normalizeStatus = (row: OperationsSearchRow) => {
  if (isCompleted(row)) return 'completed'
  const status = String(row.agreementStatus || row.opportunityStatus || row.leadStatus || 'pending').toLowerCase()
  if (status.includes('insufficient') || status.includes('rejected')) return 'insufficient'
  if (status.includes('registered') || status.includes('uploaded')) return 'registered'
  return 'pending'
}

const monthKey = (value: string | null) => {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

const buildOpsReport = (rows: OperationsSearchRow[], reportType: string, startDate: string, endDate: string): OpsReport => {
  const completedApplications = rows.filter(isCompleted).length
  const pendingApplications = rows.filter(row => normalizeStatus(row) === 'pending').length
  const insufficientApplications = rows.filter(row => normalizeStatus(row) === 'insufficient').length
  const registeredApplications = rows.filter(row => normalizeStatus(row) === 'registered').length
  const countryCounts = rows.reduce((acc, row) => {
    const country = row.country_interest || row.nationality || 'Unknown'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCountries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([country, count]) => ({
      country,
      count,
      percentage: rows.length > 0 ? (count / rows.length) * 100 : 0
    }))

  const monthlyMap = rows.reduce((acc, row) => {
    const month = monthKey(row.generatedDate)
    if (!acc[month]) acc[month] = { month, applications: 0, completed: 0, successRate: 0 }
    acc[month].applications += 1
    if (isCompleted(row)) acc[month].completed += 1
    return acc
  }, {} as Record<string, OpsReport['monthlyTrends'][number]>)

  const monthlyTrends = Object.values(monthlyMap)
    .slice(-6)
    .map(item => ({
      ...item,
      successRate: item.applications > 0 ? (item.completed / item.applications) * 100 : 0
    }))

  const totalValue = rows.reduce((sum, row) => sum + toNumber(row.totalAmount || row.estimatedValue), 0)
  const pendingValue = rows.reduce((sum, row) => sum + paymentDue(row), 0)

  return {
    id: reportType,
    reportType: moduleLabels[reportType] || reportType,
    startDate,
    endDate,
    region: 'Live Database',
    ecaStatus: 'all',
    totalApplications: rows.length,
    completedApplications,
    pendingApplications,
    insufficientApplications,
    registeredApplications,
    successRate: rows.length > 0 ? (completedApplications / rows.length) * 100 : 0,
    averageProcessingTime: rows.length > 0 ? Math.round((pendingValue / Math.max(totalValue, 1)) * 100) : 0,
    topCountries,
    monthlyTrends,
    createdAt: new Date().toISOString(),
    generatedBy: 'System',
  }
}

export default function OpsReportPage() {
  const [reports, setReports] = useState<OpsReport[]>([])
  const [rows, setRows] = useState<OperationsSearchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    region: '',
    ecaStatus: '',
    reportType: 'canada'
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const reportModule = reportModuleMap[filters.reportType]
      const databaseRows = await searchOperationCases({ module: reportModule, limit: 100 })
      const filteredRows = databaseRows.filter(row => {
        const generatedDate = row.generatedDate ? new Date(row.generatedDate) : null
        const matchesStart = !filters.startDate || !generatedDate || generatedDate >= new Date(filters.startDate)
        const matchesEnd = !filters.endDate || !generatedDate || generatedDate <= new Date(filters.endDate)
        const matchesStatus = !filters.ecaStatus || normalizeStatus(row) === filters.ecaStatus.toLowerCase()
        return matchesStart && matchesEnd && matchesStatus
      })

      setRows(filteredRows)
      setReports([
        buildOpsReport(filteredRows, filters.reportType, filters.startDate || 'All time', filters.endDate || 'Today')
      ])
    } catch (error) {
      console.error('Error fetching reports:', error)
      setRows([])
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      region: '',
      ecaStatus: '',
      reportType: 'canada'
    })
  }

  const generateReport = () => {
    fetchReports()
  }

  const exportReport = () => {
    const headers = ['Lead ID', 'Client', 'Agreement', 'Service', 'Status', 'Payment Status', 'Paid Amount', 'Total Amount']
    const csvRows = rows.map(row => [
      row.leadId,
      clientName(row),
      row.agreementNumber || row.opportunityNumber || '',
      row.service_interest || row.serviceType || row.agreementType || '',
      normalizeStatus(row),
      row.paymentStatus || '',
      row.paidAmount || 0,
      row.totalAmount || row.estimatedValue || 0
    ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))

    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `operations-report-${filters.reportType}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Reports</h1>
            <p className="text-gray-600">Comprehensive operations and application reports</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button onClick={generateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Report Filters</h3>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <SearchableSelect
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Regions</option>
                    <option value="1">North America</option>
                    <option value="2">Europe</option>
                    <option value="3">Asia</option>
                    <option value="4">Middle East</option>
                    <option value="5">Africa</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ECA Status</label>
                  <SearchableSelect
                    value={filters.ecaStatus}
                    onChange={(e) => handleFilterChange('ecaStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="insufficient">Insufficient</option>
                    <option value="registered">Registered</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <SearchableSelect
                    value={filters.reportType}
                    onChange={(e) => handleFilterChange('reportType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="canada">Canada Application</option>
                    <option value="australia">Australia Application</option>
                    <option value="uk">UK Application</option>
                    <option value="usa">USA Application</option>
                    <option value="all">All Operations</option>
                  </SearchableSelect>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {reports.map((report) => (
          <Card key={report.id} className="mb-6">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>{report.reportType} Report</CardTitle>
                <div className="flex space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {(() => { const d = new Date(report.startDate); return isNaN(d.getTime()) ? report.startDate : d.toLocaleDateString(); })()} - {(() => { const d = new Date(report.endDate); return isNaN(d.getTime()) ? report.endDate : d.toLocaleDateString(); })()}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={exportReport}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">{report.totalApplications}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{report.completedApplications}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{report.pendingApplications}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{report.successRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Status Breakdown */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Application Status Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-gray-900">{report.completedApplications}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-gray-900">{report.pendingApplications}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-gray-900">{report.insufficientApplications}</p>
                    <p className="text-sm text-gray-500">Insufficient</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-semibold text-gray-900">{report.registeredApplications}</p>
                    <p className="text-sm text-gray-500">Registered</p>
                  </div>
                </div>
              </div>

              {/* Top Countries */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Top Countries</h4>
                <div className="space-y-2">
                  {report.topCountries.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{country.country}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-900">{country.count} applications</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {country.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Trends */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Monthly Trends</h4>
                <RecordList isEmpty={report.monthlyTrends.length === 0}>
                  {report.monthlyTrends.map((trend, index) => (
                    <RecordCard
                      key={index}
                      avatar={<TrendingUp className="h-4 w-4" />}
                      avatarColorClass="from-purple-600 to-fuchsia-400"
                      title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{trend.month}</span>}
                      stats={[
                        { label: 'Applications', value: trend.applications },
                        { label: 'Completed', value: trend.completed },
                        { label: 'Success Rate', value: `${trend.successRate.toFixed(1)}%` },
                      ]}
                    />
                  ))}
                </RecordList>
              </div>

              {/* Report Metadata */}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  Generated by: {report.generatedBy} on {new Date(report.createdAt).toLocaleDateString()}
                </div>
                <div>
                  Source: {report.region} | Pending value ratio: {report.averageProcessingTime}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
            </CardContent>
          </Card>
        )}
      </div>
  )
}
