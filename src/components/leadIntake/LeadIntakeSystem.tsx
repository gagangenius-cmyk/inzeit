'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { CounselorAssignmentSystem, Lead, Counselor, AssignmentRule } from '@/lib/counselorAssignment';
import { 
  Globe, Facebook, Instagram, Linkedin, Users, Phone, Mail, 
  Clock, CheckCircle, AlertCircle, Settings, ToggleLeft, ToggleRight,
  UserPlus, Activity, TrendingUp, Filter, Search
} from 'lucide-react';

export default function LeadIntakeSystem() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [assignmentSystem, setAssignmentSystem] = useState<CounselorAssignmentSystem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'counselors' | 'rules' | 'analytics'>('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    setLoading(true);
    try {
      const databaseCounselors: Counselor[] = [];
      const databaseRules: AssignmentRule[] = [];

      setCounselors([]);
      setRules([]);
      setLeads([]);
      
      const system = new CounselorAssignmentSystem(databaseCounselors, databaseRules);
      setAssignmentSystem(system);
    } catch (error) {
      console.error('Error initializing system:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateNewLead = (_source: Lead['source']) => {
    window.toast.info('Lead intake uses database records only. Create leads through the connected lead forms or API.');
  };

  const toggleCounselorAutoAssign = (counselorId: string) => {
    if (assignmentSystem) {
      assignmentSystem.toggleAutoAssign(counselorId);
      setCounselors(prev => prev.map(c => 
        c.id === counselorId 
          ? { ...c, availability: { ...c.availability, autoAssignEnabled: !c.availability.autoAssignEnabled } }
          : c
      ));
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getSourceIcon = (source: Lead['source']) => {
    switch (source) {
      case 'website': return <Globe className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-700" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Lead['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Lead['status']) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'assigned': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'contacted': return <Phone className="w-4 h-4 text-green-500" />;
      case 'qualified': return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'converted': return <TrendingUp className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Counselor Assignment System</h2>
            <p className="text-gray-600 mt-1">Auto-assign leads from website and social platforms</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => simulateNewLead('website')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Globe className="w-4 h-4 mr-2" />
              Simulate Website Lead
            </button>
            <button
              onClick={() => simulateNewLead('facebook')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Simulate Facebook Lead
            </button>
            <button
              onClick={() => simulateNewLead('instagram')}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              <Instagram className="w-4 h-4 mr-2" />
              Simulate Instagram Lead
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['leads', 'counselors', 'rules', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'leads' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <SearchableSelect
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                </SearchableSelect>
              </div>

              {/* Leads Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getSourceIcon(lead.source)}
                            <span className="ml-2 text-sm text-gray-900 capitalize">{lead.source}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.program}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(lead.status)}
                            <span className="ml-2 text-sm text-gray-900 capitalize">{lead.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.assignedTo ? counselors.find(c => c.id === lead.assignedTo)?.name : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.receivedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'counselors' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counselor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workload</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auto-Assign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {counselors.map((counselor) => (
                      <tr key={counselor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{counselor.name}</div>
                            <div className="text-sm text-gray-500">{counselor.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counselor.branch}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-24">
                              <div 
                                className={`h-2 rounded-full ${
                                  (counselor.currentLeads / counselor.maxLeads) >= 0.9 ? 'bg-red-500' : 
                                  (counselor.currentLeads / counselor.maxLeads) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                                }`} 
                                style={{ width: `${(counselor.currentLeads / counselor.maxLeads) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{counselor.currentLeads}/{counselor.maxLeads}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>Conversion: {counselor.performance.conversionRate}%</div>
                            <div>Response: {counselor.performance.responseTime}%</div>
                            <div>Satisfaction: {counselor.performance.satisfactionScore}/5</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleCounselorAutoAssign(counselor.id)}
                            className={`p-1 rounded ${
                              counselor.availability.autoAssignEnabled ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {counselor.availability.autoAssignEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                          <button className="text-gray-600 hover:text-gray-900">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                      <p className="text-sm text-gray-500">Priority: {rule.priority}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-900">Edit</button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div>Conditions: {JSON.stringify(rule.conditions)}</div>
                    <div>Actions: {JSON.stringify(rule.actions)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              {assignmentSystem && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h3>
                    <div className="space-y-2">
                      {Object.entries(assignmentSystem.getSystemStats()).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


