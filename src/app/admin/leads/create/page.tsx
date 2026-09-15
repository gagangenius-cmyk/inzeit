'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Phone, Globe, Loader2, AlertTriangle, AlertCircle, User, MapPin, UserCircle2, Tag, GraduationCap, UserCog, CalendarClock, SlidersHorizontal, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isFoeOrBranchManagerOrCeo } from '@/lib/roleChecks';
import { ALL_COUNTRIES } from '@/lib/countries';
import { calculateAgeFromDob } from '@/lib/utils';
import {
  FormSection, Field, TextField, TextAreaField, SelectField, CheckboxField,
  FormPageHeader, FormActionBar, PrimaryButton, SecondaryButton, inputClass,
} from '@/components/leads/LeadFormFields';

interface LeadFormData {
  // Lead Information
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  whatsappNumber: string;

  // Address Information
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // Personal Information
  genderIdentity: string;
  age: string;
  dateOfBirth: string;

  // Lead Details
  leadSource: string;
  utmSource: string;
  utmMedium: string;
  gclId: string;

  // Assignment
  leadOwner: string;
  assignedDate: string;
  autoAssign: boolean;
  reEnquiry: boolean;
  reEnquiryCounter: number;

  // Follow-up
  prospectFollowUp: string;
  callAttempt1: string;
  callBackAttempts: number;
  callAttemptsDeadline: string;

  // Additional Fields
  watnotBot: boolean;
  roundrobin: boolean;
  whatsapp: boolean;

  // System Fields
  status: string;
  priority: string;
  notes: string;

  // Chained Dropdown Fields
  programCountry: string;
  program: string;
  programType: string;
}

