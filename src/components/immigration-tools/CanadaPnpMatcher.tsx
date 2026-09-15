'use client';

import { useState } from 'react';
import {
  provinceJobOfferOptions, matchPnpStreams,
  type ProvinceJobOffer, type PnpStreamMatch,
} from '@/lib/immigrationTools/canada';
import { ToolCard, FieldGrid, Field, SelectInput, NumberInput, CalculateButton, ResultsPanel, StreamList, SaveResultButton } from './shared';

const yesNoOptions: Array<{ value: 'yes' | 'no'; label: string }> = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];

const inDemandOptions: Array<{ value: 'yes' | 'not_sure_no'; label: string }> = [
  { value: 'not_sure_no', label: 'Not sure / no' },
  { value: 'yes', label: 'Yes' },
];

export default function CanadaPnpMatcher() {
  const [jobOfferProvince, setJobOfferProvince] = useState<ProvinceJobOffer>('none');
  const [hasExpressEntryProfile, setHasExpressEntryProfile] = useState<'yes' | 'no'>('yes');
  const [crsScore, setCrsScore] = useState<number | ''>('');
  const [inDemandOrTrade, setInDemandOrTrade] = useState<'yes' | 'not_sure_no'>('not_sure_no');
  const [recentlyStudiedInCanada, setRecentlyStudiedInCanada] = useState<'yes' | 'no'>('no');
  const [frenchSpeaking, setFrenchSpeaking] = useState<'yes' | 'no'>('no');
  const [matches, setMatches] = useState<PnpStreamMatch[] | null>(null);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);

  const handleFind = () => {
    const input = {
      jobOfferProvince,
      hasExpressEntryProfile: hasExpressEntryProfile === 'yes',
      crsScore: crsScore === '' ? null : crsScore,
      inDemandOrTrade,
      recentlyStudiedInCanada: recentlyStudiedInCanada === 'yes',
      frenchSpeaking: frenchSpeaking === 'yes',
    };
    setMatches(matchPnpStreams(input));
    setLastInput(input);
  };

  return (
    <ToolCard
      title="PNP Matcher"
      description="Screens a profile against provincial nominee streams. This checks broad fit signals — always confirm exact eligibility on the province’s own PNP criteria before advising a client."
    >
      <FieldGrid>
        <Field label="Do they have a job offer in a specific province?">
          <SelectInput value={jobOfferProvince} onChange={setJobOfferProvince} options={provinceJobOfferOptions} />
        </Field>
        <Field label="Existing Express Entry profile?">
          <SelectInput value={hasExpressEntryProfile} onChange={setHasExpressEntryProfile} options={yesNoOptions} />
        </Field>
        <Field label="CRS score (if known)">
          <NumberInput value={crsScore} onChange={setCrsScore} placeholder="e.g. 430" step={1} min={0} max={1200} />
        </Field>
        <Field label="In an in-demand / skilled trade occupation?">
          <SelectInput value={inDemandOrTrade} onChange={setInDemandOrTrade} options={inDemandOptions} />
        </Field>
        <Field label="Recently studied in Canada?">
          <SelectInput value={recentlyStudiedInCanada} onChange={setRecentlyStudiedInCanada} options={yesNoOptions} />
        </Field>
        <Field label="French-speaking?">
          <SelectInput value={frenchSpeaking} onChange={setFrenchSpeaking} options={yesNoOptions} />
        </Field>
      </FieldGrid>

      <CalculateButton onClick={handleFind} label="Find matching streams" />

      {matches && (
        <ResultsPanel>
          <StreamList matches={matches} />
          <SaveResultButton
            country="canada"
            tool="pnp_matcher"
            headlineScore={`${matches.length} stream${matches.length === 1 ? '' : 's'} matched`}
            input={lastInput}
            result={matches}
          />
        </ResultsPanel>
      )}
    </ToolCard>
  );
}
