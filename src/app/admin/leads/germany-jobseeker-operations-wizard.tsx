'use client';

import { useEffect, useState } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Globe, GraduationCap, Languages, Scale, DollarSign, Shield, Calendar,
  Building2, ChevronLeft, CheckCircle, Clock,
} from 'lucide-react';
import ClientDocumentsPanel from '@/components/operations/ClientDocumentsPanel';
import ClientChatPanel from '@/components/operations/ClientChatPanel';

interface GermanyJobSeekerOperationsWizardProps {
  opportunityId: number;
  leadId: number;
  clientName: string;
}

interface GermanyJobSeekerCaseDetails {
  status: string;
  priority: 'high' | 'medium' | 'low';
  nextFollowUp: string;
  personalInfo: {
    nationality: string;
    passportNumber: string;
    dateOfBirth: string;
    retentionDate: string;
    contractExpiry: string;
    currentLocation: string;
    maritalStatus: string;
    education: string;
    fieldOfStudy: string;
    yearsExperience: string;
    germanLanguageLevel: string;
    englishLevel: string;
  };
  visaDetails: {
    targetSector: string;
    targetJobTitle: string;
    salaryExpectation: string;
    blockedAccountAmount: string;
    visaFee: string;
    appointmentDate: string;
    embassyLocation: string;
    travelHealthInsurance: boolean;
    motivationLetterReady: boolean;
    cvGermanFormat: boolean;
    recognizedQualification: boolean;
  };
  stageChecklist: {
    initialAssessment: boolean;
    documentsCollected: boolean;
    cvGermanFormatted: boolean;
    motivationLetterDone: boolean;
    qualificationRecognition: boolean;
    blockedAccountOpened: boolean;
    healthInsuranceArranged: boolean;
    embassyAppointmentBooked: boolean;
    visaInterviewPrepared: boolean;
    visaApproved: boolean;
    travelBooked: boolean;
    cityRegistered: boolean;
  };
  notes: string;
}

const STAGES = [
  { key: 'initialAssessment', label: 'Initial Assessment' },
  { key: 'documentsCollected', label: 'Documents Collected' },
  { key: 'cvGermanFormatted', label: 'CV (German Format)' },
  { key: 'motivationLetterDone', label: 'Motivation Letter' },
  { key: 'qualificationRecognition', label: 'Qualification Recognition' },
  { key: 'blockedAccountOpened', label: 'Blocked Account (€)' },
  { key: 'healthInsuranceArranged', label: 'Health Insurance' },
  { key: 'embassyAppointmentBooked', label: 'Embassy Appointment' },
  { key: 'visaInterviewPrepared', label: 'Interview Prepared' },
  { key: 'visaApproved', label: 'Visa Approved' },
  { key: 'travelBooked', label: 'Travel Booked' },
  { key: 'cityRegistered', label: 'City Registration (Anmeldung)' },
] as const;

const GERMAN_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'None'];
const SECTORS = ['Engineering', 'IT / Software', 'Healthcare / Nursing', 'Finance', 'Architecture', 'Teaching', 'Skilled Trades', 'Research / Science', 'Logistics', 'Other'];

const emptyCase = (): GermanyJobSeekerCaseDetails => ({
  status: 'active', priority: 'medium', nextFollowUp: '',
  personalInfo: { nationality: '', passportNumber: '', dateOfBirth: '', retentionDate: '', contractExpiry: '', currentLocation: '',
    maritalStatus: 'Single', education: '', fieldOfStudy: '', yearsExperience: '',
    germanLanguageLevel: 'None', englishLevel: 'B2' },
  visaDetails: { targetSector: '', targetJobTitle: '', salaryExpectation: '', blockedAccountAmount: '11208',
    visaFee: '75', appointmentDate: '', embassyLocation: '',
    travelHealthInsurance: false, motivationLetterReady: false,
    cvGermanFormat: false, recognizedQualification: false },
  stageChecklist: { initialAssessment: false, documentsCollected: false, cvGermanFormatted: false,
    motivationLetterDone: false, qualificationRecognition: false, blockedAccountOpened: false,
    healthInsuranceArranged: false, embassyAppointmentBooked: false, visaInterviewPrepared: false,
    visaApproved: false, travelBooked: false, cityRegistered: false },
  notes: '',
});

