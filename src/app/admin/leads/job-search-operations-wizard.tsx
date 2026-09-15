'use client';

import { Search, ClipboardCheck, FolderOpen, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface JobSearchOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Search },
  { id: 'profile', name: 'Job Profile', icon: ClipboardCheck },
  { id: 'status', name: 'Application Status', icon: ClipboardCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'financials', name: 'Financials', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage([
    { name: 'education', label: 'Education' },
    { name: 'experience', label: 'Years of Experience' },
  ]),
  profile: [
    { name: 'currentPosition', label: 'Current Position', required: true },
    { name: 'yearsExperience', label: 'Years of Experience', type: 'number' },
    { name: 'skills', label: 'Skills' },
    { name: 'salaryExpectation', label: 'Salary Expectation' },
    { name: 'jobType', label: 'Job Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Remote'] },
    { name: 'availability', label: 'Availability' },
    { name: 'targetCompanies', label: 'Target Companies' },
    { name: 'preferredLocations', label: 'Preferred Locations' },
  ],
  status: [
    { name: 'profileCreation', label: 'Profile Creation', type: 'select', options: statusOptions, required: true },
    { name: 'resumeOptimization', label: 'Resume Optimization', type: 'select', options: statusOptions },
    { name: 'jobApplications', label: 'Job Applications', type: 'select', options: statusOptions },
    { name: 'interviews', label: 'Interviews', type: 'select', options: statusOptions },
    { name: 'offers', label: 'Offers', type: 'select', options: statusOptions },
    { name: 'visaSponsorship', label: 'Visa Sponsorship', type: 'select', options: statusOptions },
    { name: 'relocation', label: 'Relocation', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'resumeFile', label: 'Resume', type: 'file', required: true },
    { name: 'coverLetterFile', label: 'Cover Letter', type: 'file' },
    { name: 'portfolioFile', label: 'Portfolio', type: 'file' },
    { name: 'certificatesFile', label: 'Certificates', type: 'file' },
    { name: 'referencesFile', label: 'References', type: 'file' },
    { name: 'visaDocumentsFile', label: 'Visa Documents', type: 'file' },
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
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Job Placed', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact, education, and experience.', dataKey: 'personal' },
  profile: { title: 'Job Profile', description: 'Current position, skills, salary expectation, job type, and target companies/locations.', dataKey: 'profile' },
  status: { title: 'Application Status', description: 'Profile creation, resume optimization, applications, interviews, offers, visa sponsorship, and relocation tracking.', dataKey: 'status' },
  documents: { title: 'Documents', description: 'Resume, cover letter, portfolio, certificates, references, and visa documents.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function JobSearchOperationsWizard(props: JobSearchOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="job-search"
      pageTitle="Job Search Operations"
      headerIcon={Search}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
