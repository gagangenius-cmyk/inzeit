'use client';

import { useEffect, useState } from 'react';
import { uploadOperationFiles } from '@/lib/operationsData';
import { useOperationStages, useSaveOperationStage } from '@/hooks/useOperationsQueries';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, Award, Globe as GlobeIcon, MapPin, FolderOpen, Files, Send, ScrollText, FlagOff,
  ChevronRight, ChevronLeft, Save, CheckCircle, FolderCheck, MessageSquare
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';

const CLIENT_DOCUMENTS_STAGE_ID = 'client-documents';

interface SkillAustraliaOperationsWizardProps {
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

type FieldType = 'text' | 'date' | 'select' | 'textarea' | 'file' | 'number';

interface StageField {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
  span?: 'full';
}

const statusOptions = ['Pending', 'Submitted', 'Under Review', 'Sent for filing', 'Completed', 'Insufficient', 'Registered', 'Rejected', 'Not Applicable'];
const documentStatusOptions = ['Complete', 'Pending', 'Yet not submitted', 'Not Applicable'];
const yesNoOptions = ['Yes', 'No'];
const visaSubclassOptions = [
  '189 - Skilled Independent',
  '190 - Skilled Nominated',
  '491 - Skilled Work Regional',
  '482 - Employer Sponsored',
  '485 - Temporary Graduate',
  'Partner Visa (820/801, 309/100)',
  'Other',
];
const applicantTypeOptions = ['Principal Applicant', 'Spouse / Partner', 'Dependant (Over 18 Years of Age)', 'Dependant (Under 18 Years of Age)'];
const languageTestOptions = ['IELTS (Academic)', 'PTE Academic', 'TOEFL iBT', 'OET'];
const assessingAuthorityOptions = ['ACS', 'VETASSESS', 'TRA', 'Engineers Australia', 'Other'];
const resultOutcomeOptions = ['Positive', 'Negative', 'Pending'];
const australianStates = ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'];

const languageFields = (): StageField[] => [
  { name: 'testTaken', label: 'Test Taken', type: 'select', options: languageTestOptions, required: true },
  { name: 'status', label: 'Status', type: 'select', options: statusOptions, required: true },
  { name: 'listening', label: 'Listening', type: 'number' },
  { name: 'reading', label: 'Reading', type: 'number' },
  { name: 'writing', label: 'Writing', type: 'number' },
  { name: 'speaking', label: 'Speaking', type: 'number' },
  { name: 'overallScore', label: 'Overall Score', type: 'number' },
  { name: 'testDate', label: 'Test Date', type: 'date' },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
  { name: 'languageFile', label: 'English Test Score Report', type: 'file' },
  { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
];

const skillAssessmentFields = (): StageField[] => [
  { name: 'nominatedOccupation', label: 'Nominated Occupation', required: true },
  { name: 'anzscoCode', label: 'ANZSCO Code' },
  { name: 'assessingAuthority', label: 'Assessing Authority', type: 'select', options: assessingAuthorityOptions },
  { name: 'dateApplied', label: 'Date Applied', type: 'date' },
  { name: 'resultOutcome', label: 'Result / Outcome', type: 'select', options: resultOutcomeOptions },
  { name: 'referenceNo', label: 'Reference No. (if assessed)' },
  { name: 'assessmentFile', label: 'Assessment Document', type: 'file' },
  { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: [
    { name: 'clientName', label: 'Client Name', required: true, readOnly: true },
    { name: 'email', label: 'Email', readOnly: true },
    { name: 'phone', label: 'Phone', readOnly: true },
    { name: 'mobile', label: 'Mobile', readOnly: true },
    { name: 'nationality', label: 'Nationality', readOnly: true },
    { name: 'dob', label: 'Date of Birth', type: 'date', readOnly: true },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], readOnly: true },
    { name: 'country_interest', label: 'Country Interested', readOnly: true },
    { name: 'service_interest', label: 'Program Interested', readOnly: true },
    { name: 'market_source', label: 'Lead Source', readOnly: true },
    { name: 'counselor', label: 'Counselor', readOnly: true },
    { name: 'case_officer', label: 'Case Processing Officer', readOnly: true },
    { name: 'retnDate', label: 'Date of retention', type: 'date', required: true },
    { name: 'contractExpiry', label: 'Expiry of contract', type: 'date' },
    { name: 'agreeNo', label: 'Agreement No', readOnly: true },
    { name: 'branch', label: 'Branch', readOnly: true },
    { name: 'branchAddress', label: 'Branch Address', readOnly: true },
    { name: 'branchEmail', label: 'Branch Email', readOnly: true },
    { name: 'branchMobile', label: 'Branch Mobile', readOnly: true },
    // Details of Application (Personal Information Sheet – Australia)
    { name: 'visaSubclass', label: 'Visa Subclass Applied For', type: 'select', options: visaSubclassOptions, required: true },
    { name: 'applicantType', label: 'Applicant Type', type: 'select', options: applicantTypeOptions, required: true },
    { name: 'appliedBefore', label: 'Applied for a visa to Australia before?', type: 'select', options: yesNoOptions },
    { name: 'appliedBeforeDetails', label: 'Previous Application Details', type: 'textarea', span: 'full' },
    { name: 'trnClientId', label: 'TRN / Client ID No. (ImmiAccount)' },
    { name: 'placeOfBirth', label: 'Place of Birth' },
    { name: 'colourOfEyes', label: 'Colour of Eyes' },
    { name: 'height', label: 'Height' },
    { name: 'statusInAustralia', label: 'Status in Australia (if applicable)' },
    { name: 'currentAddress', label: 'Current Address', type: 'textarea', span: 'full' },
    { name: 'homeCountryAddress', label: 'Address in Home Country', type: 'textarea', span: 'full' },
    { name: 'passportNo', label: 'Passport No.' },
    { name: 'passportIssueDate', label: 'Passport Issue Date', type: 'date' },
    { name: 'passportExpiryDate', label: 'Passport Expiry Date', type: 'date' },
    { name: 'passportCountryOfIssue', label: 'Country of Issue (Passport)' },
    { name: 'personalFile', label: 'Document File', type: 'file' },
  ],
  documents: [
    { name: 'docPassportPrimary', label: 'Passport - Primary Applicant', type: 'file', required: true },
    { name: 'docPassportSpouse', label: 'Passport - Spouse', type: 'file' },
    { name: 'docPassportChild1', label: 'Passport - Child 1', type: 'file' },
    { name: 'docPassportChild2', label: 'Passport - Child 2', type: 'file' },
    { name: 'eduPrimary10th', label: 'Education (Primary) - 10th', type: 'file' },
    { name: 'eduPrimary12th', label: 'Education (Primary) - 12th', type: 'file' },
    { name: 'eduPrimaryBachelors', label: 'Education (Primary) - Bachelors', type: 'file' },
    { name: 'eduPrimaryMasters', label: 'Education (Primary) - Masters', type: 'file' },
    { name: 'eduSpouse10th', label: 'Education (Spouse) - 10th', type: 'file' },
    { name: 'eduSpouse12th', label: 'Education (Spouse) - 12th', type: 'file' },
    { name: 'eduSpouseBachelors', label: 'Education (Spouse) - Bachelors', type: 'file' },
    { name: 'eduSpouseMasters', label: 'Education (Spouse) - Masters', type: 'file' },
    { name: 'expPrimary1', label: 'Experience (Primary) - Employment 1', type: 'file' },
    { name: 'expPrimary2', label: 'Experience (Primary) - Employment 2', type: 'file' },
    { name: 'expSpouse1', label: 'Experience (Spouse) - Employment 1', type: 'file' },
    { name: 'resumePrimary', label: 'Resume - Primary Applicant', type: 'file' },
    { name: 'resumeSpouse', label: 'Resume - Spouse', type: 'file' },
    { name: 'documentsComments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  language: languageFields(),
  skillAssessment: skillAssessmentFields(),
  eoi: [
    { name: 'eoiRef', label: 'EOI Reference (SkillSelect ID)' },
    { name: 'eoiSubmissionDate', label: 'EOI Submission Date', type: 'date' },
    { name: 'eoiExpiryDate', label: 'EOI Expiry Date', type: 'date' },
    { name: 'invitationDate', label: 'Invitation to Apply Date', type: 'date' },
    { name: 'eoiStatus', label: 'Status', type: 'select', options: statusOptions, required: true },
    // Points Test Estimate (Skilled Visas – 189/190/491)
    { name: 'pointsAge', label: 'Points: Age', type: 'number' },
    { name: 'pointsEnglish', label: 'Points: English Language Ability', type: 'number' },
    { name: 'pointsEmploymentOverseas', label: 'Points: Skilled Employment – Overseas', type: 'number' },
    { name: 'pointsEmploymentAustralia', label: 'Points: Skilled Employment – In Australia', type: 'number' },
    { name: 'pointsEducation', label: 'Points: Educational Qualification', type: 'number' },
    { name: 'pointsAusStudy', label: 'Points: Australian Study Requirement', type: 'number' },
    { name: 'pointsSpecialistEducation', label: 'Points: Specialist Education Qualification', type: 'number' },
    { name: 'pointsCommunityLanguage', label: 'Points: Credentialled Community Language', type: 'number' },
    { name: 'pointsRegionalStudy', label: 'Points: Study in Regional Australia', type: 'number' },
    { name: 'pointsPartnerSkill', label: 'Points: Partner Skill Qualification', type: 'number' },
    { name: 'pointsStateNomination', label: 'Points: State/Territory Nomination or Family Sponsorship', type: 'number' },
    { name: 'pointsTotal', label: 'Estimated Total Points', type: 'number', required: true },
    { name: 'eoiFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  stateNomination: [
    { name: 'stateSelected', label: 'State / Territory', type: 'select', options: australianStates },
    { name: 'applicationDate', label: 'Application Date', type: 'date' },
    { name: 'nominationDate', label: 'Nomination Date', type: 'date' },
    { name: 'nominationStatus', label: 'Status', type: 'select', options: statusOptions },
    { name: 'referenceNo', label: 'Reference No.' },
    { name: 'nominationFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  postInvite: [
    { name: 'invitationReceivedDate', label: 'Invitation Received Date', type: 'date', required: true },
    { name: 'applicationSubmitDate', label: 'Visa Application Submitted Date', type: 'date' },
    { name: 'medicalDate', label: 'Medical Examination Date', type: 'date' },
    { name: 'documentChecklist', label: 'Document Checklist Status', type: 'select', options: documentStatusOptions },
    { name: 'postInviteStatus', label: 'Status', type: 'select', options: statusOptions, required: true },
    { name: 'postInviteFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  postInviteDocuments: [
    { name: 'piFundsDocuments', label: 'Funds Documents', type: 'file' },
    { name: 'piPcc', label: 'PCC (Police Clearance Certificate)', type: 'file' },
    { name: 'piMedicals', label: 'Medicals', type: 'file' },
    { name: 'piFormsSigned', label: 'Signed Visa Application Forms', type: 'file' },
    { name: 'piMisc', label: 'Miscellaneous Documents', type: 'file' },
    { name: 'postInviteDocsComments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  aor: [
    { name: 'aorReceiptDate', label: 'AOR Receipt Date', type: 'date', required: true },
    { name: 'aorReceiptFile', label: 'AOR Receipt', type: 'file', required: true },
    { name: 'aorComments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  approvalRefusal: [
    { name: 'decision', label: 'Decision', type: 'select', options: ['Approved', 'Refused'], required: true },
    { name: 'decisionDate', label: 'Decision Date', type: 'date', required: true },
    { name: 'refusalReason', label: 'Refusal Reason (if refused)', type: 'textarea', span: 'full' },
    { name: 'decisionLetterFile', label: 'Decision Letter', type: 'file' },
  ],
  closure: [
    { name: 'closureDate', label: 'Closure Date', type: 'date', required: true },
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Visa Approved & Completed', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'], required: true },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full', required: true },
  ],
};

function GenericStage({
  title,
  description,
  fields,
  data,
  isFirstStage,
  isLastStage,
  onFieldChange,
  onSaveDraft,
  onBack,
  onContinue,
}: {
  title: string;
  description: string;
  fields: StageField[];
  data: Record<string, any>;
  isFirstStage: boolean;
  isLastStage: boolean;
  onFieldChange: (field: StageField, value: any) => void;
  onSaveDraft: () => Promise<void>;
  onBack: () => void;
  onContinue: () => Promise<void>;
}) {
  const [localSaving, setLocalSaving] = useState(false);
  const [continuing, setContinuing] = useState(false);

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

  const missingRequired = fields.filter((field) => field.required && !data[field.name]);

  const renderField = (field: StageField) => {
    const value = data[field.name] || '';
    const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500';
    const label = (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="ml-1 text-red-600">*</span>}
      </label>
    );

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className={field.span === 'full' ? 'md:col-span-2' : ''}>
          {label}
          <textarea
            value={value}
            onChange={(event) => onFieldChange(field, event.target.value)}
            rows={4}
            className={inputClass}
            placeholder={field.label}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name}>
          {label}
          <select
            value={value}
            onChange={(event) => onFieldChange(field, event.target.value)}
            disabled={field.readOnly}
            className={inputClass}
          >
            <option value="">Select</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'file') {
      const uploaded = value && typeof value === 'object' && 'url' in value ? value : null;
      return (
        <div key={field.name} className={field.span === 'full' ? 'md:col-span-2' : ''}>
          {label}
          {uploaded?.url && (
            <a href={uploaded.url} target="_blank" className="mb-2 block text-xs font-medium text-blue-700 hover:text-blue-900">
              View uploaded file
            </a>
          )}
          <input
            type="file"
            onChange={(event) => onFieldChange(field, event.target.files?.[0] || null)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">Accepted legacy formats: png, jpeg, jpg, pdf, docx, doc, xls, xlsx.</p>
        </div>
      );
    }

    return (
      <div key={field.name}>
        {label}
        <input
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(event) => onFieldChange(field, event.target.value)}
          readOnly={field.readOnly}
          className={inputClass}
          placeholder={field.label}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-800">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(renderField)}
        {missingRequired.length > 0 && (
          <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Pending required fields: {missingRequired.map((field) => field.label).join(', ')}
          </div>
        )}
      </div>

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
              setContinuing(true);
              try {
                await onContinue();
              } finally {
                setContinuing(false);
              }
            }}
            disabled={continuing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center font-medium"
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
      </div>
    </div>
  );
}

export default function SkillAustraliaOperationsWizard({
  opportunityId,
  leadId,
  clientName
}: SkillAustraliaOperationsWizardProps) {
  const [activeStage, setActiveStage] = useState('personal');

  const [stages, setStages] = useState<OperationsStage[]>([
    { id: 'personal', name: 'Personal Details', icon: User, status: 'current' },
    { id: 'documents', name: 'Documents', icon: FolderOpen, status: 'pending' },
    { id: 'skill-assessment', name: 'Skills Assessment', icon: Award, status: 'pending' },
    { id: 'language', name: 'Language Proficiency', icon: FileText, status: 'pending' },
    { id: 'eoi', name: 'EOI Stage', icon: GlobeIcon, status: 'pending' },
    { id: 'state-nomination', name: 'State Applications', icon: MapPin, status: 'pending' },
    { id: 'post-invite', name: 'Post Invite', icon: Send, status: 'pending' },
    { id: 'post-invite-documents', name: 'Documents', icon: Files, status: 'pending' },
    { id: 'aor', name: 'AOR', icon: ScrollText, status: 'pending' },
    { id: 'approval-refusal', name: 'Approval/Refusal', icon: CheckCircle, status: 'pending' },
    { id: 'closure', name: 'Closure', icon: FlagOff, status: 'pending' },
    { id: 'live-chat', name: 'Live Chat', icon: MessageSquare, status: 'pending' },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck, status: 'pending' },
  ]);

  const [stageData, setStageData] = useState<Record<string, any>>({
    personal: {}, documents: {}, skillAssessment: {}, language: {},
    eoi: {}, stateNomination: {}, postInvite: {}, postInviteDocuments: {}, aor: {}, approvalRefusal: {}, closure: {}
  });
  const { data: savedStages } = useOperationStages('skill-australia', leadId, opportunityId);
  const saveStage = useSaveOperationStage('skill-australia', leadId, opportunityId);

  useEffect(() => {
    if (!savedStages?.data) return;
    // The save API keys rows by the raw kebab-case stage id (e.g.
    // 'skill-assessment'), but every read/write elsewhere in this component
    // uses the camelCase dataKey ('skillAssessment'). Left unconverted,
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
        const params = new URLSearchParams({ module: 'skill-australia', leadId: String(leadId), limit: '1' });
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
            dob: formatDate(row.dob || current.personal?.dob),
            gender: current.personal?.gender || row.gender || '',
            country_interest: current.personal?.country_interest || row.country_interest || '',
            service_interest: current.personal?.service_interest || row.serviceType || row.serviceRequired || row.service_interest || '',
            market_source: current.personal?.market_source || row.market_source || '',
            counselor: current.personal?.counselor || [row.counselorName, row.counselorEmail].filter(Boolean).join(' - ') || row.Counsilor || '',
            case_officer: current.personal?.case_officer || [row.caseOfficerName, row.caseOfficerEmail].filter(Boolean).join(' - ') || row.case_officer || '',
            retnDate: formatDate(row.retentionDate || current.personal?.retnDate),
            agreeNo: current.personal?.agreeNo || row.agreementNumber || '',
            branch: current.personal?.branch || row.branchAbbrv || row.branchName || row.branch || '',
            branchAddress: current.personal?.branchAddress || row.branchAddress || '',
            branchEmail: current.personal?.branchEmail || row.branchEmail || '',
            branchMobile: current.personal?.branchMobile || row.branchMobile || '',
          },
        }));
      } catch (error) {
        console.error('Failed to load Skill Australia client details:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [leadId, clientName]);

  const saveStageData = async () => {
    try {
      const dataKey = activeStage.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      await saveStage.mutateAsync({ stage: activeStage, data: await uploadOperationFiles(stageData[dataKey] || stageData[activeStage] || {}, 'skill-australia', leadId) });
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
      'personal': { title: 'Personal Details', description: 'Client personal information including application/visa subclass details, contact details, nationality, DOB, passport, current & home country address, counselor, case officer, retention date, agreement number, and branch details.', dataKey: 'personal' },
      'documents': { title: 'Documents', description: 'Passport (primary/spouse/children), education documents (primary and spouse), experience documents, and resumes.', dataKey: 'documents' },
      'skill-assessment': { title: 'Skills Assessment', description: 'Nominated occupation, ANZSCO code, assessing authority (ACS/VETASSESS/TRA/Engineers Australia), application date, result/outcome, and the assessment document upload.', dataKey: 'skillAssessment' },
      'language': { title: 'Language Proficiency', description: 'English language test details including test type (IELTS Academic, PTE Academic, TOEFL iBT, OET), individual scores for Listening, Reading, Writing, Speaking, overall score, test date, expiry date, and the test score report upload.', dataKey: 'language' },
      'eoi': { title: 'EOI Stage', description: 'SkillSelect EOI reference, submission/expiry/invitation dates, status, and the full Points Test Estimate for skilled visas 189/190/491.', dataKey: 'eoi' },
      'state-nomination': { title: 'State Applications', description: 'State/Territory nomination application including state selected, application and nomination dates, status, and reference number.', dataKey: 'stateNomination' },
      'post-invite': { title: 'Post Invite', description: 'Invitation received date, visa application submission date, medical examination date, document checklist, and status.', dataKey: 'postInvite' },
      'post-invite-documents': { title: 'Documents', description: 'Post-invite document uploads: funds documents, PCC, medicals, signed visa application forms, and miscellaneous documents.', dataKey: 'postInviteDocuments' },
      'aor': { title: 'AOR', description: 'Acknowledgement of Receipt issued after visa application submission.', dataKey: 'aor' },
      'approval-refusal': { title: 'Approval / Refusal', description: 'The final decision on the application, including refusal reason when applicable and the decision letter.', dataKey: 'approvalRefusal' },
      'closure': { title: 'Closure', description: 'Case closure with reason (visa approved & completed, client withdrew, refused, non-payment, other) and closure notes.', dataKey: 'closure' },
    };

    const currentStage = stageMap[activeStage];
    if (!currentStage) return null;
    const dataKey = currentStage.dataKey;

    return (
      <GenericStage
        title={currentStage.title}
        description={currentStage.description}
        fields={stageFieldMap[dataKey] || []}
        data={stageData[dataKey] || {}}
        isFirstStage={activeStage === stages[0]?.id}
        isLastStage={activeStage === stages[stages.length - 1]?.id}
        onFieldChange={(field, value) => updateStageData(dataKey, { ...(stageData[dataKey] || {}), [field.name]: value })}
        onSaveDraft={saveStageData}
        onBack={moveToPreviousStage}
        onContinue={async () => {
          await saveStageData();
          if (activeStage === stages[stages.length - 1].id) {
            window.toast.success('Skill Australia Operations Completed Successfully!');
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
              <h1 className="text-2xl font-bold text-gray-900">Skill Australia Operations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
            <GlobeIcon className="text-blue-600" size={48} />
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
                        ? 'bg-blue-600 text-white shadow-md'
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
