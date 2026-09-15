'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, ShieldCheck, Hash, AlertTriangle, CalendarClock, Award, XCircle } from 'lucide-react';

interface CaseMilestonesPanelProps {
  module: string;
  leadId: number;
  opportunityId: number;
}

type FieldType = 'text' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'number';
interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
}

type MilestoneRecord = Record<string, any> & { id: number };
interface MilestoneData {
  eligibilityAssessments: MilestoneRecord[];
  references: MilestoneRecord[];
  rfeRequests: MilestoneRecord[];
  interviews: MilestoneRecord[];
  decisions: MilestoneRecord[];
  closures: MilestoneRecord[];
}

const EMPTY_DATA: MilestoneData = {
  eligibilityAssessments: [], references: [], rfeRequests: [], interviews: [], decisions: [], closures: [],
};

// Gap this fills: of the 20 program wizards, only skill-canada has structured
// reference/decision/issuance/closure fields - everywhere else is a
// free-text "Application Status" dropdown, and RFE/interview tracking exists
// nowhere. This panel is injected once (OperationsWizardShell.tsx) so every
// module gets it, instead of hand-adding these fields to 20 files.
export default function CaseMilestonesPanel({ module, leadId, opportunityId }: CaseMilestonesPanelProps) {
  const [data, setData] = useState<MilestoneData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/operations/case-milestones?leadId=${leadId}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setData(json.data);
    } catch (error) {
      console.error('Failed to load case milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-gray-900">Case Milestones</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-800">Structured tracking for government reference numbers, requests for additional evidence, interviews, decisions, and case closure — shared across every program.</p>
      </div>

      <MilestoneSection
        icon={ShieldCheck}
        title="Eligibility Assessment"
        description="A formal eligibility check recorded against this case (distinct from the pre-sales screening tools)."
        type="eligibility"
        module={module} leadId={leadId} opportunityId={opportunityId}
        items={data.eligibilityAssessments}
        fields={[
          { name: 'assessmentDate', label: 'Assessment Date', type: 'date', required: true },
          { name: 'outcome', label: 'Outcome', type: 'select', options: ['eligible', 'conditionally_eligible', 'not_eligible'], required: true },
          { name: 'score', label: 'Score', type: 'number' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        renderSummary={(item) => `${item.outcome?.replace(/_/g, ' ')} — ${item.assessmentDate ? new Date(item.assessmentDate).toLocaleDateString() : ''}${item.score != null ? ` (score ${item.score})` : ''}`}
        onChanged={load}
      />

      <MilestoneSection
        icon={Hash}
        title="Government Reference Numbers"
        description="AOR, ITA, application/case numbers, or any other government-issued tracking reference."
        type="reference"
        module={module} leadId={leadId} opportunityId={opportunityId}
        items={data.references}
        fields={[
          { name: 'referenceType', label: 'Reference Type', required: true },
          { name: 'referenceNumber', label: 'Reference Number', required: true },
          { name: 'issuedDate', label: 'Issued Date', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        renderSummary={(item) => `${item.referenceType}: ${item.referenceNumber}`}
        onChanged={load}
      />

      <MilestoneSection
        icon={AlertTriangle}
        title="RFE / Additional Evidence Requests"
        description="Government requests for more documents or evidence, with a response deadline."
        type="rfe"
        module={module} leadId={leadId} opportunityId={opportunityId}
        items={data.rfeRequests}
        fields={[
          { name: 'requestDate', label: 'Request Date', type: 'date', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'documentsRequired', label: 'Documents Required', type: 'textarea' },
          { name: 'responseDueDate', label: 'Response Due Date', type: 'date' },
          { name: 'status', label: 'Status', type: 'select', options: ['pending', 'submitted', 'overdue', 'waived'] },
          { name: 'requestedBy', label: 'Requesting Office', type: 'text' },
        ]}
        renderSummary={(item) => `${item.status} — due ${item.responseDueDate ? new Date(item.responseDueDate).toLocaleDateString() : 'n/a'}`}
        onChanged={load}
      />

      <MilestoneSection
        icon={CalendarClock}
        title="Interviews"
        description="Visa interviews, biometrics appointments, or landing interviews."
        type="interview"
        module={module} leadId={leadId} opportunityId={opportunityId}
        items={data.interviews}
        fields={[
          { name: 'interviewType', label: 'Interview Type', required: true },
          { name: 'scheduledAt', label: 'Scheduled At', type: 'datetime-local' },
          { name: 'location', label: 'Location' },
          { name: 'mode', label: 'Mode', type: 'select', options: ['in_person', 'video', 'phone'] },
          { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'rescheduled', 'no_show', 'cancelled'] },
          { name: 'outcome', label: 'Outcome', type: 'select', options: ['pending', 'passed', 'failed'] },
          { name: 'outcomeNotes', label: 'Outcome Notes', type: 'textarea' },
        ]}
        renderSummary={(item) => `${item.interviewType} — ${item.status}${item.scheduledAt ? ` (${new Date(item.scheduledAt).toLocaleString()})` : ''}`}
        onChanged={load}
      />

      <MilestoneSection
        icon={Award}
        title="Decision & Issuance"
        description="The government's decision, and the visa/permit/card issued as a result."
        type="decision"
        module={module} leadId={leadId} opportunityId={opportunityId}
        items={data.decisions}
        fields={[
          { name: 'decision', label: 'Decision', type: 'select', options: ['pending', 'approved', 'refused', 'withdrawn'], required: true },
          { name: 'decisionDate', label: 'Decision Date', type: 'date' },
          { name: 'issuedDocumentType', label: 'Issued Document Type (Visa / PR Card / Residence Permit / Work Permit)' },
          { name: 'issuedDocumentNumber', label: 'Issued Document Number' },
          { name: 'issueDate', label: 'Issue Date', type: 'date' },
          { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
          { name: 'decisionNotes', label: 'Notes', type: 'textarea' },
        ]}
        renderSummary={(item) => `${item.decision}${item.issuedDocumentType ? ` — ${item.issuedDocumentType} ${item.issuedDocumentNumber || ''}` : ''}${item.expiryDate ? `, expires ${new Date(item.expiryDate).toLocaleDateString()}` : ''}`}
        onChanged={load}
      />

      <MilestoneSection
        icon={XCircle}
        title="Case Closure"
        description="One closure record per case — the reason this case was closed."
        type="closure"
        module={module} leadId={leadId} opportunityId={opportunityId}
        items={data.closures}
        singleton
        fields={[
          { name: 'closureReason', label: 'Closure Reason', type: 'select', options: ['visa_approved_completed', 'client_withdrew', 'refused', 'non_payment', 'other'], required: true },
          { name: 'closureDate', label: 'Closure Date', type: 'date', required: true },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ]}
        renderSummary={(item) => `${item.closureReason?.replace(/_/g, ' ')} — ${item.closureDate ? new Date(item.closureDate).toLocaleDateString() : ''}`}
        onChanged={load}
      />
    </div>
  );
}

function MilestoneSection({
  icon: Icon,
  title,
  description,
  type,
  module,
  leadId,
  opportunityId,
  items,
  fields,
  renderSummary,
  onChanged,
  singleton,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  type: 'eligibility' | 'reference' | 'rfe' | 'interview' | 'decision' | 'closure';
  module: string;
  leadId: number;
  opportunityId: number;
  items: MilestoneRecord[];
  fields: FieldConfig[];
  renderSummary: (item: MilestoneRecord) => string;
  onChanged: () => void;
  singleton?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/operations/case-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, module, leadId, opportunityId, ...form }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save');
      window.toast.success(`${title} saved.`);
      setForm({});
      setShowForm(false);
      onChanged();
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`/api/admin/operations/case-milestones/${id}?type=${type}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete');
      onChanged();
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const canAdd = !singleton || items.length === 0;

  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Icon size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
          >
            <Plus size={14} /> {showForm ? 'Cancel' : 'Add'}
          </button>
        )}
      </div>

      {items.length === 0 && !showForm && (
        <p className="mt-3 text-sm text-gray-400">No entries yet.</p>
      )}

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <p className="text-sm text-gray-700">{renderSummary(item)}</p>
            <button onClick={() => remove(item.id)} className="text-gray-400 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100 pt-4">
          {fields.map((field) => (
            <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {field.label}{field.required && <span className="text-red-600"> *</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={form[field.name] || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {(field.options || []).map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  value={form[field.name] || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  value={form[field.name] || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
