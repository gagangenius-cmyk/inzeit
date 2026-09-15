'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { CounselorLogger } from '@/lib/counselorLogger';
import {
  Search, Filter, Calendar, Download, Eye, Clock, User, Activity,
  AlertCircle, CheckCircle, XCircle, FileText, Phone, Mail,
  RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: Date;
  counselorId: number;
  counselorName: string;
  action: string;
  details: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
  outcome?: string;
  duration?: number;
  notes?: string;
}

interface LogFilters {
  counselorId?: number;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
  outcome?: string;
  category?: string;
}

export default function CounselorActivityLogs() {
  const [logger] = useState(() => new CounselorLogger());
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const counselors: Array<{ id: number; name: string; role: string }> = [];

  const actionTypes = [
    'lead_assigned',
    'lead_converted',
    'workflow_started',
    'workflow_completed',
    'communication_email',
    'communication_phone',
    'communication_sms',
    'communication_in_person',
    'performance_update',
    'document_uploaded',
    'document_verified'
  ];

  const outcomeTypes = ['success', 'failure', 'pending', 'in_progress'];
  const categories = ['assignment', 'conversion', 'workflow', 'communication', 'performance'];

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters, searchTerm]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      setLogs([]);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.counselorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Counselor filter
    if (filters.counselorId) {
      filtered = filtered.filter(log => log.counselorId === filters.counselorId);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(log => log.timestamp >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.timestamp <= toDate);
    }

    // Action filter
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Outcome filter
    if (filters.outcome) {
      filtered = filtered.filter(log => log.outcome === filters.outcome);
    }

    setFilteredLogs(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'lead_assigned': return <User className="w-4 h-4 text-blue-600" />;
      case 'lead_converted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'communication_email': return <Mail className="w-4 h-4 text-purple-600" />;
      case 'communication_phone': return <Phone className="w-4 h-4 text-green-600" />;
      case 'communication_sms': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'workflow_started': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'workflow_completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'document_uploaded': return <FileText className="w-4 h-4 text-gray-600" />;
      case 'document_verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in_progress': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const { sorted: sortedLogs, sortKey: logSortKey, sortDirection: logSortDirection, toggleSort: toggleLogSort } = useSortableData(
    filteredLogs,
    {
      timestamp: (log) => log.timestamp,
      counselor: (log) => log.counselorName,
      action: (log) => formatActionName(log.action),
      details: (log) => log.details.leadName || log.details.subject || log.details.communicationType,
      outcome: (log) => log.outcome || 'pending',
      duration: (log) => log.duration,
    },
  );

  const exportLogs = (format: 'json' | 'csv' | 'txt') => {
    const data = filteredLogs.map(log => ({
      timestamp: new Date(log.timestamp).toISOString(),
      counselorName: log.counselorName,
      action: log.action,
      details: log.details,
      outcome: log.outcome,
      duration: log.duration,
      notes: log.notes
    }));

    let content = '';
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        const headers = ['Timestamp', 'Counselor', 'Action', 'Details', 'Outcome', 'Duration', 'Notes'];
        const rows = data.map(log => [
          new Date(log.timestamp).toISOString(),
          log.counselorName,
          log.action,
          JSON.stringify(log.details),
          log.outcome || '',
          formatDuration(log.duration),
          log.notes || ''
        ]);
        content = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
        break;
      case 'txt':
        content = data.map(log => 
          `[${new Date(log.timestamp).toISOString()}] [${log.counselorName}] [${log.action}] [${log.outcome || 'pending'}] ${JSON.stringify(log.details)}`
        ).join('\n');
        break;
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `counselor-logs.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <h2 className="text-2xl font-bold text-gray-900">Counselor Activity Logs</h2>
            <p className="text-gray-600 mt-1">Monitor and track all counselor activities</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <button
              onClick={() => loadLogs()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => exportLogs('json')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => exportLogs('csv')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportLogs('txt')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as TXT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Counselor</label>
              <SearchableSelect
                value={filters.counselorId || ''}
                onChange={(e) => setFilters({ ...filters, counselorId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Counselors</option>
                {counselors.map(counselor => (
                  <option key={counselor.id} value={counselor.id}>{counselor.name}</option>
                ))}
              </SearchableSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <SearchableSelect
                value={filters.action || ''}
                onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{formatActionName(action)}</option>
                ))}
              </SearchableSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
              <SearchableSelect
                value={filters.outcome || ''}
                onChange={(e) => setFilters({ ...filters, outcome: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Outcomes</option>
                {outcomeTypes.map(outcome => (
                  <option key={outcome} value={outcome}>{outcome}</option>
                ))}
              </SearchableSelect>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => setFilters({})}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search logs by counselor, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh label="Timestamp" sortKey="timestamp" activeKey={logSortKey} direction={logSortDirection} onSort={toggleLogSort} />
                <SortableTh label="Counselor" sortKey="counselor" activeKey={logSortKey} direction={logSortDirection} onSort={toggleLogSort} />
                <SortableTh label="Action" sortKey="action" activeKey={logSortKey} direction={logSortDirection} onSort={toggleLogSort} />
                <SortableTh label="Details" sortKey="details" activeKey={logSortKey} direction={logSortDirection} onSort={toggleLogSort} />
                <SortableTh label="Outcome" sortKey="outcome" activeKey={logSortKey} direction={logSortDirection} onSort={toggleLogSort} />
                <SortableTh label="Duration" sortKey="duration" activeKey={logSortKey} direction={logSortDirection} onSort={toggleLogSort} />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{log.counselorName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(log.action)}
                      <span className="ml-2 text-sm text-gray-900">{formatActionName(log.action)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {log.details.leadName && <span className="font-medium">{log.details.leadName}</span>}
                      {log.details.subject && <span className="block text-xs text-gray-500">{log.details.subject}</span>}
                      {log.details.communicationType && <span className="block text-xs text-gray-500">{log.details.communicationType}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getOutcomeIcon(log.outcome)}
                      <span className="ml-2 text-sm text-gray-900">{log.outcome || 'pending'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(log.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Log Details */}
      {expandedLog && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Log Details</h3>
            <button
              onClick={() => setExpandedLog(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          {(() => {
            const log = filteredLogs.find(l => l.id === expandedLog);
            if (!log) return null;
            
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Timestamp:</span>
                    <p className="text-sm text-gray-900">{log.timestamp.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Counselor:</span>
                    <p className="text-sm text-gray-900">{log.counselorName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Action:</span>
                    <p className="text-sm text-gray-900">{formatActionName(log.action)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Outcome:</span>
                    <p className="text-sm text-gray-900">{log.outcome || 'pending'}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Details:</span>
                  <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
                
                {log.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notes:</span>
                    <p className="mt-1 text-sm text-gray-900">{log.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredLogs.length}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredLogs.filter(l => l.outcome === 'success').length}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {filteredLogs.filter(l => l.outcome === 'failure').length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredLogs.filter(l => l.outcome === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
