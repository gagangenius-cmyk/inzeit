'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { useState, useEffect } from 'react';
import {
  Clock, Users, AlertTriangle, RefreshCw, Play, Pause, Settings,
  TrendingUp, Activity, CheckCircle, XCircle, Calendar, Filter,
  Download, Eye, Edit, Trash2, Plus, Save, Bell, Mail
} from 'lucide-react';

interface ReassignmentRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    timeWithoutTouch: number;
    maxReassignments: number;
    priorityLevels: string[];
    counselorStatus: string[];
    workingHoursOnly: boolean;
  };
  actions: {
    notifyOriginalCounselor: boolean;
    notifyNewCounselor: boolean;
    notifyManager: boolean;
    escalateToManager: boolean;
    addToReassignmentQueue: boolean;
  };
  targetSelection: string;
}

interface ReassignmentRecord {
  id: string;
  leadId: string;
  originalCounselorName: string;
  newCounselorName: string;
  reassignmentReason: string;
  reassignmentTime: string;
  timeSinceAssignment: number;
  systemTriggered: boolean;
  notes?: string;
}

interface SystemStatus {
  isRunning: boolean;
  totalLeads: number;
  assignedLeads: number;
  totalReassignments: number;
  activeRules: number;
  lastCheck: string;
}

export default function LeadReassignmentManager() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isRunning: false,
    totalLeads: 0,
    assignedLeads: 0,
    totalReassignments: 0,
    activeRules: 0,
    lastCheck: new Date().toISOString()
  });

  const [rules, setRules] = useState<ReassignmentRule[]>([]);
  const [reassignmentHistory, setReassignmentHistory] = useState<ReassignmentRecord[]>([]);
  const { sorted: sortedReassignmentHistory, sortKey: reassignmentSortKey, sortDirection: reassignmentSortDirection, toggleSort: toggleReassignmentSort } = useSortableData(
    reassignmentHistory,
    {
      leadId: (r) => r.leadId,
      originalCounselor: (r) => r.originalCounselorName,
      newCounselor: (r) => r.newCounselorName,
      reason: (r) => r.reassignmentReason,
      timeSinceAssignment: (r) => r.timeSinceAssignment,
      date: (r) => r.reassignmentTime,
      systemTriggered: (r) => r.systemTriggered,
    },
  );
  const [selectedRule, setSelectedRule] = useState<ReassignmentRule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRules([]);
    setReassignmentHistory([]);
    setSystemStatus({
      isRunning: false,
      totalLeads: 0,
      assignedLeads: 0,
      totalReassignments: 0,
      activeRules: 0,
      lastCheck: new Date().toISOString()
    });
  }, []);

  const toggleSystem = () => {
    setLoading(true);
    setTimeout(() => {
      setSystemStatus(prev => ({
        ...prev,
        isRunning: !prev.isRunning,
        lastCheck: new Date().toISOString()
      }));
      setLoading(false);
    }, 1000);
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
    
    setSystemStatus(prev => ({
      ...prev,
      activeRules: rules.filter(r => r.id !== ruleId ? r.enabled : !r.enabled).length
    }));
  };

  const saveRule = (updatedRule: ReassignmentRule) => {
    if (selectedRule) {
      setRules(prev => prev.map(rule => 
        rule.id === updatedRule.id ? updatedRule : rule
      ));
    } else {
      setRules(prev => [...prev, updatedRule]);
    }
    setShowRuleModal(false);
    setSelectedRule(null);
  };

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    setSystemStatus(prev => ({
      ...prev,
      activeRules: rules.filter(r => r.id !== ruleId && r.enabled).length
    }));
  };

  const exportHistory = () => {
    const csv = [
      ['Lead ID', 'Original Counselor', 'New Counselor', 'Reason', 'Time Since Assignment', 'Date', 'System Triggered'],
      ...reassignmentHistory.map(record => [
        record.leadId,
        record.originalCounselorName,
        record.newCounselorName,
        record.reassignmentReason,
        `${record.timeSinceAssignment} minutes`,
        new Date(record.reassignmentTime).toLocaleString(),
        record.systemTriggered ? 'Yes' : 'No'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reassignment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lead Reassignment System</h2>
            <p className="text-gray-600 mt-1">Automatic lead reassignment based on time and activity rules</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSystem}
              disabled={loading}
              className={`flex items-center px-4 py-2 rounded-lg ${
                systemStatus.isRunning 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : systemStatus.isRunning ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {systemStatus.isRunning ? 'Stop System' : 'Start System'}
            </button>
            
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Clock className="w-4 h-4 mr-2" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
              systemStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <div className="text-2xl font-bold text-gray-900">
              {systemStatus.isRunning ? 'Running' : 'Stopped'}
            </div>
            <div className="text-sm text-gray-600">System Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{systemStatus.totalLeads}</div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{systemStatus.assignedLeads}</div>
            <div className="text-sm text-gray-600">Assigned Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{systemStatus.totalReassignments}</div>
            <div className="text-sm text-gray-600">Total Reassignments</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Rules:</span>
              <span className="text-sm font-medium text-gray-900">{systemStatus.activeRules}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Check:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(systemStatus.lastCheck).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reassignment Rules */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Reassignment Rules</h3>
            <button
              onClick={() => {
                setSelectedRule(null);
                setShowRuleModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {rules.map((rule) => (
            <div key={rule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        rule.enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Time Threshold:</span>
                      <span className="ml-2 text-gray-900">{rule.conditions.timeWithoutTouch} hours</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Max Reassignments:</span>
                      <span className="ml-2 text-gray-900">{rule.conditions.maxReassignments}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Priority Levels:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.conditions.priorityLevels.map(priority => (
                          <span key={priority} className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(priority)}`}>
                            {priority}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Target Selection:</span>
                      <span className="ml-2 text-gray-900">{rule.targetSelection.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedRule(rule);
                      setShowRuleModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedRule ? 'Edit Rule' : 'Add Rule'}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    defaultValue={selectedRule?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    defaultValue={selectedRule?.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter rule description"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Without Touch (hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={selectedRule?.conditions.timeWithoutTouch || 2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Reassignments</label>
                    <input
                      type="number"
                      defaultValue={selectedRule?.conditions.maxReassignments || 3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Selection</label>
                  <SearchableSelect
                    defaultValue={selectedRule?.targetSelection || 'least_loaded'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="least_loaded">Least Loaded</option>
                    <option value="best_performance">Best Performance</option>
                    <option value="random">Random</option>
                    <option value="specialty_match">Specialty Match</option>
                    <option value="round_robin">Round Robin</option>
                  </SearchableSelect>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // In a real implementation, this would save the rule
                  setShowRuleModal(false);
                  setSelectedRule(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Reassignment History</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportHistory}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableTh label="Lead ID" sortKey="leadId" activeKey={reassignmentSortKey} direction={reassignmentSortDirection} onSort={toggleReassignmentSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Original Counselor" sortKey="originalCounselor" activeKey={reassignmentSortKey} direction={reassignmentSortDirection} onSort={toggleReassignmentSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="New Counselor" sortKey="newCounselor" activeKey={reassignmentSortKey} direction={reassignmentSortDirection} onSort={toggleReassignmentSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Reason" sortKey="reason" activeKey={reassignmentSortKey} direction={reassignmentSortDirection} onSort={toggleReassignmentSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Time Since Assignment" sortKey="timeSinceAssignment" activeKey={reassignmentSortKey} direction={reassignmentSortDirection} onSort={toggleReassignmentSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Date" sortKey="date" activeKey={reassignmentSortKey} direction={reassignmentSortDirection} onSort={toggleReassignmentSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="System Triggered" sortKey="systemTriggered" activeKey={reassignmentSortKey} direction={reassignmentSortDirection} onSort={toggleReassignmentSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedReassignmentHistory.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.leadId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.originalCounselorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.newCounselorName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={record.reassignmentReason}>
                          {record.reassignmentReason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(record.timeSinceAssignment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.reassignmentTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.systemTriggered ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-gray-600">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
