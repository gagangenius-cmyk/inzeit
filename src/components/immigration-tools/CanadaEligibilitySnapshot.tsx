'use client';

import { useState } from 'react';
import {
  educationOptions, clbRangeOptions, experienceRangeOptions, canadianExperienceTypeOptions,
  jobOfferOrPnpOptions, eipInterestOptions, screenEligibilitySnapshot,
  type EducationLevel, type ClbRange, type ExperienceRange, type CanadianExperienceType, type JobOfferOrPnpInterest, type EipInterest,
  type PathwaySuggestion,
} from '@/lib/immigrationTools/canada';
import { ToolCard, FieldGrid, Field, SelectInput, NumberInput, CalculateButton, ResultsPanel, PathwayList, SaveResultButton } from './shared';

export default function CanadaEligibilitySnapshot() {
  const [age, setAge] = useState<number | ''>('');
  const [education, setEducation] = useState<EducationLevel>('bachelors');
  const [clb, setClb] = useState<ClbRange>('7_8');
  const [experience, setExperience] = useState<ExperienceRange>('3_5');
  const [canadianExperience, setCanadianExperience] = useState<CanadianExperienceType>('none');
  const [jobOfferOrPnp, setJobOfferOrPnp] = useState<JobOfferOrPnpInterest>('neither');
  const [eipInterest, setEipInterest] = useState<EipInterest>('no');
  const [results, setResults] = useState<PathwaySuggestion[] | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const handleCheck = () => {
    const input = {
      age: age === '' ? 0 : age,
      education, clb, experience, canadianExperience, jobOfferOrPnp, eipInterest,
    };
    setResults(screenEligibilitySnapshot(input));
    setLastInput(input);
  };

  return (
    <ToolCard
      title="Quick eligibility snapshot"
      description="A few questions to point a sales lead toward the right Canadian pathway before a full CRS or PNP review."
    >
      <FieldGrid>
        <Field label="Age">
          <NumberInput value={age} onChange={setAge} placeholder="e.g. 29" step={1} min={0} max={100} />
        </Field>
        <Field label="Highest education">
          <SelectInput value={education} onChange={setEducation} options={educationOptions} />
        </Field>
        <Field label="English/French ability (CLB)">
          <SelectInput value={clb} onChange={setClb} options={clbRangeOptions} />
        </Field>
        <Field label="Skilled work experience (years)">
          <SelectInput value={experience} onChange={setExperience} options={experienceRangeOptions} />
        </Field>
        <Field label="Canadian work/study experience?">
          <SelectInput value={canadianExperience} onChange={setCanadianExperience} options={canadianExperienceTypeOptions} />
        </Field>
        <Field label="Job offer or PNP interest?">
          <SelectInput value={jobOfferOrPnp} onChange={setJobOfferOrPnp} options={jobOfferOrPnpOptions} />
        </Field>
        <Field label="Interested in Economic Immigration Pilots (EIP)?">
          <SelectInput value={eipInterest} onChange={setEipInterest} options={eipInterestOptions} />
        </Field>
      </FieldGrid>

      <CalculateButton onClick={handleCheck} label="Check pathways" />

      {results && (
        <ResultsPanel>
          <PathwayList suggestions={results} />
          <SaveResultButton
            country="canada"
            tool="eligibility_snapshot"
            headlineScore={results[0] ? results[0].pathway : 'No pathway suggested'}
            input={lastInput}
            result={results}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
