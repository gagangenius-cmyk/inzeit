'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect, useRef } from 'react';
import { CounselorLogger } from '@/lib/counselorLogger';
import {
  Activity, Bell, TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Clock, Users, Target, FileText, Phone, Mail, RefreshCw, Filter,
  Download, Eye, EyeOff, Settings, Zap, BarChart3, PieChart,
  Calendar, Search, MoreVertical, Info, AlertTriangle
} from 'lucide-react';

interface RealTimeActivity {
  id: string;
  timestamp: Date;
  counselorId: number;
  counselorName: string;
  action: string;
  details: Record<string, any>;
  outcome?: 'success' | 'failure' | 'pending';
  duration?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'assignment' | 'conversion' | 'workflow' | 'communication' | 'performance' | 'system' | 'security';
  relatedEntityId?: string;
  relatedEntityType?: string;
}

interface PerformanceMetrics {
  counselorId: number;
  counselorName: string;
  totalActivities: number;
  successfulActivities: number;
  failedActivities: number;
  avgResponseTime: number;
  avgProcessingTime: number;
  conversionRate: number;
  workloadUtilization: number;
  lastActivity: Date;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  counselorId?: number;
  actionRequired: boolean;
  acknowledged: boolean;
}

export default function RealTimeActivityMonitor() {
  const [logger] = useState(() => new CounselorLogger());
  const [activities, setActivities] = useState<RealTimeActivity[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // Mock counselors
  const counselors = [
    { id: 1, name: 'Sarah Wilson', role: 'Counselor', status: 'active' },
    { id: 2, name: 'Mike Johnson', role: 'Counselor', status: 'active' },
    { id: 3, name: 'Emily Chen', role: 'Case Officer', status: 'active' },
    { id: 4, name: 'David Brown', role: 'Case Officer', status: 'active' }
  ];

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (isLive) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isLive]);

  // Simulate real-time activities (in production, this would be WebSocket)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      generateMockActivity();
    }, Math.random() * 3000 + 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto-refresh performance metrics
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      updatePerformanceMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const connectWebSocket = () => {
    setConnectionStatus('reconnecting');
    
    // In production, this would connect to your WebSocket server
    // For now, we'll simulate the connection
    setTimeout(() => {
      setConnectionStatus('connected');
      generateMockActivity();
    }, 1000);
  };

  const generateMockActivity = () => {
    const actions = ['lead_assigned', 'communication_email', 'communication_phone', 'workflow_started', 'lead_converted', 'document_uploaded'];
    const categories = ['assignment', 'communication', 'workflow', 'conversion', 'performance'];
    const outcomes = ['success', 'failure', 'pending'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    
    const randomCounselor = counselors[Math.floor(Math.random() * counselors.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
    
    const activity: RealTimeActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      counselorId: randomCounselor.id,
      counselorName: randomCounselor.name,
      action: randomAction,
      details: {
        leadId: Math.floor(Math.random() * 1000),
        leadName: `Client ${Math.floor(Math.random() * 100)}`,
        serviceType: 'Student Visa',
        priority: randomPriority,
        source: 'Website'
      },
      outcome: randomOutcome as 'success' | 'failure' | 'pending',
      duration: Math.floor(Math.random() * 300000) + 30000,
      priority: randomPriority as 'low' | 'medium' | 'high' | 'critical',
      category: randomCategory as 'assignment' | 'conversion' | 'workflow' | 'communication' | 'performance' | 'system' | 'security',
      relatedEntityId: `entity_${Math.floor(Math.random() * 100)}`,
      relatedEntityType: 'lead'
    };

    setActivities(prev => [activity, ...prev.slice(0, 99)]);
    
    // Generate alerts for critical activities
    if (randomPriority === 'critical' || randomOutcome === 'failure') {
      const alert: Alert = {
        id: `alert_${Date.now()}`,
        type: randomPriority === 'critical' ? 'error' : 'warning',
        title: `${randomAction.replace(/_/g, ' ').toUpperCase()} Alert`,
        message: `${randomCounselor.name} - ${randomOutcome === 'failure' ? 'Failed to complete' : 'Critical issue in'} ${randomAction.replace(/_/g, ' ')}`,
        timestamp: new Date(),
        counselorId: randomCounselor.id,
        actionRequired: true,
        acknowledged: false
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    }

    // Update performance metrics
    updatePerformanceMetrics();
  };

  const updatePerformanceMetrics = () => {
    const metrics: PerformanceMetrics[] = counselors.map(counselor => {
      const counselorActivities = activities.filter(a => a.counselorId === counselor.id);
      const successful = counselorActivities.filter(a => a.outcome === 'success').length;
      const failed = counselorActivities.filter(a => a.outcome === 'failure').length;
      const total = counselorActivities.length;
      
      const responseTimes = counselorActivities
        .filter(a => a.action.startsWith('communication_'))
        .map(a => a.duration || 0)
        .filter(time => time > 0);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;
      
      const processingTimes = counselorActivities
        .filter(a => a.action.startsWith('workflow_'))
        .map(a => a.duration || 0)
        .filter(time => time > 0);
      
      const avgProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
        : 0;
      
      const conversionRate = total > 0 ? (successful / total) * 100 : 0;
      
      return {
        counselorId: counselor.id,
        counselorName: counselor.name,
        totalActivities: total,
        successfulActivities: successful,
        failedActivities: failed,
        avgResponseTime,
        avgProcessingTime,
        conversionRate,
        workloadUtilization: Math.min(95, (total / 50) * 100), // Assuming max 50 activities
        lastActivity: counselorActivities.length > 0 ? counselorActivities[0].timestamp : new Date(),
        trends: {
          daily: Array(7).fill(0).map(() => Math.floor(Math.random() * 20)),
          weekly: Array(4).fill(0).map(() => Math.floor(Math.random() * 100)),
          monthly: Array(12).fill(0).map(() => Math.floor(Math.random() * 400))
        }
      };
    }).filter(metric => metric !== undefined) as PerformanceMetrics[];
    
    setPerformanceMetrics(metrics);
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('lead_assigned')) return <Users className="w-4 h-4 text-blue-600" />;
    if (action.includes('communication')) return <Mail className="w-4 h-4 text-purple-600" />;
    if (action.includes('workflow')) return <Activity className="w-4 h-4 text-green-600" />;
    if (action.includes('converted')) return <Target className="w-4 h-4 text-orange-600" />;
    if (action.includes('document')) return <FileText className="w-4 h-4 text-gray-600" />;
    return <Info className="w-4 h-4 text-gray-600" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assignment': return 'text-blue-600 bg-blue-100';
      case 'conversion': return 'text-green-600 bg-green-100';
      case 'workflow': return 'text-purple-600 bg-purple-100';
      case 'communication': return 'text-orange-600 bg-orange-100';
      case 'performance': return 'text-indigo-600 bg-indigo-100';
      case 'system': return 'text-gray-600 bg-gray-100';
      case 'security': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const exportReport = (format: 'json' | 'csv' | 'pdf') => {
    const data = {
      activities: activities.slice(0, 1000),
      performanceMetrics,
      alerts: alerts,
      generatedAt: new Date().toISOString(),
      timeRange,
      filters: {
        selectedCounselor,
        autoRefresh,
        refreshInterval
      }
    };

    let content = '';
    let filename = '';
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `counselor-activity-report-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'csv':
        const headers = ['Timestamp', 'Counselor', 'Action', 'Category', 'Priority', 'Outcome', 'Duration', 'Details'];
        const rows = data.activities.map(activity => [
          activity.timestamp.toISOString(),
          activity.counselorName,
          formatActionName(activity.action),
          activity.category,
          activity.priority,
          activity.outcome || 'pending',
          formatDuration(activity.duration),
          JSON.stringify(activity.details)
        ]);
        content = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
        filename = `counselor-activity-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'pdf':
        // In production, this would generate a PDF
        content = JSON.stringify(data, null, 2);
        filename = `counselor-activity-report-${new Date().toISOString().split('T')[0]}.txt`;
        break;
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredActivities = () => {
    let filtered = [...activities];
    
    if (selectedCounselor) {
      filtered = filtered.filter(a => a.counselorId === selectedCounselor);
    }
    
    // Apply time range filter
    const now = new Date();
    const cutoffTime = new Date();
    
    switch (timeRange) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoffTime.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoffTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoffTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffTime.setDate(now.getDate() - 30);
        break;
    }
    
    filtered = filtered.filter(a => a.timestamp >= cutoffTime);
    
    return filtered;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Real-Time Activity Monitor</h2>
            <p className="text-gray-600 mt-1">Live monitoring of counselor activities and performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
              </span>
            </div>
            
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isLive 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Activity className="w-4 h-4 mr-2" />
              {isLive ? 'Live' : 'Paused'}
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <div className="relative">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => exportReport('json')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => exportReport('csv')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-yellow-600" />
                Active Alerts ({alerts.length})
              </h3>
              <button
                onClick={clearAlerts}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border-b border-gray-200 ${
                  alert.acknowledged ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-1 ${
                      alert.type === 'error' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' :
                      alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.counselorId && `Counselor ID: ${alert.counselorId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Counselor</label>
              <SearchableSelect
                value={selectedCounselor || ''}
                onChange={(e) => setSelectedCounselor(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Counselors</option>
                {counselors.map(counselor => (
                  <option key={counselor.id} value={counselor.id}>{counselor.name}</option>
                ))}
              </SearchableSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <SearchableSelect
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </SearchableSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto Refresh</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center px-3 py-2 rounded-lg ${
                    autoRefresh 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {autoRefresh ? 'Enabled' : 'Disabled'}
                </button>
                {autoRefresh && (
                  <SearchableSelect
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5000}>5 seconds</option>
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                  </SearchableSelect>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => (
          <div key={metric.counselorId} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{metric.counselorName}</h3>
              <div className={`w-2 h-2 rounded-full ${
                metric.conversionRate >= 70 ? 'bg-green-500' : 
                metric.conversionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Activities</span>
                <span className="text-sm font-medium text-gray-900">{metric.totalActivities}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-gray-900">{metric.conversionRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">{formatDuration(metric.avgResponseTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Workload</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="h-2 rounded-full bg-blue-600" 
                      style={{ width: `${metric.workloadUtilization}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metric.workloadUtilization.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real-Time Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Activity Feed</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm text-gray-600`}>
                {getFilteredActivities().length} activities
              </span>
              <span className="text-sm text-gray-500">
                {isLive ? 'Live' : 'Paused'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {getFilteredActivities().map((activity, index) => (
            <div
              key={activity.id}
              className={`p-4 border-b border-gray-200 hover:bg-gray-50 ${
                index === 0 ? 'border-t-0' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(activity.category)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{activity.counselorName}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      {formatActionName(activity.action)}
                    </div>
                    {activity.details.leadName && (
                      <div className="text-sm text-gray-600">
                        {activity.details.leadName}
                      </div>
                    )}
                    {activity.details.subject && (
                      <div className="text-sm text-gray-600">
                        {activity.details.subject}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {activity.outcome === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {activity.outcome === 'failure' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    {activity.outcome === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                    <span className="text-sm text-gray-900">
                      {activity.outcome || 'pending'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(activity.duration)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {activity.timestamp.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getFilteredActivities().length}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {getFilteredActivities().filter(a => a.outcome === 'success').length}
            </div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {getFilteredActivities().filter(a => a.outcome === 'failure').length}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {getFilteredActivities().filter(a => a.outcome === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {alerts.filter(a => !a.acknowledged).length}
            </div>
            <div className="text-sm text-gray-600">Active Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {performanceMetrics.reduce((sum, m) => sum + m.totalActivities, 0)}
            </div>
            <div className="text-sm text-gray-600">All Activities</div>
          </div>
        </div>
      </div>
    </div>
  );
}
