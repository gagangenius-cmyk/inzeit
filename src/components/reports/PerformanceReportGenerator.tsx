'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import {
  Download, FileText, BarChart3, PieChart, TrendingUp, Calendar,
  Filter, Settings, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle,
  Clock, Users, Target, DollarSign, Activity, Mail, Phone,
  ChevronDown, ChevronUp, Info, Zap, Award, TrendingDown
} from 'lucide-react';

interface ReportConfig {
  id?: string;
  name: string;
  description: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  counselors: number[];
  includeCharts: boolean;
  includeDetails: boolean;
  includeTrends: boolean;
  format: 'csv' | 'json';
  sections: {
    summary: boolean;
    performance: boolean;
    activities: boolean;
    revenue: boolean;
    issues: boolean;
    trends: boolean;
    recommendations: boolean;
  };
}

interface ReportData {
  summary: {
    totalActivities: number;
    totalCounselors: number;
    totalRevenue: number;
    avgConversionRate: number;
    avgResponseTime: number;
    period: string;
    generatedAt: Date;
  };
  performance: Array<{
    counselorId: number;
    name: string;
    role: string;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    avgResponseTime: number;
    avgProcessingTime: number;
    satisfactionScore: number;
    workloadUtilization: number;
    completedTasks: number;
    failedTasks: number;
    totalRevenue: number;
    efficiency: number;
    rank: number;
  }>;
  activities: Array<{
    date: string;
    counselorId: number;
    counselorName: string;
    action: string;
    details: string;
    outcome: string;
    duration: number;
    priority: string;
    category: string;
  }>;
  revenue: Array<{
    date: string;
    counselorId: number;
    counselorName: string;
    amount: number;
    source: string;
    type: string;
  }>;
  trends: {
    daily: Array<{ date: string; activities: number; conversions: number; revenue: number }>;
    weekly: Array<{ week: string; activities: number; conversions: number; revenue: number }>;
    monthly: Array<{ month: string; activities: number; conversions: number; revenue: number }>;
  };
  issues: Array<{
    type: string;
    counselor: string;
    description: string;
    severity: string;
    count: number;
    impact: string;
  }>;
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: string;
    impact: string;
    actionItems: string[];
  }>;
}

