'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Calendar, FileText, AlertCircle, CheckCircle, 
  Clock, Target, Briefcase, Shield, Activity, BarChart3, PieChart,
  ArrowUp, ArrowDown, Eye, Filter, Search, Download, RefreshCw
} from 'lucide-react';
import { LeadOpportunityConversion } from '@/lib/leadOpportunityConversion';
import { WorkflowManagement } from '@/lib/workflowManagement';
import { useAuth } from '@/contexts/AuthContext';

interface UnifiedDashboardProps {
  leads: any[];
  opportunities: any[];
  caseOfficers: any[];
}

interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  totalOpportunities: number;
  activeWorkflows: number;
  completedWorkflows: number;
  totalRevenue: number;
  avgConversionTime: number;
  caseOfficerUtilization: number;
}

interface WorkflowMetrics {
  activeWorkflows: number;
  completedWorkflows: number;
  overdueStages: number;
  avgProgress: number;
  completionRate: number;
}

interface LeadMetrics {
  newLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  avgLeadValue: number;
  topSources: Array<{ source: string; count: number }>;
}

interface OpportunityMetrics {
  totalOpportunities: number;
  retainedOpportunities: number;
  retentionRate: number;
  avgOpportunityValue: number;
  byServiceType: Array<{ type: string; count: number; value: number }>;
}

