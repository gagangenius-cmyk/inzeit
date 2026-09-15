'use client';

import { useEffect, useState } from 'react';
import { uploadOperationFiles } from '@/lib/operationsData';
import { useOperationStages, useSaveOperationStage } from '@/hooks/useOperationsQueries';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, Award, CheckCircle, Target,
  ClipboardList, Shield, Briefcase, Users, ChevronRight, ChevronLeft, Save, FolderCheck, MessageSquare
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';

const CLIENT_DOCUMENTS_STAGE_ID = 'client-documents';

interface RMSOperationsWizardProps {
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

const educationOptions = ['Under 10th', '10th Pass', '12th Pass', 'Bachelors', 'Diploma', 'Masters', 'PHD'];
const relocationOptions = ['Yes, anywhere', 'Yes, specific locations only', 'No, current location only'];
const companySizeOptions = ['Startup (<50)', 'Mid-size (50-500)', 'Large/Enterprise (500+)', 'No preference'];
const workArrangementOptions = ['Remote', 'Hybrid', 'On-site', 'No preference'];
const completeIncompleteOptions = ['Complete', 'Incomplete'];
const jobRegStatusOptions = ['Pending', 'submitted', 'under review', 'Sent for filing', 'Completed'];
const pnpOptions = ['PEI', 'Nova Scotia', 'New Brunswick', 'Saskatchewan', 'Quebec', 'Manitoba', 'Ontario', 'British Columbia', 'Alberta', 'Yukon'];
const recruiterStatusOptions = ['IN PROGRESS', 'Submitted', 'APPROVED', 'Rejected'];
const prescreeningStatusOptions = ['Scheduled', 'Completed', 'Pending', 'Rescheduled'];
const interviewModeOptions = ['Zoom', 'Telephonic', 'In-Person'];
const currentStatusOptions = ['In Progress', 'Documents Pending', 'Under Review', 'Approved', 'On Hold', 'Completed'];

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
    { name: 'service_interest', label: 'Service Interested', readOnly: true },
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
    { name: 'personalFile', label: 'Document File', type: 'file' },
  ],
  // Fields from the RMS Client Intake Form.
  intake: [
    { name: 'currentLocation', label: 'Current Location (City, State/Country)' },
    { name: 'linkedinUrl', label: 'LinkedIn Profile URL' },
    { name: 'openToRelocation', label: 'Open to Relocation?', type: 'select', options: relocationOptions },
    { name: 'specificLocations', label: 'If specific locations, please list' },
    { name: 'targetJobTitles', label: 'Target Job Title(s)' },
    { name: 'targetIndustries', label: 'Target Industries' },
    { name: 'preferredCompanySize', label: 'Preferred Company Size', type: 'select', options: companySizeOptions },
    { name: 'preferredWorkArrangement', label: 'Preferred Work Arrangement', type: 'select', options: workArrangementOptions },
    { name: 'currentSalary', label: 'Current Salary / CTC' },
    { name: 'expectedSalary', label: 'Expected Salary / CTC Range' },
    { name: 'noticePeriod', label: 'Earliest Availability / Notice Period' },
    { name: 'totalYearsExperience', label: 'Total Years of Experience', type: 'number' },
    { name: 'currentJobTitleCompany', label: 'Current / Most Recent Job Title & Company' },
    { name: 'keyResponsibilities', label: 'Key Responsibilities in Current/Recent Role', type: 'textarea', span: 'full' },
    { name: 'teamSizeManaged', label: 'Team Size Managed (direct/indirect reports)' },
    { name: 'topAchievements', label: 'Top 3 Achievements (with numbers/metrics)', type: 'textarea', span: 'full' },
    { name: 'employmentGaps', label: 'Any employment gaps?', type: 'textarea', span: 'full' },
    { name: 'coreSkills', label: 'Core Technical/Functional Skills', type: 'textarea', span: 'full' },
    { name: 'certifications', label: 'Certifications / Licenses' },
    { name: 'highestEducation', label: 'Highest Education (degree, institution, year)' },
    { name: 'languagesSpoken', label: 'Languages Spoken' },
    { name: 'excludedCompanies', label: 'Companies/recruiters to NOT contact', type: 'textarea', span: 'full' },
    { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', span: 'full' },
    { name: 'intakeFile', label: 'Signed Intake Form', type: 'file' },
  ],
  resume: [
    { name: 'resumeDate', label: 'Resume Date', type: 'date' },
    { name: 'education', label: 'Education Level', type: 'select', options: educationOptions, required: true },
    { name: 'draftResume', label: 'Draft Resume', type: 'file' },
    { name: 'uploadPassport', label: 'Upload Passport', type: 'file' },
    { name: 'uploadEducation', label: 'Education Document', type: 'file' },
    { name: 'nationalId', label: 'National ID', type: 'file' },
    { name: 'level1Remarks', label: 'Level 1 Remarks', type: 'textarea', span: 'full' },
    { name: 'finalCopyResume', label: 'Final Copy of Resume (Level 2)', type: 'file' },
    { name: 'level2Remarks', label: 'Level 2 Remarks', type: 'textarea', span: 'full' },
  ],
  prescreening: [
    { name: 'prescreeningDateScheduled', label: 'Prescreening Date Scheduled', type: 'date' },
    { name: 'prescreeningStatus', label: 'Prescreening Status', type: 'select', options: prescreeningStatusOptions },
    { name: 'interviewMode', label: 'Interview Mode', type: 'select', options: interviewModeOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  jobregistration: [
    { name: 'frontendCaseHandover', label: 'Frontend Case Handover', type: 'select', options: completeIncompleteOptions },
    { name: 'documentStatus', label: 'Document Status', type: 'select', options: completeIncompleteOptions },
    { name: 'pointClaimedFSWP', label: 'Point Claimed in FSWP', type: 'number' },
    { name: 'nocConfirmed', label: 'NOC Confirmed by Client' },
    { name: 'profileLaunched', label: 'Profile Launched', type: 'date' },
    { name: 'profileExpiry', label: 'Profile Expiry', type: 'date' },
    { name: 'crsScores', label: 'CRS Scores', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: jobRegStatusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  recruiter: [
    { name: 'pnpLaunched', label: 'PNP Launched', type: 'select', options: pnpOptions },
    { name: 'eoiPoints', label: 'EOI Points', type: 'number' },
    { name: 'eoiSubmissionDate', label: 'EOI Submission Date', type: 'date' },
    { name: 'eoiExpiryDate', label: 'EOI Expiry Date', type: 'date' },
    { name: 'noiReceivedDate', label: 'NOI Received Date', type: 'date' },
    { name: 'noiSubmissionDate', label: 'NOI Submission Date', type: 'date' },
    { name: 'noiExpiryDate', label: 'NOI Expiry Date', type: 'date' },
    { name: 'nominationAwardedDate', label: 'Nomination Awarded Date', type: 'date' },
    { name: 'nominationExpiryDate', label: 'Nomination Expiry Date', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: recruiterStatusOptions },
    { name: 'comments', label: 'Comments', type: 'textarea', span: 'full' },
  ],
  status: [
    { name: 'currentStatus', label: 'Current Status', type: 'select', options: currentStatusOptions },
    { name: 'lastUpdated', label: 'Last Updated', type: 'date' },
    { name: 'statusNotes', label: 'Status Notes', type: 'textarea', span: 'full' },
    { name: 'nextAction', label: 'Next Action Required' },
    { name: 'nextActionDate', label: 'Next Action Date', type: 'date' },
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
              await onContinue();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
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

export default function RMSOperationsWizard({
  opportunityId,
  leadId,
  clientName
}: RMSOperationsWizardProps) {
  const [activeStage, setActiveStage] = useState('personal');

  const [stages, setStages] = useState<OperationsStage[]>([
    { id: 'personal', name: 'Personal Details', icon: User, status: 'current' },
    { id: 'intake', name: 'Client Intake', icon: ClipboardList, status: 'pending' },
    { id: 'resume', name: 'Resume Writing', icon: FileText, status: 'pending' },
    { id: 'prescreening', name: 'Prescreening', icon: Shield, status: 'pending' },
    { id: 'jobregistration', name: 'Job Registration', icon: Briefcase, status: 'pending' },
    { id: 'recruiter', name: 'Recruiter Interview', icon: Users, status: 'pending' },
    { id: 'status', name: 'Status Update', icon: Target, status: 'pending' },
    { id: 'live-chat', name: 'Live Chat', icon: MessageSquare, status: 'pending' },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck, status: 'pending' },
  ]);

  const [stageData, setStageData] = useState<Record<string, any>>({
    personal: {}, intake: {}, resume: {}, prescreening: {}, jobregistration: {}, recruiter: {}, status: {}
  });
  const { data: savedStages } = useOperationStages('rms', leadId, opportunityId);
  const saveStage = useSaveOperationStage('rms', leadId, opportunityId);

  useEffect(() => {
    if (savedStages?.data) setStageData((current) => ({ ...current, ...savedStages.data }));
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
        const params = new URLSearchParams({ module: 'rms', leadId: String(leadId), limit: '1' });
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
        console.error('Failed to load RMS client details:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [leadId, clientName]);

  const saveStageData = async () => {
    try {
      const dataKey = activeStage.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      await saveStage.mutateAsync({ stage: activeStage, data: await uploadOperationFiles(stageData[activeStage] || stageData[dataKey] || {}, 'rms', leadId) });
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
      'personal': { title: 'Personal Details', description: 'Client personal information including contact details, nationality, DOB, gender, country/service interest, counselor, case officer, retention date, agreement number, and branch details.', dataKey: 'personal' },
      'intake': { title: 'Client Intake Form', description: 'Resume Marketing Service intake: contact & relocation preferences, target role and career goals, work experience summary, skills & qualifications, marketing preferences, and additional notes.', dataKey: 'intake' },
      'resume': { title: 'Resume Writing', description: 'Documents received from client (resume draft, passport, education, national ID) and the final resume copy, tracked across Level 1 and Level 2 remarks.', dataKey: 'resume' },
      'prescreening': { title: 'Prescreening', description: 'Prescreening interview scheduling, status, and interview mode (Zoom, Telephonic, In-Person).', dataKey: 'prescreening' },
      'jobregistration': { title: 'Job Registration', description: 'Job registration and application details including document status, FSWP points, NOC, profile dates, and CRS scores.', dataKey: 'jobregistration' },
      'recruiter': { title: 'Recruiter Interview', description: 'PNP process tracking including EOI/NOI dates, points, nomination dates, and status.', dataKey: 'recruiter' },
      'status': { title: 'Status Update', description: 'Current case status, notes, and next required action with target date.', dataKey: 'status' },
    };

    const currentStage = stageMap[activeStage];
    if (!currentStage) return null;

    return (
      <GenericStage
        title={currentStage.title}
        description={currentStage.description}
        fields={stageFieldMap[currentStage.dataKey] || []}
        data={stageData[currentStage.dataKey] || {}}
        isFirstStage={activeStage === stages[0]?.id}
        isLastStage={activeStage === stages[stages.length - 1]?.id}
        onFieldChange={(field, value) => updateStageData(currentStage.dataKey, { ...(stageData[currentStage.dataKey] || {}), [field.name]: value })}
        onSaveDraft={saveStageData}
        onBack={moveToPreviousStage}
        onContinue={async () => {
          await saveStageData();
          if (activeStage === stages[stages.length - 1].id) {
            window.toast.success('RMS Operations Completed Successfully!');
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
              <h1 className="text-2xl font-bold text-gray-900">RMS Operations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
            <Award className="text-blue-600" size={48} />
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
