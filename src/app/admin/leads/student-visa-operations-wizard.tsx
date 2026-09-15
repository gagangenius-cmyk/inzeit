'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useEffect, useState } from 'react';
import { loadOperationStages, uploadOperationFiles } from '@/lib/operationsData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, ClipboardCheck, FileEdit, Key,
  ChevronRight, ChevronLeft, Save, CheckCircle, BookOpen, FolderCheck, MessageSquare
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';

const CLIENT_DOCUMENTS_STAGE_ID = 'client-documents';

interface StudentVisaOperationsWizardProps {
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

function PersonalDetailsStage({ data, setData, saveStageData, moveToNextStage }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Personal Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
          <input
            type="tel"
            value={data.mobile}
            onChange={(e) => setData({ ...data, mobile: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
          <input
            type="text"
            value={data.nationality}
            onChange={(e) => setData({ ...data, nationality: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => setData({ ...data, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={data.dob}
            onChange={(e) => setData({ ...data, dob: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <SearchableSelect
            value={data.gender}
            onChange={(e) => setData({ ...data, gender: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </SearchableSelect>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country Interested</label>
          <input
            type="text"
            value={data.countryInterest}
            onChange={(e) => setData({ ...data, countryInterest: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Program Interested</label>
          <input
            type="text"
            value={data.programInterest}
            onChange={(e) => setData({ ...data, programInterest: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Retention Date</label>
          <input
            type="date"
            value={data.retentionDate}
            onChange={(e) => setData({ ...data, retentionDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry of Contract</label>
          <input
            type="date"
            value={data.contractExpiry}
            onChange={(e) => setData({ ...data, contractExpiry: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Agreement No</label>
          <input
            type="text"
            value={data.agreementNo}
            onChange={(e) => setData({ ...data, agreementNo: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            readOnly
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button
          onClick={async () => {
            await saveStageData();
            moveToNextStage();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
        >
          Continue to Documentation
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function DocumentationStage({ data, setData, saveStageData, moveToPreviousStage, moveToNextStage }: any) {
  const [localSaving, setLocalSaving] = useState(false);

  const handleSave = async () => {
    setLocalSaving(true);
    try {
      await saveStageData();
      window.toast.success('Documentation data saved successfully!');
    } catch (error) {
      window.toast.error('Failed to save data');
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Documentation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Submit Date</label>
          <input
            type="date"
            value={data.docSubmitDate}
            onChange={(e) => setData({ ...data, docSubmitDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Planned Travel Date</label>
          <input
            type="date"
            value={data.plannedTravelDate}
            onChange={(e) => setData({ ...data, plannedTravelDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Biometrics Required</label>
          <SearchableSelect
            value={data.biometricsRequired}
            onChange={(e) => setData({ ...data, biometricsRequired: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </SearchableSelect>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">University/College Name</label>
          <input
            type="text"
            value={data.universityName}
            onChange={(e) => setData({ ...data, universityName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
          <input
            type="file"
            multiple
            onChange={(e) => setData({ ...data, documents: [...(data.documents || []), ...Array.from(e.target.files || [])] })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {Array.isArray(data.documents) && data.documents.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{data.documents.length} file(s) selected</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Supported: PNG, JPEG, JPG, PDF, DOCX, DOC, XLS, XLSX (Max 5MB)
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={moveToPreviousStage}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back
        </button>
        <div className="flex gap-3">
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
              await saveStageData();
              moveToNextStage();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
          >
            Continue to Application
            <ChevronRight className="ml-2" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationStatusStage({ data, setData, saveStageData, moveToPreviousStage, moveToNextStage }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Application Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Documents Received</label>
          <input
            type="date"
            value={data.docReceiveDate}
            onChange={(e) => setData({ ...data, docReceiveDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application Submission</label>
          <SearchableSelect
            value={data.applicationSubmission}
            onChange={(e) => setData({ ...data, applicationSubmission: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </SearchableSelect>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application Status</label>
          <SearchableSelect
            value={data.applicationStatus}
            onChange={(e) => setData({ ...data, applicationStatus: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="In Process">In Process</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </SearchableSelect>
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Application Documents</label>
          <input
            type="file"
            multiple
            onChange={(e) => setData({ ...data, documents: [...(data.documents || []), ...Array.from(e.target.files || [])] })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {Array.isArray(data.documents) && data.documents.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{data.documents.length} file(s) selected</p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={moveToPreviousStage}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back
        </button>
        <button
          onClick={async () => {
            await saveStageData();
            moveToNextStage();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
        >
          Continue to Remark
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function RemarkStage({ data, setData, saveStageData, moveToPreviousStage, moveToNextStage }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Remarks</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Remark</label>
        <textarea
          value={data.remark}
          onChange={(e) => setData({ ...data, remark: e.target.value })}
          rows={6}
          placeholder="Enter any important notes or remarks about this student visa application..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={moveToPreviousStage}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back
        </button>
        <button
          onClick={async () => {
            await saveStageData();
            moveToNextStage();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
        >
          Continue to Credentials
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function CredentialsStage({ data, setData, saveStageData, moveToPreviousStage }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Login Credentials</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
          <input
            type="text"
            value={data.eeuid}
            onChange={(e) => setData({ ...data, eeuid: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Password</label>
          <input
            type="password"
            value={data.eeusrpsswrd}
            onChange={(e) => setData({ ...data, eeusrpsswrd: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
          <input
            type="text"
            value={data.eeregemail}
            onChange={(e) => setData({ ...data, eeregemail: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">User Password</label>
          <input
            type="password"
            value={data.eeregpsswrd}
            onChange={(e) => setData({ ...data, eeregpsswrd: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <h4 className="font-medium text-gray-900 mb-3">Security Questions</h4>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Security Question 1</label>
          <input
            type="text"
            value={data.eesecq1}
            onChange={(e) => setData({ ...data, eesecq1: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Answer 1</label>
          <input
            type="text"
            value={data.ee1}
            onChange={(e) => setData({ ...data, ee1: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Security Question 2</label>
          <input
            type="text"
            value={data.eesecq2}
            onChange={(e) => setData({ ...data, eesecq2: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Answer 2</label>
          <input
            type="text"
            value={data.ee2}
            onChange={(e) => setData({ ...data, ee2: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Security Question 3</label>
          <input
            type="text"
            value={data.eesecq3}
            onChange={(e) => setData({ ...data, eesecq3: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Answer 3</label>
          <input
            type="text"
            value={data.ee3}
            onChange={(e) => setData({ ...data, ee3: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={moveToPreviousStage}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center font-medium"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back
        </button>
        <button
          onClick={async () => {
            await saveStageData();
            window.toast.success('Student Visa Operations Completed Successfully!');
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center font-medium"
        >
          <CheckCircle className="mr-2" size={20} />
          Complete Operations
        </button>
      </div>
    </div>
  );
}

export default function StudentVisaOperationsWizard({
  opportunityId,
  leadId,
  clientName
}: StudentVisaOperationsWizardProps) {
  const [activeStage, setActiveStage] = useState('personal');
  const [saving, setSaving] = useState(false);

  const [stages, setStages] = useState<OperationsStage[]>([
    { id: 'personal', name: 'Personal Details', icon: User, status: 'current' },
    { id: 'documentation', name: 'Documentation', icon: FileText, status: 'pending' },
    { id: 'application', name: 'Application Status', icon: ClipboardCheck, status: 'pending' },
    { id: 'remark', name: 'Remark', icon: FileEdit, status: 'pending' },
    { id: 'credentials', name: 'Login Credentials', icon: Key, status: 'pending' },
    { id: 'live-chat', name: 'Live Chat', icon: MessageSquare, status: 'pending' },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck, status: 'pending' },
  ]);

  const [personalData, setPersonalData] = useState({
    email: '',
    mobile: '',
    nationality: '',
    address: '',
    dob: '',
    gender: '',
    countryInterest: '',
    programInterest: '',
    leadSource: '',
    retentionDate: '',
    contractExpiry: '',
    agreementNo: ''
  });

  const [documentationData, setDocumentationData] = useState({
    docSubmitDate: '',
    plannedTravelDate: '',
    biometricsRequired: '',
    universityName: '',
    documents: [] as any[]
  });

  const [applicationData, setApplicationData] = useState({
    docReceiveDate: '',
    applicationSubmission: '',
    applicationStatus: '',
    documents: [] as any[]
  });

  const [remarkData, setRemarkData] = useState({
    remark: ''
  });

  const [credentialsData, setCredentialsData] = useState({
    eeuid: '',
    eeusrpsswrd: '',
    eeregemail: '',
    eeregpsswrd: '',
    eesecq1: '',
    ee1: '',
    eesecq2: '',
    ee2: '',
    eesecq3: '',
    ee3: ''
  });

  useEffect(() => {
    loadOperationStages('student-visa', leadId, opportunityId).then((data) => {
      if (data.personal) setPersonalData(data.personal as typeof personalData);
      if (data.documentation) setDocumentationData(data.documentation as typeof documentationData);
      if (data.application) setApplicationData(data.application as typeof applicationData);
      if (data.remark) setRemarkData(data.remark as typeof remarkData);
      if (data.credentials) setCredentialsData(data.credentials as typeof credentialsData);
    }).catch((error) => console.error('Unable to load Student Visa operations data:', error));
  }, [leadId, opportunityId]);

  const saveStageData = async () => {
    setSaving(true);
    try {
      const stageDataMap: Record<string, any> = {
        personal: personalData,
        documentation: documentationData,
        application: applicationData,
        remark: remarkData,
        credentials: credentialsData
      };

      const dataToSave = {
        opportunityId,
        leadId,
        stage: activeStage,
        data: await uploadOperationFiles(stageDataMap[activeStage], 'student-visa', leadId),
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/admin/operations/student-visa/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save Student Visa operations data');
      }

    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
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

  const renderStageContent = () => {
    switch (activeStage) {
      case CLIENT_DOCUMENTS_STAGE_ID:
        return <ClientDocumentsPanel leadId={leadId} opportunityId={opportunityId} />;
      case 'live-chat':
        return <ClientChatPanel leadId={leadId} opportunityId={opportunityId} />;
      case 'personal':
        return <PersonalDetailsStage data={personalData} setData={setPersonalData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} />;
      case 'documentation':
        return <DocumentationStage data={documentationData} setData={setDocumentationData} saveStageData={saveStageData} moveToPreviousStage={moveToPreviousStage} moveToNextStage={moveToNextStage} />;
      case 'application':
        return <ApplicationStatusStage data={applicationData} setData={setApplicationData} saveStageData={saveStageData} moveToPreviousStage={moveToPreviousStage} moveToNextStage={moveToNextStage} />;
      case 'remark':
        return <RemarkStage data={remarkData} setData={setRemarkData} saveStageData={saveStageData} moveToPreviousStage={moveToPreviousStage} moveToNextStage={moveToNextStage} />;
      case 'credentials':
        return <CredentialsStage data={credentialsData} setData={setCredentialsData} saveStageData={saveStageData} moveToPreviousStage={moveToPreviousStage} />;
      default:
        return <PersonalDetailsStage data={personalData} setData={setPersonalData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} />;
    }
  };

  return (
    <div className="min-h-[60vh] bg-gray-50">
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-900">Student Visa Operations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
            <BookOpen className="text-green-600" size={48} />
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
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
                    className={`flex items-center px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? stage.status === 'completed'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-blue-600 text-white shadow-md'
                        : stage.status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    <span className="text-sm font-medium">{stage.name}</span>
                    {stage.status === 'completed' && (
                      <CheckCircle size={14} className="ml-2" />
                    )}
                  </button>

                  {index < stages.length - 1 && (
                    <ChevronRight
                      size={16}
                      className={`mx-1 hidden sm:block ${
                        stage.status === 'completed' ? 'text-green-600' : 'text-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
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
