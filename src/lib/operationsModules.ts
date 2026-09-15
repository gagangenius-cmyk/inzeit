// Single directory of every live operations module: its display label and
// the leads/*-operations-wizard.tsx route each client's case opens into.
// Keys match crm_operation_stage_data.module / the allowedModules list in
// /api/admin/operations/[module]/save, so this is the same "module" the
// case-officer wizards and /api/admin/operations/search already key on.
export interface OperationsModuleInfo {
  key: string;
  label: string;
  wizardRoute: string;
}

export const OPERATIONS_MODULES: OperationsModuleInfo[] = [
  { key: 'skill-canada', label: 'Canada Skilled', wizardRoute: '/admin/leads/skill-canada-operations' },
  { key: 'rms', label: 'Resume Marketing (RMS)', wizardRoute: '/admin/leads/rms-operations' },
  { key: 'visit-visa', label: 'Visit Visa', wizardRoute: '/admin/leads/visit-visa-operations' },
  { key: 'eip-canada', label: 'EIP Canada', wizardRoute: '/admin/leads/eip-canada-operations' },
  { key: 'skill-australia', label: 'Australia Skilled', wizardRoute: '/admin/leads/skill-australia-operations' },
  { key: 'student-visa', label: 'Student Visa', wizardRoute: '/admin/leads/student-visa-operations' },
  { key: 'poland-visa', label: 'Poland Work Visa', wizardRoute: '/admin/leads/poland-visa-operations' },
  { key: 'germany-jobseeker', label: 'Germany Job Seeker Visa', wizardRoute: '/admin/leads/germany-jobseeker-operations' },
  { key: 'business', label: 'Business Immigration', wizardRoute: '/admin/leads/business-operations' },
  { key: 'business-canada', label: 'Canada Business', wizardRoute: '/admin/leads/business-canada-operations' },
  { key: 'business-poland', label: 'Poland Business', wizardRoute: '/admin/leads/business-poland-operations' },
  { key: 'business-uk', label: 'UK Business', wizardRoute: '/admin/leads/business-uk-operations' },
  { key: 'business-usa', label: 'USA Business', wizardRoute: '/admin/leads/business-usa-operations' },
  { key: 'portugal-business', label: 'Portugal Business', wizardRoute: '/admin/leads/portugal-business-operations' },
  { key: 'cbi', label: 'Citizenship by Investment', wizardRoute: '/admin/leads/cbi-operations' },
  { key: 'europe-cases', label: 'Europe Cases', wizardRoute: '/admin/leads/europe-cases-operations' },
  { key: 'ict-canada', label: 'Canada ICT', wizardRoute: '/admin/leads/ict-canada-operations' },
  { key: 'job-search', label: 'Job Search', wizardRoute: '/admin/leads/job-search-operations' },
  { key: 'skill-canada-pip', label: 'Skill Canada PIP', wizardRoute: '/admin/leads/skill-canada-pip-operations' },
  { key: 'work', label: 'Work Operations', wizardRoute: '/admin/leads/work-operations' },
  { key: 'work-permit', label: 'Work Permit', wizardRoute: '/admin/leads/work-permit-operations' },
];

export const getOperationsModule = (key: string): OperationsModuleInfo | undefined =>
  OPERATIONS_MODULES.find((m) => m.key === key);
