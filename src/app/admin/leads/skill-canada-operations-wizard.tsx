'use client';

import { useEffect, useState } from 'react';
import { uploadOperationFiles } from '@/lib/operationsData';
import { useOperationStages, useSaveOperationStage } from '@/hooks/useOperationsQueries';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, Award, GlobeIcon, Send, CheckCircle, TrendingUp,
  FileEdit, MessageCircle, MessageSquare, Files, BarChart, ChevronRight, ChevronLeft, Save, MapPin,
  FolderOpen, Inbox, ScrollText, FlagOff, FolderCheck
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';
import { useAuth } from '@/contexts/AuthContext';

// Every stage below saves to crm_operation_stage_data (the office's own
// case-processing data), but the client's OWN uploads to their portal
// checklist land in a separate table (crm_client_documents) - the
// 'client-documents' stage below is a case-officer review view onto that
// table, not another entry in stageFieldMap/GenericStage.
const CLIENT_DOCUMENTS_STAGE_ID = 'client-documents';

interface SkillCanadaOperationsWizardProps {
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
  /** Date fields marked true can only be set to today's date - no back-dating, no future-dating. */
  todayOnly?: boolean;
}

const statusOptions = ['Pending', 'Submitted', 'Under Review', 'Sent for filing', 'Completed', 'Insufficient', 'Registered', 'Rejected', 'Not Applicable'];
const documentStatusOptions = ['Complete', 'Pending', 'Yet not submitted', 'Not Applicable'];
const assessmentBodyOptions = ['WES', 'ICAS', 'IQAS', 'MCC', 'PEBC', 'ICES', 'CES'];
const paymentModeOptions = ['Client Credit Card', 'Company Credit Card'];
const transcriptStatusOptions = ['Accepted', 'Yet not submitted', 'Rejected', 'In process', 'Verification'];
const yesNoOptions = ['Yes', 'No'];
const approvedOptions = ['Approved', 'Rejected', 'Pending'];
const languageTestOptions = ['IELTS(AT)', 'IELTS(GT)', 'PTE', 'TOEFL iBT', 'OET', 'CAE', 'CELPIP'];
const conversationTypes = ['Walk-in', 'Inbound', 'Outbound', 'Email'];

