'use client';

import { Briefcase, ClipboardCheck, FolderOpen, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface WorkOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Briefcase },
  { id: 'workDetails', name: 'Work Details', icon: Briefcase },
  { id: 'status', name: 'Application Status', icon: ClipboardCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'financials', name: 'Financials', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage([
    { name: 'targetCountry', label: 'Target Country', required: true },
    { name: 'education', label: 'Education' },
    { name: 'profession', label: 'Profession' },
  ]),
  workDetails: [
    { name: 'category', label: 'Work Category', required: true },
    { name: 'subCategory', label: 'Sub-Category' },
    { name: 'experience', label: 'Years of Experience' },
    { name: 'certifications', label: 'Certifications' },
    { name: 'skills', label: 'Skills' },
    { name: 'languages', label: 'Languages' },
    { name: 'salaryExpectation', label: 'Salary Expectation' },
    { name: 'jobType', label: 'Job Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract'] },
    { name: 'availability', label: 'Availability' },
  ],
  status: [
    { name: 'initialConsultation', label: 'Initial Consultation', type: 'select', options: statusOptions, required: true },
    { name: 'documentCollection', label: 'Document Collection', type: 'select', options: statusOptions },
    { name: 'jobSearch', label: 'Job Search', type: 'select', options: statusOptions },
    { name: 'interviews', label: 'Interviews', type: 'select', options: statusOptions },
    { name: 'jobOffer', label: 'Job Offer', type: 'select', options: statusOptions },
    { name: 'workPermitStatus', label: 'Work Permit', type: 'select', options: statusOptions },
    { name: 'relocation', label: 'Relocation', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'resumeFile', label: 'Resume', type: 'file', required: true },
    { name: 'certificatesFile', label: 'Certificates', type: 'file' },
    { name: 'workReferencesFile', label: 'Work References', type: 'file' },
    { name: 'policeClearanceFile', label: 'Police Clearance', type: 'file' },
    { name: 'medicalCertificateFile', label: 'Medical Certificate', type: 'file' },
    { name: 'languageTestFile', label: 'Language Test', type: 'file' },
    { name: 'workPermitFile', label: 'Work Permit', type: 'file' },
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
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Placed', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact, target country, education, and profession.', dataKey: 'personal' },
  workDetails: { title: 'Work Details', description: 'Work category, experience, certifications, skills, languages, and job preferences.', dataKey: 'workDetails' },
  status: { title: 'Application Status', description: 'Consultation, document collection, job search, interviews, job offer, work permit, and relocation tracking.', dataKey: 'status' },
  documents: { title: 'Documents', description: 'Resume, certificates, work references, police clearance, medical, language test, and work permit.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function WorkOperationsWizard(props: WorkOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="work"
      pageTitle="Work Operations"
      headerIcon={Briefcase}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
