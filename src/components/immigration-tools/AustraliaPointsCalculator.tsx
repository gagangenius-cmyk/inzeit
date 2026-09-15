'use client';

import { useState } from 'react';
import {
  ageBandOptions, englishAbilityOptions, overseasExperienceOptions, australianExperienceOptions,
  educationQualificationOptions, australianStudyOptions, partnerSituationOptions, nominationOptions,
  calculateAustraliaPoints,
  type AgeBand, type EnglishAbility, type OverseasExperience, type AustralianExperience,
  type EducationQualification, type AustralianStudyRequirement, type YesNo, type PartnerSituation, type NominationType,
  type AustraliaPointsBreakdown,
} from '@/lib/immigrationTools/australia';
import { ToolCard, FieldGrid, Field, SelectInput, CalculateButton, ResultsPanel, ScorePill, SaveResultButton } from './shared';

const yesNoOptions: Array<{ value: YesNo; label: string }> = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

export default function AustraliaPointsCalculator() {
  const [age, setAge] = useState<AgeBand>('25_32');
  const [english, setEnglish] = useState<EnglishAbility>('proficient');
  const [overseasExperience, setOverseasExperience] = useState<OverseasExperience>('3_4');
  const [australianExperience, setAustralianExperience] = useState<AustralianExperience>('under_1');
  const [education, setEducation] = useState<EducationQualification>('bachelor_or_masters');
  const [australianStudy, setAustralianStudy] = useState<AustralianStudyRequirement>('met');
  const [specialistEducation, setSpecialistEducation] = useState<YesNo>('no');
  const [naati, setNaati] = useState<YesNo>('no');
  const [regionalStudy, setRegionalStudy] = useState<YesNo>('no');
  const [partnerSituation, setPartnerSituation] = useState<PartnerSituation>('single_or_partner_citizen');
  const [professionalYear, setProfessionalYear] = useState<YesNo>('no');
  const [nomination, setNomination] = useState<NominationType>('none_189');
  const [result, setResult] = useState<AustraliaPointsBreakdown | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const handleCalculate = () => {
    const input = {
      age, english, overseasExperience, australianExperience, education, australianStudy,
      specialistEducation, naati, regionalStudy, partnerSituation, professionalYear, nomination,
    };
    setResult(calculateAustraliaPoints(input));
    setLastInput(input);
  };

  return (
    <ToolCard
      title="Skilled Migration Points Calculator"
      description="A minimum of 65 points is required to lodge an Expression of Interest for subclass 189, 190, or 491. Higher scores receive invitations sooner — recent 189 invitation rounds have typically landed around 95+."
    >
      <FieldGrid>
        <Field label="Age">
          <SelectInput value={age} onChange={setAge} options={ageBandOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
        <Field label="English ability">
          <SelectInput value={english} onChange={setEnglish} options={englishAbilityOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
        <Field label="Skilled employment — overseas (last 10 yrs)">
          <SelectInput value={overseasExperience} onChange={setOverseasExperience} options={overseasExperienceOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
        <Field label="Skilled employment — in Australia (last 10 yrs)">
          <SelectInput value={australianExperience} onChange={setAustralianExperience} options={australianExperienceOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
        <Field label="Educational qualification">
          <SelectInput value={education} onChange={setEducation} options={educationQualificationOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
        <Field label="Australian study requirement met?">
          <SelectInput value={australianStudy} onChange={setAustralianStudy} options={australianStudyOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
        <Field label="Specialist education (STEM Masters/PhD)?">
          <SelectInput value={specialistEducation} onChange={setSpecialistEducation} options={yesNoOptions} />
        </Field>
        <Field label="Credentialled community language (NAATI)?">
          <SelectInput value={naati} onChange={setNaati} options={yesNoOptions} />
        </Field>
        <Field label="Study in regional Australia?">
          <SelectInput value={regionalStudy} onChange={setRegionalStudy} options={yesNoOptions} />
        </Field>
        <Field label="Partner / spouse situation">
          <SelectInput value={partnerSituation} onChange={setPartnerSituation} options={partnerSituationOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
        <Field label="Professional Year in Australia?">
          <SelectInput value={professionalYear} onChange={setProfessionalYear} options={yesNoOptions} />
        </Field>
        <Field label="Nomination / sponsorship">
          <SelectInput value={nomination} onChange={setNomination} options={nominationOptions.map((o) => ({ value: o.value, label: `${o.label} (+${o.points})` }))} />
        </Field>
      </FieldGrid>

      <CalculateButton onClick={handleCalculate} label="Calculate points score" accent="blue" />

      {result && (
        <ResultsPanel>
          <div className="flex flex-wrap items-center gap-4">
            <ScorePill label="Total Points" value={result.total} />
            <div className="text-sm">
              <p className={result.meetsMinimum ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                {result.meetsMinimum ? 'Meets the 65-point minimum to lodge an EOI.' : 'Below the 65-point minimum required to lodge an EOI.'}
              </p>
              {result.meetsMinimum && (
                <p className="mt-1 text-[var(--cmg-muted)]">
                  {result.competitiveEstimate
                    ? 'In range with recent 189 invitation rounds (~95+) — a strong position.'
                    : 'Below recent 189 invitation rounds (~95+) — a state/territory nomination or regional visa may improve timing.'}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {result.lineItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border border-[var(--cmg-border)] bg-white px-3 py-2 text-sm">
                <span className="text-[var(--cmg-muted)]">{item.label}</span>
                <span className="font-semibold text-[var(--cmg-ink)]">+{item.points}</span>
              </div>
            ))}
          </div>
          <SaveResultButton
            country="australia"
            tool="points_calculator"
            headlineScore={`${result.total} points`}
            input={lastInput}
            result={result}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
