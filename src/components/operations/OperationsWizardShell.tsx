'use client';

import { useEffect, useState } from 'react';
import { uploadOperationFiles } from '@/lib/operationsData';
import { useOperationStages, useSaveOperationStage } from '@/hooks/useOperationsQueries';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Save, CheckCircle, FolderCheck, MessageCircle, Milestone, type LucideIcon } from 'lucide-react';
import ClientDocumentsPanel from './ClientDocumentsPanel';
import ClientChatPanel from './ClientChatPanel';
import CaseMilestonesPanel from './CaseMilestonesPanel';

// Every wizard built on this shell gets a "Client Documents" stage for free -
// it reviews the same crm_client_documents rows the client's portal
// document-upload page reads, so approve/reject/resubmit here is immediately
// visible to the client without a separate sync step.
const CLIENT_DOCUMENTS_STAGE_ID = '__clientDocuments';

// Same idea for chat: a two-way channel with the client's own portal chat
// (crm_client_conversations via /api/admin/operations/client-chat), so every
// wizard gets a live Chat tab without each module having to wire it up.
const CLIENT_CHAT_STAGE_ID = '__clientChat';

// Structured government reference/RFE/interview/decision/closure tracking -
// see docs/CASE_MILESTONES.md. Only skill-canada has any of this today
// (as bespoke stages); every other module gets it for free via this shared
// tab instead of 19 separate wizard-file edits.
const CASE_MILESTONES_STAGE_ID = '__caseMilestones';

export interface WizardStage {
  id: string;
  name: string;
  icon: LucideIcon;
}

export type StageFieldType = 'text' | 'date' | 'select' | 'textarea' | 'file' | 'number';

export interface StageField {
  name: string;
  label: string;
  type?: StageFieldType;
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
  span?: 'full';
}

export interface StageMeta {
  title: string;
  description: string;
  dataKey: string;
}

// The "personal" stage's readOnly fields are always prefilled from the same
// lead/opportunity row (via /api/admin/operations/search) that every
// leads/*-operations-wizard.tsx already uses — module only affects which
// crm_operation_stage_data rows come back, not the row shape itself, so this
// mapping is safe to share across every module.
const PERSONAL_FIELDS: StageField[] = [
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
];

export const withPersonalStage = (extra: StageField[] = []): StageField[] => [...PERSONAL_FIELDS, ...extra];

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

interface OperationsWizardShellProps {
  module: string;
  pageTitle: string;
  headerIcon: LucideIcon;
  opportunityId: number;
  leadId: number;
  clientName: string;
  stages: WizardStage[];
  stageFieldMap: Record<string, StageField[]>;
  stageMeta: Record<string, StageMeta>;
}

export default function OperationsWizardShell({
  module,
  pageTitle,
  headerIcon: HeaderIcon,
  opportunityId,
  leadId,
  clientName,
  stages: initialStages,
  stageFieldMap,
  stageMeta,
}: OperationsWizardShellProps) {
  const stagesWithClientDocuments: WizardStage[] = [
    ...initialStages,
    { id: CASE_MILESTONES_STAGE_ID, name: 'Case Milestones', icon: Milestone },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck },
    { id: CLIENT_CHAT_STAGE_ID, name: 'Chat', icon: MessageCircle },
  ];
  const [activeStage, setActiveStage] = useState(stagesWithClientDocuments[0]?.id || '');
  const [stages, setStages] = useState<Array<WizardStage & { status: 'pending' | 'current' | 'completed' }>>(
    stagesWithClientDocuments.map((stage, index) => ({ ...stage, status: index === 0 ? 'current' : 'pending' })),
  );

  const initialStageData = Object.fromEntries(Object.values(stageMeta).map((meta) => [meta.dataKey, {}]));
  const [stageData, setStageData] = useState<Record<string, any>>(initialStageData);

  const { data: savedStages } = useOperationStages(module, leadId, opportunityId);
  const saveStage = useSaveOperationStage(module, leadId, opportunityId);

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
        const params = new URLSearchParams({ module, leadId: String(leadId), limit: '1' });
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
        console.error(`Failed to load ${module} client details:`, error);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, clientName, module]);

  const saveStageData = async () => {
    try {
      await saveStage.mutateAsync({ stage: activeStage, data: await uploadOperationFiles(stageData[activeStage] || {}, module, leadId) });
    } catch (error) {
      console.error('Error saving:', error);
      throw error;
    }
  };

  const moveToNextStage = () => {
    const currentIndex = stages.findIndex((s) => s.id === activeStage);
    if (currentIndex < stages.length - 1) {
      const newStages = [...stages];
      newStages[currentIndex].status = 'completed';
      newStages[currentIndex + 1].status = 'current';
      setStages(newStages);
      setActiveStage(newStages[currentIndex + 1].id);
    }
  };

  const moveToPreviousStage = () => {
    const currentIndex = stages.findIndex((s) => s.id === activeStage);
    if (currentIndex > 0) {
      const newStages = [...stages];
      newStages[currentIndex].status = 'pending';
      newStages[currentIndex - 1].status = 'current';
      setStages(newStages);
      setActiveStage(newStages[currentIndex - 1].id);
    }
  };

  const updateStageData = (key: string, data: any) => {
    setStageData((prev) => ({ ...prev, [key]: data }));
  };

  const renderStageContent = () => {
    if (activeStage === CASE_MILESTONES_STAGE_ID) {
      return <CaseMilestonesPanel module={module} leadId={leadId} opportunityId={opportunityId} />;
    }
    if (activeStage === CLIENT_DOCUMENTS_STAGE_ID) {
      return <ClientDocumentsPanel leadId={leadId} opportunityId={opportunityId} />;
    }
    if (activeStage === CLIENT_CHAT_STAGE_ID) {
      return <ClientChatPanel leadId={leadId} opportunityId={opportunityId} />;
    }
    const currentStage = stageMeta[activeStage];
    if (!currentStage) return null;
    return (
      <GenericStage
        title={currentStage.title}
        description={currentStage.description}
        fields={stageFieldMap[currentStage.dataKey] || []}
        data={stageData[currentStage.dataKey] || {}}
        onFieldChange={(field, value) => updateStageData(currentStage.dataKey, { ...(stageData[currentStage.dataKey] || {}), [field.name]: value })}
        isFirstStage={activeStage === stages[0]?.id}
        isLastStage={activeStage === stages[stages.length - 1]?.id}
        onSaveDraft={saveStageData}
        onBack={moveToPreviousStage}
        onContinue={async () => {
          await saveStageData();
          if (activeStage === stages[stages.length - 1].id) {
            window.toast.success(`${pageTitle} Completed Successfully!`);
          } else {
            moveToNextStage();
          }
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
            <HeaderIcon className="text-blue-600" size={48} />
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