export default function PerformanceReportGenerator() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: 'Performance Report',
    description: 'Comprehensive performance analysis report',
    period: 'weekly',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    counselors: [],
    includeCharts: true,
    includeDetails: true,
    includeTrends: true,
    format: 'csv',
    sections: {
      summary: true,
      performance: true,
      activities: true,
      revenue: true,
      issues: true,
      trends: true,
      recommendations: true
    }
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { sorted: sortedPerformance, sortKey: performanceSortKey, sortDirection: performanceSortDirection, toggleSort: togglePerformanceSort } = useSortableData(
    reportData?.performance || [],
    {
      counselor: (c) => c.name,
      leads: (c) => c.totalLeads,
      conversion: (c) => c.conversionRate,
      response: (c) => c.avgResponseTime,
      revenue: (c) => c.totalRevenue,
      efficiency: (c) => c.efficiency,
    },
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'performance']));

  const [counselors, setCounselors] = useState<Array<{ id: number; name: string; role: string }>>([]);

  useEffect(() => {
    const loadCounselors = async () => {
      try {
        const response = await fetch('/api/reports?type=performance');
        if (!response.ok) throw new Error('Failed to load employees');
        const result = await response.json();
        setCounselors((result.data?.performance || []).map((row: any) => ({
          id: row.employeeId,
          name: row.employeeName,
          role: 'Employee'
        })));
      } catch (error) {
        console.error('Error loading report employees:', error);
        setCounselors([]);
      }
    };

    loadCounselors();
  }, []);

  const generateReportData = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports?type=performance');
      if (!response.ok) throw new Error('Failed to load live performance report');
      const result = await response.json();
      const performanceRows = (result.data?.performance || [])
        .filter((row: any) => reportConfig.counselors.length === 0 || reportConfig.counselors.includes(row.employeeId))
        .map((row: any, index: number) => ({
          counselorId: row.employeeId,
          name: row.employeeName,
          role: 'Employee',
          totalLeads: row.leadCount || 0,
          convertedLeads: row.convertedLeadCount || 0,
          conversionRate: row.conversionRate || 0,
          avgResponseTime: 0,
          avgProcessingTime: 0,
          satisfactionScore: 0,
          workloadUtilization: 0,
          completedTasks: row.appointmentCount || 0,
          failedTasks: 0,
          totalRevenue: row.totalRevenue || 0,
          efficiency: row.conversionRate || 0,
          rank: index + 1
        }));

      setCounselors(performanceRows.map((row: any) => ({ id: row.counselorId, name: row.name, role: row.role })));
      setReportData({
        summary: {
          totalActivities: performanceRows.reduce((sum: number, row: any) => sum + row.totalLeads + row.completedTasks, 0),
          totalCounselors: performanceRows.length,
          totalRevenue: result.data?.totalRevenue || 0,
          avgConversionRate: performanceRows.length
            ? performanceRows.reduce((sum: number, row: any) => sum + row.conversionRate, 0) / performanceRows.length
            : 0,
          avgResponseTime: 0,
          period: `${reportConfig.startDate.toLocaleDateString()} - ${reportConfig.endDate.toLocaleDateString()}`,
          generatedAt: new Date()
        },
        performance: performanceRows,
        activities: [],
        revenue: [],
        trends: { daily: [], weekly: [], monthly: [] },
        issues: [],
        recommendations: []
      });
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading live performance report:', error);
      setReportData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const exportReport = (format: string) => {
    if (!reportData) return;

    const data = {
      config: reportConfig,
      data: reportData,
      generatedAt: new Date().toISOString()
    };

    let content = '';
    let filename = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `${reportConfig.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'csv':
        content = generateCSVReport();
        filename = `${reportConfig.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSVReport = () => {
    if (!reportData) return '';

    const headers = ['Date', 'Counselor', 'Action', 'Details', 'Outcome', 'Duration', 'Priority', 'Category'];
    const rows = reportData.activities.map(activity => [
      activity.date,
      activity.counselorName,
      activity.action,
      activity.details,
      activity.outcome,
      `${activity.duration / 1000}s`,
      activity.priority,
      activity.category
    ]);

    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  };

  const saveReportConfig = () => {
    setSavedReports([...savedReports, { ...reportConfig, id: Date.now().toString() }]);
  };

  const loadReportConfig = (config: ReportConfig) => {
    setReportConfig(config);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 80) return 'text-green-600 bg-green-100';
    if (value >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Report Generator</h2>
            <p className="text-gray-600 mt-1">Generate comprehensive performance reports with detailed analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              onClick={saveReportConfig}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Save Config
            </button>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
            <input
              type="text"
              value={reportConfig.name}
              onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <SearchableSelect
              value={reportConfig.period}
              onChange={(e) => setReportConfig({ ...reportConfig, period: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </SearchableSelect>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <SearchableSelect
              value={reportConfig.format}
              onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </SearchableSelect>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={reportConfig.startDate.toISOString().split('T')[0]}
              onChange={(e) => setReportConfig({ ...reportConfig, startDate: new Date(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={reportConfig.endDate.toISOString().split('T')[0]}
              onChange={(e) => setReportConfig({ ...reportConfig, endDate: new Date(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Counselors</label>
            <div className="space-y-2">
              {counselors.map(counselor => (
                <label key={counselor.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reportConfig.counselors.includes(counselor.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReportConfig({ ...reportConfig, counselors: [...reportConfig.counselors, counselor.id] });
                      } else {
                        setReportConfig({ ...reportConfig, counselors: reportConfig.counselors.filter(id => id !== counselor.id) });
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{counselor.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Report Sections</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(reportConfig.sections).map(([key, value]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setReportConfig({ 
                    ...reportConfig, 
                    sections: { ...reportConfig.sections, [key]: e.target.checked }
                  })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 capitalize">{key}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex items-center space-x-4">
          <button
            onClick={generateReportData}
            disabled={isGenerating}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
          
          {reportData && (
            <div className="relative">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => exportReport('csv')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportReport('json')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && reportData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Report Preview</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Summary Section */}
            {reportConfig.sections.summary && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Executive Summary</h4>
                  <button
                    onClick={() => toggleSection('summary')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.has('summary') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {expandedSections.has('summary') && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalActivities}</div>
                      <div className="text-sm text-gray-600">Total Activities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{reportData.summary.avgConversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Avg Conversion</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatDuration(reportData.summary.avgResponseTime)}</div>
                      <div className="text-sm text-gray-600">Avg Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{reportData.summary.totalCounselors}</div>
                      <div className="text-sm text-gray-600">Counselors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{formatCurrency(reportData.summary.totalRevenue)}</div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Performance Section */}
            {reportConfig.sections.performance && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Performance Metrics</h4>
                  <button
                    onClick={() => toggleSection('performance')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.has('performance') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {expandedSections.has('performance') && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <SortableTh label="Counselor" sortKey="counselor" activeKey={performanceSortKey} direction={performanceSortDirection} onSort={togglePerformanceSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                          <SortableTh label="Leads" sortKey="leads" activeKey={performanceSortKey} direction={performanceSortDirection} onSort={togglePerformanceSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                          <SortableTh label="Conversion" sortKey="conversion" activeKey={performanceSortKey} direction={performanceSortDirection} onSort={togglePerformanceSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                          <SortableTh label="Response" sortKey="response" activeKey={performanceSortKey} direction={performanceSortDirection} onSort={togglePerformanceSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                          <SortableTh label="Revenue" sortKey="revenue" activeKey={performanceSortKey} direction={performanceSortDirection} onSort={togglePerformanceSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                          <SortableTh label="Efficiency" sortKey="efficiency" activeKey={performanceSortKey} direction={performanceSortDirection} onSort={togglePerformanceSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedPerformance.map((counselor) => (
                          <tr key={counselor.counselorId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900">{counselor.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counselor.totalLeads}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(counselor.conversionRate)}`}>
                                {counselor.conversionRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDuration(counselor.avgResponseTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(counselor.totalRevenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(counselor.efficiency)}`}>
                                {counselor.efficiency.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            {/* Issues Section */}
            {reportConfig.sections.issues && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Issues & Alerts</h4>
                  <button
                    onClick={() => toggleSection('issues')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.has('issues') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {expandedSections.has('issues') && (
                  <div className="space-y-3">
                    {reportData.issues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <div>
                            <div className="font-medium text-gray-900">{issue.counselor}</div>
                            <div className="text-sm text-gray-600">{issue.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className="text-xs text-gray-500">{issue.count} occurrences</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Recommendations Section */}
            {reportConfig.sections.recommendations && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Recommendations</h4>
                  <button
                    onClick={() => toggleSection('recommendations')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.has('recommendations') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {expandedSections.has('recommendations') && (
                  <div className="space-y-4">
                    {reportData.recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{rec.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                                rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {rec.priority} Priority
                              </span>
                              <span className="ml-2 text-xs text-gray-500">Impact: {rec.impact}</span>
                            </div>
                            <div className="mt-3">
                              <h6 className="text-sm font-medium text-gray-900 mb-2">Action Items:</h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {rec.actionItems.map((item, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <CheckCircle className="w-3 h-3 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Report Configurations</h3>
          <div className="space-y-3">
            {savedReports.map((config, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{config.name}</div>
                  <div className="text-sm text-gray-600">{config.description}</div>
                  <div className="text-xs text-gray-500">
                    {config.period} • {config.startDate.toLocaleDateString()} - {config.endDate.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadReportConfig(config)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => setSavedReports(savedReports.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
