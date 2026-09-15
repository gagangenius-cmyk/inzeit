// Canada Express Entry / CRS / PNP sales-screening estimators.
//
// These mirror IRCC's published Comprehensive Ranking System point grid and
// CLB equivalency charts closely enough for a first-pass sales conversation,
// but are deliberately approximate (skill transferability especially - see
// note on calculateCrs). They are NOT official assessments; every tool that
// consumes this module must keep the RCIC-confirmation disclaimer visible.

export type MaritalStatus = 'single' | 'married_accompanying';

export type EducationLevel =
  | 'less_than_secondary'
  | 'secondary'
  | 'one_year_post_secondary'
  | 'two_year_post_secondary'
  | 'bachelors'
  | 'two_or_more_credentials'
  | 'masters'
  | 'phd';

export const educationOptions: Array<{ value: EducationLevel; label: string }> = [
  { value: 'less_than_secondary', label: 'Less than secondary school' },
  { value: 'secondary', label: 'Secondary diploma (high school)' },
  { value: 'one_year_post_secondary', label: 'One-year post-secondary program' },
  { value: 'two_year_post_secondary', label: 'Two-year post-secondary program' },
  { value: 'bachelors', label: "Bachelor's degree (3+ year program)" },
  { value: 'two_or_more_credentials', label: 'Two or more credentials, one 3+ years' },
  { value: 'masters', label: "Master's degree / professional degree" },
  { value: 'phd', label: 'Doctoral degree (PhD)' },
];

export type ExperienceYears = '0' | '1' | '2' | '3' | '4' | '5plus';

export const canadianExperienceOptions: Array<{ value: ExperienceYears; label: string }> = [
  { value: '0', label: 'None' },
  { value: '1', label: '1 year' },
  { value: '2', label: '2 years' },
  { value: '3', label: '3 years' },
  { value: '4', label: '4 years' },
  { value: '5plus', label: '5+ years' },
];

export type ForeignExperience = 'none' | 'one_to_two' | 'three_plus';

export const foreignExperienceOptions: Array<{ value: ForeignExperience; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'one_to_two', label: '1-2 years' },
  { value: 'three_plus', label: '3+ years' },
];

export type CanadianStudyCredential = 'none' | 'one_to_two_year' | 'three_plus_or_masters';

export const canadianStudyOptions: Array<{ value: CanadianStudyCredential; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'one_to_two_year', label: '1-2 year diploma/credential' },
  { value: 'three_plus_or_masters', label: "3+ year credential, Master's or PhD" },
];

// ---------------------------------------------------------------------------
// CLB (Canadian Language Benchmark) conversion
// ---------------------------------------------------------------------------

export type LanguageTest = 'ielts_gt' | 'celpip_g' | 'pte_core';

export const languageTestOptions: Array<{ value: LanguageTest; label: string }> = [
  { value: 'ielts_gt', label: 'IELTS General Training' },
  { value: 'celpip_g', label: 'CELPIP - General' },
  { value: 'pte_core', label: 'PTE Core' },
];

