'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, Plus, Edit, Trash2, Download, Upload, CheckCircle, XCircle, Clock, AlertCircle, 
  FileText, Send, Eye, User, Calendar, DollarSign, FileSignature, Shield, X, ChevronRight, 
  ChevronLeft, Save, Mail, Phone, MapPin, Globe, Target, TrendingUp, Users, Briefcase, 
  Flag, MessageSquare, FileCheck, Receipt, FolderOpen, PenTool 
} from 'lucide-react';

interface LeadData {
  id: number;
  fname: string;
  mname: string;
  lname: string;
  email: string;
  phone: string;
  mobile: string;
  nationality: string;
  address: string;
  gender: string;
  id_number: string;
  id_expiry: Date;
  id_issue_date: Date;
  country_interest: string;
  sub_country_interest: number;
  service_interest: string;
  market_source: string;
  sub_market_source: number;
  status: string;
  assigned_to: string;
  created: Date;
  updated: Date;
}

interface PathWizardProps {
  leadId: number;
}

interface PathStage {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'current' | 'incomplete' | 'active' | 'completed';
  component?: React.ComponentType<any>;
}

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

export default function PathWizard({ leadId }: PathWizardProps) {
  const [activeStage, setActiveStage] = useState('prospect');
  const [lead, setLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(true);

  const pathStages: PathStage[] = [
    { id: 'prospect', name: 'Prospect', icon: Target, status: 'current' },
    { id: 'quotation', name: 'Quotation', icon: FileText, status: 'incomplete' },
    { id: 'payment', name: 'Payment', icon: DollarSign, status: 'incomplete' },
    { id: 'documents', name: 'Documents', icon: FolderOpen, status: 'incomplete' },
    { id: 'agreement', name: 'Agreement Generation', icon: PenTool, status: 'incomplete' },
    { id: 'signed-upload', name: 'Signed Agreement Upload', icon: FileSignature, status: 'incomplete' },
    { id: 'retained', name: 'Retained', icon: Shield, status: 'incomplete' },
    { id: 'retention-rejected', name: 'Retention Rejected', icon: XCircle, status: 'incomplete' },
    { id: 'closed', name: 'Closed', icon: CheckCircle, status: 'incomplete' }
  ];

  useEffect(() => {
    // Load lead data
        setLead(null);
    setLoading(false);
  }, [leadId]);

  const handleStageClick = (stageId: string) => {
    setActiveStage(stageId);
  };

  const getStageStatus = (stageId: string) => {
    const currentIndex = pathStages.findIndex(s => s.id === activeStage);
    const stageIndex = pathStages.findIndex(s => s.id === stageId);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'incomplete';
  };

  const renderStageContent = () => {
    switch (activeStage) {
      case 'prospect':
        return <ProspectStage lead={lead} />;
      case 'quotation':
        return <QuotationStage lead={lead} />;
      case 'payment':
        return <PaymentStage lead={lead} />;
      case 'documents':
        return <DocumentsStage lead={lead} />;
      case 'agreement':
        return <AgreementStage lead={lead} />;
      case 'signed-upload':
        return <SignedUploadStage lead={lead} />;
      case 'retained':
        return <RetainedStage lead={lead} />;
      case 'retention-rejected':
        return <RetentionRejectedStage lead={lead} />;
      case 'closed':
        return <ClosedStage lead={lead} />;
      default:
        return <div>Select a stage</div>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header with Lead Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Lead Management Path</h2>
            <button
              onClick={() => window.close()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          
          {lead && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="mr-2" size={16} />
                <span className="font-medium">{lead.fname} {lead.lname}</span>
                <span className="ml-4 text-sm text-gray-600">ID: #{lead.id}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <Mail className="mr-2" size={14} />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2" size={14} />
                  <span>{lead.phone}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="mr-2" size={14} />
                  <span>{lead.nationality}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="mr-2" size={14} />
                  <span>{lead.service_interest}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Path Navigation */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between overflow-x-auto">
            {pathStages.map((stage, index) => {
              const status = getStageStatus(stage.id);
              const Icon = stage.icon;
              
              return (
                <div key={stage.id} className="flex items-center">
                  <button
                    onClick={() => handleStageClick(stage.id)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      status === 'current' 
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' 
                        : status === 'completed'
                        ? 'bg-green-100 text-green-600 border-2 border-green-600'
                        : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                      status === 'current' 
                        ? 'bg-blue-600 text-white' 
                        : status === 'completed'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-400 text-white'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-center max-w-[100px]">
                      {stage.name}
                    </span>
                  </button>
                  
                  {index < pathStages.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${
                      status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              transition={{ duration: 0.3 }}
            >
              {renderStageContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Stage Components
function ProspectStage({ lead }: { lead: LeadData | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Target className="mr-3 text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Prospect Stage</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Lead Information</h4>
          {lead && (
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {lead.fname} {lead.lname}</p>
              <p><strong>Email:</strong> {lead.email}</p>
              <p><strong>Phone:</strong> {lead.phone}</p>
              <p><strong>Service:</strong> {lead.service_interest}</p>
            </div>
          )}
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Prospecting Actions</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={16} />
              Initial contact made
            </li>
            <li className="flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={16} />
              Requirements gathered
            </li>
            <li className="flex items-center">
              <Clock className="mr-2 text-yellow-600" size={16} />
              Follow-up scheduled
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Next Steps</h4>
        <div className="space-y-3">
          <button className="w-full text-left p-3 bg-white rounded-lg border hover:border-blue-500 transition-colors">
            <div className="flex items-center justify-between">
              <span>Generate Quotation</span>
              <ChevronRight size={16} />
            </div>
          </button>
          <button className="w-full text-left p-3 bg-white rounded-lg border hover:border-blue-500 transition-colors">
            <div className="flex items-center justify-between">
              <span>Schedule Consultation</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function QuotationStage({ lead }: { lead: LeadData | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <FileText className="mr-3 text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Quotation Stage</h3>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Quotation Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Quotation Number</label>
            <input type="text" className="w-full p-2 border rounded" placeholder="AUTO-2024-001" />
          </div>
          <div>
            <label className="block font-medium mb-1">Amount</label>
            <input type="number" className="w-full p-2 border rounded" placeholder="5000" />
          </div>
          <div>
            <label className="block font-medium mb-1">Currency</label>
            <SearchableSelect className="w-full p-2 border rounded">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </SearchableSelect>
          </div>
          <div>
            <label className="block font-medium mb-1">Valid Until</label>
            <input type="date" className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Services Included</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Document Preparation</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Application Filing</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span>Legal Consultation</span>
          </label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
          Save Draft
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Generate PDF
        </button>
      </div>
    </div>
  );
}

function PaymentStage({ lead }: { lead: LeadData | null }) {
  const { currencyCode } = useAuth();
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <DollarSign className="mr-3 text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Payment Stage</h3>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Payment Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Payment Method</label>
            <SearchableSelect className="w-full p-2 border rounded">
              <option>Credit Card</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Check</option>
            </SearchableSelect>
          </div>
          <div>
            <label className="block font-medium mb-1">Amount Paid</label>
            <input type="number" className="w-full p-2 border rounded" placeholder="2500" />
          </div>
          <div>
            <label className="block font-medium mb-1">Payment Date</label>
            <input type="date" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Transaction ID</label>
            <input type="text" className="w-full p-2 border rounded" placeholder="TXN-123456" />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Payment Schedule</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between p-2 bg-white rounded">
            <span>Initial Payment</span>
            <span className="font-medium">{currencyCode} 2,500</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span>Second Installment</span>
            <span className="font-medium">{currencyCode} 2,500</span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded">
            <span>Final Payment</span>
            <span className="font-medium">{currencyCode} 0</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Process Payment
        </button>
      </div>
    </div>
  );
}

function DocumentsStage({ lead }: { lead: LeadData | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <FolderOpen className="mr-3 text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Documents Stage</h3>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Required Documents</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div className="flex items-center">
              <FileText className="mr-3 text-gray-400" size={20} />
              <div>
                <p className="font-medium">Passport Copy</p>
                <p className="text-sm text-gray-600">Required for identity verification</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <button className="text-blue-600 hover:text-blue-800">View</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div className="flex items-center">
              <FileText className="mr-3 text-gray-400" size={20} />
              <div>
                <p className="font-medium">Birth Certificate</p>
                <p className="text-sm text-gray-600">Required for age verification</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="text-yellow-600" size={20} />
              <button className="text-blue-600 hover:text-blue-800">Upload</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div className="flex items-center">
              <FileText className="mr-3 text-gray-400" size={20} />
              <div>
                <p className="font-medium">Educational Certificates</p>
                <p className="text-sm text-gray-600">Required for qualification assessment</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="text-red-600" size={20} />
              <button className="text-blue-600 hover:text-blue-800">Upload</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 mb-2">Drop files here or click to upload</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Select Files
        </button>
      </div>
    </div>
  );
}

function AgreementStage({ lead }: { lead: LeadData | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <PenTool className="mr-3 text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Agreement Generation Stage</h3>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Agreement Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Agreement Type</label>
            <SearchableSelect className="w-full p-2 border rounded">
              <option>Service Agreement</option>
              <option>Retainer Agreement</option>
              <option>Consultation Agreement</option>
            </SearchableSelect>
          </div>
          <div>
            <label className="block font-medium mb-1">Duration (months)</label>
            <input type="number" className="w-full p-2 border rounded" placeholder="12" />
          </div>
          <div>
            <label className="block font-medium mb-1">Start Date</label>
            <input type="date" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">End Date</label>
            <input type="date" className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Terms and Conditions</h4>
        <textarea 
          className="w-full p-3 border rounded-lg" 
          rows={6}
          placeholder="Enter the terms and conditions of the agreement..."
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
          Preview
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Generate Agreement
        </button>
      </div>
    </div>
  );
}

function SignedUploadStage({ lead }: { lead: LeadData | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <FileSignature className="mr-3 text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Signed Agreement Upload Stage</h3>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Client Signature Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Client Name</label>
            <input type="text" className="w-full p-2 border rounded" placeholder="Client signature" />
          </div>
          <div>
            <label className="block font-medium mb-1">Signature Date</label>
            <input type="date" className="w-full p-2 border rounded" />
          </div>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileSignature className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 mb-2">Upload signed agreement document</p>
        <p className="text-sm text-gray-500 mb-4">PDF, JPG, PNG (Max 10MB)</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Choose File
        </button>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="mr-2 text-yellow-600" size={20} />
          <span className="text-sm">Once uploaded, the signed agreement will be automatically sent to the compliance team for review.</span>
        </div>
      </div>
    </div>
  );
}

function RetainedStage({ lead }: { lead: LeadData | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Shield className="mr-3 text-blue-600" size={24} />
        <h3 className="text-xl font-semibold">Retained Stage</h3>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Compliance Review</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Agreement Review</span>
            <span className="text-yellow-600">In Progress</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Document Verification</span>
            <span className="text-green-600">Completed</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Background Check</span>
            <span className="text-gray-400">Pending</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Compliance Manager</h4>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            MJ
          </div>
          <div>
            <p className="font-medium">Michael Johnson</p>
            <p className="text-sm text-gray-600">Senior Compliance Officer</p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Review Notes</h4>
        <textarea 
          className="w-full p-3 border rounded-lg" 
          rows={4}
          placeholder="Add compliance review notes..."
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Reject
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Approve
        </button>
      </div>
    </div>
  );
}

function RetentionRejectedStage({ lead }: { lead: LeadData | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <XCircle className="mr-3 text-red-600" size={24} />
        <h3 className="text-xl font-semibold">Retention Rejected Stage</h3>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Rejection Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <XCircle className="mr-2 text-red-600" size={16} />
            <span>Rejection Date: January 15, 2024</span>
          </div>
          <div className="flex items-center">
            <XCircle className="mr-2 text-red-600" size={16} />
            <span>Rejected By: Michael Johnson (Compliance Manager)</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Rejection Reason</h4>
        <div className="p-3 bg-white rounded-lg border-l-4 border-red-600">
          <p className="text-sm">The submitted documents do not meet the required standards. Please provide updated documentation with proper verification and complete all required fields in the application form.</p>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Required Actions</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <AlertCircle className="mr-2 text-yellow-600" size={16} />
            Upload updated passport copy
          </li>
          <li className="flex items-center">
            <AlertCircle className="mr-2 text-yellow-600" size={16} />
            Provide missing educational certificates
          </li>
          <li className="flex items-center">
            <AlertCircle className="mr-2 text-yellow-600" size={16} />
            Complete application form sections 3 and 4
          </li>
        </ul>
      </div>
      
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Resubmit for Review
        </button>
      </div>
    </div>
  );
}

function ClosedStage({ lead }: { lead: LeadData | null }) {
  const { currencyCode } = useAuth();
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <CheckCircle className="mr-3 text-green-600" size={24} />
        <h3 className="text-xl font-semibold">Closed Stage</h3>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Lead Successfully Converted</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <CheckCircle className="mr-2 text-green-600" size={16} />
            <span>Final Approval: January 20, 2024</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="mr-2 text-green-600" size={16} />
            <span>Status: Won</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="mr-2 text-green-600" size={16} />
            <span>Total Revenue: {currencyCode} 5,000</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Process Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Prospect → Quotation</span>
            <span className="text-green-600">✓ Completed</span>
          </div>
          <div className="flex justify-between">
            <span>Quotation → Payment</span>
            <span className="text-green-600">✓ Completed</span>
          </div>
          <div className="flex justify-between">
            <span>Payment → Documents</span>
            <span className="text-green-600">✓ Completed</span>
          </div>
          <div className="flex justify-between">
            <span>Documents → Agreement</span>
            <span className="text-green-600">✓ Completed</span>
          </div>
          <div className="flex justify-between">
            <span>Agreement → Retained</span>
            <span className="text-green-600">✓ Completed</span>
          </div>
          <div className="flex justify-between">
            <span>Retained → Closed</span>
            <span className="text-green-600">✓ Completed</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Next Steps</h4>
        <div className="space-y-2 text-sm">
          <p>• Schedule onboarding session with client</p>
          <p>• Begin service delivery</p>
          <p>• Set up payment reminders for remaining installments</p>
          <p>• Add client to CRM for ongoing management</p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
          Generate Report
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          View in CRM
        </button>
      </div>
    </div>
  );
}


