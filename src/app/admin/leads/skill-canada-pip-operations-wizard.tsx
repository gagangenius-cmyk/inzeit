'use client';

import { Award, ClipboardCheck, FolderOpen, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface SkillCanadaPipOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Pending', 'In Progress', 'Approved', 'Rejected', 'Cancelled'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Award },
  { id: 'profile', name: 'Occupation & Language', icon: Award },
  { id: 'points', name: 'CRS Points Breakdown', icon: ClipboardCheck },
  { id: 'eoi', name: 'EOI / Invitation', icon: ClipboardCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'financials', name: 'Financials', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage([
    { name: 'targetCountry', label: 'Target Province/Country', required: true },
  ]),
  profile: [
    { name: 'occupation', label: 'Occupation', required: true },
    { name: 'nocCode', label: 'NOC Code', required: true },
    { name: 'workExperience', label: 'Years of Work Experience', type: 'number' },
    { name: 'education', label: 'Education Level' },
    { name: 'englishTest', label: 'English Test', type: 'select', options: ['IELTS(AT)', 'IELTS(GT)', 'PTE', 'TOEFL iBT', 'CELPIP'] },
    { name: 'englishReading', label: 'English - Reading', type: 'number' },
    { name: 'englishWriting', label: 'English - Writing', type: 'number' },
    { name: 'englishListening', label: 'English - Listening', type: 'number' },
    { name: 'englishSpeaking', label: 'English - Speaking', type: 'number' },
    { name: 'frenchReading', label: 'French - Reading (if any)', type: 'number' },
    { name: 'frenchWriting', label: 'French - Writing (if any)', type: 'number' },
    { name: 'frenchListening', label: 'French - Listening (if any)', type: 'number' },
    { name: 'frenchSpeaking', label: 'French - Speaking (if any)', type: 'number' },
  ],
  points: [
    { name: 'ptsAge', label: 'Age Points', type: 'number' },
    { name: 'ptsEducation', label: 'Education Points', type: 'number' },
    { name: 'ptsLanguage', label: 'Language Points', type: 'number' },
    { name: 'ptsWorkExperience', label: 'Work Experience Points', type: 'number' },
    { name: 'ptsAdaptability', label: 'Adaptability Points', type: 'number' },
    { name: 'ptsSkillsTransferability', label: 'Skills Transferability Points', type: 'number' },
    { name: 'ptsProvincialNomination', label: 'Provincial Nomination Points', type: 'number' },
    { name: 'ptsJobOffer', label: 'Job Offer Points', type: 'number' },
    { name: 'crsScore', label: 'Total CRS Score', type: 'number', required: true },
    { name: 'cutoffScore', label: 'Latest Draw Cut-off Score', type: 'number' },
    { name: 'rank', label: 'Rank / Comparison Notes' },
  ],
  eoi: [
    { name: 'eoiStatus', label: 'EOI Status', type: 'select', options: ['Submitted', 'Invited', 'Accepted', 'Expired'], required: true },
    { name: 'submissionDate', label: 'Submission Date', type: 'date' },
    { name: 'invitationDate', label: 'Invitation Date', type: 'date' },
    { name: 'applicationStatus', label: 'Application Status', type: 'select', options: statusOptions, required: true },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'passportFile', label: 'Passport', type: 'file', required: true },
    { name: 'languageTestFile', label: 'Language Test Results', type: 'file' },
    { name: 'educationDocsFile', label: 'Education Documents', type: 'file' },
    { name: 'eoiSubmissionFile', label: 'EOI Submission Document', type: 'file' },
  ],
  financials: [
    { name: 'serviceFee', label: 'Service Fee', type: 'number', required: true },
    { name: 'paidAmount', label: 'Paid Amount', type: 'number' },
    { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Pending', 'Partial', 'Paid', 'Overdue'], required: true },
  ],
  conversation: [
    { name: 'conversationDate', label: 'Conversation Date', type: 'date', required: true },
    { name: 'conversationType', label: 'Conversation Type', type: 'select', options: ['Call', 'Email', 'WhatsApp', 'In-Person', 'Video Call'] },
    { name: 'conversationStatus', label: 'Status', type: 'select', options: ['Open', 'Follow-up Required', 'Resolved'] },
    { name: 'conversation', label: 'Conversation Notes', type: 'textarea', span: 'full', required: true },
    { name: 'followupDate', label: 'Follow-up Date', type: 'date' },
    { name: 'followupRemarks', label: 'Follow-up Remarks', type: 'textarea', span: 'full' },
  ],
  remark: [
    { name: 'remarkDate', label: 'Remark Date', type: 'date' },
    { name: 'remark', label: 'Remark', type: 'textarea', span: 'full', required: true },
  ],
  closure: [
    { name: 'closureDate', label: 'Closure Date', type: 'date' },
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Invited & Approved', 'Client Withdrew', 'Rejected', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact and case information.', dataKey: 'personal' },
  profile: { title: 'Occupation & Language', description: 'NOC code, work experience, education, and English/French test scores.', dataKey: 'profile' },
  points: { title: 'CRS Points Breakdown', description: 'Points by category (age, education, language, work experience, adaptability, skills transferability, provincial nomination, job offer) and total CRS score vs. cut-off.', dataKey: 'points' },
  eoi: { title: 'EOI / Invitation', description: 'Expression of Interest status, submission/invitation dates, and application status.', dataKey: 'eoi' },
  documents: { title: 'Documents', description: 'Passport, language test results, education documents, and EOI submission.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function SkillCanadaPipOperationsWizard(props: SkillCanadaPipOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="skill-canada-pip"
      pageTitle="Skill Canada PIP Operations"
      headerIcon={Award}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