export interface SkillScores {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

// Thresholds are the minimum raw score needed to reach a given CLB level,
// checked from the top down. Source: IRCC's published CLB/NCLC equivalency
// charts for IELTS General Training and PTE Core.
const ieltsGtThresholds: Record<keyof SkillScores, Array<[number, number]>> = {
  listening: [[10, 8.5], [9, 8.0], [8, 7.5], [7, 6.0], [6, 5.5], [5, 5.0], [4, 4.5]],
  reading: [[10, 8.0], [9, 7.0], [8, 6.5], [7, 6.0], [6, 5.0], [5, 4.0], [4, 3.5]],
  writing: [[10, 7.5], [9, 7.0], [8, 6.5], [7, 6.0], [6, 5.5], [5, 5.0], [4, 4.0]],
  speaking: [[10, 7.5], [9, 7.0], [8, 6.5], [7, 6.0], [6, 5.5], [5, 5.0], [4, 4.0]],
};

const pteCoreThresholds: Record<keyof SkillScores, Array<[number, number]>> = {
  listening: [[10, 89], [9, 82], [8, 71], [7, 60], [6, 50], [5, 39], [4, 28]],
  reading: [[10, 88], [9, 78], [8, 69], [7, 60], [6, 51], [5, 42], [4, 33]],
  writing: [[10, 90], [9, 88], [8, 79], [7, 69], [6, 60], [5, 51], [4, 41]],
  speaking: [[10, 89], [9, 84], [8, 76], [7, 68], [6, 59], [5, 51], [4, 42]],
};

const clbFromThreshold = (score: number, thresholds: Array<[number, number]>): number => {
  for (const [clb, min] of thresholds) {
    if (score >= min) return clb;
  }
  return 0; // below CLB 4
};

export interface ClbResult {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number; // lowest of the four - what CRS/PNP tools use
  note?: string;
}

export function convertToClb(test: LanguageTest, scores: SkillScores): ClbResult {
  if (test === 'celpip_g') {
    // CELPIP-General's numeric scale is defined to equal CLB directly.
    const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));
    const listening = clamp(scores.listening);
    const reading = clamp(scores.reading);
    const writing = clamp(scores.writing);
    const speaking = clamp(scores.speaking);
    return { listening, reading, writing, speaking, overall: Math.min(listening, reading, writing, speaking) };
  }

  const thresholds = test === 'pte_core' ? pteCoreThresholds : ieltsGtThresholds;
  const listening = clbFromThreshold(scores.listening, thresholds.listening);
  const reading = clbFromThreshold(scores.reading, thresholds.reading);
  const writing = clbFromThreshold(scores.writing, thresholds.writing);
  const speaking = clbFromThreshold(scores.speaking, thresholds.speaking);

  return {
    listening,
    reading,
    writing,
    speaking,
    overall: Math.min(listening, reading, writing, speaking),
    note: test === 'pte_core'
      ? 'PTE Core thresholds are indicative - confirm exact score requirements against IRCC’s official conversion chart.'
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// CRS (Comprehensive Ranking System) calculator
// ---------------------------------------------------------------------------

const agePointsNoSpouse: Record<number, number> = {
  17: 0, 18: 99, 19: 105, 20: 110, 21: 110, 22: 110, 23: 110, 24: 110, 25: 110, 26: 110, 27: 110, 28: 110, 29: 110,
  30: 105, 31: 99, 32: 94, 33: 88, 34: 83, 35: 77, 36: 72, 37: 66, 38: 61, 39: 55,
  40: 50, 41: 39, 42: 28, 43: 17, 44: 6,
};
const agePointsWithSpouse: Record<number, number> = {
  17: 0, 18: 90, 19: 95, 20: 100, 21: 100, 22: 100, 23: 100, 24: 100, 25: 100, 26: 100, 27: 100, 28: 100, 29: 100,
  30: 95, 31: 90, 32: 85, 33: 80, 34: 75, 35: 70, 36: 65, 37: 60, 38: 55, 39: 50,
  40: 45, 41: 35, 42: 25, 43: 15, 44: 5,
};

function agePoints(age: number, withSpouse: boolean): number {
  const table = withSpouse ? agePointsWithSpouse : agePointsNoSpouse;
  if (age <= 17) return 0;
  if (age >= 45) return 0;
  return table[Math.floor(age)] ?? 0;
}

const educationPointsNoSpouse: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 30,
  one_year_post_secondary: 90,
  two_year_post_secondary: 98,
  bachelors: 120,
  two_or_more_credentials: 128,
  masters: 135,
  phd: 150,
};
const educationPointsWithSpouse: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 28,
  one_year_post_secondary: 84,
  two_year_post_secondary: 91,
  bachelors: 112,
  two_or_more_credentials: 119,
  masters: 126,
  phd: 140,
};

// Points per ability (out of 4: listening/reading/writing/speaking).
function firstLanguagePointsPerAbility(clb: number, withSpouse: boolean): number {
  const table = withSpouse
    ? { 10: 29, 9: 26, 8: 20, 7: 15, 6: 8, 5: 6 }
    : { 10: 32, 9: 29, 8: 22, 7: 16, 6: 8, 5: 6 };
  if (clb >= 10) return table[10];
  if (clb === 9) return table[9];
  if (clb === 8) return table[8];
  if (clb === 7) return table[7];
  if (clb === 6) return table[6];
  if (clb === 5) return table[5];
  return 0;
}

