export type OperationsSearchRow = {
  opportunityId: number;
  opportunityNumber: string | null;
  opportunityName: string | null;
  serviceType: string | null;
  serviceRequired: string | null;
  opportunityStatus: string | null;
  retentionStatus: string | null;
  estimatedValue: number | string | null;
  actualValue: number | string | null;
  currency: string | null;
  leadId: number;
  fname: string | null;
  lname: string | null;
  email: string | null;
  mobile: string | null;
  phone: string | null;
  nationality: string | null;
  country_interest: string | null;
  service_interest: string | null;
  leadType: string | null;
  leadStatus: string | null;
  case_officer: number | null;
  agreementId: number | null;
  agreementNumber: string | null;
  agreementType: string | null;
  agreementTitle: string | null;
  agreementStatus: string | null;
  generatedDate: string | null;
  latestPaymentId: number | null;
  paymentNumber: string | null;
  receiptNumber: string | null;
  paidAmount: number | string | null;
  totalAmount: number | string | null;
  paymentStatus: string | null;
};

type SearchOptions = {
  module?: string;
  leadId?: string | number | null;
  agreementNumber?: string | null;
  search?: string | null;
  limit?: number;
};

const asNumber = (value: number | string | null | undefined) => Number(value || 0);
const today = () => new Date().toISOString();
const displayDate = (value?: string | null) => value || today();