const baseEcaFields: StageField[] = [
  { name: 'ecaReceDate', label: 'ECA Package received from client', type: 'date', required: true },
  { name: 'ecaPackage', label: 'Source', type: 'select', options: ['PA', 'Spouse'], required: true },
  { name: 'ecaDocStatus', label: 'Documents status', type: 'select', options: documentStatusOptions, required: true },
  { name: 'ecaAssmBody', label: 'Assessment Body', type: 'select', options: assessmentBodyOptions },
  { name: 'ecaApplyDate', label: 'Date Applied', type: 'date' },
  { name: 'ecaPayMode', label: 'Payment Mode', type: 'select', options: paymentModeOptions },
  { name: 'ecaTranSent', label: 'Transcript sent', type: 'select', options: ['Client', 'Company'] },
  { name: 'ecaTranStatus', label: 'Transcript Status', type: 'select', options: transcriptStatusOptions },
  { name: 'ecaStatus', label: 'Status', type: 'select', options: statusOptions, required: true },
  { name: 'compDate', label: 'Date of Completion', type: 'date' },
  { name: 'qualification', label: 'Add Qualification', type: 'select', options: ['High School', 'Diploma', 'Bachelors', 'Masters', 'PhD'] },
  { name: 'specialization', label: 'Specialization' },
  { name: 'university', label: 'University' },
  { name: 'rating', label: 'Rating', type: 'select', options: ['+ve', '-ve'] },
  { name: 'ecauid', label: 'App User ID' },
  { name: 'ecausrpsswrd', label: 'App Password' },
  { name: 'regemail', label: 'Registered Email ID' },
  { name: 'regpsswrd', label: 'Registered Password' },
  { name: 'secq', label: 'Security Question' },
  { name: 'seca', label: 'Answer' },
  { name: 'ecaFile', label: 'Document File', type: 'file' },
  { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
];

const makeSpouseEcaFields = (): StageField[] => [
  { name: 'spQualify', label: 'Spouse Qualification' },
  ...baseEcaFields.map((field) => ({
    ...field,
    name: ({
      ecaReceDate: 'specaReceDate',
      ecaPackage: 'specaPackage',
      ecaDocStatus: 'specaDocStatus',
      ecaAssmBody: 'specaAssmBody',
      ecaApplyDate: 'specaApplyDate',
      ecaPayMode: 'specaPayMode',
      ecaTranSent: 'specaTranSent',
      ecaTranStatus: 'specaTranStatus',
      ecaStatus: 'specaStatus',
      compDate: 'spcompDate',
      ecauid: 'secauid',
      ecausrpsswrd: 'secausrpsswrd',
      regemail: 'sregemail',
      regpsswrd: 'sregpsswrd',
      secq: 'ssecq',
      seca: 'sseca',
      ecaFile: 'spEcaFile',
      comments: 'comments',
    } as Record<string, string>)[field.name] || field.name,
  })),
];

const languageFields = (prefix = ''): StageField[] => {
  const key = (name: string) => prefix ? `${name}${prefix}` : name;
  return [
    { name: key('langTest'), label: 'Language Test', type: 'select', options: languageTestOptions, required: true },
    { name: key('testStatus'), label: 'Status', type: 'select', options: statusOptions, required: true },
    { name: key('expiryDate'), label: 'Expiry Date', type: 'date' },
    { name: key('reading'), label: 'Reading', type: 'number' },
    { name: key('writing'), label: 'Writing', type: 'number' },
    { name: key('listening'), label: 'Listening', type: 'number' },
    { name: key('speaking'), label: 'Speaking', type: 'number' },
    { name: key('testDate'), label: 'Test Date', type: 'date' },
    { name: key('testScore'), label: 'Test Score' },
    { name: key('mreq'), label: 'Medical Required', type: 'select', options: yesNoOptions },
    { name: key('languageFile'), label: 'Document File', type: 'file' },
    { name: key('comments'), label: 'Comments', type: 'textarea', span: 'full' },
  ];
};

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
    { name: 'renDate', label: 'Date of Contract Renewal', type: 'date' },
    { name: 'renExpiryDate', label: 'Date of expiry after renewal', type: 'date' },
    { name: 'renew_type', label: 'Renewed Type', type: 'select', options: ['with fee', 'without fee'] },
    { name: 'agreeNo', label: 'Agreement No', readOnly: true },
    { name: 'branch', label: 'Branch', readOnly: true },
    { name: 'branchAddress', label: 'Branch Address', readOnly: true },
    { name: 'branchEmail', label: 'Branch Email', readOnly: true },
    { name: 'branchMobile', label: 'Branch Mobile', readOnly: true },
    { name: 'personalFile', label: 'Document File', type: 'file' },
  ],
  eca: baseEcaFields,
  spouseEca: makeSpouseEcaFields(),
  language: languageFields(),
  spouseLanguage: languageFields('Spouse'),
  documents: [
    { name: 'docPassportPrimary', label: 'Passport - Primary Applicant', type: 'file', required: true },
    { name: 'docPassportSpouse', label: 'Passport - Spouse', type: 'file' },
    { name: 'docPassportChild1', label: 'Passport - Child 1', type: 'file' },
    { name: 'docPassportChild2', label: 'Passport - Child 2', type: 'file' },
    { name: 'eduPrimary10th', label: 'Education (Primary) - 10th', type: 'file' },
    { name: 'eduPrimary12th', label: 'Education (Primary) - 12th', type: 'file' },
    { name: 'eduPrimaryBachelors', label: 'Education (Primary) - Bachelors', type: 'file' },
    { name: 'eduPrimaryMasters', label: 'Education (Primary) - Masters', type: 'file' },
    { name: 'eduPrimaryPhd', label: 'Education (Primary) - PhD', type: 'file' },
    { name: 'eduSpouse10th', label: 'Education (Spouse) - 10th', type: 'file' },
    { name: 'eduSpouse12th', label: 'Education (Spouse) - 12th', type: 'file' },
    { name: 'eduSpouseBachelors', label: 'Education (Spouse) - Bachelors', type: 'file' },
    { name: 'eduSpouseMasters', label: 'Education (Spouse) - Masters', type: 'file' },
    { name: 'eduSpousePhd', label: 'Education (Spouse) - PhD', type: 'file' },
    { name: 'eduMisc', label: 'Education - Miscellaneous Documents', type: 'file' },
    { name: 'expPrimary1', label: 'Experience (Primary) - Employment 1', type: 'file' },
    { name: 'expPrimary2', label: 'Experience (Primary) - Employment 2', type: 'file' },
    { name: 'expPrimary3', label: 'Experience (Primary) - Employment 3', type: 'file' },
    { name: 'expSpouse1', label: 'Experience (Spouse) - Employment 1', type: 'file' },
    { name: 'expSpouse2', label: 'Experience (Spouse) - Employment 2', type: 'file' },
    { name: 'expSpouse3', label: 'Experience (Spouse) - Employment 3', type: 'file' },
    { name: 'resumePrimary', label: 'Resume - Primary Applicant', type: 'file' },
    { name: 'resumeSpouse', label: 'Resume - Spouse', type: 'file' },
    { name: 'hasCanadianExperience', label: 'Has Canadian Experience?', type: 'select', options: yesNoOptions },
    { name: 'canadianOfferLetter', label: 'Canadian Experience - Offer Letter', type: 'file' },
    { name: 'documentsComments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  expressEntry: [
    { name: 'eeDocReceDate', label: 'Documents Received', type: 'date', required: true },
    { name: 'eeDocSts', label: 'Document Status', type: 'select', options: documentStatusOptions, required: true },
    { name: 'eeEoiRef', label: 'EOI Reference', required: true },
    { name: 'eeEoiValidTill', label: 'EOI Valid Till', type: 'date' },
    { name: 'eePoint', label: 'Point Claimed in FSWP', type: 'number' },
    { name: 'eeNoc', label: 'NOC Code (Primary)' },
    { name: 'eeSecNoc', label: 'NOC Code (Secondary)' },
    { name: 'eeProfLauDate', label: 'Profile launched', type: 'date' },
    { name: 'eeProfExpDate', label: 'Profile Expiry', type: 'date' },
    { name: 'eeScore', label: 'CRS Points', type: 'number', required: true },
    { name: 'eestatus', label: 'Status', type: 'select', options: statusOptions, required: true },
    { name: 'pftype', label: 'Profile Type', type: 'select', options: ['Primary', 'Spouse', 'Both'] },
    { name: 'eeuid', label: 'App User ID' },
    { name: 'eeusrpsswrd', label: 'App Password' },
    { name: 'eeregemail', label: 'Registered Email ID' },
    { name: 'eeregpsswrd', label: 'Registered Password' },
    { name: 'eeFile', label: 'EOI Submission Document', type: 'file' },
  ],
  pnp: [
    { name: 'pnpDocReceDate', label: 'Documents Received', type: 'date' },
    { name: 'pnpDocSts', label: 'Document Status', type: 'select', options: documentStatusOptions },
    { name: 'province', label: 'Province' },
    { name: 'pnpApplyDate', label: 'Date Applied', type: 'date' },
    { name: 'pnpNominationDate', label: 'Nomination Date', type: 'date' },
    { name: 'pnpCertificateNo', label: 'Nomination Certificate No' },
    { name: 'pnpStatus', label: 'Status', type: 'select', options: statusOptions },
    { name: 'peiValidTill', label: 'PEI Application - Valid Till', type: 'date' },
    { name: 'peiPoints', label: 'PEI Application - Points', type: 'number' },
    { name: 'sinpValidTill', label: 'SINP Application - Valid Till', type: 'date' },
    { name: 'sinpPoints', label: 'SINP Application - Points', type: 'number' },
    { name: 'quebecValidity', label: 'Quebec Submission - Validity', type: 'date' },
    { name: 'pnpFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  ita: [
    { name: 'itaDate', label: 'ITA Received Date', type: 'date', required: true },
    { name: 'itaScore', label: 'CRS score at invitation', type: 'number' },
    { name: 'itaSubmitDate', label: 'Application Submitted Date', type: 'date' },
    { name: 'medicalDate', label: 'Medical Examination Date', type: 'date' },
    { name: 'documentChecklist', label: 'Document Checklist Status', type: 'select', options: documentStatusOptions },
    { name: 'itaStatus', label: 'ITA Status', type: 'select', options: statusOptions, required: true },
    { name: 'itaFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  visaGrant: [
    { name: 'grantDate', label: 'Visa Grant Date', type: 'date' },
    { name: 'visaType', label: 'Visa Type' },
    { name: 'visaExpiryDate', label: 'Visa Expiry Date', type: 'date' },
    { name: 'passportSubmissionDate', label: 'Passport Submission Date', type: 'date' },
    { name: 'coprNumber', label: 'COPR Number' },
    { name: 'copr_a', label: 'COPR Review', type: 'select', options: approvedOptions },
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
    { name: 'postLandingFile', label: 'Document File', type: 'file' },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  postIta: [
    { name: 'itaAckReceiptDate', label: 'ITA Acknowledgement Receipt Date', type: 'date', required: true },
    { name: 'itaAckReceiptFile', label: 'ITA Acknowledgement Receipt', type: 'file', required: true },
    { name: 'piExpPrimary1Referral', label: 'Experience (Primary) Employment 1 - Referral Letter', type: 'file' },
    { name: 'piExpPrimary1Payslips', label: 'Experience (Primary) Employment 1 - Payslips', type: 'file' },
    { name: 'piExpPrimary1Itr', label: 'Experience (Primary) Employment 1 - ITR', type: 'file' },
    { name: 'piExpPrimary2Referral', label: 'Experience (Primary) Employment 2 - Referral Letter', type: 'file' },
    { name: 'piExpPrimary2Payslips', label: 'Experience (Primary) Employment 2 - Payslips', type: 'file' },
    { name: 'piExpPrimary2Itr', label: 'Experience (Primary) Employment 2 - ITR', type: 'file' },
    { name: 'piExpSpouse1Referral', label: 'Experience (Spouse) Employment 1 - Referral Letter', type: 'file' },
    { name: 'piExpSpouse1Payslips', label: 'Experience (Spouse) Employment 1 - Payslips', type: 'file' },
    { name: 'piExpSpouse1Itr', label: 'Experience (Spouse) Employment 1 - ITR', type: 'file' },
    { name: 'piHasCanadianExperience', label: 'Has Canadian Experience?', type: 'select', options: yesNoOptions },
    { name: 'piCanadianOfferLetter', label: 'Canadian Experience - Offer Letter', type: 'file' },
    { name: 'piCanadianReferralLetter', label: 'Canadian Experience - Referral Letter', type: 'file' },
    { name: 'piCanadianPayStubs', label: 'Canadian Experience - Pay Stubs', type: 'file' },
    { name: 'piCanadianNoa', label: 'Canadian Experience - NOA', type: 'file' },
    { name: 'piCanadianT4', label: 'Canadian Experience - T4', type: 'file' },
    { name: 'piFundsDocuments', label: 'Funds Documents', type: 'file' },
    { name: 'piPcc', label: 'PCC (Police Clearance Certificate)', type: 'file' },
    { name: 'piMedicals', label: 'Medicals', type: 'file' },
    { name: 'piMisc', label: 'Miscellaneous Documents', type: 'file' },
    { name: 'postItaComments', label: 'Comments', type: 'textarea', span: 'full' },
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
  remark: [
    { name: 'remarkDate', label: 'Remark Date', type: 'date' },
    { name: 'remarkType', label: 'Remark Type', type: 'select', options: ['Case Progress', 'Client Communication', 'Observation', 'Escalation'] },
    { name: 'remark', label: 'Remark', type: 'textarea', span: 'full', required: true },
  ],
  conversation: [
    { name: 'conversationDate', label: 'Conversation Date', type: 'date', required: true, todayOnly: true },
    { name: 'conversation_type', label: 'Type of Conversation', type: 'select', options: conversationTypes, required: true },
    { name: 'confollowdate', label: 'Follow up Conversation', type: 'date' },
    { name: 'conversationStatus', label: 'Status', type: 'select', options: ['Open', 'Closed'] },
    { name: 'conversation', label: 'Conversation', type: 'textarea', span: 'full', required: true },
  ],
  docReview: [
    { name: 'con_mark_sheet_m_a', label: 'Consolidated Mark Sheet - Masters', type: 'select', options: approvedOptions },
    { name: 'con_mark_sheet_b_a', label: 'Consolidated Mark Sheet - Bachelors', type: 'select', options: approvedOptions },
    { name: 'ind_mark_sheet_m_a', label: 'Individual Mark Sheet - Masters', type: 'select', options: approvedOptions },
    { name: 'ind_mark_sheet_b_a', label: 'Individual Mark Sheet - Bachelors', type: 'select', options: approvedOptions },
    { name: 'revised_eca_m_a', label: 'Revised ECA - Masters', type: 'select', options: approvedOptions },
    { name: 'revised_eca_b_a', label: 'Revised ECA - Bachelors', type: 'select', options: approvedOptions },
    { name: 'revised_wes_eca_m_a', label: 'Revised WES ECA - Masters', type: 'select', options: approvedOptions },
    { name: 'revised_wes_eca_b_a', label: 'Revised WES ECA - Bachelors', type: 'select', options: approvedOptions },
    { name: 'conv_cert_m_a', label: 'Convocation Certificate - Masters', type: 'select', options: approvedOptions },
    { name: 'conv_cert_b_a', label: 'Convocation Certificate - Bachelors', type: 'select', options: approvedOptions },
    { name: 'eca_m_a', label: 'ECA - Masters', type: 'select', options: approvedOptions },
    { name: 'eca_b_a', label: 'ECA - Bachelors', type: 'select', options: approvedOptions },
    { name: 'intermediate_a', label: 'Intermediate', type: 'select', options: approvedOptions },
    { name: 'ssc_a', label: 'SSC', type: 'select', options: approvedOptions },
    { name: 'educationReviewNotes', label: 'Review Notes', type: 'textarea', span: 'full' },
  ],
  statusUpdate: [
    { name: 'cstat', label: 'Status Category', type: 'select', options: ['eca', 'pnp'] },
    { name: 'status_c', label: 'Status Update', type: 'textarea', span: 'full', required: true },
    { name: 'status_f', label: 'Status File', type: 'file' },
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
  locked?: boolean;
  lockedMessage?: string;
  onFieldChange: (field: StageField, value: any) => void;
  onSaveDraft: () => Promise<void>;
  onBack: () => void;
  onContinue: () => Promise<void>;
}) {
  const [localSaving, setLocalSaving] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);

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
    const isReadOnly = field.readOnly || locked;
    const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-500';
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
            readOnly={isReadOnly}
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
            disabled={isReadOnly}
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
            <a href={uploaded.url} target="_blank" className="mb-2 block text-xs font-medium text-red-700 hover:text-red-900">
              View uploaded file
            </a>
          )}
          <input
            type="file"
            onChange={(event) => onFieldChange(field, event.target.files?.[0] || null)}
            disabled={locked}
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
          readOnly={isReadOnly}
          min={field.type === 'date' && field.todayOnly ? todayIso : undefined}
          max={field.type === 'date' && field.todayOnly ? todayIso : undefined}
          className={inputClass}
          placeholder={field.label}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{description}</p>
        <p className="text-sm text-red-600 mt-2">Required fields are marked from the legacy ops_skill_canada.php stage requirements.</p>
      </div>

      {locked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {lockedMessage || 'You do not have permission to edit this stage.'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(renderField)}
        {!locked && missingRequired.length > 0 && (
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
                setContinuing(true);
                try {
                  await onContinue();
                } finally {
                  setContinuing(false);
                }
              }}
              disabled={continuing}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center font-medium"
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

export default function SkillCanadaOperationsWizard({
  opportunityId,
  leadId,
  clientName
}: SkillCanadaOperationsWizardProps) {
  const { hasRole } = useAuth();
  const canEditConversation = ['operation_manager', 'admin', 'administrator', 'super_admin'].some((role) => hasRole(role));
  const [activeStage, setActiveStage] = useState('personal');

  const [stages, setStages] = useState<OperationsStage[]>([
    { id: 'personal', name: 'Personal Details', icon: User, status: 'current' },
    { id: 'documents', name: 'Documents', icon: FolderOpen, status: 'pending' },
    { id: 'eca', name: 'ECA', icon: Award, status: 'pending' },
    { id: 'spouse-eca', name: 'Spouse ECA', icon: Award, status: 'pending' },
    { id: 'language', name: 'Language Proficiency', icon: FileText, status: 'pending' },
    { id: 'spouse-language', name: 'Language (Spouse)', icon: FileText, status: 'pending' },
    { id: 'express-entry', name: 'Express Entry', icon: GlobeIcon, status: 'pending' },
    { id: 'pnp', name: 'PnP', icon: MapPin, status: 'pending' },
    { id: 'ita', name: 'ITA', icon: Send, status: 'pending' },
    { id: 'post-ita', name: 'Post ITA', icon: Inbox, status: 'pending' },
    { id: 'aor', name: 'AOR', icon: ScrollText, status: 'pending' },
    { id: 'approval-refusal', name: 'Approval/Refusal', icon: CheckCircle, status: 'pending' },
    { id: 'visa-grant', name: 'Visa Grant', icon: CheckCircle, status: 'pending' },
    { id: 'post-landing', name: 'Post Landing', icon: TrendingUp, status: 'pending' },
    { id: 'closure', name: 'Closure', icon: FlagOff, status: 'pending' },
    { id: 'remark', name: 'Remark', icon: FileEdit, status: 'pending' },
    { id: 'conversation', name: 'Conversation', icon: MessageCircle, status: 'pending' },
    { id: 'doc-review', name: 'Document Review', icon: Files, status: 'pending' },
    { id: 'status-update', name: 'Status Update', icon: BarChart, status: 'pending' },
    { id: 'live-chat', name: 'Live Chat', icon: MessageSquare, status: 'pending' },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck, status: 'pending' },
  ]);

  const [stageData, setStageData] = useState<Record<string, any>>({
    personal: {}, documents: {}, eca: {}, spouseEca: {}, language: {}, spouseLanguage: {},
    expressEntry: {}, pnp: {}, ita: {}, postIta: {}, aor: {}, approvalRefusal: {}, visaGrant: {}, postLanding: {},
    closure: {}, remark: {}, conversation: {}, docReview: {}, statusUpdate: {}
  });
  const { data: savedStages } = useOperationStages('skill-canada', leadId, opportunityId);
  const saveStage = useSaveOperationStage('skill-canada', leadId, opportunityId);

  useEffect(() => {
    if (!savedStages?.data) return;
    // The save API keys rows by the raw kebab-case stage id (e.g.
    // 'spouse-eca'), but every read/write elsewhere in this component uses
    // the camelCase dataKey ('spouseEca'). Left unconverted, loaded data
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
        const params = new URLSearchParams({ module: 'skill-canada', leadId: String(leadId), limit: '1' });
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
        console.error('Failed to load Skill Canada client details:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [leadId, clientName]);

  const saveStageData = async () => {
    try {
      const dataKey = activeStage.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      await saveStage.mutateAsync({ stage: activeStage, data: await uploadOperationFiles(stageData[dataKey] || stageData[activeStage] || {}, 'skill-canada', leadId) });
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
      'documents': { title: 'Documents', description: 'Passport (primary/spouse/children), education documents (primary and spouse - 10th, 12th, Bachelors, Masters, PhD), experience documents per employment for primary and spouse, resumes, and Canadian-experience offer letter.', dataKey: 'documents' },
      'eca': { title: 'ECA (Educational Credential Assessment)', description: 'ECA package details including receipt date, source (PA/Spouse), document status, assessment body (WES/ICAS/IQAS/MCC/PEBC/ICES/CES), application date, payment mode, transcript details, status, and completion date. Add qualifications with university, specialization, and rating.', dataKey: 'eca' },
      'spouse-eca': { title: 'Spouse ECA', description: 'Educational credential assessment for spouse including all qualification details, transcript status, assessment body selection, and completion tracking.', dataKey: 'spouseEca' },
      'language': { title: 'Language Proficiency', description: 'Language test details including test type (IELTS AT/GT, PTE, TOEFL iBT, OET, CAE), status (Pending/Completed/Insufficient/Registered), test date, expiry date, test score, and individual scores for Reading, Writing, Listening, Speaking. Multiple test entries supported.', dataKey: 'language' },
      'spouse-language': { title: 'Language Proficiency (Spouse)', description: 'Spouse language test information including test type, scores, dates, and proficiency levels across all four skills.', dataKey: 'spouseLanguage' },
      'express-entry': { title: 'Express Entry', description: 'Express Entry profile including EOI reference, EOI valid till, CRS points, NOC codes, profile dates, and the EOI submission upload.', dataKey: 'expressEntry' },
      'pnp': { title: 'Provincial Nominee Program', description: 'PnP application including province selection, nomination status and dates, plus PEI (valid till + points), SINP (valid till + points), and Quebec submission validity.', dataKey: 'pnp' },
      'ita': { title: 'Invitation to Apply', description: 'ITA details including invitation date, CRS score at invitation, application submission date, document checklist, and medical examination details.', dataKey: 'ita' },
      'post-ita': { title: 'Post ITA', description: 'ITA acknowledgement receipt, post-ITA experience documents (referral letters, payslips, ITR per employment for primary and spouse), Canadian-experience documents (offer letter, referral letter, pay stubs, NOA, T4), funds documents, PCC, medicals, and miscellaneous documents.', dataKey: 'postIta' },
      'aor': { title: 'AOR', description: 'Acknowledgement of Receipt issued after ITA submission.', dataKey: 'aor' },
      'approval-refusal': { title: 'Approval / Refusal', description: 'The final decision on the application, including refusal reason when applicable and the decision letter.', dataKey: 'approvalRefusal' },
      'visa-grant': { title: 'Visa Grant', description: 'Final visa approval including grant date, visa type, expiry date, passport submission, COPR details, and landing instructions.', dataKey: 'visaGrant' },
      'post-landing': { title: 'Post Landing Services', description: 'Settlement services including SIN application, bank account setup, health card, job search assistance, and accommodation support.', dataKey: 'postLanding' },
      'closure': { title: 'Closure', description: 'Case closure with reason (visa approved & completed, client withdrew, refused, non-payment, other) and closure notes.', dataKey: 'closure' },
      'remark': { title: 'Remarks', description: 'General remarks and notes about the case progress, client communication, and important observations.', dataKey: 'remark' },
      'conversation': { title: 'Conversation History', description: 'Email conversations including date, conversation type (Walk-in/Inbound/Outbound/Email), conversation details, follow-up remarks, follow-up date, and conversation status.', dataKey: 'conversation' },
      'doc-review': { title: 'Document Review', description: 'Complete document review including education documents, employment records, financial statements, and all supporting documentation.', dataKey: 'docReview' },
      'status-update': { title: 'Status Update', description: 'Case status updates including current stage, progress notes, next steps, and client communication updates. Upload status files and track milestones.', dataKey: 'statusUpdate' }
    };

    const currentStage = stageMap[activeStage];
    if (!currentStage) return null;
    const dataKey = currentStage.dataKey;
    const isConversationStage = activeStage === 'conversation';

    return (
      <GenericStage
        title={currentStage.title}
        description={currentStage.description}
        fields={stageFieldMap[dataKey] || []}
        data={stageData[dataKey] || {}}
        isFirstStage={activeStage === stages[0]?.id}
        isLastStage={activeStage === stages[stages.length - 1]?.id}
        locked={isConversationStage && !canEditConversation}
        lockedMessage="Only Operations Managers can add or edit conversation entries."
        onFieldChange={(field, value) => updateStageData(dataKey, { ...(stageData[dataKey] || {}), [field.name]: value })}
        onSaveDraft={saveStageData}
        onBack={moveToPreviousStage}
        onContinue={async () => {
          await saveStageData();
          if (activeStage === stages[stages.length - 1].id) {
            window.toast.success('Skill Canada Operations Completed Successfully!');
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
              <h1 className="text-2xl font-bold text-gray-900">Skill Canada Operations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
            <MapPin className="text-red-600" size={48} />
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
                        ? 'bg-red-600 text-white shadow-md'
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
