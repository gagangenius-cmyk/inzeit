'use client';

import { useEffect, useState } from 'react';
import { uploadOperationFiles } from '@/lib/operationsData';
import { useOperationStages, useSaveOperationStage } from '@/hooks/useOperationsQueries';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, Briefcase, FileSignature, Shield, Video, DollarSign,
  MessageCircle, BarChart, MessageSquare, ChevronRight, ChevronLeft, Save, CheckCircle, Plane, FolderCheck
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';
import { useAuth } from '@/contexts/AuthContext';

const CLIENT_DOCUMENTS_STAGE_ID = 'client-documents';
import {
  OperationStageForm,
  OperationField,
  commonPersonalFields,
  documentStatusOptions,
  statusOptions,
  conversationTypes,
  missingRequiredFields,
} from './operations-stage-form';

interface PolandVisaOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

interface OperationsStage {
  id: string;
  name: string;
  icon: any;
  status: 'pending' | 'current' | 'completed';
}

const polandStageFields: Record<string, OperationField[]> = {
  personal: [
    ...commonPersonalFields,
    { name: 'passportNumber', label: 'Passport Number' },
    { name: 'passportExpiryDate', label: 'Passport Expiry Date', type: 'date' },
    { name: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
  ],
  application: [
    { name: 'applicationType', label: 'Application Type', type: 'select', options: ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'], required: true },
    { name: 'visaType', label: 'Visa Type', required: true },
    { name: 'jobTitle', label: 'Job Title' },
    { name: 'jobDescription', label: 'Job Description', type: 'textarea', span: 'full' },
    { name: 'employerName', label: 'Employer Name', required: true },
    { name: 'contractStartDate', label: 'Contract Start Date', type: 'date' },
    { name: 'contractEndDate', label: 'Contract End Date', type: 'date' },
    { name: 'applicationDate', label: 'Application Date', type: 'date' },
    { name: 'applicationStatus', label: 'Processing Status', type: 'select', options: statusOptions, required: true },
    { name: 'applicationFile', label: 'Document File', type: 'file' },
  ],
  jol: [
    { name: 'employerName', label: 'Employer Name', required: true },
    { name: 'jobTitle', label: 'Job Title', required: true },
    { name: 'salary', label: 'Salary' },
    { name: 'workLocation', label: 'Work Location' },
    { name: 'contractDuration', label: 'Contract Duration' },
    { name: 'companyRegistrationNumber', label: 'Company Registration Number' },
    { name: 'jolApprovalStatus', label: 'JOL Approval Status', type: 'select', options: statusOptions },
    { name: 'jolDate', label: 'JOL Date', type: 'date' },
    { name: 'jolFile', label: 'JOL Upload', type: 'file' },
  ],
  loc: [
    { name: 'commitmentDetails', label: 'Commitment Details', type: 'textarea', span: 'full', required: true },
    { name: 'employmentTerms', label: 'Employment Terms', type: 'textarea', span: 'full' },
    { name: 'accommodationArrangements', label: 'Accommodation Arrangements' },
    { name: 'insuranceCoverage', label: 'Insurance Coverage' },
    { name: 'employerObligations', label: 'Employer Obligations', type: 'textarea', span: 'full' },
    { name: 'locApprovalStatus', label: 'LOC Approval Status', type: 'select', options: statusOptions },
    { name: 'locFile', label: 'LOC Upload', type: 'file' },
  ],
  workPermit: [
    { name: 'districtOffice', label: 'Starostwo / District Office' },
    { name: 'permitType', label: 'Permit Type', type: 'select', options: ['Type A', 'Type B', 'Type C', 'Type D', 'Type E'], required: true },
    { name: 'applicationDate', label: 'Application Date', type: 'date' },
    { name: 'expectedDecisionDate', label: 'Expected Decision Date', type: 'date' },
    { name: 'permitNumber', label: 'Permit Number' },
    { name: 'validFrom', label: 'Valid From', type: 'date' },
    { name: 'validTo', label: 'Valid To', type: 'date' },
    { name: 'workPermitStatus', label: 'Approval/Rejection Status', type: 'select', options: statusOptions, required: true },
    { name: 'workPermitFile', label: 'Work Permit File', type: 'file' },
  ],
  biometrics: [
    { name: 'appointmentDate', label: 'Biometrics Appointment Date', type: 'date' },
    { name: 'appointmentLocation', label: 'Appointment Location' },
    { name: 'collectionStatus', label: 'Collection Status', type: 'select', options: statusOptions },
    { name: 'medicalExamDate', label: 'Medical Examination Date', type: 'date' },
    { name: 'vaccinationStatus', label: 'Vaccination Records', type: 'select', options: documentStatusOptions },
    { name: 'healthInsuranceStatus', label: 'Health Insurance Documentation', type: 'select', options: documentStatusOptions },
    { name: 'biometricsFile', label: 'Document File', type: 'file' },
  ],
  payment: [
    { name: 'applicationFee', label: 'Application Fees', type: 'number' },
    { name: 'processingFee', label: 'Processing Fees', type: 'number' },
    { name: 'serviceCharge', label: 'Service Charges', type: 'number' },
    { name: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['Cash', 'Card', 'Bank Transfer', 'Cheque', 'Online'] },
    { name: 'paymentDate', label: 'Payment Date', type: 'date' },
    { name: 'receiptNumber', label: 'Receipt Number' },
    { name: 'outstandingAmount', label: 'Outstanding Amount', type: 'number' },
    { name: 'refundStatus', label: 'Refund Processing', type: 'select', options: statusOptions },
    { name: 'paymentFile', label: 'Payment Document', type: 'file' },
  ],
  conversation: [
    { name: 'conversationDate', label: 'Conversation Date', type: 'date', required: true, todayOnly: true },
    { name: 'conversationType', label: 'Type', type: 'select', options: conversationTypes, required: true },
    { name: 'followupDate', label: 'Follow-up Date', type: 'date' },
    { name: 'priority', label: 'Priority Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
    { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
    { name: 'conversation', label: 'Conversation Details', type: 'textarea', span: 'full', required: true },
    { name: 'followupRemarks', label: 'Follow-up Remarks', type: 'textarea', span: 'full' },
  ],
  statusUpdate: [
    { name: 'currentStage', label: 'Current Processing Stage', required: true },
    { name: 'milestone', label: 'Milestone' },
    { name: 'expectedTimeline', label: 'Expected Timeline' },
    { name: 'documentVerificationStatus', label: 'Document Verification Status', type: 'select', options: documentStatusOptions },
    { name: 'authorityFeedback', label: 'Authority Feedback', type: 'textarea', span: 'full' },
    { name: 'nextAction', label: 'Next Action Items', type: 'textarea', span: 'full' },
    { name: 'statusFile', label: 'Status Documents', type: 'file' },
  ],
  clientChat: [
    { name: 'queryType', label: 'Query Type', type: 'select', options: ['Query', 'Support Request', 'Document Clarification', 'Appointment Scheduling', 'General Assistance'] },
    { name: 'message', label: 'Client Message', type: 'textarea', span: 'full', required: true },
    { name: 'response', label: 'Response', type: 'textarea', span: 'full' },
    { name: 'responseTime', label: 'Response Time' },
    { name: 'resolutionStatus', label: 'Resolution Status', type: 'select', options: statusOptions },
  ],
};

function GenericStage({
  title,
  description,
  fields,
  data,
  isFirstStage,
  isLastStage,
  locked,
  lockedMessage,
  onDataChange,
  onSaveDraft,
  onBack,
  onContinue,
}: {
  title: string;
  description: string;
  fields: OperationField[];
  data: Record<string, any>;
  isFirstStage: boolean;
  isLastStage: boolean;
  locked?: boolean;
  lockedMessage?: string;
  onDataChange: (next: Record<string, any>) => void;
  onSaveDraft: () => Promise<void>;
  onBack: () => void;
  onContinue: () => Promise<void>;
}) {
  const [localSaving, setLocalSaving] = useState(false);
  const missingRequired = missingRequiredFields(fields, data);

  const handleSave = async () => {
    setLocalSaving(true);
    try {
      await onSaveDraft();
      window.toast.success(`${title} saved successfully!`);
    } catch (error) {
      window.toast.error('Failed to save data');
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <p className="text-indigo-800">{description}</p>
        <p className="text-sm text-[var(--cmg-blue)] mt-2">Required fields are marked from the legacy Poland visa operations requirements.</p>
      </div>

      {locked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {lockedMessage || 'You do not have permission to edit this stage.'}
        </div>
      )}

      <OperationStageForm fields={fields} data={data} color="indigo" onChange={onDataChange} locked={locked} />
      {!locked && missingRequired.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Pending required fields: {missingRequired.map((field) => field.label).join(', ')}
        </div>
      )}

      <div className="flex justify-between pt-6">
        {!isFirstStage && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center font-medium"
          >
            <ChevronLeft className="mr-2" size={20} />
            Back
          </button>
        )}
        {!locked && (
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleSave}
              disabled={localSaving}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center font-medium"
            >
              <Save className="mr-2" size={20} />
              {localSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={async () => {
                if (missingRequired.length > 0) {
                  window.toast.warning(`Complete required fields: ${missingRequired.map((field) => field.label).join(', ')}`);
                  return;
                }
                await onContinue();
              }}
              className="px-6 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] flex items-center font-medium"
            >
              {isLastStage ? (
                <>
                  <CheckCircle className="mr-2" size={20} />
                  Complete
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-2" size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PolandVisaOperationsWizard({
  opportunityId,
  leadId,
  clientName
}: PolandVisaOperationsWizardProps) {
  const { hasRole } = useAuth();
  const canEditConversation = ['operation_manager', 'admin', 'administrator', 'super_admin'].some((role) => hasRole(role));
  const [activeStage, setActiveStage] = useState('personal');

  const [stages, setStages] = useState<OperationsStage[]>([
    { id: 'personal', name: 'Personal Details', icon: User, status: 'current' },
    { id: 'application', name: 'Application Details', icon: FileText, status: 'pending' },
    { id: 'jol', name: 'Job Offer Letter', icon: Briefcase, status: 'pending' },
    { id: 'loc', name: 'Letter of Commitment', icon: FileSignature, status: 'pending' },
    { id: 'work-permit', name: 'Work Permit', icon: Shield, status: 'pending' },
    { id: 'biometrics', name: 'Biometrics', icon: Video, status: 'pending' },
    { id: 'payment', name: 'Payment Operations', icon: DollarSign, status: 'pending' },
    { id: 'conversation', name: 'Conversation', icon: MessageCircle, status: 'pending' },
    { id: 'status-update', name: 'Status Update', icon: BarChart, status: 'pending' },
    { id: 'client-chat', name: 'Client Chat', icon: MessageSquare, status: 'pending' },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck, status: 'pending' },
  ]);

  const [stageData, setStageData] = useState<Record<string, any>>({});
  const { data: savedStages } = useOperationStages('poland-visa', leadId, opportunityId);
  const saveStage = useSaveOperationStage('poland-visa', leadId, opportunityId);

  useEffect(() => {
    if (!savedStages?.data) return;
    // The save API keys rows by the raw kebab-case stage id (e.g.
    // 'work-permit'), but every read/write elsewhere in this component uses
    // the camelCase dataKey ('workPermit'). Left unconverted, loaded data
    // would sit under a key the form never reads, making previously-saved
    // answers for every hyphenated stage look blank after a reload —
    // normalize here so both sides agree on one key.
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(savedStages.data)) {
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      normalized[camelKey] = value;
    }
    setStageData((current) => ({ ...current, ...normalized }));
  }, [savedStages]);

  useEffect(() => {
    let cancelled = false;
    const formatDate = (value: unknown) => {
      if (!value) return '';
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
    };

    (async () => {
      try {
        const params = new URLSearchParams({ module: 'poland-visa', leadId: String(leadId), limit: '1' });
        const response = await fetch(`/api/admin/operations/search?${params.toString()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const result = await response.json();
        const row = result.data?.[0];
        if (!row || cancelled) return;

        setStageData((current) => ({
          ...current,
          personal: {
            ...(current.personal || {}),
            clientName,
            email: current.personal?.email || row.email || '',
            phone: current.personal?.phone || row.phone || '',
            mobile: current.personal?.mobile || row.mobile || '',
            nationality: current.personal?.nationality || row.nationality || '',
            address: current.personal?.address || row.address || '',
            dob: current.personal?.dob || formatDate(row.dob),
            gender: current.personal?.gender || row.gender || '',
            country_interest: current.personal?.country_interest || row.country_interest || '',
            service_interest: current.personal?.service_interest || row.serviceType || row.serviceRequired || row.service_interest || '',
            market_source: current.personal?.market_source || row.market_source || '',
            counselor: current.personal?.counselor || [row.counselorName, row.counselorEmail].filter(Boolean).join(' - ') || row.Counsilor || '',
            case_officer: current.personal?.case_officer || [row.caseOfficerName, row.caseOfficerEmail].filter(Boolean).join(' - ') || row.case_officer || '',
            retnDate: current.personal?.retnDate || formatDate(row.retentionDate),
            agreeNo: current.personal?.agreeNo || row.agreementNumber || '',
            branch: current.personal?.branch || row.branchAbbrv || row.branchName || row.branch || '',
            branchAddress: current.personal?.branchAddress || row.branchAddress || '',
            branchEmail: current.personal?.branchEmail || row.branchEmail || '',
            branchMobile: current.personal?.branchMobile || row.branchMobile || '',
          },
        }));
      } catch (error) {
        console.error('Failed to load Poland Visa client details:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [leadId, clientName]);

  const saveStageData = async () => {
    try {
      const dataKey = activeStage.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      await saveStage.mutateAsync({ stage: activeStage, data: await uploadOperationFiles(stageData[dataKey] || stageData[activeStage] || {}, 'poland-visa', leadId) });
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    }
  };

  const moveToNextStage = () => {
    const currentIndex = stages.findIndex(s => s.id === activeStage);
    if (currentIndex < stages.length - 1) {
      const newStages = [...stages];
      newStages[currentIndex].status = 'completed';
      newStages[currentIndex + 1].status = 'current';
      setStages(newStages);
      setActiveStage(newStages[currentIndex + 1].id);
    }
  };

  const moveToPreviousStage = () => {
    const currentIndex = stages.findIndex(s => s.id === activeStage);
    if (currentIndex > 0) {
      const newStages = [...stages];
      newStages[currentIndex].status = 'pending';
      newStages[currentIndex - 1].status = 'current';
      setStages(newStages);
      setActiveStage(newStages[currentIndex - 1].id);
    }
  };

  const updateStageData = (key: string, data: any) => {
    setStageData(prev => ({ ...prev, [key]: data }));
  };

  const renderStageContent = () => {
    if (activeStage === CLIENT_DOCUMENTS_STAGE_ID) {
      return <ClientDocumentsPanel leadId={leadId} opportunityId={opportunityId} />;
    }
    if (activeStage === 'client-chat') {
      return <ClientChatPanel leadId={leadId} opportunityId={opportunityId} />;
    }
    const stageMap: Record<string, { title: string; description: string; dataKey: string }> = {
      'personal': { title: 'Personal Details', description: 'Client personal information including name, contact details, nationality, DOB, passport details, gender, marital status, counselor, case officer, retention date, agreement number, and branch details.', dataKey: 'personal' },
      'application': { title: 'Application Details', description: 'Poland work permit application information including application type (Type A/Type B/Type D), visa type, job details, employer information, contract details, application date, and processing status.', dataKey: 'application' },
      'jol': { title: 'Job Offer Letter (JOL)', description: 'Job offer letter details including employer name, job title, job description, salary details, work location, contract duration, company registration number, and JOL upload. Track JOL approval status and dates.', dataKey: 'jol' },
      'loc': { title: 'Letter of Commitment (LOC)', description: 'Letter of Commitment from employer including commitment details, employment terms, accommodation arrangements, insurance coverage, and employer obligations. Upload and track LOC approval.', dataKey: 'loc' },
      'work-permit': { title: 'Work Permit Processing', description: 'Work permit application and processing including Starostwo (District Office) application, permit type, application date, processing timeline, permit number, validity period, and approval/rejection status.', dataKey: 'workPermit' },
      'biometrics': { title: 'Biometrics & Medical', description: 'Biometrics appointment including appointment date, location, collection status, medical examination details, vaccination records, and health insurance documentation.', dataKey: 'biometrics' },
      'payment': { title: 'Payment Operations', description: 'All payment tracking including application fees, processing fees, service charges, payment mode, payment date, receipt numbers, outstanding amounts, and refund processing.', dataKey: 'payment' },
      'conversation': { title: 'Conversation Management', description: 'Email conversations and client communications including conversation date, type (Walk-in/Inbound/Outbound/Email), conversation details, follow-up remarks, follow-up date, priority level, and status tracking.', dataKey: 'conversation' },
      'status-update': { title: 'Status Update', description: 'Case status updates including current processing stage, milestone tracking, expected timelines, document verification status, authority feedback, and next action items. Upload status documents and communication from authorities.', dataKey: 'statusUpdate' },
      'client-chat': { title: 'Client Chat & Support', description: 'Direct client communication channel for queries, support requests, document clarifications, appointment scheduling, and general assistance. Track response times and resolution status.', dataKey: 'clientChat' }
    };

    const currentStage = stageMap[activeStage];
    if (!currentStage) return null;
    const isConversationStage = activeStage === 'conversation';

    return (
      <GenericStage
        title={currentStage.title}
        description={currentStage.description}
        fields={polandStageFields[currentStage.dataKey] || []}
        data={stageData[currentStage.dataKey] || {}}
        isFirstStage={activeStage === stages[0]?.id}
        isLastStage={activeStage === stages[stages.length - 1]?.id}
        locked={isConversationStage && !canEditConversation}
        lockedMessage="Only Operations Managers can add or edit conversation entries."
        onDataChange={(next) => updateStageData(currentStage.dataKey, next)}
        onSaveDraft={saveStageData}
        onBack={moveToPreviousStage}
        onContinue={async () => {
          await saveStageData();
          if (activeStage === stages[stages.length - 1].id) {
            window.toast.success('Poland Visa Operations Completed Successfully!');
          } else {
            moveToNextStage();
          }
        }}
      />
    );
  };

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => window.history.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ChevronLeft className="mr-1" size={20} />
                Back to Opportunities
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Poland Visa Operations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
            <Plane className="text-[var(--cmg-blue)]" size={48} />
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center gap-2">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = stage.id === activeStage;

              return (
                <div key={stage.id} className="flex items-center">
                  <button
                    onClick={() => setActiveStage(stage.id)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--cmg-blue)] text-white shadow-md'
                        : stage.status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={14} className="mr-1" />
                    <span className="text-xs font-medium">{stage.name}</span>
                    {stage.status === 'completed' && <CheckCircle size={12} className="ml-1" />}
                  </button>
                  {index < stages.length - 1 && (
                    <ChevronRight size={14} className={`mx-0.5 hidden sm:block ${stage.status === 'completed' ? 'text-green-600' : 'text-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
