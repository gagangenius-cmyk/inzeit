'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Download, Mail, FileText, Settings, Play, Pause, Trash2, Plus } from 'lucide-react';

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  nextRun: string;
  lastRun: string;
  status: 'active' | 'paused' | 'error';
  createdBy: string;
  createdAt: string;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export default function ReportExportScheduler() {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [scheduleData, setScheduleData] = useState({
    name: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    recipients: '',
    format: 'pdf' as 'pdf' | 'excel' | 'csv',
    time: '09:00',
    dayOfWeek: '1'
  });
  const [loading, setLoading] = useState(false);

  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF',
      extension: '.pdf',
      icon: FileText,
      description: 'Portable Document Format'
    },
    {
      id: 'excel',
      name: 'Excel',
      extension: '.xlsx',
      icon: FileText,
      description: 'Microsoft Excel Spreadsheet'
    },
    {
      id: 'csv',
      name: 'CSV',
      extension: '.csv',
      icon: FileText,
      description: 'Comma Separated Values'
    }
  ];

  const availableReports = [
    { id: 'branch-lead-status', name: 'Branch Lead Status' },
    { id: 'approved-retained', name: 'Approved Retained Amount' },
    { id: 'total-revenue', name: 'Total Revenue' },
    { id: 'monthly-leads', name: 'Monthly Leads Received' },
    { id: 'program-retentions', name: 'Program Wise Retentions' },
    { id: 'branch-leaderboard', name: 'Branch Wise Revenue Leaderboard' },
    { id: 'comprehensive-analytics', name: 'Comprehensive Analytics' }
  ];

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reports?action=getSavedReports');
      if (!response.ok) throw new Error('Failed to load scheduled reports');
      const result = await response.json();
      setScheduledReports((result.data || result.reports || []).map((report: any) => ({
        id: String(report.id),
        name: report.name || report.reportName || '',
        type: report.type || report.reportType || '',
        frequency: report.frequency || 'weekly',
        recipients: Array.isArray(report.recipients) ? report.recipients : String(report.recipients || '').split(',').filter(Boolean),
        format: report.format || 'pdf',
        nextRun: report.nextRun || '',
        lastRun: report.lastRun || '',
        status: report.status || 'active',
        createdBy: report.createdBy || report.created_by || '',
        createdAt: report.createdAt || report.created_at || ''
      })));
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleData.name || !selectedReport || !scheduleData.recipients) {
      window.toast.warning('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveReport',
          reportName: scheduleData.name,
          reportType: selectedReport,
          filters: {
            frequency: scheduleData.frequency,
            recipients: scheduleData.recipients,
            format: scheduleData.format,
            time: scheduleData.time,
            dayOfWeek: scheduleData.dayOfWeek
          }
        })
      });
      if (!response.ok) throw new Error('Scheduled report storage is not configured');
      await fetchScheduledReports();
      setShowScheduler(false);
      resetScheduleForm();
    } catch (error) {
      console.error('Error creating schedule:', error);
      window.toast.error('Failed to create schedule');
    }
  };

  const calculateNextRun = (frequency: string): string => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
    }
    return now.toISOString().split('T')[0] + ' 09:00';
  };

  const resetScheduleForm = () => {
    setScheduleData({
      name: '',
      frequency: 'weekly',
      recipients: '',
      format: 'pdf',
      time: '09:00',
      dayOfWeek: '1'
    });
    setSelectedReport('');
  };

  const toggleScheduleStatus = (id: string) => {
    setScheduledReports(reports =>
      reports.map(report =>
        report.id === id
          ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
          : report
      )
    );
  };

  const deleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this scheduled report?')) {
      setScheduledReports(reports => reports.filter(report => report.id !== id));
    }
  };

  const exportReport = async (reportId: string, format: string) => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            name: availableReports.find((report) => report.id === reportId)?.name || reportId,
            description: '',
            period: 'monthly',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            counselors: [],
            includeCharts: true,
            includeDetails: true,
            includeTrends: true,
            format: format === 'excel' ? 'excel' : format,
            sections: {
              summary: true,
              performance: true,
              activities: true,
              revenue: true,
              issues: true,
              trends: true,
              recommendations: true
            }
          }
        })
      });
      if (!response.ok) throw new Error('Failed to export live report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId}.${format === 'excel' ? 'xlsx' : format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      window.toast.error('Failed to export report');
    }
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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Report Export & Scheduling</h2>
            <p className="text-gray-600 mt-1">Automate report generation and delivery</p>
          </div>
          <button
            onClick={() => setShowScheduler(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Report
          </button>
        </div>
      </div>

      {/* Quick Export */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableReports.map(report => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{report.name}</h4>
              <div className="flex space-x-2">
                {exportFormats.map(format => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => exportReport(report.id, format.id)}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      title={format.description}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {format.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                      <div className="text-sm text-gray-500">
                        {availableReports.find(r => r.id === report.type)?.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {report.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                      {report.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {report.recipients.slice(0, 2).join(', ')}
                      {report.recipients.length > 2 && ` +${report.recipients.length - 2} more`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {report.nextRun}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleScheduleStatus(report.id)}
                        className={`p-1 rounded ${
                          report.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                        }`}
                        title={report.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {report.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => exportReport(report.type, report.format)}
                        className="p-1 text-blue-600 hover:text-blue-900"
                        title="Export Now"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSchedule(report.id)}
                        className="p-1 text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Report</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                <input
                  type="text"
                  value={scheduleData.name}
                  onChange={(e) => setScheduleData({ ...scheduleData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter schedule name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Report</label>
                <SearchableSelect
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a report...</option>
                  {availableReports.map(report => (
                    <option key={report.id} value={report.id}>{report.name}</option>
                  ))}
                </SearchableSelect>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <SearchableSelect
                    value={scheduleData.frequency}
                    onChange={(e) => setScheduleData({ ...scheduleData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <div className="flex space-x-4">
                  {exportFormats.map(format => {
                    const Icon = format.icon;
                    return (
                      <label key={format.id} className="flex items-center">
                        <input
                          type="radio"
                          value={format.id}
                          checked={scheduleData.format === format.id}
                          onChange={(e) => setScheduleData({ ...scheduleData, format: e.target.value as any })}
                          className="mr-2"
                        />
                        <Icon className="w-4 h-4 mr-1" />
                        <span className="text-sm">{format.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <input
                  type="text"
                  value={scheduleData.recipients}
                  onChange={(e) => setScheduleData({ ...scheduleData, recipients: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email addresses separated by commas"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduler(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