export async function searchOperationCases(options: SearchOptions = {}) {
  const params = new URLSearchParams();
  if (options.module) params.set('module', options.module);
  if (options.leadId) params.set('leadId', String(options.leadId));
  if (options.agreementNumber) params.set('agreementNumber', options.agreementNumber);
  if (options.search) params.set('search', options.search);
  params.set('limit', String(options.limit || 50));

  const response = await fetch(`/api/admin/operations/search?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to load operations cases');
  }

  const payload = await response.json();
  return (payload.data || []) as OperationsSearchRow[];
}

export async function findOperationCase(options: SearchOptions) {
  const rows = await searchOperationCases({ ...options, limit: 1 });
  return rows[0] || null;
}

export function clientName(row: OperationsSearchRow) {
  return [row.fname, row.lname].filter(Boolean).join(' ').trim() || row.opportunityName || `Lead ${row.leadId}`;
}

export function operationStatus(row: OperationsSearchRow) {
  if (row.opportunityStatus === 'won' || row.retentionStatus === 'approved') return 'in_progress';
  return row.opportunityStatus || row.leadStatus || 'pending';
}

export function paymentDue(row: OperationsSearchRow) {
  return Math.max(asNumber(row.totalAmount) - asNumber(row.paidAmount), 0);
}

export function baseOperationFields(row: OperationsSearchRow) {
  return {
    id: row.opportunityId,
    leadId: row.leadId,
    leadName: clientName(row),
    agreementNumber: row.agreementNumber || row.opportunityNumber || '',
    paymentDue: paymentDue(row),
    paymentRemarks: row.paymentStatus || '',
    paymentDueDate: displayDate(row.generatedDate),
    status: operationStatus(row),
    createdAt: displayDate(row.generatedDate),
    updatedAt: today(),
    assignedTo: row.case_officer ? `Officer ${row.case_officer}` : '',
    assignedToId: row.case_officer || 0,
  };
}

export function mapOperationsRowToListItem(row: OperationsSearchRow) {
  const base = baseOperationFields(row);
  const totalCost = Number(row.totalAmount || row.estimatedValue || 0);
  const paidAmount = Number(row.paidAmount || 0);
  const status = operationStatus(row);
  const service = row.service_interest || row.serviceType || row.agreementType || 'Operations Case';
  const currentCountry = row.country_interest || '';
  const stageStatus = row.agreementStatus === 'uploaded' || row.agreementStatus === 'signed' ? 'completed' : 'pending';
  const financials = {
    serviceFee: totalCost,
    processingFees: 0,
    governmentFees: 0,
    assessmentFees: 0,
    investmentAmount: 0,
    totalCost,
    paidAmount,
    balanceAmount: paymentDue(row),
    paymentStatus: row.paymentStatus || 'pending',
    nextPaymentDue: ''
  };
  const documents = {
    passport: [],
    resume: [],
    educational: [],
    professional: [],
    language: [],
    other: [],
    businessPlan: [],
    financialStatements: [],
    investmentProof: [],
    registrationDocuments: [],
    educationalCertificates: [],
    skillsAssessment: [],
    financialDocuments: [],
    languageTest: [],
    policeClearance: [],
    financialProof: [],
    sourceOfFunds: [],
    applicationForms: [],
    supportingDocuments: []
  };

  return {
    ...base,
    // Aliases used by the legacy program-specific list pages.
    clientName: clientName(row),
    clientEmail: row.email || '',
    clientPhone: row.mobile || row.phone || '',
    applicantName: clientName(row),
    applicantEmail: row.email || '',
    applicantPhone: row.mobile || row.phone || '',
    email: row.email || '',
    phone: row.mobile || row.phone || '',
    agreementNumber: row.agreementNumber || row.opportunityNumber || '',
    priority: 'medium',
    nextFollowUp: '',
    caseType: service,
    country: currentCountry,
    targetCountry: currentCountry,
    visaType: service,
    occupation: row.serviceRequired || service,
    targetPosition: row.serviceRequired || service,
    companyName: row.opportunityName || '',
    employerName: row.opportunityName || '',
    employerAddress: '',
    employerPhone: '',
    employerEmail: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    businessType: service,
    registrationNumber: row.agreementNumber || '',
    incorporationStatus: status === 'in_progress' ? 'in_progress' : stageStatus,
    workPermitStatus: status === 'in_progress' ? 'in_progress' : 'pending',
    investorVisaStatus: status === 'in_progress' ? 'in_progress' : 'pending',
    applicationStatusValue: status,
    lmiastatus: 'not_required',
    permitType: 'employer_specific',
    jobTitle: row.serviceRequired || service,
    jobCategory: service,
    workLocation: currentCountry,
    salary: 0,
    dateOfBirth: '',
    passportNumber: '',
    startDate: displayDate(row.generatedDate),
    expectedCompletion: '',
    serviceFee: totalCost,
    investmentAmount: totalCost,
    anzscoCode: '',
    personalInfo: {
      fullName: clientName(row),
      dateOfBirth: '',
      passportNumber: '',
      nationality: row.nationality || '',
      email: row.email || '',
      phone: row.mobile || row.phone || '',
      address: '',
      currentLocation: currentCountry,
      maritalStatus: '',
      education: '',
      profession: row.serviceRequired || '',
      languages: []
    },
    caseDetails: {
      category: service,
      subCategory: row.agreementTitle || '',
      program: service,
      duration: '',
      investmentAmount: totalCost,
      position: row.serviceRequired || ''
    },
    investmentDetails: {
      program: service,
      investmentType: row.agreementType || '',
      familyMembers: 0
    },
    workExperience: {
      totalYears: 0,
      currentOccupation: row.serviceRequired || '',
      nocCode: '',
      company: '',
      duration: '',
      duties: []
    },
    pointsTest: {
      totalPoints: 0,
      requiredPoints: 0
    },
    skillsAssessment: {
      assessingAuthority: '',
      outcome: stageStatus,
      referenceNumber: row.agreementNumber || ''
    },
    englishProficiency: {
      ieltsOverall: '',
      testDate: ''
    },
    registrationStatus: {
      companyRegistration: stageStatus,
      taxRegistration: 'pending',
      socialSecurity: 'pending',
      licenses: 'pending'
    },
    applicationStatus: {
      initialConsultation: 'completed',
      documentCollection: stageStatus,
      applicationSubmission: 'pending',
      governmentReview: 'pending',
      dueDiligence: 'pending',
      submitted: false,
      biometrics: false,
      medical: false,
      interview: false,
      decision: row.agreementStatus || 'pending'
    },
    documents,
    financials,
    milestones: [],
    notes: []
  };
}