function secondLanguagePointsPerAbility(clb: number): number {
  if (clb >= 9) return 6;
  if (clb >= 7) return 3;
  if (clb >= 5) return 1;
  return 0;
}

function canadianExperiencePoints(years: ExperienceYears, withSpouse: boolean): number {
  const table = withSpouse
    ? { '0': 0, '1': 35, '2': 46, '3': 56, '4': 63, '5plus': 70 }
    : { '0': 0, '1': 40, '2': 53, '3': 64, '4': 72, '5plus': 80 };
  return table[years];
}

// Spouse or common-law partner factors (IRCC CRS grid, section B) - max 40
// points total (10 education + 20 language + 10 Canadian experience), only
// scored when the spouse is accompanying.
const spouseEducationPoints: Record<EducationLevel, number> = {
  less_than_secondary: 0,
  secondary: 2,
  one_year_post_secondary: 6,
  two_year_post_secondary: 7,
  bachelors: 8,
  two_or_more_credentials: 9,
  masters: 10,
  phd: 10,
};

// Points per ability (out of 4: listening/reading/writing/speaking) - max 5
// per ability, 20 total.
function spouseLanguagePointsPerAbility(clb: number): number {
  if (clb >= 9) return 5;
  if (clb >= 7) return 3;
  if (clb >= 5) return 1;
  return 0;
}

function spouseCanadianExperiencePoints(years: ExperienceYears): number {
  const table: Record<ExperienceYears, number> = { '0': 0, '1': 5, '2': 7, '3': 8, '4': 9, '5plus': 10 };
  return table[years];
}

export interface CrsInput {
  maritalStatus: MaritalStatus;
  age: number;
  education: EducationLevel;
  firstLanguageClb: number; // applied uniformly to all 4 abilities, per the sales snapshot form
  secondLanguageClb: number; // 0 = none / CLB4 or below
  canadianExperience: ExperienceYears;
  foreignExperience: ForeignExperience;
  provincialNomination: boolean;
  canadianStudyCredential: CanadianStudyCredential;
  siblingInCanada: boolean;
  frenchNclc7Plus: boolean;
  // Only scored when maritalStatus is 'married_accompanying'.
  spouseEducation?: EducationLevel;
  spouseLanguageClb?: number; // 0 = not tested / CLB4 or below
  spouseCanadianExperience?: ExperienceYears;
}

export interface CrsBreakdown {
  coreHumanCapital: number;
  spouseFactors: number;
  skillTransferability: number;
  additionalPoints: number;
  total: number;
  withSpouse: boolean;
  notes: string[];
}