export default function UnifiedWorkflowDashboard({ leads, opportunities, caseOfficers }: UnifiedDashboardProps) {
  const { currencyCode } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    convertedLeads: 0,
    totalOpportunities: 0,
    activeWorkflows: 0,
    completedWorkflows: 0,
    totalRevenue: 0,
    avgConversionTime: 0,
    caseOfficerUtilization: 0
  });

  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics>({
    activeWorkflows: 0,
    completedWorkflows: 0,
    overdueStages: 0,
    avgProgress: 0,
    completionRate: 0
  });

  const [leadMetrics, setLeadMetrics] = useState<LeadMetrics>({
    newLeads: 0,
    qualifiedLeads: 0,
    conversionRate: 0,
    avgLeadValue: 0,
    topSources: []
  });

  const [opportunityMetrics, setOpportunityMetrics] = useState<OpportunityMetrics>({
    totalOpportunities: 0,
    retainedOpportunities: 0,
    retentionRate: 0,
    avgOpportunityValue: 0,
    byServiceType: []
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    calculateMetrics();
  }, [leads, opportunities, caseOfficers, timeRange, selectedBranch]);

  const calculateMetrics = () => {
    setLoading(true);
    
    // Calculate dashboard stats
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const totalOpportunities = opportunities.length;
    const totalRevenue = opportunities.reduce((sum, o) => sum + (o.estimatedValue || 0), 0);
    
    // Calculate case officer utilization
    const totalCapacity = caseOfficers.reduce((sum, co) => sum + co.maxCases, 0);
    const currentLoad = caseOfficers.reduce((sum, co) => sum + co.currentCases, 0);
    const utilization = totalCapacity > 0 ? (currentLoad / totalCapacity) * 100 : 0;

    setStats({
      totalLeads,
      convertedLeads,
      totalOpportunities,
      activeWorkflows: 0, // Will be calculated below
      completedWorkflows: 0, // Will be calculated below
      totalRevenue,
      avgConversionTime: 0, // Will be calculated below
      caseOfficerUtilization: utilization
    });

    // Calculate lead metrics
    const newLeads = leads.filter(l => {
      const createdDate = new Date(l.created);
      const daysAgo = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;

    const qualifiedLeads = leads.filter(l => l.priority === 'high' || l.priority === 'medium').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    // Group by source
    const sourceGroups = leads.reduce((acc, lead) => {
      const source = lead.market_source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSources = Object.entries(sourceGroups)
      .map(([source, count]) => ({ source, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setLeadMetrics({
      newLeads,
      qualifiedLeads,
      conversionRate,
      avgLeadValue: totalLeads > 0 ? totalRevenue / totalLeads : 0,
      topSources
    });

    // Calculate opportunity metrics
    const retainedOpportunities = opportunities.filter(o => o.status === 'retained').length;
    const retentionRate = totalOpportunities > 0 ? (retainedOpportunities / totalOpportunities) * 100 : 0;
    
    // Group by service type
    const serviceGroups = opportunities.reduce((acc, opp) => {
      const service = opp.serviceRequired || 'Unknown';
      if (!acc[service]) {
        acc[service] = { count: 0, value: 0 };
      }
      acc[service].count++;
      acc[service].value += opp.estimatedValue || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    const byServiceType = Object.entries(serviceGroups)
      .map(([type, data]: any) => ({ type, count: Number(data.count), value: Number(data.value) }))
      .sort((a: any, b: any) => b.value - a.value);

    setOpportunityMetrics({
      totalOpportunities,
      retainedOpportunities,
      retentionRate,
      avgOpportunityValue: totalOpportunities > 0 ? totalRevenue / totalOpportunities : 0,
      byServiceType
    });

    // Calculate workflow metrics (mock data for now)
    setWorkflowMetrics({
      activeWorkflows: 45,
      completedWorkflows: 128,
      overdueStages: 8,
      avgProgress: 67.5,
      completionRate: 74.0
    });

    setLoading(false);
  };

  const getTrendIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (value < threshold) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const getTrendColor = (value: number, threshold: number = 0) => {
    if (value > threshold) return 'text-green-600';
    if (value < threshold) return 'text-red-600';
    return 'text-gray-500';
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
            <h2 className="text-2xl font-bold text-gray-900">Unified Workflow Dashboard</h2>
            <p className="text-gray-600 mt-1">Complete overview of leads, opportunities, and operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <SearchableSelect
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </SearchableSelect>
            <SearchableSelect
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              <option value="1">Delhi</option>
              <option value="2">Mumbai</option>
              <option value="3">Bangalore</option>
            </SearchableSelect>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(leadMetrics.newLeads, 50)}
                <span className={`text-sm ${getTrendColor(leadMetrics.newLeads, 50)} ml-1`}>
                  {leadMetrics.newLeads} new this month
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{leadMetrics.conversionRate.toFixed(1)}%</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(leadMetrics.conversionRate, 25)}
                <span className={`text-sm ${getTrendColor(leadMetrics.conversionRate, 25)} ml-1`}>
                  {leadMetrics.conversionRate > 25 ? 'Above target' : 'Below target'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOpportunities}</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(opportunityMetrics.retainedOpportunities, 20)}
                <span className={`text-sm ${getTrendColor(opportunityMetrics.retainedOpportunities, 20)} ml-1`}>
                  {opportunityMetrics.retainedOpportunities} retained
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Case Officer Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{stats.caseOfficerUtilization.toFixed(1)}%</p>
              <div className="flex items-center mt-2">
                {getTrendIcon(stats.caseOfficerUtilization, 80)}
                <span className={`text-sm ${getTrendColor(stats.caseOfficerUtilization, 80)} ml-1`}>
                  {stats.caseOfficerUtilization > 80 ? 'High utilization' : 'Optimal'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Workflows</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{workflowMetrics.activeWorkflows}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(workflowMetrics.activeWorkflows / (workflowMetrics.activeWorkflows + workflowMetrics.completedWorkflows)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{workflowMetrics.completedWorkflows}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(workflowMetrics.completedWorkflows / (workflowMetrics.activeWorkflows + workflowMetrics.completedWorkflows)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Progress</span>
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{workflowMetrics.avgProgress.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${workflowMetrics.avgProgress}%` }}></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overdue Stages</span>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{workflowMetrics.overdueStages}</p>
              <div className="text-xs text-red-600 mt-2">Requires attention</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-lg font-bold text-gray-900">{currencyCode} {(stats.totalRevenue / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Opportunity Value</span>
              <span className="text-lg font-bold text-gray-900">{currencyCode} {opportunityMetrics.avgOpportunityValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Retention Rate</span>
              <span className="text-lg font-bold text-gray-900">{opportunityMetrics.retentionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Lead Value</span>
              <span className="text-lg font-bold text-gray-900">{currencyCode} {leadMetrics.avgLeadValue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Lead Sources</h3>
          <div className="space-y-3">
            {leadMetrics.topSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">{source.source}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">{source.count} leads</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(source.count / leadMetrics.newLeads) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Types</h3>
          <div className="space-y-3">
            {opportunityMetrics.byServiceType.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">{service.type}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">{service.count} opportunities</span>
                  <span className="text-sm font-medium text-gray-900">{currencyCode} {(service.value / 1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Users className="w-4 h-4 mr-2" />
            View All Leads
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-[var(--dmc-gold)] text-[var(--dmc-green-dark)] rounded-lg hover:brightness-95">
            <Target className="w-4 h-4 mr-2" />
            Manage Opportunities
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)]">
            <Briefcase className="w-4 h-4 mr-2" />
            Operations Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

