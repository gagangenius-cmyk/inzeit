'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

type StageData = Record<string, unknown> | null;
interface Scores {
  expressEntry: StageData;
  eca: StageData;
  language: StageData;
  pnp: StageData;
  spouseEca: StageData;
  spouseLanguage: StageData;
}

const val = (data: StageData, key: string): string => {
  const value = data?.[key];
  return value === undefined || value === null || value === '' ? '—' : String(value);
};

const Card = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-6">
    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    <div className="mt-4 space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm font-medium text-slate-900">{value}</span>
  </div>
);

const ScoreTile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-center">
    <p className="text-lg font-semibold text-slate-900">{value}</p>
    <p className="text-xs text-slate-500">{label}</p>
    {sub && <p className="text-[10px] font-medium text-blue-600">{sub}</p>}
  </div>
);

export default function EligibilityScoresPage() {
  const params = useParams<{ opportunityId: string }>();
  const [scores, setScores] = useState<Scores | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/clientportal/${params.opportunityId}/eligibility-scores`)
      .then((res) => res.json())
      .then((json) => setScores(json.scores ?? null))
      .catch(() => setScores(null));
  }, [params.opportunityId]);

  if (scores === undefined) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }
  if (!scores) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Eligibility & scores aren&apos;t available yet — your case manager updates this once your Express Entry profile work begins.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card title="NOC" subtitle="Occupation classification used to assess eligibility.">
        <Row label="Principal Applicant — NOC" value={val(scores.expressEntry, 'eeNoc')} />
      </Card>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">CRS Score (Comprehensive Ranking System — Express Entry)</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ScoreTile label="CRS Score (of 1200)" value={val(scores.expressEntry, 'eeScore')} />
          <ScoreTile label="Profile Launched" value={val(scores.expressEntry, 'eeProfLauDate')} />
          <ScoreTile label="Profile Expiry" value={val(scores.expressEntry, 'eeProfExpDate')} />
        </div>
      </div>

      <Card title="Provincial Nominee Program (PNP)" subtitle="Details of the provincial nomination stream applied to, separate from federal Express Entry.">
        <Row label="Status" value={val(scores.pnp, 'pnpStatus')} />
        <Row label="EOI submitted" value={val(scores.pnp, 'eoisubdate')} />
        <Row label="EOI Points" value={val(scores.pnp, 'ptsp')} />
        <Row label="Nomination awarded" value={val(scores.pnp, 'nomrecdate')} />
      </Card>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Federal Skilled Worker Program (FSWP) Score</h2>
        <p className="mt-1 text-xs text-slate-500">Pass mark is 67 points. Verified and entered by your case manager.</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Total Points Claimed</span>
          <span className="text-lg font-semibold text-slate-900">{val(scores.expressEntry, 'eePoint')} / 100</span>
        </div>
      </div>

      <Card title="IELTS / Language Test Scores" subtitle={`Test: ${val(scores.language, 'langTest')} · Test date: ${val(scores.language, 'testDate')}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ScoreTile label="Listening" value={val(scores.language, 'listening')} />
          <ScoreTile label="Reading" value={val(scores.language, 'reading')} />
          <ScoreTile label="Writing" value={val(scores.language, 'writing')} />
          <ScoreTile label="Speaking" value={val(scores.language, 'speaking')} />
        </div>
      </Card>

      <Card title="ECA Equivalency Outcome" subtitle="Educational Credential Assessment, required to prove your degree is equivalent to a Canadian credential.">
        <Row label="Assessing body" value={val(scores.eca, 'ecaAssmBody')} />
        <Row label="Application date" value={val(scores.eca, 'ecaApplyDate')} />
        <Row label="Completion date" value={val(scores.eca, 'compDate')} />
        <Row label="Qualification" value={val(scores.eca, 'qualification')} />
        <Row label="University" value={val(scores.eca, 'university')} />
      </Card>

      {(scores.spouseLanguage || scores.spouseEca) && (
        <>
          <Card title="Spouse — Language Test Scores">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ScoreTile label="Listening" value={val(scores.spouseLanguage, 'spouseListening')} />
              <ScoreTile label="Reading" value={val(scores.spouseLanguage, 'spouseReading')} />
              <ScoreTile label="Writing" value={val(scores.spouseLanguage, 'spouseWriting')} />
              <ScoreTile label="Speaking" value={val(scores.spouseLanguage, 'spouseSpeaking')} />
            </div>
          </Card>
          <Card title="Spouse — ECA Equivalency Outcome">
            <Row label="Assessing body" value={val(scores.spouseEca, 'spouseEcaAssmBody')} />
            <Row label="Completion date" value={val(scores.spouseEca, 'spouseCompDate')} />
            <Row label="Qualification" value={val(scores.spouseEca, 'spouseQualification')} />
          </Card>
        </>
      )}
    </div>
  );
}
