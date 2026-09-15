'use client';

import { useState } from 'react';
import {
  englishAbilityOptions, skillsAssessmentOptions, screenAustraliaEligibility,
  type EnglishAbility, type SkillsAssessmentStatus, type YesNo, type PathwaySuggestion,
} from '@/lib/immigrationTools/australia';
import { ToolCard, FieldGrid, Field, SelectInput, NumberInput, CalculateButton, ResultsPanel, PathwayList, SaveResultButton } from './shared';

const yesNoOptions: Array<{ value: YesNo; label: string }> = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

export default function AustraliaEligibilityChecker() {
  const [age, setAge] = useState<number | ''>('');
  const [occupationOnList, setOccupationOnList] = useState<YesNo>('yes');
  const [englishAbility, setEnglishAbility] = useState<EnglishAbility>('competent');
  const [skillsAssessment, setSkillsAssessment] = useState<SkillsAssessmentStatus>('yes_confident');
  const [employerSponsorshipAvailable, setEmployerSponsorshipAvailable] = useState<YesNo>('no');
  const [willingRegional, setWillingRegional] = useState<YesNo>('no');
  const [results, setResults] = useState<PathwaySuggestion[] | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const handleCheck = () => {
    const input = {
      age: age === '' ? 0 : age,
      occupationOnList,
      englishAbility,
      skillsAssessment,
      employerSponsorshipAvailable,
      willingRegional,
    };
    setResults(screenAustraliaEligibility(input));
    setLastInput(input);
  };

  return (
    <ToolCard
      title="Australia eligibility checker"
      description="A first-pass screen for skilled migration and other common pathways."
    >
      <FieldGrid>
        <Field label="Age">
          <NumberInput value={age} onChange={setAge} placeholder="e.g. 31" step={1} min={0} max={100} />
        </Field>
        <Field label="Occupation on a skilled occupation list?">
          <SelectInput value={occupationOnList} onChange={setOccupationOnList} options={yesNoOptions} />
        </Field>
        <Field label="English ability">
          <SelectInput value={englishAbility} onChange={setEnglishAbility} options={englishAbilityOptions} />
        </Field>
        <Field label="Positive skills assessment obtained/likely?">
          <SelectInput value={skillsAssessment} onChange={setSkillsAssessment} options={skillsAssessmentOptions} />
        </Field>
        <Field label="Employer sponsorship available?">
          <SelectInput value={employerSponsorshipAvailable} onChange={setEmployerSponsorshipAvailable} options={yesNoOptions} />
        </Field>
        <Field label="Willing to live/work regionally?">
          <SelectInput value={willingRegional} onChange={setWillingRegional} options={yesNoOptions} />
        </Field>
      </FieldGrid>

      <CalculateButton onClick={handleCheck} label="Check pathways" accent="blue" />

      {results && (
        <ResultsPanel>
          <PathwayList suggestions={results} />
          <SaveResultButton
            country="australia"
            tool="eligibility_checker"
            headlineScore={results[0] ? results[0].pathway : 'No pathway suggested'}
            input={lastInput}
            result={results}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