export function calculateCrs(input: CrsInput): CrsBreakdown {
  const withSpouse = input.maritalStatus === 'married_accompanying';
  const notes: string[] = [];

  const age = agePoints(input.age, withSpouse);
  const education = (withSpouse ? educationPointsWithSpouse : educationPointsNoSpouse)[input.education];
  const firstLangPerAbility = firstLanguagePointsPerAbility(input.firstLanguageClb, withSpouse);
  const firstLanguage = firstLangPerAbility * 4;
  const secondLangPerAbility = secondLanguagePointsPerAbility(input.secondLanguageClb);
  const secondLanguage = secondLangPerAbility * 4;
  const canadianExp = canadianExperiencePoints(input.canadianExperience, withSpouse);

  const coreHumanCapital = age + education + firstLanguage + secondLanguage + canadianExp;

  // Spouse or common-law partner factors (max 40: 10 education + 20 language + 10 experience).
  let spouseFactors = 0;
  if (withSpouse) {
    const spouseEdu = input.spouseEducation ? spouseEducationPoints[input.spouseEducation] : 0;
    const spouseLangPerAbility = input.spouseLanguageClb ? spouseLanguagePointsPerAbility(input.spouseLanguageClb) : 0;
    const spouseLang = spouseLangPerAbility * 4;
    const spouseExp = input.spouseCanadianExperience ? spouseCanadianExperiencePoints(input.spouseCanadianExperience) : 0;
    spouseFactors = Math.min(40, spouseEdu + spouseLang + spouseExp);

    if (!input.spouseEducation && !input.spouseLanguageClb && !input.spouseCanadianExperience) {
      notes.push("Spouse factors (up to 40 points) are shown as 0 until the spouse's education, language, and Canadian experience are entered above.");
    }
  }

  // Skill transferability (approximated, capped at 100 total - see module note).
  const hasPostSecondary = input.education !== 'less_than_secondary' && input.education !== 'secondary';
  const hasHigherCredential = input.education === 'two_or_more_credentials' || input.education === 'masters' || input.education === 'phd';
  const strongFirstLang = input.firstLanguageClb >= 9;
  const goodFirstLang = input.firstLanguageClb >= 7;
  const hasCanadianExp = input.canadianExperience !== '0';
  const strongCanadianExp = input.canadianExperience !== '0' && input.canadianExperience !== '1';
  const hasForeignExp = input.foreignExperience !== 'none';
  const strongForeignExp = input.foreignExperience === 'three_plus';

  const eduLanguageTransfer = !hasPostSecondary ? 0
    : hasHigherCredential ? (strongFirstLang ? 50 : goodFirstLang ? 25 : 0)
    : (strongFirstLang ? 25 : goodFirstLang ? 13 : 0);

  const eduExperienceTransfer = !hasPostSecondary ? 0
    : hasHigherCredential ? (strongCanadianExp ? 50 : hasCanadianExp ? 25 : 0)
    : (strongCanadianExp ? 25 : hasCanadianExp ? 13 : 0);

  const foreignExpLanguageTransfer = !hasForeignExp ? 0
    : strongForeignExp ? (strongFirstLang ? 50 : goodFirstLang ? 25 : 0)
    : (strongFirstLang ? 25 : goodFirstLang ? 13 : 0);

  const foreignExpCanadianTransfer = !hasForeignExp ? 0
    : strongForeignExp ? (strongCanadianExp ? 50 : hasCanadianExp ? 25 : 0)
    : (strongCanadianExp ? 25 : hasCanadianExp ? 13 : 0);

  const skillTransferability = Math.min(
    100,
    Math.min(50, eduLanguageTransfer + eduExperienceTransfer) +
    Math.min(50, foreignExpLanguageTransfer + foreignExpCanadianTransfer)
  );

  // Additional points (max 600). Arranged employment (LMIA-backed job offer)
  // points were removed by IRCC effective March 25, 2025 and are no longer
  // part of the CRS grid - a job offer itself can still support Canadian
  // work experience / skill transferability, but no longer earns its own
  // additional-points bonus.
  let additionalPoints = 0;
  if (input.provincialNomination) additionalPoints += 600;
  if (input.canadianStudyCredential === 'one_to_two_year') additionalPoints += 15;
  if (input.canadianStudyCredential === 'three_plus_or_masters') additionalPoints += 30;
  if (input.siblingInCanada) additionalPoints += 15;
  if (input.frenchNclc7Plus) additionalPoints += input.firstLanguageClb >= 5 ? 50 : 25;

  const total = Math.min(1200, coreHumanCapital + spouseFactors + skillTransferability + additionalPoints);

  return { coreHumanCapital, spouseFactors, skillTransferability, additionalPoints, total, withSpouse, notes };
}

// ---------------------------------------------------------------------------
// Quick Eligibility Snapshot (page-1 style screening, ahead of a full CRS/PNP review)
// ---------------------------------------------------------------------------

export type ClbRange = 'below_5' | '5_6' | '7_8' | '9_plus';
export const clbRangeOptions: Array<{ value: ClbRange; label: string }> = [
  { value: 'below_5', label: 'Below CLB 5' },
  { value: '5_6', label: 'CLB 5-6' },
  { value: '7_8', label: 'CLB 7-8' },
  { value: '9_plus', label: 'CLB 9+' },
];

