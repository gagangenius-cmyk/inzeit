'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CrmcForumLeads } from '@/models';
import {
  Search, Plus, Edit, Trash2, Download, Upload, CheckCircle, XCircle, Clock, AlertCircle,
  FileText, Send, Eye, User, Calendar, DollarSign, FileSignature, Shield, X, ChevronRight,
  ChevronLeft, Save, Mail, Phone, MapPin, Globe, Target, TrendingUp, Users, Briefcase,
  Flag, MessageSquare, ArrowRight, Check, Info, Building, Award, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ConversionData {
  leadId: number;
  opportunityName: string;
  opportunityType: string;
  estimatedValue: string;
  probability: number;
  expectedCloseDate: string;
  description: string;
  assignedTo: string;
  priority: string;
  nextSteps: string;
  notes: string;
}

interface OpportunityConversionWizardProps {
  leadId: number;
}

function OpportunityConversionWizard({ leadId }: OpportunityConversionWizardProps) {
  const { currencyCode } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [conversionData, setConversionData] = useState<ConversionData>({
    leadId: leadId,
    opportunityName: '',
    opportunityType: 'new_business',
    estimatedValue: '',
    probability: 50,
    expectedCloseDate: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    nextSteps: '',
    notes: '',
  });

  const [leads, setLeads] = useState<CrmcForumLeads[]>([]);
  const [lead, setLead] = useState<CrmcForumLeads | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load lead data
        setLead(null);
    setLoading(false);
  }, [leadId]);

  const handleInputChange = (field: string, value: any) => {
    setConversionData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitted(true);
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Target className="w-8 h-8 text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Opportunity Details</h2>
              <p className="text-gray-600 mb-8">Enter the basic information about this opportunity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Target className="mr-2 text-blue-600" size={20} />
                  Basic Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity Name *</label>
                    <input
                      type="text"
                      value={conversionData.opportunityName}
                      onChange={(e) => handleInputChange('opportunityName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter opportunity name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity Type *</label>
                    <SearchableSelect
                      value={conversionData.opportunityType}
                      onChange={(e) => handleInputChange('opportunityType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="new_business">New Business</option>
                      <option value="existing_business">Existing Business</option>
                      <option value="referral">Referral</option>
                      <option value="partner">Partner</option>
                    </SearchableSelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Value *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">{currencyCode}</span>
                      </div>
                      <input
                        type="text"
                        value={conversionData.estimatedValue}
                        onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                    <SearchableSelect
                      value={conversionData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </SearchableSelect>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="mr-2 text-blue-600" size={20} />
                  Description
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opportunity Description</label>
                  <textarea
                    value={conversionData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the opportunity..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Value & Probability</h2>
              <p className="text-gray-600 mb-8">Assess the opportunity value and win probability</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <DollarSign className="mr-2 text-green-600" size={20} />
                  Value Assessment
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Probability of Success (%)</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={conversionData.probability}
                        onChange={(e) => handleInputChange('probability', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-2xl font-bold text-blue-600 w-12 text-center">{conversionData.probability}%</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {conversionData.probability < 30 && 'Low - Needs qualification'}
                      {conversionData.probability >= 30 && conversionData.probability < 70 && 'Medium - Good potential'}
                      {conversionData.probability >= 70 && 'High - Strong opportunity'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Close Date *</label>
                    <input
                      type="date"
                      value={conversionData.expectedCloseDate}
                      onChange={(e) => handleInputChange('expectedCloseDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="mr-2 text-green-600" size={20} />
                  Assignment
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                    <SearchableSelect
                      value={conversionData.assignedTo}
                      onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select team member</option>
                      <option value="1">John Smith</option>
                      <option value="3">Mike Johnson</option>
                      <option value="4">Sarah Wilson</option>
                    </SearchableSelect>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--cmg-blue)] rounded-full mb-4">
                <MessageSquare className="w-8 h-8 text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Next Steps</h2>
              <p className="text-gray-600 mb-8">Define the action plan and follow-up strategy</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Zap className="mr-2 text-purple-600" size={20} />
                  Action Plan
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Steps</label>
                    <textarea
                      value={conversionData.nextSteps}
                      onChange={(e) => handleInputChange('nextSteps', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="List the next action items..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Info className="mr-2 text-purple-600" size={20} />
                  Additional Notes
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes</label>
                    <textarea
                      value={conversionData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any internal notes or observations..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" size={40} />
              </div>

              <Award className="w-16 h-16 text-yellow-500 mx-auto mb-6" size={64} />

              <h2 className="text-3xl font-bold text-gray-900 mb-4">Opportunity Created Successfully!</h2>
              <p className="text-lg text-gray-600 mb-8">
                Your opportunity has been created and added to the pipeline.
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Opportunity Summary</h3>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{conversionData.opportunityName || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{conversionData.opportunityType || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">{currencyCode} {conversionData.estimatedValue || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Probability:</span>
                    <span className="font-medium">{conversionData.probability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className="font-medium capitalize">{conversionData.priority || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => window.close()}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setCurrentStep(1);
                    setConversionData({
                      leadId: leadId,
                      opportunityName: '',
                      opportunityType: 'new_business',
                      estimatedValue: '',
                      probability: 50,
                      expectedCloseDate: '',
                      description: '',
                      assignedTo: '',
                      priority: 'medium',
                      nextSteps: '',
                      notes: '',
                    });
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="mr-2" size={20} />
                  Create New Opportunity
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Opportunity Created!</h2>
            <p className="text-gray-600 mb-6">
              The opportunity has been successfully created and added to your pipeline.
            </p>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center text-blue-800">
                <Building className="w-5 h-5 mr-2" />
                <span className="font-medium">Opportunity ID: #OPP-{Math.floor(Math.random() * 10000)}</span>
              </div>
            </div>

            <button
              onClick={() => window.close()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" size={16} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Opportunity Conversion</h1>
                  <p className="text-sm text-gray-600">Convert lead to opportunity</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.close()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Information */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-blue-600 mr-3" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{lead?.fname} {lead?.lname}</h2>
                <p className="text-sm text-gray-600">Lead ID: #{lead?.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" size={16} />
                <span>{lead?.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" size={16} />
                <span>{lead?.phone}</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 text-gray-400 mr-2" size={16} />
                <span>{lead?.nationality}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step === currentStep
                      ? 'bg-blue-600 text-white scale-110'
                      : step < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                      }`}
                  >
                    {step < currentStep && <CheckCircle size={16} />}
                    {step === currentStep && <span className="text-sm font-bold">{step}</span>}
                    {step > currentStep && <span className="text-xs">{step}</span>}
                  </div>

                  {step < 4 && (
                    <div className={`w-8 h-0.5 ${step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-gray-600">
            {currentStep === 1 && 'Step 1: Opportunity Details'}
            {currentStep === 2 && 'Step 2: Value & Probability'}
            {currentStep === 3 && 'Step 3: Next Steps'}
            {currentStep === 4 && 'Step 4: Review & Create'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-xl">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="mr-2" size={20} />
                Previous
              </button>

              <div className="flex items-center space-x-2">
                {currentStep < 4 && (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next Step
                    <ArrowRight className="ml-2" size={16} />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={20} />
                        Create Opportunity
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunityConversionContent() {
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get('leadId');
  const leadId = Number.parseInt(leadIdParam || '', 10);

  if (!leadId) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">No lead ID provided.</p>
          <button
            onClick={() => window.location.href = '/admin/leads'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return <OpportunityConversionWizard leadId={leadId} />;
}

export default function OpportunityConversionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    }>
      <OpportunityConversionContent />
    </Suspense>
  );
}


