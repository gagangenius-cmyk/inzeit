'use client';

import { useState } from 'react';
import { languageTestOptions, convertToClb, type LanguageTest, type ClbResult } from '@/lib/immigrationTools/canada';
import { ToolCard, FieldGrid, Field, SelectInput, NumberInput, CalculateButton, ResultsPanel, ScorePill, SaveResultButton } from './shared';

export default function CanadaClbConverter() {
  const [test, setTest] = useState<LanguageTest>('ielts_gt');
  const [listening, setListening] = useState<number | ''>('');
  const [reading, setReading] = useState<number | ''>('');
  const [writing, setWriting] = useState<number | ''>('');
  const [speaking, setSpeaking] = useState<number | ''>('');
  const [result, setResult] = useState<ClbResult | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const handleConvert = () => {
    const scores = {
      listening: listening === '' ? 0 : listening,
      reading: reading === '' ? 0 : reading,
      writing: writing === '' ? 0 : writing,
      speaking: speaking === '' ? 0 : speaking,
    };
    setResult(convertToClb(test, scores));
    setLastInput({ test, ...scores });
  };

  return (
    <ToolCard
      title="IELTS / PTE → CLB Calculator"
      description="Converts raw test scores into Canadian Language Benchmark (CLB) levels per skill — the same figure the CRS Calculator uses for language points."
    >
      <Field label="Test">
        <SelectInput value={test} onChange={setTest} options={languageTestOptions} />
      </Field>

      <FieldGrid>
        <Field label="Listening">
          <NumberInput value={listening} onChange={setListening} placeholder="e.g. 7.0" step={test === 'pte_core' ? 1 : 0.5} min={0} />
        </Field>
        <Field label="Reading">
          <NumberInput value={reading} onChange={setReading} placeholder="e.g. 7.0" step={test === 'pte_core' ? 1 : 0.5} min={0} />
        </Field>
        <Field label="Writing">
          <NumberInput value={writing} onChange={setWriting} placeholder="e.g. 7.0" step={test === 'pte_core' ? 1 : 0.5} min={0} />
        </Field>
        <Field label="Speaking">
          <NumberInput value={speaking} onChange={setSpeaking} placeholder="e.g. 7.0" step={test === 'pte_core' ? 1 : 0.5} min={0} />
        </Field>
      </FieldGrid>

      <CalculateButton onClick={handleConvert} label="Convert to CLB" />

      {result && (
        <ResultsPanel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <ScorePill label="Listening" value={`CLB ${result.listening}`} />
            <ScorePill label="Reading" value={`CLB ${result.reading}`} />
            <ScorePill label="Writing" value={`CLB ${result.writing}`} />
            <ScorePill label="Speaking" value={`CLB ${result.speaking}`} />
            <ScorePill label="Overall (lowest)" value={`CLB ${result.overall}`} />
          </div>
          {result.note && <p className="mt-3 text-xs text-[var(--cmg-muted)]">{result.note}</p>}
          <SaveResultButton
            country="canada"
            tool="clb_converter"
            headlineScore={`CLB ${result.overall}`}
            input={lastInput}
            result={result}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