export type ExperienceRange = 'none' | 'under_1' | '1_2' | '3_5' | '5_plus';
export const experienceRangeOptions: Array<{ value: ExperienceRange; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'under_1', label: 'Under 1 year' },
  { value: '1_2', label: '1-2 years' },
  { value: '3_5', label: '3-5 years' },
  { value: '5_plus', label: '5+ years' },
];

export type CanadianExperienceType = 'none' | 'study_only' | 'work_only' | 'both';
export const canadianExperienceTypeOptions: Array<{ value: CanadianExperienceType; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'study_only', label: 'Study only' },
  { value: 'work_only', label: 'Work only' },
  { value: 'both', label: 'Both study and work' },
];

export type JobOfferOrPnpInterest = 'neither' | 'job_offer' | 'pnp_interest' | 'both';
export const jobOfferOrPnpOptions: Array<{ value: JobOfferOrPnpInterest; label: string }> = [
  { value: 'neither', label: 'Neither' },
  { value: 'job_offer', label: 'Job offer' },
  { value: 'pnp_interest', label: 'PNP interest' },
  { value: 'both', label: 'Both' },
];

export type EipInterest = 'yes' | 'no';
export const eipInterestOptions: Array<{ value: EipInterest; label: string }> = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

export interface EligibilitySnapshotInput {
  age: number;
  education: EducationLevel;
  clb: ClbRange;
  experience: ExperienceRange;
  canadianExperience: CanadianExperienceType;
  jobOfferOrPnp: JobOfferOrPnpInterest;
  eipInterest: EipInterest;
}

export interface PathwaySuggestion {
  pathway: string;
  fit: 'strong' | 'possible' | 'unlikely';
  reason: string;
}

