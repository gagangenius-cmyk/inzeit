'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Mail, Phone, User, MapPin, UserCircle2, Tag, GraduationCap, UserCog, CalendarClock, SlidersHorizontal, Flag, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isFoeOrBranchManagerOrCeo, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { ALL_COUNTRIES } from '@/lib/countries';
import { calculateAgeFromDob } from '@/lib/utils';
import {
  FormSection, Field, TextField, TextAreaField, SelectField, CheckboxField,
  FormPageHeader, FormActionBar, PrimaryButton, SecondaryButton,
} from '@/components/leads/LeadFormFields';

interface LeadFormData {
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  genderIdentity: string;
  age: string;
  dateOfBirth: string;
  leadSource: string;
  utmSource: string;
  utmMedium: string;
  gclId: string;
  leadOwner: string;
  assignedDate: string;
  reEnquiry: boolean;
  reEnquiryCounter: number;
  prospectFollowUp: string;
  callAttempt1: string;
  callBackAttempts: number;
  callAttemptsDeadline: string;
  watnotBot: boolean;
  roundrobin: boolean;
  whatsapp: boolean;
  status: string;
  priority: string;
  notes: string;
  leadQuality: string;
  programCountry: string;
  program: string;
  programType: string;
}

interface LeadApiData {
  fname?: string | null;
  mname?: string | null;
  lname?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  whatsapp_number?: string | null;
  address?: string | null;
  area?: string | null;
  nationality?: string | null;
  gender?: string | null;
  dob?: string | null;
  market_source?: string | null;
  assignTo?: number | string | null;
  created?: string | null;
  followup?: string | null;
  status?: string | null;
  priority?: string | null;
  lead_remark?: string | null;
  lead_quality?: string | null;
  country_interest?: number | string | null;
  service_interest?: number | string | null;
  salutation?: string | null;
  suffix?: string | null;
  state?: string | null;
  postal_code?: string | null;
  age?: number | string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  gclid?: string | null;
  re_enquiry?: number | boolean | null;
  re_enquiry_counter?: number | string | null;
  call_attempt_1?: string | null;
  call_back_attempts?: number | string | null;
  call_attempts_deadline?: string | null;
  watnot_bot?: number | boolean | null;
  roundrobin?: number | boolean | null;
  whatsapp?: number | boolean | null;
  transfer_date?: string | null;
}

interface SelectOption {
  id?: number | string;
  name?: string;
  branch?: number | string | null;
}

interface ProgramTypeOption {
  id: number | string;
  type: string;
}

const emptyForm: LeadFormData = {
  salutation: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  email: '',
  phone: '',
  whatsappNumber: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  genderIdentity: '',
  age: '',
  dateOfBirth: '',
  leadSource: '',
  utmSource: '',
  utmMedium: '',
  gclId: '',
  leadOwner: '',
  assignedDate: '',
  reEnquiry: false,
  reEnquiryCounter: 0,
  prospectFollowUp: '',
  callAttempt1: '',
  callBackAttempts: 0,
  callAttemptsDeadline: '',
  watnotBot: false,
  roundrobin: false,
  whatsapp: false,
  status: 'New',
  priority: 'Medium',
  notes: '',
  leadQuality: 'Warm',
  programCountry: '',
  program: '',
  programType: ''
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
};