// This module already had a real, working single-form editor (unlike the
// other ops-* pages converted alongside it, which had no working save path
// at all) - so unlike its siblings this wizard preserves the exact same
// module key ('germany-jobseeker'), the same single 'caseDetails' stage, and
// the same nested field shape, so previously-saved cases keep loading correctly.
export default function GermanyJobSeekerOperationsWizard({ opportunityId, leadId, clientName }: GermanyJobSeekerOperationsWizardProps) {
  const [caseDetails, setCaseDetails] = useState<GermanyJobSeekerCaseDetails>(emptyCase());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ leadId: String(leadId) });
        if (opportunityId) params.set('opportunityId', String(opportunityId));
        const res = await fetch(`/api/admin/operations/germany-jobseeker/save?${params.toString()}`);
        const json = await res.json();
        const saved = json?.data?.caseDetails;
        if (saved && !cancelled) setCaseDetails((prev) => ({ ...prev, ...saved }));
      } catch (error) {
        console.error('Failed to load Germany Job Seeker case:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [leadId, opportunityId]);

  const stageProgress = () => {
    const done = Object.values(caseDetails.stageChecklist).filter(Boolean).length;
    return { done, total: STAGES.length, pct: Math.round((done / STAGES.length) * 100) };
  };

  const saveCase = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/operations/germany-jobseeker/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          opportunityId: opportunityId || null,
          stage: 'caseDetails',
          data: caseDetails,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save case');
      window.toast.success('Germany Job Seeker case saved successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save case';
      setSaveError(message);
      window.toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const { done, total, pct } = stageProgress();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <button onClick={() => window.history.back()} className="flex items-center text-gray-600 hover:text-gray-900 mb-2">
            <ChevronLeft className="mr-1" size={20} />
            Back to Opportunities
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-600" /> Germany Job Seeker Visa Operations
              </h1>
              <p className="text-sm text-gray-600 mt-1">Client: {clientName} | Lead ID: {leadId} | Opportunity: {opportunityId}</p>
              <p className="text-xs text-gray-500 mt-0.5">§20 AufenthG — Qualified Professionals Job Seeker Operations</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700">{done}/{total}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{pct}% complete</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Germany Job Seeker Visa Key Requirements (§20 AufenthG)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-amber-700">
            <div className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Recognised university degree</div>
            <div className="flex items-center gap-1"><Languages className="w-3 h-3" /> German B1 or English B2+</div>
            <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Blocked account ≥ €11,208</div>
            <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Travel health insurance</div>
            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid for 6 months (extendable)</div>
            <div className="flex items-center gap-1"><Building2 className="w-3 h-3" /> Job offer → convert to Work Permit</div>
            <div className="flex items-center gap-1"><Scale className="w-3 h-3" /> Qualification recognition (if applicable)</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <SearchableSelect value={caseDetails.status}
                onChange={(e) => setCaseDetails((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="approved">Visa Approved</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <SearchableSelect value={caseDetails.priority}
                onChange={(e) => setCaseDetails((p) => ({ ...p, priority: e.target.value as GermanyJobSeekerCaseDetails['priority'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Next Follow-up</label>
              <input type="date" value={caseDetails.nextFollowUp}
                onChange={(e) => setCaseDetails((p) => ({ ...p, nextFollowUp: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Personal & Language</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nationality</label>
              <input type="text" value={caseDetails.personalInfo.nationality}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, nationality: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Passport Number</label>
              <input type="text" value={caseDetails.personalInfo.passportNumber}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, passportNumber: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
              <input type="date" value={caseDetails.personalInfo.dateOfBirth}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, dateOfBirth: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Retention</label>
              <input type="date" value={caseDetails.personalInfo.retentionDate}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, retentionDate: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expiry of Contract</label>
              <input type="date" value={caseDetails.personalInfo.contractExpiry}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, contractExpiry: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Current Location</label>
              <input type="text" value={caseDetails.personalInfo.currentLocation}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, currentLocation: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Education</label>
              <input type="text" value={caseDetails.personalInfo.education}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, education: e.target.value } }))}
                placeholder="e.g. Bachelor's in Engineering"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Field of Study</label>
              <input type="text" value={caseDetails.personalInfo.fieldOfStudy}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, fieldOfStudy: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Years of Experience</label>
              <input type="text" value={caseDetails.personalInfo.yearsExperience}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, yearsExperience: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">German Language Level</label>
              <SearchableSelect value={caseDetails.personalInfo.germanLanguageLevel}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, germanLanguageLevel: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {GERMAN_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">English Level</label>
              <SearchableSelect value={caseDetails.personalInfo.englishLevel}
                onChange={(e) => setCaseDetails((p) => ({ ...p, personalInfo: { ...p.personalInfo, englishLevel: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                {GERMAN_LEVELS.filter((l) => l !== 'None').map((l) => <option key={l} value={l}>{l}</option>)}
              </SearchableSelect>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Visa / Job Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Sector</label>
              <SearchableSelect value={caseDetails.visaDetails.targetSector}
                onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, targetSector: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Select sector</option>
                {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
              </SearchableSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Job Title</label>
              <input type="text" value={caseDetails.visaDetails.targetJobTitle}
                onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, targetJobTitle: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Salary Expectation</label>
              <input type="text" value={caseDetails.visaDetails.salaryExpectation}
                onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, salaryExpectation: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Blocked Account Amount (€)</label>
              <input type="text" value={caseDetails.visaDetails.blockedAccountAmount}
                onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, blockedAccountAmount: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Visa Fee (€)</label>
              <input type="text" value={caseDetails.visaDetails.visaFee}
                onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, visaFee: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Embassy Location</label>
              <input type="text" value={caseDetails.visaDetails.embassyLocation}
                onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, embassyLocation: e.target.value } }))}
                placeholder="e.g. Dubai"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date</label>
              <input type="date" value={caseDetails.visaDetails.appointmentDate}
                onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, appointmentDate: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ['travelHealthInsurance', 'Travel Health Insurance'],
              ['motivationLetterReady', 'Motivation Letter Ready'],
              ['cvGermanFormat', 'CV in German Format'],
              ['recognizedQualification', 'Recognized Qualification'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-200">
                <input type="checkbox" checked={caseDetails.visaDetails[key]}
                  onChange={(e) => setCaseDetails((p) => ({ ...p, visaDetails: { ...p.visaDetails, [key]: e.target.checked } }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Stage Checklist</h4>
          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((s) => (
              <label key={s.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox"
                  checked={caseDetails.stageChecklist[s.key]}
                  onChange={(e) => setCaseDetails((p) => ({
                    ...p,
                    stageChecklist: { ...p.stageChecklist, [s.key]: e.target.checked },
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-gray-700">{s.label}</span>
                {caseDetails.stageChecklist[s.key] && <CheckCircle className="w-3.5 h-3.5 text-green-600" />}
                {!caseDetails.stageChecklist[s.key] && <Clock className="w-3.5 h-3.5 text-gray-300" />}
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea rows={4} value={caseDetails.notes}
              onChange={(e) => setCaseDetails((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Case notes..." />
          </div>

          {saveError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{saveError}</div>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={saveCase} disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center font-medium">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <ClientDocumentsPanel leadId={leadId} opportunityId={opportunityId} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <ClientChatPanel leadId={leadId} opportunityId={opportunityId} />
        </div>
      </div>
    </div>
  );
}