export function screenEligibilitySnapshot(input: EligibilitySnapshotInput): PathwaySuggestion[] {
  const suggestions: PathwaySuggestion[] = [];
  const hasPostSecondary = input.education !== 'less_than_secondary' && input.education !== 'secondary';
  const strongClb = input.clb === '7_8' || input.clb === '9_plus';
  const inCoreAgeBand = input.age >= 18 && input.age <= 45;
  const experienced = input.experience === '1_2' || input.experience === '3_5' || input.experience === '5_plus';

  // Federal Skilled Worker (Express Entry)
  if (inCoreAgeBand && strongClb && hasPostSecondary && experienced) {
    suggestions.push({
      pathway: 'Federal Skilled Worker (Express Entry)',
      fit: 'strong',
      reason: 'Age, language, education and experience all sit in the range Express Entry typically rewards.',
    });
  } else if (strongClb && hasPostSecondary) {
    suggestions.push({
      pathway: 'Federal Skilled Worker (Express Entry)',
      fit: 'possible',
      reason: 'Core profile is workable, but a full CRS calculation is needed to judge draw competitiveness.',
    });
  } else {
    suggestions.push({
      pathway: 'Federal Skilled Worker (Express Entry)',
      fit: 'unlikely',
      reason: input.clb === 'below_5' || input.clb === '5_6'
        ? 'Language score is likely the limiting factor - CLB 7+ is usually needed to be competitive.'
        : 'Education or experience level may not meet the FSW selection factors on their own.',
    });
  }

  // Canadian Experience Class
  if (input.canadianExperience === 'work_only' || input.canadianExperience === 'both') {
    suggestions.push({
      pathway: 'Canadian Experience Class (CEC)',
      fit: strongClb ? 'strong' : 'possible',
      reason: 'Canadian skilled work experience is CEC’s core requirement.',
    });
  }

  // Provincial Nominee Program
  if (input.jobOfferOrPnp === 'pnp_interest' || input.jobOfferOrPnp === 'both') {
    suggestions.push({
      pathway: 'Provincial Nominee Program (PNP)',
      fit: 'possible',
      reason: 'Worth running through the PNP Matcher - many streams accept lower CLB or target specific occupations.',
    });
  }
  if (input.jobOfferOrPnp === 'job_offer' || input.jobOfferOrPnp === 'both') {
    suggestions.push({
      pathway: 'Employer-supported PNP / job-offer streams',
      fit: 'possible',
      reason: 'A valid job offer can unlock employer-driven provincial streams even at lower CRS scores.',
    });
  }

  // Canadian study route
  if (input.canadianExperience === 'study_only' || input.canadianExperience === 'both') {
    suggestions.push({
      pathway: 'Study permit → PGWP → Express Entry / CEC pipeline',
      fit: 'possible',
      reason: 'Canadian study credential adds CRS points and, with a PGWP, builds toward CEC eligibility.',
    });
  }

  // Economic Immigration Pilots (EIP) - Rural, Northern, Agri-Food, and
  // similar community/sector-driven pilots with their own eligibility
  // criteria, separate from the main Express Entry/PNP streams above.
  if (input.eipInterest === 'yes') {
    suggestions.push({
      pathway: 'Economic Immigration Pilots (EIP)',
      fit: experienced || input.canadianExperience !== 'none' ? 'possible' : 'unlikely',
      reason: experienced || input.canadianExperience !== 'none'
        ? 'Community and sector-driven pilots (e.g. rural, northern, agri-food) often have their own job-offer and community-endorsement requirements - confirm current intake status and criteria, as pilots change frequently.'
        : 'Most active pilots require a qualifying job offer or community endorsement - worth revisiting once one is in place.',
    });
  }

  if (!inCoreAgeBand && input.age > 45) {
    suggestions.push({
      pathway: 'Age-sensitive pathways (FSW/CEC/most PNPs)',
      fit: 'unlikely',
      reason: 'CRS age points drop to zero at 45+ - PNP streams without age limits or family sponsorship may fit better.',
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// PNP Matcher (broad fit signals only - screening heuristic, not eligibility rules)
// ---------------------------------------------------------------------------

export type ProvinceJobOffer =
  | 'none'
  | 'ontario'
  | 'british_columbia'
  | 'alberta'
  | 'saskatchewan'
  | 'manitoba'
  | 'atlantic'
  | 'other';

export const provinceJobOfferOptions: Array<{ value: ProvinceJobOffer; label: string }> = [
  { value: 'none', label: 'No job offer' },
  { value: 'ontario', label: 'Ontario' },
  { value: 'british_columbia', label: 'British Columbia' },
  { value: 'alberta', label: 'Alberta' },
  { value: 'saskatchewan', label: 'Saskatchewan' },
  { value: 'manitoba', label: 'Manitoba' },
  { value: 'atlantic', label: 'Atlantic (NB/NS/PEI/NL)' },
  { value: 'other', label: 'Other province/territory' },
];

export interface PnpMatcherInput {
  jobOfferProvince: ProvinceJobOffer;
  hasExpressEntryProfile: boolean;
  crsScore: number | null;
  inDemandOrTrade: 'yes' | 'not_sure_no';
  recentlyStudiedInCanada: boolean;
  frenchSpeaking: boolean;
}

export interface PnpStreamMatch {
  stream: string;
  reason: string;
}

export function matchPnpStreams(input: PnpMatcherInput): PnpStreamMatch[] {
  const matches: PnpStreamMatch[] = [];

  if (input.jobOfferProvince !== 'none' && input.jobOfferProvince !== 'other') {
    matches.push({
      stream: `${provinceJobOfferOptions.find((o) => o.value === input.jobOfferProvince)?.label} Employer Job Offer stream`,
      reason: 'A province-specific job offer is usually the fastest route into that province’s employer-driven stream.',
    });
  }

  if (input.hasExpressEntryProfile) {
    if (input.crsScore !== null && input.crsScore >= 400) {
      matches.push({
        stream: 'Express Entry-linked PNP (e.g. OINP Human Capital Priorities, BC PNP Express Entry)',
        reason: 'CRS score of 400+ is competitive for most enhanced Express Entry-aligned provincial streams.',
      });
    } else {
      matches.push({
        stream: 'Express Entry-linked PNP (e.g. Alberta Express Entry Stream, Saskatchewan EE)',
        reason: 'An active Express Entry profile can still be picked from provincial pools even at a moderate CRS score.',
      });
    }
  }

  if (input.inDemandOrTrade === 'yes') {
    matches.push({
      stream: 'Occupation In-Demand / Skilled Trade streams (e.g. Saskatchewan Occupation In-Demand, Manitoba Skilled Worker)',
      reason: 'In-demand or trade occupations often qualify for province-specific occupation lists with lower thresholds.',
    });
  }

  if (input.recentlyStudiedInCanada) {
    matches.push({
      stream: 'International Graduate streams (e.g. BC PNP International Graduate, Ontario International Student stream)',
      reason: 'Recent Canadian study is a direct eligibility signal for graduate-focused provincial streams.',
    });
  }

  if (input.frenchSpeaking) {
    matches.push({
      stream: 'French-speaking skilled worker streams (e.g. Ontario French-Speaking Skilled Worker, Francophone Mobility)',
      reason: 'French proficiency opens dedicated francophone immigration streams with their own selection criteria.',
    });
  }

  if (input.jobOfferProvince === 'atlantic') {
    matches.push({
      stream: 'Atlantic Immigration Program',
      reason: 'Employer-driven pathway for the four Atlantic provinces, separate from each province’s base PNP.',
    });
  }

  if (matches.length === 0) {
    matches.push({
      stream: 'General Express Entry base PNP pools',
      reason: 'No strong signals yet - worth building an Express Entry profile first, then targeting a province.',
    });
  }

  return matches;
}

// ---------------------------------------------------------------------------
// Processing times reference (Canada) - static, as published by IRCC
// ---------------------------------------------------------------------------

export interface ProcessingTimeRow {
  program: string;
  range: string;
  notes: string;
}

export interface ProcessingTimeGroup {
  title: string;
  rows: ProcessingTimeRow[];
}

export const canadaProcessingTimes: { referencePoint: string; groups: ProcessingTimeGroup[]; footnote: string } = {
  referencePoint: 'IRCC published times as of early–mid July 2026',
  groups: [
    {
      title: 'Permanent Residence — Economic',
      rows: [
        { program: 'Express Entry (FSW, CEC, FST)', range: '5–7 months', notes: 'Service standard 6 months; recently running close to or at standard.' },
        { program: 'PNP — Express Entry-linked (enhanced)', range: '~7 months federally', notes: 'Plus provincial nomination processing time before the federal stage begins.' },
        { program: 'PNP — base (non-Express Entry, paper)', range: '~12–13 months', notes: 'Significantly slower than enhanced nomination — factor this in when a client isn’t EE-eligible.' },
      ],
    },
    {
      title: 'Family Sponsorship',
      rows: [
        { program: 'Spousal/common-law — inland', range: '10–12 months', notes: 'Applicant is in Canada; open work permit available a few months in.' },
        { program: 'Spousal/common-law — outland', range: '10–14 months', notes: 'Varies by visa office; high-volume offices (India, China, Philippines) trend toward the longer end.' },
        { program: 'Parents & Grandparents (PGP)', range: '20–24 months+', notes: 'Subject to annual intake caps/lottery — plan expectations accordingly.' },
      ],
    },
    {
      title: 'Temporary Residence',
      rows: [
        { program: 'Work permit — LMIA-based, outside Canada', range: '7–13 weeks', notes: 'Varies notably by source country.' },
        { program: 'Study permit', range: '4–12 weeks', notes: 'SDS-eligible countries typically faster; varies by visa office and season.' },
        { program: 'Visitor visa (TRV)', range: 'Days to a few weeks', notes: 'Highly country-dependent — some source countries have improved sharply in 2026.' },
      ],
    },
    {
      title: 'Citizenship',
      rows: [
        { program: 'Citizenship grant', range: '7–9 months', notes: 'Certificate applications tied to citizenship-by-descent changes have seen volume spikes.' },
      ],
    },
  ],
  footnote: 'These are rolling estimates, not guarantees — IRCC recalculates them weekly (temporary residence) or monthly (permanent residence) based on actual completed cases, and they can move quickly with draw volume and inventory. Always confirm current figures at canada.ca’s official processing-times tool before quoting a client a number.',
};
