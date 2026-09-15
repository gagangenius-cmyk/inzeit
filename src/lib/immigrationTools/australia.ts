// Australia skilled migration sales-screening estimators.
//
// Mirrors the Department of Home Affairs points table, English competency
// tiers and general processing-time bands closely enough for a first-pass
// sales conversation. NOT an official assessment - every tool built on this
// module must keep the MARA-agent-confirmation disclaimer visible, and fee
// figures in particular must be flagged as indicative (DHA revises charges
// roughly every July).

export type AgeBand = 'under_18' | '18_24' | '25_32' | '33_39' | '40_44' | '45_plus';
export const ageBandOptions: Array<{ value: AgeBand; label: string; points: number }> = [
  { value: 'under_18', label: 'Under 18', points: 0 },
  { value: '18_24', label: '18-24 years', points: 25 },
  { value: '25_32', label: '25-32 years', points: 30 },
  { value: '33_39', label: '33-39 years', points: 25 },
  { value: '40_44', label: '40-44 years', points: 15 },
  { value: '45_plus', label: '45 and over', points: 0 },
];

export type EnglishAbility = 'competent' | 'proficient' | 'superior';
export const englishAbilityOptions: Array<{ value: EnglishAbility; label: string; points: number }> = [
  { value: 'competent', label: 'Competent (IELTS 6 equiv.)', points: 0 },
  { value: 'proficient', label: 'Proficient (IELTS 7 equiv.)', points: 10 },
  { value: 'superior', label: 'Superior (IELTS 8 equiv.)', points: 20 },
];

export type OverseasExperience = 'under_3' | '3_4' | '5_7' | '8_10';
export const overseasExperienceOptions: Array<{ value: OverseasExperience; label: string; points: number }> = [
  { value: 'under_3', label: 'Less than 3 years', points: 0 },
  { value: '3_4', label: '3-4 years', points: 5 },
  { value: '5_7', label: '5-7 years', points: 10 },
  { value: '8_10', label: '8-10 years', points: 15 },
];

export type AustralianExperience = 'under_1' | '1_2' | '3_4' | '5_7' | '8_10';
export const australianExperienceOptions: Array<{ value: AustralianExperience; label: string; points: number }> = [
  { value: 'under_1', label: 'Less than 1 year', points: 0 },
  { value: '1_2', label: '1-2 years', points: 5 },
  { value: '3_4', label: '3-4 years', points: 10 },
  { value: '5_7', label: '5-7 years', points: 15 },
  { value: '8_10', label: '8-10 years', points: 20 },
];

export type EducationQualification = 'none_relevant' | 'diploma_trade' | 'bachelor_or_masters' | 'doctorate';
export const educationQualificationOptions: Array<{ value: EducationQualification; label: string; points: number }> = [
  { value: 'none_relevant', label: 'No qualification recognized by assessing authority', points: 0 },
  { value: 'diploma_trade', label: 'Diploma or trade qualification', points: 10 },
  { value: 'bachelor_or_masters', label: "Bachelor's or Master's degree", points: 15 },
  { value: 'doctorate', label: 'Doctorate from an Australian institution or equivalent', points: 20 },
];

export type AustralianStudyRequirement = 'not_met' | 'met';
export const australianStudyOptions: Array<{ value: AustralianStudyRequirement; label: string; points: number }> = [
  { value: 'not_met', label: 'No', points: 0 },
  { value: 'met', label: 'Yes — 1-2 years in Australia', points: 5 },
];

export type YesNo = 'yes' | 'no';
const yesNoPoints = (value: YesNo, points: number) => (value === 'yes' ? points : 0);

export type PartnerSituation = 'skilled_partner' | 'single_or_partner_citizen' | 'competent_english_only' | 'none';
export const partnerSituationOptions: Array<{ value: PartnerSituation; label: string; points: number }> = [
  { value: 'skilled_partner', label: 'Partner meets age/English/skills-assessment requirements', points: 10 },
  { value: 'single_or_partner_citizen', label: 'Single, or partner is Australian citizen/PR', points: 10 },
  { value: 'competent_english_only', label: 'Partner has Competent English only (not separately skilled)', points: 5 },
  { value: 'none', label: 'Partner does not meet requirements', points: 0 },
];

export type NominationType = 'none_189' | 'state_190' | 'regional_491';
export const nominationOptions: Array<{ value: NominationType; label: string; points: number }> = [
  { value: 'none_189', label: 'None (subclass 189)', points: 0 },
  { value: 'state_190', label: 'State/territory nomination (subclass 190)', points: 5 },
  { value: 'regional_491', label: 'State/territory or family sponsorship (subclass 491)', points: 15 },
];

