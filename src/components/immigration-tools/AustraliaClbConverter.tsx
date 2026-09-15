'use client';

import { useState } from 'react';
import { australiaEnglishTestOptions, convertToAustraliaCompetency, type AustraliaEnglishTest, type AustraliaEnglishResult } from '@/lib/immigrationTools/australia';
import { ToolCard, FieldGrid, Field, SelectInput, NumberInput, CalculateButton, ResultsPanel, ScorePill, SaveResultButton } from './shared';

export default function AustraliaClbConverter() {
  const [test, setTest] = useState<AustraliaEnglishTest>('ielts');
  const [listening, setListening] = useState<number | ''>('');
  const [reading, setReading] = useState<number | ''>('');
  const [writing, setWriting] = useState<number | ''>('');
  const [speaking, setSpeaking] = useState<number | ''>('');
  const [result, setResult] = useState<AustraliaEnglishResult | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const handleConvert = () => {
    const scores = {
      listening: listening === '' ? 0 : listening,
      reading: reading === '' ? 0 : reading,
      writing: writing === '' ? 0 : writing,
      speaking: speaking === '' ? 0 : speaking,
    };
    setResult(convertToAustraliaCompetency(test, scores));
    setLastInput({ test, ...scores });
  };

  const tierStyle = result?.tier === 'superior'
    ? 'text-emerald-700'
    : result?.tier === 'proficient'
      ? 'text-blue-700'
      : result?.tier === 'competent'
        ? 'text-amber-700'
        : 'text-red-700';

  return (
    <ToolCard
      title="IELTS / PTE → English Competency"
      description="Converts raw test scores into the Competent / Proficient / Superior tiers used by the Australian points test — all four skills must meet the same tier, with no band below."
    >
      <Field label="Test">
        <SelectInput value={test} onChange={setTest} options={australiaEnglishTestOptions} />
      </Field>

      <FieldGrid>
        <Field label="Listening">
          <NumberInput value={listening} onChange={setListening} placeholder="e.g. 7.0" step={test === 'pte_academic' ? 1 : 0.5} min={0} />
        </Field>
        <Field label="Reading">
          <NumberInput value={reading} onChange={setReading} placeholder="e.g. 7.0" step={test === 'pte_academic' ? 1 : 0.5} min={0} />
        </Field>
        <Field label="Writing">
          <NumberInput value={writing} onChange={setWriting} placeholder="e.g. 7.0" step={test === 'pte_academic' ? 1 : 0.5} min={0} />
        </Field>
        <Field label="Speaking">
          <NumberInput value={speaking} onChange={setSpeaking} placeholder="e.g. 7.0" step={test === 'pte_academic' ? 1 : 0.5} min={0} />
        </Field>
      </FieldGrid>

      <CalculateButton onClick={handleConvert} label="Convert to competency level" accent="blue" />

      {result && (
        <ResultsPanel>
          <div className="flex flex-wrap items-center gap-4">
            <ScorePill label="Lowest skill score" value={result.lowestSkill} />
            <div>
              <p className={`text-lg font-bold ${tierStyle}`}>{result.label}</p>
              <p className="text-sm text-[var(--cmg-muted)]">Points test contribution: +{result.points}</p>
            </div>
          </div>
          <SaveResultButton
            country="australia"
            tool="english_competency"
            headlineScore={result.label}
            input={lastInput}
            result={result}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
