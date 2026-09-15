'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, Loader2 } from 'lucide-react';

interface FormFieldDefinition { name: string; label: string; }
interface FormTemplateDefinition { key: string; title: string; description: string; icon: string; fields: FormFieldDefinition[]; }
interface Submission { submission_id: string; form_key: string; status: string; submitted_at: string; }

const FORMS: FormTemplateDefinition[] = [
  {
    key: 'client-data-sheet', icon: '📋', title: 'Client Data Sheet',
    description: 'General intake sheet — personal, family, education & work history.',
    fields: [
      { name: 'fullName', label: 'Full Name' },
      { name: 'familyDetails', label: 'Family Details' },
      { name: 'educationHistory', label: 'Education History' },
      { name: 'workHistory', label: 'Work History' },
    ],
  },
  {
    key: 'employment-letter-format', icon: '💼', title: 'Employment Letter Format',
    description: 'Standard reference-letter format for your current/past employer to fill.',
    fields: [
      { name: 'employerName', label: 'Employer Name' },
      { name: 'position', label: 'Position Held' },
      { name: 'duration', label: 'Employment Duration' },
      { name: 'salaryDetails', label: 'Salary Details' },
    ],
  },
  {
    key: 'name-change-affidavit', icon: '📝', title: 'Name Change Affidavit',
    description: 'Submit if your legal name has changed since your file was opened.',
    fields: [
      { name: 'oldName', label: 'Previous Name' },
      { name: 'newName', label: 'Current Legal Name' },
      { name: 'reason', label: 'Reason for Change' },
    ],
  },
];

export default function FormsTemplatesPage() {
  const params = useParams<{ opportunityId: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nameChanged, setNameChanged] = useState(false);
  const [openForm, setOpenForm] = useState<FormTemplateDefinition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setIsLoading(true);
    fetch('/api/clientportal/forms')
      .then((res) => res.json())
      .then((json) => setSubmissions(json.submissions || []))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const submittedKeys = new Set(submissions.map((s) => s.form_key));
  const visibleForms = nameChanged ? FORMS : FORMS.filter((f) => f.key !== 'name-change-affidavit');

  const downloadTemplate = async (formKey: string) => {
    const res = await fetch(`/api/clientportal/forms/${formKey}/template`);
    const json = await res.json();
    if (res.ok && json.url) window.open(json.url, '_blank');
  };

  const openFillOnline = (form: FormTemplateDefinition) => {
    setOpenForm(form);
    setFormValues({});
  };

  const submitOnline = async () => {
    if (!openForm) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/clientportal/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formKey: openForm.key, opportunityId: Number(params.opportunityId), data: formValues }),
      });
      if (res.ok) {
        setOpenForm(null);
        load();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-900">Forms & Templates</h1>
        <p className="mt-1 text-sm text-slate-500">Generic templates used across products. Fill these in online or download a blank copy.</p>

        <label className="mt-4 flex items-center gap-3 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <input type="checkbox" checked={nameChanged} onChange={(e) => setNameChanged(e.target.checked)} className="h-4 w-4" />
          My legal name has changed and I need to submit a Name Change Affidavit
        </label>

        <div className="mt-4 space-y-3">
          {visibleForms.map((form) => (
            <div key={form.key} className="flex flex-col gap-3 rounded-md border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{form.icon} {form.title}</p>
                <p className="text-xs text-slate-500">{form.description}</p>
                {submittedKeys.has(form.key) && (
                  <span className="mt-1 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Submitted</span>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => openFillOnline(form)} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">Fill Online</button>
                <button onClick={() => downloadTemplate(form.key)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Download className="h-3.5 w-3.5" /> Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">{openForm.title}</h2>
            <div className="mt-4 space-y-3">
              {openForm.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-700">{field.label}</label>
                  <input
                    value={formValues[field.name] || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setOpenForm(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={submitOnline} disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