export interface AustraliaPointsInput {
  age: AgeBand;
  english: EnglishAbility;
  overseasExperience: OverseasExperience;
  australianExperience: AustralianExperience;
  education: EducationQualification;
  australianStudy: AustralianStudyRequirement;
  specialistEducation: YesNo; // STEM Masters/PhD
  naati: YesNo; // credentialled community language
  regionalStudy: YesNo;
  partnerSituation: PartnerSituation;
  professionalYear: YesNo;
  nomination: NominationType;
}

export interface AustraliaPointsBreakdown {
  total: number;
  meetsMinimum: boolean; // 65-point EOI threshold for 189/190/491
  competitiveEstimate: boolean; // rough proxy for recent 189 invitation rounds (~95+)
  lineItems: Array<{ label: string; points: number }>;
}

export function calculateAustraliaPoints(input: AustraliaPointsInput): AustraliaPointsBreakdown {
  const age = ageBandOptions.find((o) => o.value === input.age)!.points;
  const english = englishAbilityOptions.find((o) => o.value === input.english)!.points;
  const overseasExperience = overseasExperienceOptions.find((o) => o.value === input.overseasExperience)!.points;
  const australianExperience = australianExperienceOptions.find((o) => o.value === input.australianExperience)!.points;
  const education = educationQualificationOptions.find((o) => o.value === input.education)!.points;
  const australianStudy = australianStudyOptions.find((o) => o.value === input.australianStudy)!.points;
  const specialistEducation = yesNoPoints(input.specialistEducation, 10);
  const naati = yesNoPoints(input.naati, 5);
  const regionalStudy = yesNoPoints(input.regionalStudy, 5);
  const partner = partnerSituationOptions.find((o) => o.value === input.partnerSituation)!.points;
  const professionalYear = yesNoPoints(input.professionalYear, 5);
  const nomination = nominationOptions.find((o) => o.value === input.nomination)!.points;

  const lineItems = [
    { label: 'Age', points: age },
    { label: 'English ability', points: english },
    { label: 'Skilled employment — overseas', points: overseasExperience },
    { label: 'Skilled employment — in Australia', points: australianExperience },
    { label: 'Educational qualification', points: education },
    { label: 'Australian study requirement', points: australianStudy },
    { label: 'Specialist education (STEM Masters/PhD)', points: specialistEducation },
    { label: 'Credentialled community language (NAATI)', points: naati },
    { label: 'Study in regional Australia', points: regionalStudy },
    { label: 'Partner / spouse situation', points: partner },
    { label: 'Professional Year in Australia', points: professionalYear },
    { label: 'Nomination / sponsorship', points: nomination },
  ];

  const total = lineItems.reduce((sum, item) => sum + item.points, 0);

  return {
    total,
    meetsMinimum: total >= 65,
    competitiveEstimate: total >= 95,
    lineItems,
  };
}

// ---------------------------------------------------------------------------
// Australia eligibility checker (first-pass screen)
// ---------------------------------------------------------------------------

export type SkillsAssessmentStatus = 'yes_confident' | 'in_progress' | 'no_unlikely';
export const skillsAssessmentOptions: Array<{ value: SkillsAssessmentStatus; label: string }> = [
  { value: 'yes_confident', label: 'Yes / confident' },
  { value: 'in_progress', label: 'In progress / unsure of outcome' },
  { value: 'no_unlikely', label: 'No / unlikely' },
];

export interface AustraliaEligibilityInput {
  age: number;
  occupationOnList: YesNo;
  englishAbility: EnglishAbility;
  skillsAssessment: SkillsAssessmentStatus;
  employerSponsorshipAvailable: YesNo;
  willingRegional: YesNo;
}

