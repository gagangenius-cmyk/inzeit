'use client';

import { useState } from 'react';
import { visaSubclassOptions, estimateAustraliaVisaFee, type VisaSubclass, type FeeEstimateResult } from '@/lib/immigrationTools/australia';
import { ToolCard, Field, SelectInput, NumberInput, CalculateButton, ResultsPanel, ScorePill, SaveResultButton } from './shared';

export default function AustraliaFeeEstimator() {
  const [subclass, setSubclass] = useState<VisaSubclass>('186');
  const [accompanyingPartner, setAccompanyingPartner] = useState<'yes' | 'no'>('no');
  const [accompanyingChildren, setAccompanyingChildren] = useState<number | ''>(0);
  const [result, setResult] = useState<FeeEstimateResult | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const handleEstimate = () => {
    const input = {
      subclass,
      accompanyingPartner: accompanyingPartner === 'yes',
      accompanyingChildren: accompanyingChildren === '' ? 0 : accompanyingChildren,
    };
    setResult(estimateAustraliaVisaFee(input));
    setLastInput(input);
  };

  return (
    <ToolCard
      title="Visa Fee Estimator"
      description="Indicative Department of Home Affairs base application charges. Government fees change periodically (typically each July) — always confirm the current charge on homeaffairs.gov.au before quoting a client."
    >
      <Field label="Visa subclass">
        <SelectInput value={subclass} onChange={setSubclass} options={visaSubclassOptions.map((o) => ({ value: o.value, label: o.label }))} />
      </Field>
      <Field label="Accompanying partner (18+)?">
        <SelectInput value={accompanyingPartner} onChange={setAccompanyingPartner} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
      </Field>
      <Field label="Accompanying children">
        <NumberInput value={accompanyingChildren} onChange={setAccompanyingChildren} step={1} min={0} max={20} />
      </Field>

      <CalculateButton onClick={handleEstimate} label="Estimate total fee" accent="blue" />

      {result && (
        <ResultsPanel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ScorePill label="Base charge" value={`AUD ${result.baseCharge.toLocaleString()}`} />
            <ScorePill label="Partner" value={`AUD ${result.partnerCharge.toLocaleString()}`} />
            <ScorePill label="Children" value={`AUD ${result.childrenCharge.toLocaleString()}`} />
            <ScorePill label="Estimated total" value={`AUD ${result.total.toLocaleString()}`} />
          </div>
          {result.note && <p className="mt-3 text-xs text-[var(--cmg-muted)]">{result.note}</p>}
          <SaveResultButton
            country="australia"
            tool="fee_estimator"
            headlineScore={`AUD ${result.total.toLocaleString()}`}
            input={lastInput}
            result={result}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
