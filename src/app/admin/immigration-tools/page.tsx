'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import CanadaEligibilitySnapshot from '@/components/immigration-tools/CanadaEligibilitySnapshot';
import CanadaCrsCalculator from '@/components/immigration-tools/CanadaCrsCalculator';
import CanadaPnpMatcher from '@/components/immigration-tools/CanadaPnpMatcher';
import CanadaClbConverter from '@/components/immigration-tools/CanadaClbConverter';
import CanadaProcessingTimes from '@/components/immigration-tools/CanadaProcessingTimes';
import AustraliaEligibilityChecker from '@/components/immigration-tools/AustraliaEligibilityChecker';
import AustraliaPointsCalculator from '@/components/immigration-tools/AustraliaPointsCalculator';
import AustraliaFeeEstimator from '@/components/immigration-tools/AustraliaFeeEstimator';
import AustraliaClbConverter from '@/components/immigration-tools/AustraliaClbConverter';
import AustraliaProcessingTimes from '@/components/immigration-tools/AustraliaProcessingTimes';
import { ImmigrationToolsProvider } from '@/components/immigration-tools/ImmigrationToolsContext';
import LeadPicker from '@/components/immigration-tools/LeadPicker';
import HistoryPanel from '@/components/immigration-tools/HistoryPanel';

type Country = 'canada' | 'australia';

const canadaTabs = [
  { id: 'snapshot', label: 'Eligibility Snapshot' },
  { id: 'crs', label: 'CRS Calculator' },
  { id: 'pnp', label: 'PNP Matcher' },
  { id: 'clb', label: 'IELTS/PTE → CLB' },
  { id: 'processing', label: 'Processing Times' },
] as const;

const australiaTabs = [
  { id: 'snapshot', label: 'Eligibility Checker' },
  { id: 'crs', label: 'Points Calculator' },
  { id: 'fees', label: 'Fee Estimator' },
  { id: 'clb', label: 'IELTS/PTE Score' },
  { id: 'processing', label: 'Processing Times' },
] as const;

type TabId = typeof canadaTabs[number]['id'] | typeof australiaTabs[number]['id'];

export default function ImmigrationToolsPage() {
  const [country, setCountry] = useState<Country>('canada');
  const [tab, setTab] = useState<TabId>('snapshot');

  const tabs = country === 'canada' ? canadaTabs : australiaTabs;
  const accent = country === 'canada' ? 'var(--cmg-red)' : '#2563eb';

  const selectCountry = (next: Country) => {
    setCountry(next);
    setTab('snapshot');
  };

  return (
    <ImmigrationToolsProvider>
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--cmg-blue)] text-lg font-bold text-white">GN</div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--cmg-ink)]">Immigration Tools</h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cmg-muted)]">Sales Module · Inzeit CRM</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-[var(--cmg-border)] bg-white px-4 py-3 text-sm text-[var(--cmg-muted)]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dmc-gold)]" />
        <span>Estimates for sales screening only — not official assessments. Always confirm with an RCIC / MARA agent before advising a client.</span>
      </div>

      <LeadPicker />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => selectCountry('canada')}
          className={`flex items-center gap-3 rounded-md border-2 px-4 py-3 text-left transition-colors ${
            country === 'canada' ? 'border-[var(--cmg-red)] bg-red-50' : 'border-[var(--cmg-border)] bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-2xl">🇨🇦</span>
          <span>
            <span className="block font-semibold text-[var(--cmg-ink)]">Canada</span>
            <span className="block text-xs text-[var(--cmg-muted)]">Express Entry, CRS &amp; PNP</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => selectCountry('australia')}
          className={`flex items-center gap-3 rounded-md border-2 px-4 py-3 text-left transition-colors ${
            country === 'australia' ? 'border-blue-600 bg-blue-50' : 'border-[var(--cmg-border)] bg-white hover:bg-slate-50'
          }`}
        >
          <span className="text-2xl">🇦🇺</span>
          <span>
            <span className="block font-semibold text-[var(--cmg-ink)]">Australia</span>
            <span className="block text-xs text-[var(--cmg-muted)]">Points test, fees &amp; eligibility</span>
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={tab === item.id
              ? { backgroundColor: accent, color: 'white' }
              : { backgroundColor: 'white', color: 'var(--cmg-muted)', border: '1px solid var(--cmg-border)' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {country === 'canada' ? (
        <>
          {tab === 'snapshot' && <CanadaEligibilitySnapshot />}
          {tab === 'crs' && <CanadaCrsCalculator />}
          {tab === 'pnp' && <CanadaPnpMatcher />}
          {tab === 'clb' && <CanadaClbConverter />}
          {tab === 'processing' && <CanadaProcessingTimes />}
        </>
      ) : (
        <>
          {tab === 'snapshot' && <AustraliaEligibilityChecker />}
          {tab === 'crs' && <AustraliaPointsCalculator />}
          {tab === 'fees' && <AustraliaFeeEstimator />}
          {tab === 'clb' && <AustraliaClbConverter />}
          {tab === 'processing' && <AustraliaProcessingTimes />}
        </>
      )}

      <HistoryPanel />
    </div>
    </ImmigrationToolsProvider>
  );
}