export function screenAustraliaEligibility(input: AustraliaEligibilityInput): PathwaySuggestion[] {
  const suggestions: PathwaySuggestion[] = [];
  const underAgeCap = input.age < 45;
  const hasOccupation = input.occupationOnList === 'yes';
  const assessmentReady = input.skillsAssessment === 'yes_confident';

  if (underAgeCap && hasOccupation && assessmentReady) {
    suggestions.push({
      pathway: 'Subclass 189 — Skilled Independent',
      fit: input.englishAbility === 'competent' ? 'possible' : 'strong',
      reason: 'Occupation is on a skilled list, skills assessment is in hand, and age is under the 45 cutoff.',
    });
    suggestions.push({
      pathway: 'Subclass 190 — Skilled Nominated',
      fit: 'possible',
      reason: 'Same core eligibility as 189, plus a state/territory nomination for extra points and a faster queue.',
    });
  } else if (hasOccupation && !assessmentReady) {
    suggestions.push({
      pathway: 'Subclass 189 / 190 — Skilled Independent / Nominated',
      fit: 'possible',
      reason: 'Occupation looks eligible, but a positive skills assessment is the next gating step.',
    });
  } else if (!hasOccupation) {
    suggestions.push({
      pathway: 'Subclass 189 / 190 — Skilled Independent / Nominated',
      fit: 'unlikely',
      reason: 'Occupation isn’t confirmed on a relevant skilled occupation list yet — that’s the first thing to check.',
    });
  }

  if (input.willingRegional === 'yes') {
    suggestions.push({
      pathway: 'Subclass 491 — Skilled Work Regional (Provisional)',
      fit: hasOccupation ? 'strong' : 'possible',
      reason: 'Regional willingness opens 491, which currently benefits from government priority processing in places.',
    });
  }

  if (input.employerSponsorshipAvailable === 'yes') {
    suggestions.push({
      pathway: 'Subclass 482 (Skills in Demand) → Subclass 186 (ENS)',
      fit: 'strong',
      reason: 'An available employer sponsor is usually the fastest and most certain route, independent of the points test.',
    });
  }

  if (!underAgeCap) {
    suggestions.push({
      pathway: 'Age-capped points-tested visas (189/190/491)',
      fit: 'unlikely',
      reason: 'Most points-tested skilled visas require being under 45 at time of invitation.',
    });
  }

  return suggestions;
}

// Reuse the same PathwaySuggestion shape as the Canada module without a
// circular import — kept identical for the shared results-list component.
export interface PathwaySuggestion {
  pathway: string;
  fit: 'strong' | 'possible' | 'unlikely';
  reason: string;
}

// ---------------------------------------------------------------------------
// IELTS / PTE → Australian English competency tier
// ---------------------------------------------------------------------------

export type AustraliaEnglishTest = 'ielts' | 'pte_academic';
export const australiaEnglishTestOptions: Array<{ value: AustraliaEnglishTest; label: string }> = [
  { value: 'ielts', label: 'IELTS (Academic or General)' },
  { value: 'pte_academic', label: 'PTE Academic' },
];

export interface AustraliaEnglishScores {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
}

export interface AustraliaEnglishResult {
  tier: 'below_competent' | 'competent' | 'proficient' | 'superior';
  label: string;
  points: number;
  lowestSkill: number;
}

export function convertToAustraliaCompetency(test: AustraliaEnglishTest, scores: AustraliaEnglishScores): AustraliaEnglishResult {
  const values = [scores.listening, scores.reading, scores.writing, scores.speaking];
  const lowest = Math.min(...values);

  const thresholds = test === 'ielts'
    ? { superior: 8.0, proficient: 7.0, competent: 6.0 }
    : { superior: 79, proficient: 65, competent: 50 };

  if (lowest >= thresholds.superior) return { tier: 'superior', label: 'Superior', points: 20, lowestSkill: lowest };
  if (lowest >= thresholds.proficient) return { tier: 'proficient', label: 'Proficient', points: 10, lowestSkill: lowest };
  if (lowest >= thresholds.competent) return { tier: 'competent', label: 'Competent', points: 0, lowestSkill: lowest };
  return { tier: 'below_competent', label: 'Below Competent — does not meet the basic English requirement', points: 0, lowestSkill: lowest };
}

// ---------------------------------------------------------------------------
// Visa fee estimator (indicative base charges only)
// ---------------------------------------------------------------------------

export type VisaSubclass =
  | '189' | '190' | '491' | '186' | '482_short' | '482_medium' | '820_801' | '500';

// Base/additional-applicant charges effective 1 July 2026 (Home Affairs
// Legislation Amendment (2026 Measures No. 1) Regulations 2026 raised most
// charges ~25% from 1 July 2026). Verified against multiple registered-agent
// summaries of the July 2026 schedule, NOT the DHA pricing tool directly
// (immi.homeaffairs.gov.au blocks automated fetches) - re-confirm on
// homeaffairs.gov.au before this feeds a real client quote, and revisit
// every July when DHA next revises charges.
export const visaSubclassOptions: Array<{ value: VisaSubclass; label: string; baseCharge: number; adultCharge: number; childCharge: number; note?: string }> = [
  { value: '189', label: 'Subclass 189 — Skilled Independent', baseCharge: 6135, adultCharge: 3070, childCharge: 1540 },
  { value: '190', label: 'Subclass 190 — Skilled Nominated', baseCharge: 6140, adultCharge: 3070, childCharge: 1540 },
  { value: '491', label: 'Subclass 491 — Skilled Work Regional (Provisional)', baseCharge: 6140, adultCharge: 3070, childCharge: 1540 },
  { value: '186', label: 'Subclass 186 — Employer Nomination Scheme', baseCharge: 6140, adultCharge: 3070, childCharge: 1540 },
  { value: '482_short', label: 'Subclass 482 — Skills in Demand (short-term stream)', baseCharge: 4015, adultCharge: 4015, childCharge: 1005, note: 'All Skills in Demand streams (Core Skills, Specialist Skills, Labour Agreement) now share one base charge. Nomination fee and Skilling Australians Fund levy apply separately, paid by the employer.' },
  { value: '482_medium', label: 'Subclass 482 — Skills in Demand (medium-term stream)', baseCharge: 4015, adultCharge: 4015, childCharge: 1005, note: 'All Skills in Demand streams (Core Skills, Specialist Skills, Labour Agreement) now share one base charge. Nomination fee and Skilling Australians Fund levy apply separately, paid by the employer.' },
  { value: '820_801', label: 'Subclass 820/801 — Partner (primary applicant)', baseCharge: 11710, adultCharge: 5860, childCharge: 2935 },
  { value: '500', label: 'Subclass 500 — Student', baseCharge: 2500, adultCharge: 0, childCharge: 0, note: 'Accompanying family members typically lodge their own related Subclass 500 application rather than being added as dependants here.' },
];

