// Buckets a won case into one of the 6 Operations Dashboard visa-type
// columns (Visit visa / Student visa / Canada / Australia / RMS / Work
// Permit). The legacy PHP routing arrays in operations-management/page.tsx
// (EIP_ARRAY, POLAND_ARRAY, etc.) key off a numeric service_interest scheme
// from the old system (ids in the 200s-300s) that no longer matches live
// data — crm_service today only has ids 1-50, and crm_forum_leads.type is
// always the literal string 'lead'. This bucketing instead uses the live
// crm_service catalog (id ranges below, verified against seed-services /
// scripts/seed-services data) with a keyword fallback on free-text service
// names for anything outside that catalog.

export type VisaTypeBucket = 'Visit visa' | 'Student visa' | 'Canada' | 'Australia' | 'RMS' | 'Work Permit';

export const VISA_TYPE_BUCKETS: VisaTypeBucket[] = ['Visit visa', 'Student visa', 'Canada', 'Australia', 'RMS', 'Work Permit'];

// crm_service id ranges (see `SELECT id, name FROM crm_service ORDER BY id`):
//   1-25  Canada programs (PA/Spouse, ECA, OINP, PNP, SINP, Saskatchewan,
//         Yukon, Economic Immigration Program, Nursing Work Permit, Super Visa)
//   26-34 & 38  Australia programs (PA/Spouse, Single, Skill Assessment,
//         Work Visa, Job Search Assistance)
//   36    Visit Visa / Tourist Visa
//   37    Student Visa
// Everything else (35 Global Talent Visa, 39-50 Business/Investor/CBI
// countries/Resume/Nomad/Germany Opportunity Card) has no dedicated PDF
// column and falls back to Work Permit, the closest generic bucket.
const bucketByServiceId = (serviceId: number | null | undefined): VisaTypeBucket | null => {
  if (!serviceId) return null;
  if (serviceId >= 1 && serviceId <= 25) return 'Canada';
  if ((serviceId >= 26 && serviceId <= 34) || serviceId === 38) return 'Australia';
  if (serviceId === 36) return 'Visit visa';
  if (serviceId === 37) return 'Student visa';
  return null;
};

const bucketByName = (name: string | null | undefined): VisaTypeBucket | null => {
  const text = (name || '').toLowerCase();
  if (!text) return null;
  if (text.includes('student')) return 'Student visa';
  if (text.includes('visit') || text.includes('tourist')) return 'Visit visa';
  if (text.includes('australia')) return 'Australia';
  if (text.includes('canada')) return 'Canada';
  return null;
};

export const resolveVisaTypeBucket = (input: {
  serviceId?: number | string | null;
  serviceName?: string | null;
  hasRmsStage?: boolean;
}): VisaTypeBucket => {
  if (input.hasRmsStage) return 'RMS';
  const numericServiceId = typeof input.serviceId === 'string' ? Number.parseInt(input.serviceId, 10) : input.serviceId;
  return bucketByServiceId(numericServiceId) || bucketByName(input.serviceName) || 'Work Permit';
};