export default function AdminCreateLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpportunityMode = searchParams.get('mode') === 'opportunity';
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    leadId: number;
    ownerId: number | null;
    ownerName: string | null;
    status: string;
  } | null>(null);
  const [transferReason, setTransferReason] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferRequested, setTransferRequested] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
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
    country: '--None--',

    genderIdentity: '',
    age: '',
    dateOfBirth: '',

    leadSource: '',
    utmSource: '',
    utmMedium: '',
    gclId: '',

    leadOwner: '',
    assignedDate: '',
    // Off by default: a lead should only be auto-assigned via round-robin when
    // explicitly requested. If no counselor is picked and this stays unchecked,
    // the lead enters unassigned for a FOE/Branch Manager/CEO to assign later.
    autoAssign: false,
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

    programCountry: '',
    program: '',
    programType: ''
  });

  // State for dropdown options
  const [countries, setCountries] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [programTypes, setProgramTypes] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [ownerBranchFilter, setOwnerBranchFilter] = useState('');
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Get logged-in user
  const { user } = useAuth();
  const isCeoUser = String((user as any)?.roleName || '').trim().toLowerCase() === 'ceo';
  // FOE and Branch Manager only ever add leads for their own branch's staff;
  // CEO can pick any branch via the selector below.
  const isBranchLockedRole = isFoeOrBranchManagerOrCeo(user as any) && !isCeoUser;
  // Plain counselors never see or choose the Counselor field — a new lead
  // they add is always assigned to themselves (enforced server-side too).
  const isPlainCounsellor = !isCeoUser && !isBranchLockedRole;
  const effectiveOwnerBranch = isBranchLockedRole ? String(user?.branch || '') : ownerBranchFilter;
  const leadOwnerOptions = effectiveOwnerBranch
    ? employees.filter((e) => String(e.branch || '') === effectiveOwnerBranch)
    : employees;

  // Fetch countries, lead sources, and employees on component mount
  useEffect(() => {
    fetchCountries();
    fetchLeadSources();
    fetchEmployees();
    fetchBranches();
  }, []);

  // Default the counselor to the logged-in user when they are themselves a
  // counselor. FOE/Branch Manager/CEO aren't counselors, so they must
  // explicitly pick one from the dropdown instead of defaulting to themselves.
  useEffect(() => {
    if (user && !formData.leadOwner && !isCeoUser && !isBranchLockedRole) {
      setFormData(prev => ({
        ...prev,
        leadOwner: user.id.toString(),
        assignedDate: new Date().toISOString().split('T')[0]
      }));
    } else if (user && !formData.assignedDate) {
      setFormData(prev => ({ ...prev, assignedDate: new Date().toISOString().split('T')[0] }));
    }
  }, [user, isCeoUser, isBranchLockedRole]);

  // Check the email/phone against existing leads as the person types (debounced),
  // instead of only finding out about the duplicate after they hit Save.
  useEffect(() => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const phoneValid = phoneDigits.length >= 7;
    if (!emailValid && !phoneValid) return;

    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (emailValid) params.set('email', formData.email);
        if (phoneValid) params.set('phone', formData.phone);
        const res = await fetch(`/api/leads/check-duplicate?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.duplicate) {
          setDuplicateInfo({
            leadId: json.duplicateLeadId,
            ownerId: json.duplicateLeadOwnerId ?? null,
            ownerName: json.duplicateLeadOwner ?? null,
            status: json.duplicateLeadStatus || 'New',
          });
        }
      } catch (error) {
        console.error('Error checking for duplicate lead:', error);
      }
    }, 600);

    return () => clearTimeout(handle);
  }, [formData.email, formData.phone]);

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  // Fetch programs when country changes
  useEffect(() => {
    if (formData.programCountry) {
      fetchPrograms(formData.programCountry);
    } else {
      setPrograms([]);
      setProgramTypes([]);
      setFormData(prev => ({ ...prev, program: '', programType: '' }));
    }
  }, [formData.programCountry]);

  // Fetch program types when program changes
  useEffect(() => {
    if (formData.programCountry && formData.program) {
      fetchProgramTypes(formData.programCountry, formData.program);
    } else {
      setProgramTypes([]);
      setFormData(prev => ({ ...prev, programType: '' }));
    }
  }, [formData.programCountry, formData.program]);

  const fetchPrograms = async (countryId: string) => {
    setLoadingPrograms(true);
    try {
      const response = await fetch(`/api/country-programs?countryId=${countryId}`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const response = await fetch('/api/lead-sources');
      if (response.ok) {
        const data = await response.json();
        setLeadSources([{ id: '', name: '--None--' }, ...data]);
      }
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Only counselors can be a lead's owner from this form — CEO sees every
      // branch, FOE/Branch Manager are locked server-side to their own branch.
      const response = await fetch('/api/employees/active?role=counsellor');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches?limit=200&status=1');
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchProgramTypes = async (countryId: string, programId: string) => {
    setLoadingTypes(true);
    try {
      const response = await fetch(`/api/program-types?countryId=${countryId}&programId=${programId}`);
      if (response.ok) {
        const data = await response.json();
        setProgramTypes(data);
      }
    } catch (error) {
      console.error('Error fetching program types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (formErrors.length > 0) setFormErrors([]);
    // A stale "this lead already exists" panel from a previous email/phone
    // shouldn't linger once the person edits either field again.
    if ((name === 'email' || name === 'phone') && duplicateInfo) {
      setDuplicateInfo(null);
      setTransferRequested(false);
      setTransferReason('');
    }
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      };
      if (name === 'dateOfBirth') {
        next.age = calculateAgeFromDob(value);
      }
      // Prospect leads are prioritized P1-P4 instead of the Hot/Warm/Cold
      // scale, so switching status in/out of Prospect must re-pick a
      // priority that's actually valid for the now-active option list.
      if (name === 'status') {
        const wasProspect = prev.status === 'Prospect';
        const isProspect = value === 'Prospect';
        if (isProspect && !wasProspect) next.priority = 'P1';
        else if (!isProspect && wasProspect) next.priority = 'Medium';
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateLeadForm(formData);
    if (errors.length > 0) {
      setFormErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormErrors([]);
    setDuplicateInfo(null);
    setLoading(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // CEO isn't tied to one branch — the lead (and any agreement later
          // generated for it) must use whichever branch the CEO picked in the
          // selector above, not the CEO's own (empty) branch. Every other
          // role has no branch picker and always uses their own branch.
          branch: isCeoUser ? (ownerBranchFilter || user?.branch || 1) : (user?.branch || 1),
          autoAssign: formData.autoAssign,
          created_by_admin: true,
          admin_created: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const addedByLabel = `${user?.name || 'you'}${user?.roleName ? ` (${user.roleName})` : ''}`;
        // Soft, non-blocking signal (unlike the exact-match 409 above) - a
        // similarly-spelled name already exists. Never stops creation, just
        // gives the creator a heads-up in case it's a re-enquiry under a
        // slightly different spelling.
        const topMatch = result?.possibleDuplicates?.[0];
        if (topMatch) {
          window.toast.warning(
            `Possible duplicate: Lead #${topMatch.id} (${[topMatch.fname, topMatch.lname].filter(Boolean).join(' ')}) has a very similar name - ${topMatch.matchReason}.`,
            { durationMs: 8000 }
          );
        }
        if (isOpportunityMode && result?.id) {
          window.toast.success(`Lead added by ${addedByLabel}. Opening opportunity flow...`);
          router.push(`/admin/leads/opportunity-flow?leadId=${result.id}`);
        } else {
          window.toast.success(`Lead added by ${addedByLabel}`);
          // The Leads list keeps its status/tab filters (e.g. "New Leads") in
          // React state, not the URL, so a fresh push to '/admin/leads'
          // always landed back on the unfiltered default view. Going back
          // returns to the exact filtered page state the user came from.
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push('/admin/leads');
          }
        }
      } else {
        const error = await response.json();
        if (response.status === 409 && error.duplicateLeadId) {
          setDuplicateInfo({
            leadId: error.duplicateLeadId,
            ownerId: error.duplicateLeadOwnerId ?? null,
            ownerName: error.duplicateLeadOwner ?? null,
            status: error.duplicateLeadStatus || 'New',
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const messages = Array.isArray(error.errors) ? error.errors.join('\n') : error.message || error.error || 'Unknown error';
          window.toast.error(`Error creating lead: ${messages}`);
        }
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      window.toast.error('Error creating lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransfer = async () => {
    if (!duplicateInfo?.ownerId || !user) return;
    setTransferSubmitting(true);
    try {
      const res = await fetch('/api/lead-reassignments-working', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: duplicateInfo.leadId,
          fromEmployeeId: duplicateInfo.ownerId,
          toEmployeeId: user.id,
          reassignmentType: 'transfer',
          reason: transferReason.trim() || `${user.name || 'A counselor'} re-enquired on this lead and is requesting ownership.`,
          previousStatus: duplicateInfo.status,
          newStatus: duplicateInfo.status,
          createdBy: user.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.error || 'Failed to submit transfer request');
      setTransferRequested(true);
    } catch (err) {
      window.toast.error(err instanceof Error ? err.message : 'Failed to submit transfer request');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const salutations = ['--None--', 'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
  const genderOptions = ['--None--', 'Male', 'Female', 'Other', 'Prefer not to say'];
  const staticCountries = ALL_COUNTRIES;
  const priorities = formData.status === 'Prospect' ? ['P1', 'P2', 'P3', 'P4'] : ['Hot', 'Warm', 'Cold'];
  const statuses = ['New', 'Contacted', 'Qualified', 'Prospect', 'Converted', 'Closed'];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <FormPageHeader
        title={isOpportunityMode ? 'New Lead → Opportunity' : 'New Lead'}
        onBack={() => router.back()}
        badge={<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Draft</span>}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {formErrors.length > 0 && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Please correct the following before saving:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {formErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          </div>
        )}
        {duplicateInfo && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="font-semibold">
                A lead with this email or phone already exists (Lead #{duplicateInfo.leadId})
                {duplicateInfo.ownerName ? `, currently owned by ${duplicateInfo.ownerName}.` : ', and is currently unassigned.'}
              </p>
              {duplicateInfo.ownerId ? (
                transferRequested ? (
                  <p className="mt-2 text-emerald-700">
                    Transfer request submitted — it&apos;s pending approval from a Branch Manager or CEO.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="Reason for requesting this lead (optional)"
                      rows={2}
                      className="w-full rounded-lg border border-amber-300 bg-white px-3.5 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/15"
                    />
                    <SecondaryButton onClick={handleRequestTransfer}>
                      {transferSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {transferSubmitting ? 'Submitting...' : 'Request Transfer'}
                    </SecondaryButton>
                  </div>
                )
              ) : (
                <p className="mt-2">This lead is currently unassigned — contact your Branch Manager to have it assigned to you.</p>
              )}
            </div>
          </div>
        )}

        <FormSection icon={User} title="Lead Information" description="Name and how to reach this person">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SelectField name="salutation" label="Salutation" value={formData.salutation} onChange={handleInputChange}>
              {salutations.map(option => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <TextField name="firstName" label="First Name" value={formData.firstName} onChange={handleInputChange} required placeholder="First Name" />
            <TextField name="middleName" label="Middle Name" value={formData.middleName} onChange={handleInputChange} placeholder="Middle Name" />
            <TextField name="lastName" label="Last Name" value={formData.lastName} onChange={handleInputChange} required placeholder="Last Name" />
            <TextField name="suffix" label="Suffix" value={formData.suffix} onChange={handleInputChange} placeholder="Suffix" />
            <TextField name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="Email" icon={Mail} />
            <TextField name="phone" label="Phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="Phone" icon={Phone} />
            <TextField name="whatsappNumber" label="WhatsApp Number" type="tel" value={formData.whatsappNumber} onChange={handleInputChange} placeholder="WhatsApp Number" icon={Phone} />
          </div>
        </FormSection>

        <FormSection icon={MapPin} title="Address">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TextAreaField name="street" label="Street" value={formData.street} onChange={handleInputChange} rows={2} wide placeholder="Street Address" />
            <TextField name="city" label="City" value={formData.city} onChange={handleInputChange} placeholder="City" />
            <TextField name="state" label="State/Province" value={formData.state} onChange={handleInputChange} placeholder="State/Province" />
            <TextField name="postalCode" label="Zip/Postal Code" value={formData.postalCode} onChange={handleInputChange} placeholder="Zip/Postal Code" />
            <SelectField name="country" label="Country" value={formData.country} onChange={handleInputChange}>
              {staticCountries.map(option => <option key={option} value={option}>{option}</option>)}
            </SelectField>
          </div>
        </FormSection>

        <FormSection icon={UserCircle2} title="Personal Information">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SelectField name="genderIdentity" label="Gender Identity" value={formData.genderIdentity} onChange={handleInputChange}>
              {genderOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <TextField name="age" label="Age (auto-calculated)" type="number" value={formData.age} onChange={handleInputChange} disabled placeholder="Set Date of Birth" />
            <TextField name="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={Tag} title="Lead Details" description="Where this lead came from">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SelectField name="leadSource" label="Lead Source" value={formData.leadSource} onChange={handleInputChange}>
              {leadSources.map(source => (
                <option key={source.id || source} value={source.id || source}>{source.name || source}</option>
              ))}
            </SelectField>
            <TextField name="utmSource" label="UTM Source" value={formData.utmSource} onChange={handleInputChange} placeholder="UTM Source" />
            <TextField name="utmMedium" label="UTM Medium" value={formData.utmMedium} onChange={handleInputChange} placeholder="UTM Medium" />
            <TextField name="gclId" label="GCLID" value={formData.gclId} onChange={handleInputChange} placeholder="GCLID" />
          </div>
        </FormSection>

        <FormSection icon={GraduationCap} title="Program Selection">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SelectField name="programCountry" label="Country" value={formData.programCountry} onChange={handleInputChange}>
              <option value="">-- Select Country --</option>
              {countries.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}
            </SelectField>
            <SelectField name="program" label="Program" value={formData.program} onChange={handleInputChange} disabled={!formData.programCountry || loadingPrograms} loading={loadingPrograms}>
              <option value="">-- Select Program --</option>
              {programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </SelectField>
            <SelectField name="programType" label="Program Type" value={formData.programType} onChange={handleInputChange} disabled={!formData.program || loadingTypes} loading={loadingTypes}>
              <option value="">-- Select Type --</option>
              {programTypes.map(type => <option key={type.id} value={type.id}>{type.type}</option>)}
            </SelectField>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50 p-4">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Program Selection Guide</p>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-blue-700/90">
                <li>First select the destination country</li>
                <li>Then choose an available program for that country</li>
                <li>Finally select the specific program type</li>
              </ul>
            </div>
          </div>
        </FormSection>

        <FormSection icon={UserCog} title="Assignment">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {isCeoUser && (
              <Field label="Branch">
                <SearchableSelect value={ownerBranchFilter} onChange={(e) => setOwnerBranchFilter(e.target.value)} className={inputClass}>
                  <option value="">-- All Branches --</option>
                  {branches.map((branch: any) => (
                    <option key={branch.id} value={String(branch.id)}>{branch.branch}</option>
                  ))}
                </SearchableSelect>
              </Field>
            )}

            {!isPlainCounsellor && (
              <SelectField name="leadOwner" label="Counselor" value={formData.leadOwner} onChange={handleInputChange} hint={isBranchLockedRole ? 'Showing counselors in your branch only.' : undefined}>
                <option value="">Select Counselor</option>
                {leadOwnerOptions.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </SelectField>
            )}

            <TextField name="assignedDate" label="Assigned Date" type="datetime-local" value={formData.assignedDate} onChange={handleInputChange} />
            <TextField name="reEnquiryCounter" label="Re-Enquiry Counter" type="number" value={formData.reEnquiryCounter} onChange={handleInputChange} placeholder="Re-Enquiry Counter" />
            <CheckboxField name="reEnquiry" label="Re-Enquiry" checked={formData.reEnquiry} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={CalendarClock} title="Follow-up">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <TextField name="prospectFollowUp" label="Prospect Follow-Up" type="datetime-local" value={formData.prospectFollowUp} onChange={handleInputChange} />
            <TextField name="callAttempt1" label="Call Attempt 1" type="datetime-local" value={formData.callAttempt1} onChange={handleInputChange} />
            <TextField name="callBackAttempts" label="Call Back Attempts" type="number" value={formData.callBackAttempts} onChange={handleInputChange} placeholder="Call Back Attempts" />
            <TextField name="callAttemptsDeadline" label="Call Attempts Deadline" type="datetime-local" value={formData.callAttemptsDeadline} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={SlidersHorizontal} title="Additional Options">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <CheckboxField name="watnotBot" label="Chat Lead / Bot Lead" checked={formData.watnotBot} onChange={handleInputChange} />
            {!isPlainCounsellor && (
              <CheckboxField name="roundrobin" label="Roundrobin" checked={formData.roundrobin} onChange={handleInputChange} />
            )}
            <CheckboxField name="whatsapp" label="Whatsapp" checked={formData.whatsapp} onChange={handleInputChange} />
          </div>
        </FormSection>

        <FormSection icon={Flag} title="Status & Priority">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <SelectField name="status" label="Status" value={formData.status} onChange={handleInputChange}>
              {statuses.map(option => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <SelectField name="priority" label="Priority" value={formData.priority} onChange={handleInputChange}>
              {priorities.map(option => <option key={option} value={option}>{option}</option>)}
            </SelectField>
            <TextAreaField name="notes" label="Notes" value={formData.notes} onChange={handleInputChange} rows={4} wide placeholder="Additional notes about this lead..." />
          </div>
        </FormSection>

        <FormActionBar>
          {!isPlainCounsellor ? (
            <CheckboxField name="autoAssign" label="Assign using active assignment rule" checked={formData.autoAssign} onChange={handleInputChange} />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <SecondaryButton onClick={() => router.back()}>Cancel</SecondaryButton>
            <PrimaryButton disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save'}
            </PrimaryButton>
          </div>
        </FormActionBar>
      </form>
    </div>
  );
}

function validateLeadForm(data: LeadFormData): string[] {
  const errors: string[] = [];
  const validName = /^[\p{L}][\p{L}\s.'-]*$/u;
  const phoneDigits = (value: string) => value.replace(/\D/g, '');

  if (!validName.test(data.firstName.trim())) errors.push('Enter a valid first name.');
  if (!validName.test(data.lastName.trim())) errors.push('Enter a valid last name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.push('Enter a valid email address.');

  const phone = phoneDigits(data.phone);
  if (phone.length < 7 || phone.length > 15) errors.push('Enter a valid phone number with 7 to 15 digits.');

  if (data.whatsappNumber && (phoneDigits(data.whatsappNumber).length < 7 || phoneDigits(data.whatsappNumber).length > 15)) {
    errors.push('Enter a valid WhatsApp number with 7 to 15 digits.');
  }

  if (data.age && (!Number.isInteger(Number(data.age)) || Number(data.age) < 0 || Number(data.age) > 120)) {
    errors.push('Age must be a whole number between 0 and 120.');
  }

  if (data.dateOfBirth) {
    const dateOfBirth = new Date(`${data.dateOfBirth}T00:00:00`);
    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > new Date()) errors.push('Date of birth cannot be in the future.');
  }

  return errors;
}
