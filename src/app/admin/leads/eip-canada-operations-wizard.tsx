'use client';

import { useEffect, useState } from 'react';
import { uploadOperationFiles } from '@/lib/operationsData';
import { useOperationStages, useSaveOperationStage } from '@/hooks/useOperationsQueries';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Award, FileText, GlobeIcon, MapPin, Send, Anchor, Ship, Building,
  CheckCircle, TrendingUp, FileEdit, MessageCircle, MessageSquare, BarChart,
  ChevronRight, ChevronLeft, Save, FolderCheck
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';
import { useAuth } from '@/contexts/AuthContext';

const CLIENT_DOCUMENTS_STAGE_ID = 'client-documents';
import {
  OperationStageForm,
  OperationField,
  commonPersonalFields,
  ecaFields,
  languageFields,
  prefixFields,
  documentStatusOptions,
  statusOptions,
  conversationTypes,
  missingRequiredFields,
} from './operations-stage-form';

interface EIPCanadaOperationsWizardProps {
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

const eipStageFields: Record<string, OperationField[]> = {
  personal: commonPersonalFields,
  eca: ecaFields,
  spouseEca: [
    { name: 'spQualify', label: 'Spouse Qualification' },
    ...prefixFields(ecaFields, 'spouse'),
  ],
  language: languageFields,
  spouseLanguage: prefixFields(languageFields, 'spouse'),
  expressEntry: [
    { name: 'eeDocReceDate', label: 'Documents Received', type: 'date', required: true },
    { name: 'eeDocSts', label: 'Document Status', type: 'select', options: documentStatusOptions, required: true },
    { name: 'eePoint', label: 'Point Claimed in FSWP', type: 'number' },
    { name: 'eeNoc', label: 'NOC confirmed by client' },
    { name: 'eeProfLauDate', label: 'Profile launched', type: 'date' },
    { name: 'eeProfExpDate', label: 'Profile Expiry', type: 'date' },
    { name: 'eeScore', label: 'CRS scores', type: 'number' },
    { name: 'eestatus', label: 'Status', type: 'select', options: statusOptions, required: true },
    { name: 'pftype', label: 'Profile Type', type: 'select', options: ['Primary', 'Spouse', 'Both'] },
    { name: 'eeFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  pnp: [
    { name: 'pnpLaun', label: 'PNP launched', type: 'select', options: ['Yes', 'No'] },
    { name: 'eoisubdate', label: 'EOI Submission Date', type: 'date' },
    { name: 'eoiexpdate', label: 'EOI Expiry Date', type: 'date' },
    { name: 'noirecdate', label: 'NOI Received Date', type: 'date' },
    { name: 'noisubdate', label: 'NOI Submission Date', type: 'date' },
    { name: 'noiexpdate', label: 'NOI Expiry Date', type: 'date' },
    { name: 'nomrecdate', label: 'Nomination Awarded Date', type: 'date' },
    { name: 'nomexpdate', label: 'Nomination Expiry Date', type: 'date' },
    { name: 'pnpStatus', label: 'Status', type: 'select', options: statusOptions },
    { name: 'ptsp', label: 'EOI Points', type: 'number' },
    { name: 'pnpFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  aipp: [
    { name: 'employerName', label: 'Employer Name', required: true },
    { name: 'jobOfferDate', label: 'Job Offer Date', type: 'date' },
    { name: 'designationCertificate', label: 'Designation Certificate' },
    { name: 'settlementPlanDate', label: 'Settlement Plan Date', type: 'date' },
    { name: 'endorsementDate', label: 'Endorsement Date', type: 'date' },
    { name: 'aippStatus', label: 'Status', type: 'select', options: statusOptions },
    { name: 'aippFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  rnip: [
    { name: 'community', label: 'Community', required: true },
    { name: 'jobOfferDate', label: 'Job Offer Date', type: 'date' },
    { name: 'recommendationDate', label: 'Community Recommendation Date', type: 'date' },
    { name: 'settlementPlanDate', label: 'Settlement Plan Date', type: 'date' },
    { name: 'rnipStatus', label: 'Status', type: 'select', options: statusOptions },
    { name: 'rnipFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  mcdii: [
    { name: 'category', label: 'Category', required: true },
    { name: 'eligibilityStatus', label: 'Eligibility Status', type: 'select', options: statusOptions },
    { name: 'applicationDate', label: 'Application Date', type: 'date' },
    { name: 'processingInstruction', label: 'Processing Instructions', type: 'textarea', span: 'full' },
    { name: 'mcdiiFile', label: 'Document File', type: 'file' },
  ],
  cicSubmission: [
    { name: 'submissionDate', label: 'Submission Date', type: 'date', required: true },
    { name: 'medicalDate', label: 'Medical Examination Date', type: 'date' },
    { name: 'pccStatus', label: 'Police Certificate Status', type: 'select', options: documentStatusOptions },
    { name: 'biometricsDate', label: 'Biometrics Date', type: 'date' },
    { name: 'cicStatus', label: 'Status', type: 'select', options: statusOptions, required: true },
    { name: 'cicFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  visaGrant: [
    { name: 'grantDate', label: 'Visa Grant Date', type: 'date' },
    { name: 'visaType', label: 'Visa Type' },
    { name: 'visaExpiryDate', label: 'Visa Expiry Date', type: 'date' },
    { name: 'coprNumber', label: 'COPR Number' },
    { name: 'visaGrantStatus', label: 'Status', type: 'select', options: statusOptions },
    { name: 'visaFile', label: 'Document File', type: 'file' },
    { name: 'landingInstructions', label: 'Landing Instructions', type: 'textarea', span: 'full' },
  ],
  postLanding: [
    { name: 'landingDate', label: 'Landing Date', type: 'date' },
    { name: 'sinStatus', label: 'SIN Application', type: 'select', options: statusOptions },
    { name: 'bankAccountStatus', label: 'Bank Account Setup', type: 'select', options: statusOptions },
    { name: 'healthCardStatus', label: 'Health Card', type: 'select', options: statusOptions },
    { name: 'jobSearchStatus', label: 'Job Search Assistance', type: 'select', options: statusOptions },
    { name: 'accommodationStatus', label: 'Accommodation Support', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  remark: [
    { name: 'remarkDate', label: 'Remark Date', type: 'date' },
    { name: 'remark', label: 'Remark', type: 'textarea', span: 'full', required: true },
  ],
  conversation: [
    { name: 'conversationDate', label: 'Conversation Date', type: 'date', required: true, todayOnly: true },
    { name: 'conversation_type', label: 'Type of Conversation', type: 'select', options: conversationTypes, required: true },
    { name: 'confollowdate', label: 'Follow up Conversation', type: 'date' },
    { name: 'conversation', label: 'Conversation', type: 'textarea', span: 'full', required: true },
  ],
  statusUpdate: [
    { name: 'currentStage', label: 'Current Stage', type: 'select', options: ['eca', 'pnp', 'aipp', 'rnip', 'mcdii', 'cic'] },
    { name: 'statusUpdate', label: 'Status Update', type: 'textarea', span: 'full', required: true },
    { name: 'statusFile', label: 'Status File', type: 'file' },
  ],
};

interface GenericStageProps {
  title: string;
  description: string;
  fields: OperationField[];
  data: Record<string, any>;
  isFirstStage: boolean;
  isLastStage: boolean;
  locked?: boolean;
  lockedMessage?: string;
  onDataChange: (next: any) => void;
  onSaveDraft: () => Promise<void>;
  onBack: () => void;
  onContinue: () => Promise<void>;
}

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
}: GenericStageProps) {
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <p className="text-purple-800">{description}</p>
        <p className="text-sm text-[var(--cmg-blue)] mt-2">Required fields are marked from the legacy ops_eip_canada.php stage requirements.</p>
      </div>

      {locked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {lockedMessage || 'You do not have permission to edit this stage.'}
        </div>
      )}

      <OperationStageForm fields={fields} data={data} color="purple" onChange={onDataChange} locked={locked} />
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

export default function EIPCanadaOperationsWizard({
  opportunityId,
  leadId,
  clientName
}: EIPCanadaOperationsWizardProps) {
  const { hasRole } = useAuth();
  const canEditConversation = ['operation_manager', 'admin', 'administrator', 'super_admin'].some((role) => hasRole(role));
  const [activeStage, setActiveStage] = useState('personal');

  const [stages, setStages] = useState<OperationsStage[]>([
    { id: 'personal', name: 'Personal Details', icon: User, status: 'current' },
    { id: 'eca', name: 'ECA', icon: Award, status: 'pending' },
    { id: 'spouse-eca', name: 'Spouse ECA', icon: Award, status: 'pending' },
    { id: 'language', name: 'Language Proficiency', icon: FileText, status: 'pending' },
    { id: 'spouse-language', name: 'Language (Spouse)', icon: FileText, status: 'pending' },
    { id: 'express-entry', name: 'Express Entry', icon: GlobeIcon, status: 'pending' },
    { id: 'pnp', name: 'PnP', icon: MapPin, status: 'pending' },
    { id: 'aipp', name: 'AIPP', icon: Anchor, status: 'pending' },
    { id: 'rnip', name: 'RNIP', icon: Ship, status: 'pending' },
    { id: 'mcdii', name: 'MCDII', icon: Building, status: 'pending' },
    { id: 'cic-submission', name: 'CIC Submission', icon: Send, status: 'pending' },
    { id: 'visa-grant', name: 'Visa Grant', icon: CheckCircle, status: 'pending' },
    { id: 'post-landing', name: 'Post Landing', icon: TrendingUp, status: 'pending' },
    { id: 'remark', name: 'Remark', icon: FileEdit, status: 'pending' },
    { id: 'conversation', name: 'Conversation', icon: MessageCircle, status: 'pending' },
    { id: 'status-update', name: 'Status Update', icon: BarChart, status: 'pending' },
    { id: 'live-chat', name: 'Live Chat', icon: MessageSquare, status: 'pending' },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck, status: 'pending' },
  ]);

  const [stageData, setStageData] = useState<Record<string, any>>({});
  const { data: savedStages } = useOperationStages('eip-canada', leadId, opportunityId);
  const saveStage = useSaveOperationStage('eip-canada', leadId, opportunityId);

  useEffect(() => {
    if (!savedStages?.data) return;
    // The save API keys rows by the raw kebab-case stage id (e.g. 'spouse-eca'
    // — see saveStageData below), but every read/write in this component uses
    // the camelCase dataKey ('spouseEca') from stageMap. Left unconverted,
    // loaded data would sit under a key the form never reads, making
    // previously-saved answers for every hyphenated stage look blank after a
    // reload — normalize here so both sides agree on one key.
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
        const params = new URLSearchParams({ module: 'eip-canada', leadId: String(leadId), limit: '1' });
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
        console.error('Failed to load EIP Canada client details:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [leadId, clientName]);

  const saveStageData = async () => {
    try {
      const dataKey = activeStage.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      await saveStage.mutateAsync({ stage: activeStage, data: await uploadOperationFiles(stageData[dataKey] || stageData[activeStage] || {}, 'eip-canada', leadId) });
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
    if (activeStage === 'live-chat') {
      return <ClientChatPanel leadId={leadId} opportunityId={opportunityId} />;
    }
    const stageMap: Record<string, { title: string; description: string; dataKey: string }> = {
      'personal': { title: 'Personal Details', description: 'Client personal information including contact details, nationality, DOB, gender, country interest, program interest, counselor, case officer, retention date, agreement number, and branch details.', dataKey: 'personal' },
      'eca': { title: 'ECA (Educational Credential Assessment)', description: 'ECA package details including receipt date, source (PA/Spouse), document status, assessment body (WES/ICAS/IQAS/MCC/PEBC/ICES/CES), application date, payment mode, transcript details, status, and completion date.', dataKey: 'eca' },
      'spouse-eca': { title: 'Spouse ECA', description: 'Educational credential assessment for spouse including all qualification details, transcript status, assessment body selection, and completion tracking.', dataKey: 'spouseEca' },
      'language': { title: 'Language Proficiency', description: 'Language test details including test type (IELTS AT/GT, PTE, TOEFL iBT, OET, CAE), status, test date, expiry date, test score, and individual scores for Reading, Writing, Listening, Speaking.', dataKey: 'language' },
      'spouse-language': { title: 'Language Proficiency (Spouse)', description: 'Spouse language test information including test type, scores, dates, and proficiency levels across all four skills.', dataKey: 'spouseLanguage' },
      'express-entry': { title: 'Express Entry', description: 'Express Entry profile including CRS score, profile creation date, job offer details, LMIA information, and profile status tracking.', dataKey: 'expressEntry' },
      'pnp': { title: 'Provincial Nominee Program', description: 'PnP application including province selection, nomination status, application date, nomination certificate details, and processing timeline.', dataKey: 'pnp' },
      'aipp': { title: 'Atlantic Immigration Pilot Program', description: 'AIPP details including employer endorsement, job offer, designation certificate, settlement plan, and application tracking.', dataKey: 'aipp' },
      'rnip': { title: 'Rural and Northern Immigration Pilot', description: 'RNIP application including community recommendation, job offer, settlement plan, community selection, and application status.', dataKey: 'rnip' },
      'mcdii': { title: 'Ministerial Instructions (MCDII)', description: 'MCDII category application including eligibility criteria, documentation requirements, and special processing instructions.', dataKey: 'mcdii' },
      'cic-submission': { title: 'CIC Submission', description: 'Citizenship and Immigration Canada submission including ITA response, document submission, medical examination, police certificates, and biometrics.', dataKey: 'cicSubmission' },
      'visa-grant': { title: 'Visa Grant', description: 'Final visa approval including grant date, visa type, expiry date, passport submission, COPR details, and landing instructions.', dataKey: 'visaGrant' },
      'post-landing': { title: 'Post Landing Services', description: 'Settlement services including SIN application, bank account setup, health card, job search assistance, and accommodation support.', dataKey: 'postLanding' },
      'remark': { title: 'Remarks', description: 'General remarks and notes about the case progress, client communication, and important observations.', dataKey: 'remark' },
      'conversation': { title: 'Conversation History', description: 'Email conversations including date, conversation type (Walk-in/Inbound/Outbound/Email), conversation details, follow-up remarks, and follow-up date.', dataKey: 'conversation' },
      'status-update': { title: 'Status Update', description: 'Case status updates including current stage, progress notes, next steps, and client communication updates. Upload status files and track milestones.', dataKey: 'statusUpdate' }
    };

    const currentStage = stageMap[activeStage];
    if (!currentStage) return null;

    const { dataKey } = currentStage;
    const isConversationStage = activeStage === 'conversation';

    return (
      <GenericStage
        title={currentStage.title}
        description={currentStage.description}
        fields={eipStageFields[dataKey] || []}
        data={stageData[dataKey] || {}}
        isFirstStage={activeStage === stages[0]?.id}
        isLastStage={activeStage === stages[stages.length - 1]?.id}
        locked={isConversationStage && !canEditConversation}
        lockedMessage="Only Operations Managers can add or edit conversation entries."
        onDataChange={(next) => updateStageData(dataKey, next)}
        onSaveDraft={saveStageData}
        onBack={moveToPreviousStage}
        onContinue={async () => {
          await saveStageData();
          if (activeStage === stages[stages.length - 1].id) {
            window.toast.success('EIP Canada Operations Completed Successfully!');
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
              <h1 className="text-2xl font-bold text-gray-900">EIP Canada Operations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
            <Building className="text-[var(--cmg-blue)]" size={48} />
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
                    className={`flex items-center px-2 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--cmg-blue)] text-white shadow-md'
                        : stage.status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={12} className="mr-1" />
                    <span className="text-xs font-medium">{stage.name}</span>
                    {stage.status === 'completed' && <CheckCircle size={10} className="ml-1" />}
                  </button>
                  {index < stages.length - 1 && (
                    <ChevronRight size={12} className={`mx-0.5 hidden sm:block ${stage.status === 'completed' ? 'text-green-600' : 'text-gray-300'}`} />
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