const toFormData = (lead: LeadApiData): LeadFormData => ({
  ...emptyForm,
  salutation: lead.salutation || '--None--',
  firstName: lead.fname || '',
  middleName: lead.mname || '',
  lastName: lead.lname || '',
  suffix: lead.suffix || '',
  email: lead.email || '',
  phone: lead.phone || '',
  whatsappNumber: lead.whatsapp_number || '',
  street: lead.address || '',
  city: lead.area || '',
  state: lead.state || '',
  postalCode: lead.postal_code || '',
  country: lead.nationality || '--None--',
  genderIdentity: lead.gender || '--None--',
  age: lead.age ? String(lead.age) : '',
  dateOfBirth: formatDate(lead.dob),
  leadSource: lead.market_source || '',
  utmSource: lead.utm_source || '',
  utmMedium: lead.utm_medium || '',
  gclId: lead.gclid || '',
  leadOwner: lead.assignTo ? String(lead.assignTo) : '',
  // "Assigned Date" means since-when this lead has belonged to its current
  // owner, which is what transfer_date tracks (stamped automatically by the
  // PUT handler on reassignment) - `created` is the lead's original intake
  // date, not when it was assigned to whoever holds it now.
  assignedDate: formatDateTime(lead.transfer_date) || formatDateTime(lead.created),
  reEnquiry: Boolean(lead.re_enquiry),
  reEnquiryCounter: lead.re_enquiry_counter ? Number(lead.re_enquiry_counter) : 0,
  prospectFollowUp: formatDateTime(lead.followup),
  callAttempt1: formatDateTime(lead.call_attempt_1),
  callBackAttempts: lead.call_back_attempts ? Number(lead.call_back_attempts) : 0,
  callAttemptsDeadline: formatDateTime(lead.call_attempts_deadline),
  watnotBot: Boolean(lead.watnot_bot),
  roundrobin: Boolean(lead.roundrobin),
  whatsapp: Boolean(lead.whatsapp),
  status: lead.status || 'New',
  priority: lead.priority || 'Medium',
  notes: lead.lead_remark || '',
  leadQuality: lead.lead_quality || 'Warm',
  programCountry: lead.country_interest ? String(lead.country_interest) : '',
  program: lead.service_interest ? String(lead.service_interest) : '',
  programType: lead.service_interest ? String(lead.service_interest) : ''
});

