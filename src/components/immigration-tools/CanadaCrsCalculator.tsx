'use client';

import { useState } from 'react';
import {
  educationOptions, canadianExperienceOptions, foreignExperienceOptions, canadianStudyOptions,
  calculateCrs,
  type MaritalStatus, type EducationLevel, type ExperienceYears, type ForeignExperience, type CanadianStudyCredential,
  type CrsBreakdown,
} from '@/lib/immigrationTools/canada';
import { ToolCard, FieldGrid, Field, SelectInput, NumberInput, CalculateButton, ResultsPanel, ScorePill, SaveResultButton } from './shared';

const maritalStatusOptions: Array<{ value: MaritalStatus; label: string }> = [
  { value: 'single', label: 'Single / spouse not accompanying' },
  { value: 'married_accompanying', label: 'Married / common-law — spouse accompanying' },
];

const yesNoOptions: Array<{ value: 'yes' | 'no'; label: string }> = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

const clbOptions = [4, 5, 6, 7, 8, 9, 10].map((clb) => ({ value: String(clb), label: `CLB ${clb}${clb === 10 ? '+' : ''}` }));
const secondClbOptions = [
  { value: '0', label: 'None / CLB 4 or below' },
  ...[5, 6, 7, 8, 9, 10].map((clb) => ({ value: String(clb), label: `CLB ${clb}${clb === 10 ? '+' : ''}` })),
];

export default function CanadaCrsCalculator() {
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('single');
  const [age, setAge] = useState<number | ''>(29);
  const [education, setEducation] = useState<EducationLevel>('bachelors');
  const [firstLanguageClb, setFirstLanguageClb] = useState('7');
  const [secondLanguageClb, setSecondLanguageClb] = useState('0');
  const [canadianExperience, setCanadianExperience] = useState<ExperienceYears>('0');
  const [foreignExperience, setForeignExperience] = useState<ForeignExperience>('none');
  const [provincialNomination, setProvincialNomination] = useState<'yes' | 'no'>('no');
  const [canadianStudyCredential, setCanadianStudyCredential] = useState<CanadianStudyCredential>('none');
  const [siblingInCanada, setSiblingInCanada] = useState<'yes' | 'no'>('no');
  const [frenchNclc7Plus, setFrenchNclc7Plus] = useState<'yes' | 'no'>('no');
  const [spouseEducation, setSpouseEducation] = useState<EducationLevel>('bachelors');
  const [spouseLanguageClb, setSpouseLanguageClb] = useState('0');
  const [spouseCanadianExperience, setSpouseCanadianExperience] = useState<ExperienceYears>('0');
  const [result, setResult] = useState<CrsBreakdown | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const withSpouse = maritalStatus === 'married_accompanying';

  const handleCalculate = () => {
    const input = {
      maritalStatus,
      age: age === '' ? 0 : age,
      education,
      firstLanguageClb: Number(firstLanguageClb),
      secondLanguageClb: Number(secondLanguageClb),
      canadianExperience,
      foreignExperience,
      provincialNomination: provincialNomination === 'yes',
      canadianStudyCredential,
      siblingInCanada: siblingInCanada === 'yes',
      frenchNclc7Plus: frenchNclc7Plus === 'yes',
      ...(withSpouse ? {
        spouseEducation,
        spouseLanguageClb: Number(spouseLanguageClb),
        spouseCanadianExperience,
      } : {}),
    };
    setResult(calculateCrs(input));
    setLastInput(input);
  };

  return (
    <ToolCard
      title="Comprehensive Ranking System (CRS) Calculator"
      description="Estimates an Express Entry CRS score using the official point categories (age, education, language, experience, skill transferability, and additional points). Skill transferability is approximated."
    >
      <FieldGrid>
        <Field label="Marital status">
          <SelectInput value={maritalStatus} onChange={setMaritalStatus} options={maritalStatusOptions} />
        </Field>
        <Field label="Age">
          <NumberInput value={age} onChange={setAge} placeholder="29" step={1} min={0} max={100} />
        </Field>
        <Field label="Education">
          <SelectInput value={education} onChange={setEducation} options={educationOptions} />
        </Field>
        <Field label="First language CLB (all 4 abilities)">
          <SelectInput value={firstLanguageClb} onChange={setFirstLanguageClb} options={clbOptions} />
        </Field>
        <Field label="Second language CLB (if tested)">
          <SelectInput value={secondLanguageClb} onChange={setSecondLanguageClb} options={secondClbOptions} />
        </Field>
        <Field label="Canadian work experience">
          <SelectInput value={canadianExperience} onChange={setCanadianExperience} options={canadianExperienceOptions} />
        </Field>
        <Field label="Foreign skilled work experience">
          <SelectInput value={foreignExperience} onChange={setForeignExperience} options={foreignExperienceOptions} />
        </Field>
        <Field label="Provincial nomination?">
          <SelectInput value={provincialNomination} onChange={setProvincialNomination} options={yesNoOptions} />
        </Field>
        <Field label="Canadian study credential?">
          <SelectInput value={canadianStudyCredential} onChange={setCanadianStudyCredential} options={canadianStudyOptions} />
        </Field>
        <Field label="Sibling in Canada (citizen/PR)?">
          <SelectInput value={siblingInCanada} onChange={setSiblingInCanada} options={yesNoOptions} />
        </Field>
        <Field label="French proficiency (NCLC 7+)?">
          <SelectInput value={frenchNclc7Plus} onChange={setFrenchNclc7Plus} options={yesNoOptions} />
        </Field>
      </FieldGrid>

      {withSpouse && (
        <>
          <p className="mt-6 text-sm font-medium text-[var(--cmg-ink)]">Spouse / common-law partner factors (up to 40 points)</p>
          <FieldGrid>
            <Field label="Spouse's education">
              <SelectInput value={spouseEducation} onChange={setSpouseEducation} options={educationOptions} />
            </Field>
            <Field label="Spouse's first language CLB (all 4 abilities)">
              <SelectInput value={spouseLanguageClb} onChange={setSpouseLanguageClb} options={secondClbOptions} />
            </Field>
            <Field label="Spouse's Canadian work experience">
              <SelectInput value={spouseCanadianExperience} onChange={setSpouseCanadianExperience} options={canadianExperienceOptions} />
            </Field>
          </FieldGrid>
        </>
      )}

      <CalculateButton onClick={handleCalculate} label="Calculate CRS score" />

      {result && (
        <ResultsPanel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <ScorePill label="Total CRS" value={result.total} />
            <ScorePill label="Core / Human Capital" value={result.coreHumanCapital} />
            {result.withSpouse && <ScorePill label="Spouse Factors" value={result.spouseFactors} />}
            <ScorePill label="Skill Transferability" value={result.skillTransferability} />
            <ScorePill label="Additional Points" value={result.additionalPoints} />
          </div>
          {result.notes.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--cmg-muted)]">
              {result.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          )}
          <SaveResultButton
            country="canada"
            tool="crs_calculator"
            headlineScore={`CRS ${result.total}`}
            input={lastInput}
            result={result}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
