'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import {
  Mail, Plus, Edit, Trash2, Eye, Send, Search,
  FileText, Users, BarChart3, CheckCircle,
  TrendingUp, Copy, RefreshCw, X, Pause, MoreVertical, Star
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  status: string;
  metadata: {
    createdAt: string;
    usageCount: number;
    lastUsed?: string;
  };
  tags: string[];
}

interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  templateName: string;
  status: string;
  recipients: any[];
  scheduledFor?: string;
  sentAt?: string;
  performance: {
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    openRate: number;
    clickRate: number;
  };
}

interface EmailRecipient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  status: string;
  tags: string[];
  metadata: {
    totalEmails: number;
    openedCount: number;
    clickedCount: number;
  };
}

export default function EmailTemplateManager() {
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'recipients' | 'analytics'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const { sorted: sortedCampaigns, sortKey: campaignSortKey, sortDirection: campaignSortDirection, toggleSort: toggleCampaignSort } = useSortableData(
    campaigns,
    {
      campaign: (c) => c.name,
      template: (c) => c.templateName,
      status: (c) => c.status,
      recipients: (c) => c.performance.totalRecipients,
      performance: (c) => c.performance.openRate,
      sent: (c) => c.sentAt,
    },
  );
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [templateForm, setTemplateForm] = useState({ id: '', name: '', subject: '', htmlContent: '', status: 'active' });

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/email-templates');
      const json = await res.json();
      if (json.success) setTemplates(json.templates);
    } catch (error) {
      console.error('Error loading email templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    setCampaigns([]);
    setRecipients([]);
  }, []);

  const openNewTemplateModal = () => {
    setTemplateForm({ id: '', name: '', subject: '', htmlContent: '', status: 'active' });
    setShowTemplateModal(true);
  };

  const openEditTemplateModal = (template: EmailTemplate) => {
    setTemplateForm({ id: template.id, name: template.name, subject: template.subject, htmlContent: (template as any).htmlContent || '', status: template.status });
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      if (templateForm.id) {
        const res = await fetch('/api/email-templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: templateForm.id, data: templateForm }),
        });
        if (!res.ok) throw new Error('Failed to update template');
      } else {
        const res = await fetch('/api/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create_template', data: templateForm }),
        });
        if (!res.ok) throw new Error('Failed to create template');
      }
      setShowTemplateModal(false);
      loadTemplates();
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    await fetch(`/api/email-templates?id=${templateId}`, { method: 'DELETE' });
    loadTemplates();
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    await fetch('/api/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_template',
        data: { name: `${template.name} (Copy)`, subject: template.subject, htmlContent: (template as any).htmlContent || '', status: 'inactive' },
      }),
    });
    loadTemplates();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'sending': return 'text-yellow-600 bg-yellow-100';
      case 'scheduled': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'marketing': return 'text-blue-600 bg-blue-100';
      case 'transactional': return 'text-green-600 bg-green-100';
      case 'notification': return 'text-yellow-600 bg-yellow-100';
      case 'newsletter': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || template.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const statistics = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.status === 'active').length,
    totalCampaigns: campaigns.length,
    sentCampaigns: campaigns.filter(c => c.status === 'sent').length,
    totalRecipients: recipients.length,
    activeRecipients: recipients.filter(r => r.status === 'active').length,
    totalEmailsSent: campaigns.reduce((sum, c) => sum + c.performance.sentCount, 0),
    averageOpenRate: campaigns.length > 0 ? 
      campaigns.reduce((sum, c) => sum + c.performance.openRate, 0) / campaigns.length : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Template System</h2>
            <p className="text-gray-600 mt-1">Create, manage, and send email templates to bulk users</p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={loadTemplates} className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={openNewTemplateModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalTemplates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.activeTemplates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Send className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalCampaigns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalRecipients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </div>
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaigns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Send className="w-4 h-4 mr-2" />
                Campaigns
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recipients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Recipients
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </div>
            </button>
          </nav>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <SearchableSelect
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="marketing">Marketing</option>
                  <option value="transactional">Transactional</option>
                  <option value="notification">Notification</option>
                  <option value="newsletter">Newsletter</option>
                </SearchableSelect>
                
                <SearchableSelect
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                </SearchableSelect>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(template.category)}`}>
                          {template.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(template.status)}`}>
                          {template.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Subject:</strong> {template.subject}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openEditTemplateModal(template)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditTemplateModal(template)} className="text-gray-600 hover:text-gray-800">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span>Created: {new Date(template.metadata.createdAt).toLocaleDateString()}</span>
                      <span>Used: {template.metadata.usageCount} times</span>
                    </div>
                    {template.metadata.lastUsed && (
                      <div className="mt-1">
                        <span>Last used: {new Date(template.metadata.lastUsed).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.tags.map((tag, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableTh label="Campaign" sortKey="campaign" activeKey={campaignSortKey} direction={campaignSortDirection} onSort={toggleCampaignSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Template" sortKey="template" activeKey={campaignSortKey} direction={campaignSortDirection} onSort={toggleCampaignSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Status" sortKey="status" activeKey={campaignSortKey} direction={campaignSortDirection} onSort={toggleCampaignSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Recipients" sortKey="recipients" activeKey={campaignSortKey} direction={campaignSortDirection} onSort={toggleCampaignSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Performance" sortKey="performance" activeKey={campaignSortKey} direction={campaignSortDirection} onSort={toggleCampaignSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <SortableTh label="Sent" sortKey="sent" activeKey={campaignSortKey} direction={campaignSortDirection} onSort={toggleCampaignSort} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" />
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.templateName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.performance.totalRecipients.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Open: {campaign.performance.openRate.toFixed(1)}%</div>
                          <div>Click: {campaign.performance.clickRate.toFixed(1)}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </button>
                          {campaign.status === 'draft' && (
                            <button className="text-green-600 hover:text-green-800">
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {campaign.status === 'sending' && (
                            <button className="text-yellow-600 hover:text-yellow-800">
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-800">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recipients Tab */}
        {activeTab === 'recipients' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search recipients..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {recipients.length === 0 && (
              <p className="text-sm text-gray-400">No recipient lists yet.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{recipient.fullName}</h3>
                      <p className="text-sm text-gray-600 mb-1">{recipient.email}</p>
                      {recipient.company && (
                        <p className="text-sm text-gray-500 mb-2">{recipient.company}</p>
                      )}
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(recipient.status)}`}>
                          {recipient.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
                    <div className="flex justify-between mb-2">
                      <span>Total Emails: {recipient.metadata.totalEmails}</span>
                      <span>Opened: {recipient.metadata.openedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clicked: {recipient.metadata.clickedCount}</span>
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {recipient.tags.map((tag, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Emails Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.totalEmailsSent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.averageOpenRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Sent Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.sentCampaigns}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Users className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Recipients</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.activeRecipients}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-medium text-gray-900">{campaign.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Recipients:</span>
                        <span className="font-medium text-gray-900 ml-1">{campaign.performance.totalRecipients}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sent:</span>
                        <span className="font-medium text-gray-900 ml-1">{campaign.performance.sentCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Opened:</span>
                        <span className="font-medium text-green-600 ml-1">{campaign.performance.openedCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Clicked:</span>
                        <span className="font-medium text-blue-600 ml-1">{campaign.performance.clickedCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{templateForm.id ? 'Edit Template' : 'New Template'}</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={templateForm.name} onChange={(e) => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Template name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" value={templateForm.subject} onChange={(e) => setTemplateForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Email subject" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={templateForm.htmlContent} onChange={(e) => setTemplateForm(f => ({ ...f, htmlContent: e.target.value }))}
                  rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="Email body / HTML" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <SearchableSelect value={templateForm.status} onChange={(e) => setTemplateForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </SearchableSelect>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveTemplate} disabled={loading || !templateForm.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
