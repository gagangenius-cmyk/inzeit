export interface ChecklistRule {
  key: string;
  label: string;
  mandatory: boolean;
  accepted: string;
}

const commonIdentityDocs: ChecklistRule[] = [
  { key: 'passport_copy', label: 'Passport Copy (all pages)', mandatory: true, accepted: 'PDF, JPG, PNG' },
  { key: 'passport_photo', label: 'Passport-size Photo', mandatory: true, accepted: 'JPG, PNG' },
];

const financialDocs: ChecklistRule[] = [
  { key: 'bank_statement', label: 'Bank Statement (last 6 months)', mandatory: true, accepted: 'PDF' },
];

// Keyed by CrmcOpportunities.serviceType (free-text today - no lookup table exists).
// Matching is case-insensitive substring on the service type/service required text,
// falling back to a generic identity+financial checklist for anything unmapped.
const serviceChecklistRules: Array<{ match: RegExp; items: ChecklistRule[] }> = [
  {
    match: /visa|trv|visit/i,
    items: [
      ...commonIdentityDocs,
      { key: 'visa_application_form', label: 'Visa Application Form', mandatory: true, accepted: 'PDF' },
      { key: 'travel_itinerary', label: 'Travel Itinerary / Invitation Letter', mandatory: false, accepted: 'PDF' },
      ...financialDocs,
    ],
  },
  {
    match: /work permit|job seeker|employment/i,
    items: [
      ...commonIdentityDocs,
      { key: 'resume', label: 'Updated Resume / CV', mandatory: true, accepted: 'PDF, DOC' },
      { key: 'qualification_certificates', label: 'Educational / Professional Certificates', mandatory: true, accepted: 'PDF' },
      { key: 'employment_offer', label: 'Employment Offer Letter (if available)', mandatory: false, accepted: 'PDF' },
    ],
  },
  {
    match: /skilled|migration|permanent residence|pr\b/i,
    items: [
      ...commonIdentityDocs,
      { key: 'qualification_certificates', label: 'Educational / Professional Certificates', mandatory: true, accepted: 'PDF' },
      { key: 'skills_assessment', label: 'Skills Assessment Result', mandatory: true, accepted: 'PDF' },
      { key: 'english_test', label: 'English Test Result (IELTS/PTE)', mandatory: true, accepted: 'PDF' },
      ...financialDocs,
    ],
  },
];

const fallbackChecklist: ChecklistRule[] = [...commonIdentityDocs, ...financialDocs];

export function getChecklistRulesForService(serviceType: string | null | undefined, serviceRequired: string | null | undefined): ChecklistRule[] {
  const text = `${serviceType || ''} ${serviceRequired || ''}`;
  const matched = serviceChecklistRules.find((rule) => rule.match.test(text));
  return matched ? matched.items : fallbackChecklist;
}
