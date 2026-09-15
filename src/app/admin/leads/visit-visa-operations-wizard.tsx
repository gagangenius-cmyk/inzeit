'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useEffect, useState } from 'react';
import { loadOperationStages, uploadOperationFiles } from '@/lib/operationsData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, ClipboardList, Video, MessageSquare,
  TrendingUp, MessageCircle, Key, FileEdit, ChevronRight,
  ChevronLeft, Save, CheckCircle, XCircle, FolderCheck
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';

const CLIENT_DOCUMENTS_STAGE_ID = 'client-documents';

interface VisitVisaOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

interface OperationsStage {
  id: string;
  name: string;
  icon: any;
  status: 'pending' | 'current' | 'completed' | 'rejected';
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Applicants</label>
          <input
            type="number"
            value={data.noOfApplicants}
            onChange={(e) => setData({ ...data, noOfApplicants: e.target.value })}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destination Country</label>
          <input
            type="text"
            value={data.descCountry}
            onChange={(e) => setData({ ...data, descCountry: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">University/College Name</label>
          <input
            type="text"
            value={data.university}
            onChange={(e) => setData({ ...data, university: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Retention</label>
          <input
            type="date"
            value={data.retnDate}
            onChange={(e) => setData({ ...data, retnDate: e.target.value })}
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

function DocumentationStage({ data, setData, saveStageData, moveToNextStage, moveToPreviousStage }: any) {
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Checklist Sent Date</label>
          <input
            type="date"
            value={data.docSubDate}
            onChange={(e) => setData({ ...data, docSubDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destination Country</label>
          <input
            type="text"
            value={data.descCountry}
            onChange={(e) => setData({ ...data, descCountry: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">University/College Name</label>
          <input
            type="text"
            value={data.university}
            onChange={(e) => setData({ ...data, university: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
          <SearchableSelect
            value={data.docType}
            onChange={(e) => setData({ ...data, docType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Option</option>
            <option value="Passport">Passport</option>
            <option value="National Identity Document">National Identity Document</option>
            <option value="Birth Certificate">Birth Certificate</option>
            <option value="Marriage Certificate">Marriage Certificate</option>
            <option value="Education Documents">Education Documents</option>
            <option value="Employment Documents">Employment Documents</option>
            <option value="Financial Documents">Financial Documents</option>
          </SearchableSelect>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
          <textarea
            value={data.remark}
            onChange={(e) => setData({ ...data, remark: e.target.value })}
            rows={4}
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

function ApplicationSubmissionStage({ data, setData, saveStageData, moveToNextStage, moveToPreviousStage }: any) {
  const applications: any[] = Array.isArray(data.applications) ? data.applications : [];

  const updateApplication = (index: number, field: string, value: string) => {
    const next = applications.map((application, i) => (i === index ? { ...application, [field]: value } : application));
    setData({ ...data, applications: next });
  };

  const addApplication = () => {
    setData({
      ...data,
      applications: [...applications, { applicantName: '', referenceNumber: '', submissionDate: '', submissionCenter: '', status: '', remarks: '' }],
    });
  };

  const removeApplication = (index: number) => {
    setData({ ...data, applications: applications.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Application Submission</h3>
      <p className="text-gray-600">Track application submissions and statuses</p>

      <div className="space-y-4">
        {applications.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">No applications added yet. Click &quot;Add Application&quot; below for each traveler.</p>
          </div>
        )}
        {applications.map((application, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Application {index + 1}</h4>
              <button onClick={() => removeApplication(index)} className="text-red-600 text-sm hover:text-red-800">Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applicant Name</label>
                <input type="text" value={application.applicantName || ''} onChange={(e) => updateApplication(index, 'applicantName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                <input type="text" value={application.referenceNumber || ''} onChange={(e) => updateApplication(index, 'referenceNumber', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Submission Date</label>
                <input type="date" value={application.submissionDate || ''} onChange={(e) => updateApplication(index, 'submissionDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Submission Center</label>
                <input type="text" value={application.submissionCenter || ''} onChange={(e) => updateApplication(index, 'submissionCenter', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={application.status || ''} onChange={(e) => updateApplication(index, 'status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <input type="text" value={application.remarks || ''} onChange={(e) => updateApplication(index, 'remarks', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addApplication} className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600">
          + Add Application
        </button>
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
          Continue to Biometrics
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function BiometricsStage({ data, setData, saveStageData, moveToNextStage, moveToPreviousStage }: any) {
  const biometrics: any[] = Array.isArray(data.biometrics) ? data.biometrics : [];

  const updateEntry = (index: number, field: string, value: string) => {
    const next = biometrics.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    setData({ ...data, biometrics: next });
  };

  const addEntry = () => {
    setData({
      ...data,
      biometrics: [...biometrics, { applicantName: '', appointmentDate: '', center: '', passportSubmissionDate: '', passportCollectionDate: '', status: '' }],
    });
  };

  const removeEntry = (index: number) => {
    setData({ ...data, biometrics: biometrics.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Biometrics/Passport Submission</h3>
      <p className="text-gray-600">Manage biometric appointments and passport submissions</p>

      <div className="space-y-4">
        {biometrics.length === 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">No biometric appointments added yet. Click &quot;Add Appointment&quot; below for each traveler.</p>
          </div>
        )}
        {biometrics.map((entry, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-800">Traveler {index + 1}</h4>
              <button onClick={() => removeEntry(index)} className="text-red-600 text-sm hover:text-red-800">Remove</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applicant Name</label>
                <input type="text" value={entry.applicantName || ''} onChange={(e) => updateEntry(index, 'applicantName', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Biometric Appointment Date</label>
                <input type="date" value={entry.appointmentDate || ''} onChange={(e) => updateEntry(index, 'appointmentDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Center/Location</label>
                <input type="text" value={entry.center || ''} onChange={(e) => updateEntry(index, 'center', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Submission Date</label>
                <input type="date" value={entry.passportSubmissionDate || ''} onChange={(e) => updateEntry(index, 'passportSubmissionDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Collection Date</label>
                <input type="date" value={entry.passportCollectionDate || ''} onChange={(e) => updateEntry(index, 'passportCollectionDate', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={entry.status || ''} onChange={(e) => updateEntry(index, 'status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Passport Submitted">Passport Submitted</option>
                  <option value="Passport Collected">Passport Collected</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addEntry} className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600">
          + Add Appointment
        </button>
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
          Continue to Conversation
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function ConversationStage({ data, setData, saveStageData, moveToNextStage, moveToPreviousStage }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Conversation Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type of Conversation</label>
          <SearchableSelect
            value={data.conversationType}
            onChange={(e) => setData({ ...data, conversationType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Inbound">Inbound</option>
            <option value="Outbound">Outbound</option>
            <option value="Inbound_email">Inbound Email</option>
            <option value="Outbound_email">Outbound Email</option>
          </SearchableSelect>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Conversation Status</label>
          <SearchableSelect
            value={data.conversationStatus}
            onChange={(e) => setData({ ...data, conversationStatus: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </SearchableSelect>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Conversation</label>
          <textarea
            value={data.conversation}
            onChange={(e) => setData({ ...data, conversation: e.target.value })}
            rows={4}
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
            moveToNextStage();
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium"
        >
          Continue to Status Update
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function StatusUpdateStage({ data, setData, saveStageData, moveToNextStage, moveToPreviousStage }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Status Update</h3>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status Type</label>
          <SearchableSelect
            value={data.statusType}
            onChange={(e) => setData({ ...data, statusType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="Submitted">Submitted</option>
            <option value="In Progress">In Progress</option>
            <option value="Correspondence Received">Correspondence Received</option>
            <option value="Approved">Approved</option>
            <option value="Refused">Refused</option>
          </SearchableSelect>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status Description</label>
          <textarea
            value={data.statusDescription}
            onChange={(e) => setData({ ...data, statusDescription: e.target.value })}
            rows={5}
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
            window.toast.success('Visit Visa Operations Completed Successfully!');
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

function RemarkStage({ data, setData, saveStageData, moveToPreviousStage, moveToNextStage }: any) {
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Remark</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
        <textarea
          value={data.remark}
          onChange={(e) => setData({ ...data, remark: e.target.value })}
          rows={6}
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
            setSaving(true);
            try {
              await saveStageData();
              window.toast.success('Remark saved successfully!');
              moveToNextStage();
            } catch {
              window.toast.error('Failed to save remark');
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center font-medium"
        >
          {saving ? 'Saving...' : 'Continue to Client Documents'}
          <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

export default function VisitVisaOperationsWizard({
  opportunityId,
  leadId,
  clientName
}: VisitVisaOperationsWizardProps) {
  const [activeStage, setActiveStage] = useState('personal');
  const [saving, setSaving] = useState(false);

  const [stages, setStages] = useState<OperationsStage[]>([
    { id: 'personal', name: 'Personal Details', icon: User, status: 'current' },
    { id: 'documentation', name: 'Documentation', icon: FileText, status: 'pending' },
    { id: 'application', name: 'Application Submission', icon: ClipboardList, status: 'pending' },
    { id: 'biometrics', name: 'Biometrics/Passport', icon: Video, status: 'pending' },
    { id: 'conversation', name: 'Conversation', icon: MessageCircle, status: 'pending' },
    { id: 'status', name: 'Status Update', icon: TrendingUp, status: 'pending' },
    { id: 'chat', name: 'Client Chat', icon: MessageSquare, status: 'pending' },
    { id: 'credentials', name: 'Login Credentials', icon: Key, status: 'pending' },
    { id: 'remark', name: 'Remark', icon: FileEdit, status: 'pending' },
    { id: CLIENT_DOCUMENTS_STAGE_ID, name: 'Client Documents', icon: FolderCheck, status: 'pending' },
  ]);

  // Data states
  const [personalData, setPersonalData] = useState({
    email: '',
    noOfApplicants: '',
    mobile: '',
    nationality: '',
    descCountry: '',
    university: '',
    retnDate: '',
    contractExpiry: ''
  });

  const [documentationData, setDocumentationData] = useState({
    docSubDate: '',
    descCountry: '',
    university: '',
    remark: '',
    docType: '',
    docUploadedFor: ''
  });

  const [applicationData, setApplicationData] = useState({
    applications: [] as any[]
  });

  const [biometricsData, setBiometricsData] = useState({
    biometrics: [] as any[]
  });

  const [conversationData, setConversationData] = useState({
    conversationType: '',
    conversation: '',
    followupRemarks: '',
    followupDate: '',
    conversationStatus: ''
  });

  const [statusData, setStatusData] = useState({
    statusType: '',
    statusDescription: '',
    statusFile: null
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

  const [remarkData, setRemarkData] = useState({
    remark: ''
  });

  useEffect(() => {
    loadOperationStages('visit-visa', leadId, opportunityId).then((data) => {
      if (data.personal) setPersonalData(data.personal as typeof personalData);
      if (data.documentation) setDocumentationData(data.documentation as typeof documentationData);
      if (data.application) setApplicationData(data.application as typeof applicationData);
      if (data.biometrics) setBiometricsData(data.biometrics as typeof biometricsData);
      if (data.conversation) setConversationData(data.conversation as typeof conversationData);
      if (data.status) setStatusData(data.status as typeof statusData);
      if (data.credentials) setCredentialsData(data.credentials as typeof credentialsData);
      if (data.remark) setRemarkData(data.remark as typeof remarkData);
    }).catch((error) => console.error('Unable to load Visit Visa operations data:', error));
  }, [leadId, opportunityId]);

  const saveStageData = async () => {
    setSaving(true);
    try {
      const stageDataMap: Record<string, any> = {
        personal: personalData,
        documentation: documentationData,
        application: applicationData,
        biometrics: biometricsData,
        conversation: conversationData,
        status: statusData,
        credentials: credentialsData,
        remark: remarkData
      };

      const dataToSave = {
        opportunityId,
        leadId,
        stage: activeStage,
        data: await uploadOperationFiles(stageDataMap[activeStage], 'visit-visa', leadId),
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/admin/operations/visit-visa/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save Visit Visa operations data');
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
      case 'personal':
        return <PersonalDetailsStage data={personalData} setData={setPersonalData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} />;
      case 'documentation':
        return <DocumentationStage data={documentationData} setData={setDocumentationData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} moveToPreviousStage={moveToPreviousStage} />;
      case 'application':
        return <ApplicationSubmissionStage data={applicationData} setData={setApplicationData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} moveToPreviousStage={moveToPreviousStage} />;
      case 'biometrics':
        return <BiometricsStage data={biometricsData} setData={setBiometricsData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} moveToPreviousStage={moveToPreviousStage} />;
      case 'conversation':
        return <ConversationStage data={conversationData} setData={setConversationData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} moveToPreviousStage={moveToPreviousStage} />;
      case 'status':
        return <StatusUpdateStage data={statusData} setData={setStatusData} saveStageData={saveStageData} moveToNextStage={moveToNextStage} moveToPreviousStage={moveToPreviousStage} />;
      case 'credentials':
        return <CredentialsStage data={credentialsData} setData={setCredentialsData} saveStageData={saveStageData} moveToPreviousStage={moveToPreviousStage} />;
      case 'chat':
        return <ClientChatPanel leadId={leadId} opportunityId={opportunityId} />;
      case 'remark':
        return <RemarkStage data={remarkData} setData={setRemarkData} saveStageData={saveStageData} moveToPreviousStage={moveToPreviousStage} moveToNextStage={moveToNextStage} />;
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
              <h1 className="text-2xl font-bold text-gray-900">Visit Visa Operations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}
              </p>
            </div>
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
