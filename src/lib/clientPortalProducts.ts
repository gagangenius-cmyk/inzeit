export interface ChecklistStageDefinition {
  key: string;
  label: string;
  sequence: number;
}

export interface ClientPortalProduct {
  key: string;
  label: string;
  icon: string;
  checklistStages: ChecklistStageDefinition[];
  hasEligibilityScores: boolean;
}

const stages = (labels: string[]): ChecklistStageDefinition[] =>
  labels.map((label, index) => ({
    key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    label,
    sequence: index + 1,
  }));

// Single source of truth for every product the client portal can show. `key` matches
// crm_opportunities.product_type and the crm_operation_stage_data.module convention already
// used by the internal admin ops wizards (see src/app/admin/leads/*-operations-wizard.tsx).
export const CLIENT_PORTAL_PRODUCTS: ClientPortalProduct[] = [
  {
    key: 'canada-pr',
    label: 'Canada PR',
    icon: '🍁',
    checklistStages: stages(['Consultation', 'Agreement', 'Documents', 'Filing', 'Biometrics', 'Visa Decision']),
    hasEligibilityScores: false,
  },
  {
    key: 'rms',
    label: 'RMS — Resume Marketing',
    icon: '📋',
    checklistStages: stages(['Consultation', 'Agreement', 'Resume Build', 'Marketing', 'Employer Response', 'Placement']),
    hasEligibilityScores: false,
  },
  {
    key: 'australia-pr',
    label: 'Australia PR',
    icon: '🦘',
    checklistStages: stages(['Consultation', 'Agreement', 'Documents', 'Filing', 'Biometrics', 'Visa Decision']),
    hasEligibilityScores: false,
  },
  {
    key: 'visit-visa',
    label: 'Visit Visa',
    icon: '✈️',
    checklistStages: stages(['Consultation', 'Agreement', 'Documents', 'Application Filing', 'Biometrics Appointment', 'Visa Decision']),
    hasEligibilityScores: false,
  },
  {
    key: 'student-visa',
    label: 'Student Visa',
    icon: '🎓',
    checklistStages: stages(['Consultation', 'Agreement', 'Documents', 'University App', 'Offer Letter', 'Visa Filing', 'Visa Decision']),
    hasEligibilityScores: false,
  },
  {
    key: 'eip',
    label: 'EIP — Express Entry Program',
    icon: '🧭',
    checklistStages: stages(['Consultation', 'Agreement', 'Documents', 'EE Profile', 'Job Bank & Other App', 'ITA & Filing', 'Final Decision']),
    hasEligibilityScores: true,
  },
];

export function getClientPortalProduct(key: string | null | undefined): ClientPortalProduct | null {
  if (!key) return null;
  return CLIENT_PORTAL_PRODUCTS.find((product) => product.key === key) || null;
}

// Priority-ordered (most specific first) free-text -> product_type classifier. Must stay in
// sync with the regex patterns in migrations/20260728_client_portal_products.sql and
// migrations/20260803b_backfill_opportunity_product_type.sql, which backfill product_type for
// existing rows using these same patterns via SQL. This is the code-path equivalent, run at
// opportunity-creation time so future rows are never left NULL.
const PRODUCT_TYPE_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: 'eip', pattern: /eip|express entry|economic immigration/i },
  { key: 'student-visa', pattern: /student|study permit|university/i },
  { key: 'visit-visa', pattern: /visit visa|visitor visa|tourist visa|trv/i },
  { key: 'rms', pattern: /resume marketing|rms/i },
  { key: 'australia-pr', pattern: /australia/i },
  { key: 'canada-pr', pattern: /skilled|permanent residence|canada/i },
];

// Derives a CLIENT_PORTAL_PRODUCTS key from a free-text service label (e.g. "Canada Single",
// "Resume Marketing Services"), or null if nothing matches.
export function deriveProductTypeFromLabel(label: string | null | undefined): string | null {
  const text = String(label || '');
  const matched = PRODUCT_TYPE_PATTERNS.find(({ pattern }) => pattern.test(text));
  return matched ? matched.key : null;
}
