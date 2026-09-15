'use client';

import { Building2, ClipboardCheck, FolderOpen, DollarSign, FileEdit, FlagOff, MessageSquare } from 'lucide-react';
import OperationsWizardShell, { withPersonalStage, type StageField, type StageMeta, type WizardStage } from '@/components/operations/OperationsWizardShell';

interface IctCanadaOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

const statusOptions = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Rejected', 'Not Applicable'];

const stages: WizardStage[] = [
  { id: 'personal', name: 'Personal Details', icon: Building2 },
  { id: 'employment', name: 'Current Employment', icon: Building2 },
  { id: 'canadianCompany', name: 'Canadian Company', icon: Building2 },
  { id: 'status', name: 'Application Status', icon: ClipboardCheck },
  { id: 'documents', name: 'Documents', icon: FolderOpen },
  { id: 'financials', name: 'Financials', icon: DollarSign },
  { id: 'conversation', name: 'Conversation', icon: MessageSquare },
  { id: 'remark', name: 'Remark', icon: FileEdit },
  { id: 'closure', name: 'Closure', icon: FlagOff },
];

const stageFieldMap: Record<string, StageField[]> = {
  personal: withPersonalStage(),
  employment: [
    { name: 'currentPosition', label: 'Current Position', required: true },
    { name: 'yearsWithCompany', label: 'Years with Current Company', type: 'number' },
    { name: 'totalExperience', label: 'Total Years Experience', type: 'number' },
    { name: 'annualSalary', label: 'Current Annual Salary' },
    { name: 'companyIndustry', label: 'Company Industry' },
    { name: 'companySize', label: 'Company Size' },
  ],
  canadianCompany: [
    { name: 'companyName', label: 'Canadian Company Name', required: true },
    { name: 'businessNumber', label: 'Business Number' },
    { name: 'industry', label: 'Industry' },
    { name: 'location', label: 'Location' },
    { name: 'positionOffered', label: 'Position Offered' },
    { name: 'salaryOffered', label: 'Salary Offered' },
    { name: 'jobOfferDate', label: 'Job Offer Date', type: 'date' },
  ],
  status: [
    { name: 'initialConsultation', label: 'Initial Consultation', type: 'select', options: statusOptions, required: true },
    { name: 'documentCollection', label: 'Document Collection', type: 'select', options: statusOptions },
    { name: 'lmiaApplication', label: 'LMIA Application', type: 'select', options: statusOptions },
    { name: 'lmiaApproval', label: 'LMIA Approval', type: 'select', options: statusOptions },
    { name: 'workPermitApplication', label: 'Work Permit Application', type: 'select', options: statusOptions },
    { name: 'medicalExam', label: 'Medical Exam', type: 'select', options: statusOptions },
    { name: 'biometrics', label: 'Biometrics', type: 'select', options: statusOptions },
    { name: 'workPermitIssued', label: 'Work Permit Issued', type: 'select', options: statusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  documents: [
    { name: 'passportFile', label: 'Passport', type: 'file', required: true },
    { name: 'jobOfferLetterFile', label: 'Job Offer Letter', type: 'file' },
    { name: 'educationalCertificatesFile', label: 'Educational Certificates', type: 'file' },
    { name: 'workExperienceFile', label: 'Work Experience Documents', type: 'file' },
    { name: 'lmiaApprovalFile', label: 'LMIA Approval Document', type: 'file' },
    { name: 'medicalCertificateFile', label: 'Medical Certificate', type: 'file' },
    { name: 'biometricsFile', label: 'Biometrics Receipt', type: 'file' },
  ],
  financials: [
    { name: 'serviceFee', label: 'Service Fee', type: 'number', required: true },
    { name: 'governmentFees', label: 'Government Fees', type: 'number' },
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
    { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['Work Permit Issued', 'Client Withdrew', 'Refused', 'Non-Payment', 'Other'] },
    { name: 'closureNotes', label: 'Closure Notes', type: 'textarea', span: 'full' },
  ],
};

const stageMeta: Record<string, StageMeta> = {
  personal: { title: 'Personal Details', description: 'Client contact and case information.', dataKey: 'personal' },
  employment: { title: 'Current Employment', description: 'Applicant’s current position, tenure, experience, and employer details.', dataKey: 'employment' },
  canadianCompany: { title: 'Canadian Company', description: 'Receiving Canadian company details and job offer for the Intra-Company Transfer.', dataKey: 'canadianCompany' },
  status: { title: 'Application Status', description: 'Consultation, document collection, LMIA application/approval, work permit application, medical, biometrics, and issuance tracking.', dataKey: 'status' },
  documents: { title: 'Documents', description: 'Passport, job offer letter, educational certificates, work experience, LMIA approval, medical, and biometrics.', dataKey: 'documents' },
  financials: { title: 'Financials', description: 'Service fee, government fees, and payment tracking.', dataKey: 'financials' },
  conversation: { title: 'Conversation', description: 'Log client conversations, calls, and follow-ups for this case.', dataKey: 'conversation' },
  remark: { title: 'Remarks', description: 'General notes about the case progress.', dataKey: 'remark' },
  closure: { title: 'Closure', description: 'Case closure with reason and notes.', dataKey: 'closure' },
};

export default function IctCanadaOperationsWizard(props: IctCanadaOperationsWizardProps) {
  return (
    <OperationsWizardShell
      {...props}
      module="ict-canada"
      pageTitle="Canada ICT Operations"
      headerIcon={Building2}
      stages={stages}
      stageFieldMap={stageFieldMap}
      stageMeta={stageMeta}
    />
  );
}