export interface FeeEstimateInput {
  subclass: VisaSubclass;
  accompanyingPartner: boolean;
  accompanyingChildren: number;
}

export interface FeeEstimateResult {
  baseCharge: number;
  partnerCharge: number;
  childrenCharge: number;
  total: number;
  currency: 'AUD';
  note?: string;
}

export function estimateAustraliaVisaFee(input: FeeEstimateInput): FeeEstimateResult {
  const subclass = visaSubclassOptions.find((o) => o.value === input.subclass)!;
  const partnerCharge = input.accompanyingPartner ? subclass.adultCharge : 0;
  const childrenCharge = Math.max(0, input.accompanyingChildren) * subclass.childCharge;

  return {
    baseCharge: subclass.baseCharge,
    partnerCharge,
    childrenCharge,
    total: subclass.baseCharge + partnerCharge + childrenCharge,
    currency: 'AUD',
    note: subclass.note,
  };
}

// ---------------------------------------------------------------------------
// Processing times reference (Australia) - static, as published by Home Affairs
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

export const australiaProcessingTimes: { referencePoint: string; groups: ProcessingTimeGroup[]; footnote: string } = {
  referencePoint: 'Department of Home Affairs published times as of Q2–Q3 2026',
  groups: [
    {
      title: 'Skilled — Points-Tested (Permanent/Provisional)',
      rows: [
        { program: '189 — Skilled Independent', range: '6–14 months', notes: 'Widest spread of the skilled category; occupation ceilings and priority direction affect queue position.' },
        { program: '190 — Skilled Nominated', range: '6–12 months', notes: 'State/territory nomination stage happens before the visa application stage.' },
        { program: '491 — Skilled Work Regional (Provisional)', range: '9–14 months', notes: 'Currently benefiting from government priority for regional applications in some periods.' },
      ],
    },
    {
      title: 'Employer-Sponsored',
      rows: [
        { program: '482 — Skills in Demand (short-term stream)', range: '~3 weeks – 3 months', notes: 'Fastest-moving employer-sponsored category once nomination is lodged.' },
        { program: '482 — Skills in Demand (medium-term stream)', range: '2–7 months', notes: 'Sponsorship approval → nomination → visa application are each separately timed.' },
        { program: '186 — Employer Nomination Scheme', range: '6–14 months', notes: 'Permanent employer-sponsored route; noticeably longer than 482.' },
      ],
    },
    {
      title: 'Family & Partner',
      rows: [
        { program: '820/801 — Partner (onshore, combined)', range: '12–24+ months', notes: 'Temporary stage (820) then permanent stage (801) after a minimum 2-year relationship assessment period.' },
        { program: 'Parent (103, non-contributory)', range: 'Many years (capped queue)', notes: 'Not published on the standard processing-times tool — managed against an annual planning level, not a percentile.' },
      ],
    },
    {
      title: 'Student & Visitor',
      rows: [
        { program: '500 — Student', range: '1–4 weeks', notes: 'Usually the fastest category; can extend for complex cases or additional checks.' },
        { program: '600 — Visitor', range: 'Days to a few weeks', notes: 'Varies by applicant history and country of passport.' },
      ],
    },
  ],
  footnote: 'Home Affairs publishes these at the 50th/75th/90th percentile depending on the tool used — meaning a portion of applications finish faster, and a portion take meaningfully longer, especially with health-occupation assessments, multiple nationalities, or procedural fairness requests. Always confirm current figures at homeaffairs.gov.au before quoting a client a number.',
};
