'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrmcForumLeads } from '@/models';
import {
  Search, Plus, Edit, Trash2, Download, Upload, CheckCircle, XCircle, Clock, AlertCircle, FileText, Send, Eye, User, Calendar, DollarSign, FileSignature, Shield, X, ChevronRight, ChevronLeft, Save, Mail, Phone, MapPin, Globe, Target, TrendingUp, Users, Briefcase, Flag, MessageSquare
} from 'lucide-react';

interface OpportunityFormData {
  leadId: number;
  opportunityName: string;
  opportunityType: string;
  source: string;
  stage: string;
  probability: number;
  expectedRevenue: string;
  expectedCloseDate: string;
  description: string;
  assignedTo: number;
  priority: string;
  tags: string;
  followUpDate: string;
  nextAction: string;
  notes: string;
}

interface Opportunity {
  id: number;
  leadId: number;
  name: string;
  stage: string;
  probability: number;
  expectedRevenue: number;
  closeDate: Date;
  created: Date;
}

interface LeadOpportunityWizardProps {
  leadId: number;
  onOpportunityCreated: (opportunityId: number) => void;
}

export default function LeadOpportunityWizard({ leadId, onOpportunityCreated }: LeadOpportunityWizardProps) {
  const [activeSection, setActiveSection] = useState('details');
  const [opportunityData, setOpportunityData] = useState<OpportunityFormData>({
    leadId: leadId,
    opportunityName: '',
    opportunityType: 'new_business',
    source: 'website',
    stage: 'prospecting',
    probability: 10,
    expectedRevenue: '',
    expectedCloseDate: '',
    description: '',
    assignedTo: 1,
    priority: 'medium',
    tags: '',
    followUpDate: '',
    nextAction: '',
    notes: '',
  });

  const [leads, setLeads] = useState<CrmcForumLeads[]>([]);
  const [lead, setLead] = useState<CrmcForumLeads | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingOpportunities, setExistingOpportunities] = useState<Opportunity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdOpportunityId, setCreatedOpportunityId] = useState<number | null>(null);

  useEffect(() => {
    // Load lead data
        setLead(null);

    // Load existing opportunities for this lead
    const databaseOpportunities: Opportunity[] = []
    setExistingOpportunities([]);
    setLoading(false);
  }, [leadId]);

  const handleNext = () => {
    const sections = ['details', 'sales', 'followup'];
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const sections = ['details', 'sales', 'followup'];
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setOpportunityData(prev => ({ ...prev, [field]: value }));
  };

  const createOpportunity = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newOpportunity: Opportunity = {
        id: existingOpportunities.length + 1,
        leadId: leadId,
        name: opportunityData.opportunityName,
        stage: opportunityData.stage,
        probability: opportunityData.probability,
        expectedRevenue: parseFloat(opportunityData.expectedRevenue) || 0,
        closeDate: new Date(opportunityData.expectedCloseDate),
        created: new Date(),
      };

      setExistingOpportunities(prev => [...prev, newOpportunity]);
      setCreatedOpportunityId(newOpportunity.id);
      setSubmitted(true);
      onOpportunityCreated(newOpportunity.id);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      window.toast.error('Failed to create opportunity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'details':
        return (
          <motion.div
            key="details"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="mr-2" size={20} />
                Opportunity Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Opportunity Name *</label>
                  <input
                    type="text"
                    value={opportunityData.opportunityName}
                    onChange={(e) => handleInputChange('opportunityName', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter opportunity name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Opportunity Type *</label>
                  <SearchableSelect
                    value={opportunityData.opportunityType}
                    onChange={(e) => handleInputChange('opportunityType', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new_business">New Business</option>
                    <option value="existing_business">Existing Business</option>
                    <option value="referral">Referral</option>
                    <option value="partner">Partner</option>
                  </SearchableSelect>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Source</label>
                  <SearchableSelect
                    value={opportunityData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social_media">Social Media</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority *</label>
                  <SearchableSelect
                    value={opportunityData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </SearchableSelect>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={opportunityData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the opportunity..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={opportunityData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="immigration, express-entry, high-priority"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated tags</p>
              </div>
            </div>
          </motion.div>
        );

      case 'sales':
        return (
          <motion.div
            key="sales"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="mr-2" size={20} />
                Sales Stage & Probability
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sales Stage *</label>
                  <SearchableSelect
                    value={opportunityData.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="prospecting">Prospecting</option>
                    <option value="qualification">Qualification</option>
                    <option value="needs_analysis">Needs Analysis</option>
                    <option value="value_proposition">Value Proposition</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </SearchableSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Probability (%) *</label>
                  <input
                    type="number"
                    value={opportunityData.probability}
                    onChange={(e) => handleInputChange('probability', parseInt(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Chance of winning this opportunity</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expected Revenue ($) *</label>
                  <input
                    type="number"
                    value={opportunityData.expectedRevenue}
                    onChange={(e) => handleInputChange('expectedRevenue', e.target.value)}
                    min="0"
                    step="100"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expected Close Date *</label>
                  <input
                    type="date"
                    value={opportunityData.expectedCloseDate}
                    onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Assigned To *</label>
                <SearchableSelect
                  value={opportunityData.assignedTo}
                  onChange={(e) => handleInputChange('assignedTo', parseInt(e.target.value))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select assignee</option>
                  <option value="1">John Smith</option>
                  <option value="3">Mike Johnson</option>
                  <option value="4">Sarah Wilson</option>
                </SearchableSelect>
              </div>
            </div>
          </motion.div>
        );

      case 'followup':
        return (
          <motion.div
            key="followup"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MessageSquare className="mr-2" size={20} />
                Follow-up & Actions
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Follow-up Date</label>
                  <input
                    type="date"
                    value={opportunityData.followUpDate}
                    onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Next Action</label>
                  <SearchableSelect
                    value={opportunityData.nextAction}
                    onChange={(e) => handleInputChange('nextAction', e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select next action</option>
                    <option value="call">Phone Call</option>
                    <option value="email">Send Email</option>
                    <option value="meeting">Schedule Meeting</option>
                    <option value="proposal">Send Proposal</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="close">Close Deal</option>
                  </SearchableSelect>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={opportunityData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional notes about this opportunity..."
                />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Opportunity Created!</h3>
            <p className="text-sm text-gray-500">The opportunity has been successfully created.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Opportunity</h2>
            <button
              onClick={() => {/* Handle close */ }}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveSection('details')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === 'details'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveSection('sales')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === 'sales'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Sales
            </button>
            <button
              onClick={() => setActiveSection('followup')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === 'followup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Follow-up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {renderSection()}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={() => {/* Handle cancel */ }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {/* Handle submit */ }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Opportunity
          </button>
        </div>
      </div>
    </div>
  );
} 