export default function AdminEditLeadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const leadId = params?.id;

  const [formData, setFormData] = useState<LeadFormData>(emptyForm);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [programs, setPrograms] = useState<SelectOption[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramTypeOption[]>([]);
  const [leadSources, setLeadSources] = useState<SelectOption[]>([]);
  const [employees, setEmployees] = useState<SelectOption[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // FOE and Branch Manager only ever reassign leads to their own branch's
  // counselors; CEO (and anyone else) can pick from every branch.
  const { user } = useAuth();
  const isBranchLockedRole = isFoeOrBranchManagerOrCeo(user as any) && String((user as any)?.roleName || '').trim().toLowerCase() !== 'ceo';
  // Once a lead is in the CRM, only Branch Manager or CEO can change its
  // contact details - counselors see them read-only here (also enforced
  // server-side in PUT /api/leads/[id]).
  const canEditContactInfo = isBranchManagerOrCeo(user as any);
  // Plain counselors never get to see or change who a lead is assigned to —
  // only FOE/Branch Manager/CEO may reassign (also enforced server-side).
  const canEditAssignment = isFoeOrBranchManagerOrCeo(user as any);
  const leadOwnerOptions = isBranchLockedRole && user?.branch
    ? employees.filter((e) => String(e.branch ?? '') === String(user.branch))
    : employees;

  useEffect(() => {
    const loadInitialData = async () => {
      if (!leadId) return;
      setPageLoading(true);
      setError('');

      try {
        const [leadRes, countriesRes, sourcesRes, employeesRes] = await Promise.all([
          fetch(`/api/leads/${leadId}`),
          fetch('/api/countries'),
          fetch('/api/lead-sources'),
          fetch('/api/employees/active?role=counsellor')
        ]);

        if (!leadRes.ok) {
          const leadError = await leadRes.json().catch(() => ({}));
          throw new Error(leadError.error || 'Lead not found');
        }

        const lead = await leadRes.json();
        setFormData(toFormData(lead));

        if (countriesRes.ok) setCountries(await countriesRes.json());
        if (sourcesRes.ok) setLeadSources([{ id: '', name: '--None--' }, ...(await sourcesRes.json())]);
        if (employeesRes.ok) setEmployees(await employeesRes.json());
      } catch (loadError) {
        console.error('Error loading lead edit page:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load lead');
      } finally {
        setPageLoading(false);
      }
    };

    loadInitialData();
  }, [leadId]);

  useEffect(() => {
    if (!formData.programCountry) {
      setPrograms([]);
      setProgramTypes([]);
      return;
    }

    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await fetch(`/api/country-programs?countryId=${formData.programCountry}`);
        setPrograms(response.ok ? await response.json() : []);
      } catch (programError) {
        console.error('Error fetching programs:', programError);
        setPrograms([]);
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, [formData.programCountry]);

  useEffect(() => {
    if (!formData.programCountry || !formData.program) {
      setProgramTypes([]);
      return;
    }

    const fetchProgramTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await fetch(`/api/program-types?countryId=${formData.programCountry}&programId=${formData.program}`);
        setProgramTypes(response.ok ? await response.json() : []);
      } catch (typeError) {
        console.error('Error fetching program types:', typeError);
        setProgramTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProgramTypes();
  }, [formData.programCountry, formData.program]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value
      };
      if (name === 'dateOfBirth') {
        next.age = calculateAgeFromDob(value);
      }
      // Prospect leads are prioritized P1-P4 instead of the Hot/Warm/Cold/
      // High/Medium/Low scale, so switching status in/out of Prospect must
      // re-pick a priority that's actually valid for the now-active options.
      if (name === 'status') {
        const wasProspect = prev.status === 'Prospect';
        const isProspect = value === 'Prospect';
        if (isProspect && !wasProspect) next.priority = 'P1';
        else if (!isProspect && wasProspect) next.priority = 'Medium';
      }
      return next;
    });
  };

  const handleProgramCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      programCountry: event.target.value,
      program: '',
      programType: ''
    }));
  };

  const handleProgramChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      program: event.target.value,
      programType: ''
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!leadId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salutation: formData.salutation,
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          suffix: formData.suffix,
          // Omitted entirely for plain counselors, same reason as leadOwner
          // below: the server's "did this request touch contact info"
          // guard checks whether these keys are present at all, not whether
          // their value actually changed — so sending them unconditionally
          // (even with their unchanged values) 403'd every single edit a
          // counselor made, not just ones that actually changed contact info.
          ...(canEditContactInfo ? { email: formData.email, phone: formData.phone, whatsappNumber: formData.whatsappNumber } : {}),
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          dateOfBirth: formData.dateOfBirth,
          genderIdentity: formData.genderIdentity,
          age: formData.age,
          utmSource: formData.utmSource,
          utmMedium: formData.utmMedium,
          gclId: formData.gclId,
          leadSource: formData.leadSource,
          // Omitted entirely for plain counselors: sending it at all (even
          // unchanged) would trip the server's "only FOE/Branch Manager/CEO
          // can touch assignment" guard on an otherwise-unrelated edit.
          ...(canEditAssignment ? { leadOwner: formData.leadOwner } : {}),
          reEnquiry: formData.reEnquiry,
          reEnquiryCounter: formData.reEnquiryCounter,
          prospectFollowUp: formData.prospectFollowUp,
          callAttempt1: formData.callAttempt1,
          callBackAttempts: formData.callBackAttempts,
          callAttemptsDeadline: formData.callAttemptsDeadline,
          watnotBot: formData.watnotBot,
          roundrobin: formData.roundrobin,
          whatsapp: formData.whatsapp,
          status: formData.status,
          priority: formData.priority,
          notes: formData.notes,
          leadQuality: formData.leadQuality,
          programCountry: formData.programCountry,
          program: formData.program,
          programType: formData.programType || formData.program
        })
      });

      if (!response.ok) {
        const updateError = await response.json().catch(() => ({}));
        const message = Array.isArray(updateError.errors) ? updateError.errors.join('\n') : updateError.error || 'Error updating lead';
        throw new Error(message);
      }

      window.toast.success('Lead updated successfully!');
      // router.push('/admin/leads') always landed on the unfiltered list -
      // the Leads page keeps its status/tab filters in React state, not the
      // URL, so a fresh navigation there reset whatever filter (e.g. "New
      // Leads") the user had applied before opening this lead. Going back
      // returns to that exact page state instead.
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/admin/leads');
      }
    } catch (submitError) {
      console.error('Error updating lead:', submitError);
      window.toast.error(submitError instanceof Error ? submitError.message : 'Error updating lead. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const salutations = ['--None--', 'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
  const genderOptions = ['--None--', 'Male', 'Female', 'Other', 'Prefer not to say'];
  const staticCountries = ALL_COUNTRIES;
  const priorities = formData.status === 'Prospect' ? ['P1', 'P2', 'P3', 'P4'] : ['Hot', 'Warm', 'Cold', 'High', 'Medium', 'Low'];
  const statuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Closed', 'Prospect', 'Not Interested', 'DNQ', 'Not_answered', 'Could Not Connect', 'Call Back', 'Abroad Lead', 'Junk', 'Duplicate'];
  const leadQualities = ['Hot', 'Warm', 'Cold'];

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-blue-600" />
        <span className="text-gray-700">Loading lead...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <button onClick={() => router.push('/admin/leads')} className="mb-6 flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Leads
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <FormPageHeader
        title="Edit Lead"
        onBack={() => router.push('/admin/leads')}
        badge={<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Lead #{leadId}</span>}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection icon={User} title="Lead Information" description="Name and how to reach this person">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SelectField name="salutation" label="Salutation" value={formData.salutation} onChange={handleInputChange}>
              {salutations.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <TextField name="firstName" label="First Name" value={formData.firstName} onChange={handleInputChange} required />
            <TextField name="middleName" label="Middle Name" value={formData.middleName} onChange={handleInputChange} />
            <TextField name="lastName" label="Last Name" value={formData.lastName} onChange={handleInputChange} required />
            <TextField name="suffix" label="Suffix" value={formData.suffix} onChange={handleInputChange} />
            <Field label={canEditContactInfo ? 'Email' : 'Email (Branch Manager/CEO only)'} required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required disabled={!canEditContactInfo} className="w-full rounded-lg border border-[var(--cmg-border)] bg-white px-3.5 py-2.5 pl-9 text-sm text-[var(--cmg-ink)] cmg-focus transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
            </Field>
            <Field label={canEditContactInfo ? 'Phone' : 'Phone (Branch Manager/CEO only)'} required>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required disabled={!canEditContactInfo} className="w-full rounded-lg border border-[var(--cmg-border)] bg-white px-3.5 py-2.5 pl-9 text-sm text-[var(--cmg-ink)] cmg-focus transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
            </Field>
            <Field label={canEditContactInfo ? 'WhatsApp Number' : 'WhatsApp Number (Branch Manager/CEO only)'}>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} disabled={!canEditContactInfo} className="w-full rounded-lg border border-[var(--cmg-border)] bg-white px-3.5 py-2.5 pl-9 text-sm text-[var(--cmg-ink)] cmg-focus transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
            </Field>
          </div>
        </FormSection>

        <FormSection icon={MapPin} title="Address">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TextAreaField name="street" label="Street" value={formData.street} onChange={handleInputChange} rows={2} wide />
            <TextField name="city" label="City" value={formData.city} onChange={handleInputChange} />
            <TextField name="state" label="State/Province" value={formData.state} onChange={handleInputChange} />
            <TextField name="postalCode" label="Zip/Postal Code" value={formData.postalCode} onChange={handleInputChange} />
            <SelectField name="country" label="Country" value={formData.country} onChange={handleInputChange}>
              {formData.country && !staticCountries.includes(formData.country as typeof staticCountries[number]) && (
                <option value={formData.country}>{formData.country}</option>
              )}
              {staticCountries.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectField>
          </div>
        </FormSection>

        <FormSection icon={UserCircle2} title="Personal Information">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SelectField name="genderIdentity" label="Gender Identity" value={formData.genderIdentity} onChange={handleInputChange}>
              {genderOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <TextField name="age" label="Age (auto-calculated)" type="number" value={formData.age} onChange={handleInputChange} disabled />
            <TextField name="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={Tag} title="Lead Details" description="Where this lead came from">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SelectField name="leadSource" label="Lead Source" value={formData.leadSource} onChange={handleInputChange}>
              {formData.leadSource && !leadSources.some((source) => String(source.id ?? source.name ?? '') === formData.leadSource) && (
                <option value={formData.leadSource}>{formData.leadSource}</option>
              )}
              {leadSources.map((source) => (
                <option key={source.id ?? source.name} value={source.id ?? source.name ?? ''}>
                  {source.name ?? source.id}
                </option>
              ))}
            </SelectField>
            <TextField name="utmSource" label="UTM Source" value={formData.utmSource} onChange={handleInputChange} />
            <TextField name="utmMedium" label="UTM Medium" value={formData.utmMedium} onChange={handleInputChange} />
            <TextField name="gclId" label="GCLID" value={formData.gclId} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={GraduationCap} title="Program Selection">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SelectField name="programCountry" label="Country" value={formData.programCountry} onChange={handleProgramCountryChange}>
              <option value="">-- Select Country --</option>
              {formData.programCountry && !countries.some((country) => String(country.id) === formData.programCountry) && (
                <option value={formData.programCountry}>{formData.programCountry}</option>
              )}
              {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
            </SelectField>
            <SelectField name="program" label="Program" value={formData.program} onChange={handleProgramChange} disabled={!formData.programCountry || loadingPrograms} loading={loadingPrograms}>
              <option value="">-- Select Program --</option>
              {formData.program && !programs.some((program) => String(program.id) === formData.program) && (
                <option value={formData.program}>{formData.program}</option>
              )}
              {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </SelectField>
            <SelectField name="programType" label="Program Type" value={formData.programType} onChange={handleInputChange} disabled={!formData.program || loadingTypes} loading={loadingTypes}>
              <option value="">-- Select Type --</option>
              {formData.programType && !programTypes.some((type) => String(type.id) === formData.programType) && (
                <option value={formData.programType}>{formData.programType}</option>
              )}
              {programTypes.map((type) => <option key={type.id} value={type.id}>{type.type}</option>)}
            </SelectField>
          </div>
        </FormSection>

        <FormSection icon={UserCog} title="Assignment">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {canEditAssignment && (
              <SelectField name="leadOwner" label="Counselor" value={formData.leadOwner} onChange={handleInputChange} hint={isBranchLockedRole ? 'Showing counselors in your branch only.' : undefined}>
                <option value="">Select Counselor</option>
                {leadOwnerOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </SelectField>
            )}
            <TextField name="assignedDate" label="Assigned Date (auto-tracked)" type="datetime-local" value={formData.assignedDate} onChange={handleInputChange} disabled />
            <TextField name="reEnquiryCounter" label="Re-Enquiry Counter" type="number" value={formData.reEnquiryCounter} onChange={handleInputChange} />
            <CheckboxField name="reEnquiry" label="Re-Enquiry" checked={formData.reEnquiry} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={CalendarClock} title="Follow-up">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <TextField name="prospectFollowUp" label="Prospect Follow-Up" type="datetime-local" value={formData.prospectFollowUp} onChange={handleInputChange} />
            <TextField name="callAttempt1" label="Call Attempt 1" type="datetime-local" value={formData.callAttempt1} onChange={handleInputChange} />
            <TextField name="callBackAttempts" label="Call Back Attempts" type="number" value={formData.callBackAttempts} onChange={handleInputChange} />
            <TextField name="callAttemptsDeadline" label="Call Attempts Deadline" type="datetime-local" value={formData.callAttemptsDeadline} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={SlidersHorizontal} title="Additional Options">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <CheckboxField name="watnotBot" label="Chat Lead / Bot Lead" checked={formData.watnotBot} onChange={handleInputChange} />
            <CheckboxField name="roundrobin" label="Roundrobin" checked={formData.roundrobin} onChange={handleInputChange} />
            <CheckboxField name="whatsapp" label="Whatsapp" checked={formData.whatsapp} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={Flag} title="Status & Priority">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SelectField name="status" label="Status" value={formData.status} onChange={handleInputChange}>
              {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <SelectField name="priority" label="Priority" value={formData.priority} onChange={handleInputChange}>
              {priorities.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <SelectField name="leadQuality" label="Lead Quality" value={formData.leadQuality} onChange={handleInputChange}>
              {leadQualities.map((option) => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <TextAreaField name="notes" label="Notes" value={formData.notes} onChange={handleInputChange} rows={4} wide />
          </div>
        </FormSection>

        <FormActionBar>
          <p className="text-xs text-gray-400">Changes save immediately to Lead #{leadId}.</p>
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => router.push('/admin/leads')}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Updating...' : 'Update Lead'}
            </PrimaryButton>
          </div>
        </FormActionBar>
      </form>
    </div>
  );
}
