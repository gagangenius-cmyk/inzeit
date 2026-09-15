'use client';

import { History } from 'lucide-react';
import { useImmigrationTools } from './ImmigrationToolsContext';

const toolLabels: Record<string, string> = {
  eligibility_snapshot: 'Eligibility Snapshot',
  crs_calculator: 'CRS Calculator',
  pnp_matcher: 'PNP Matcher',
  clb_converter: 'IELTS/PTE → CLB',
  eligibility_checker: 'Eligibility Checker',
  points_calculator: 'Points Calculator',
  fee_estimator: 'Fee Estimator',
  english_competency: 'IELTS/PTE Score',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function HistoryPanel() {
  const { selectedLead, history, historyLoading } = useImmigrationTools();

  if (!selectedLead) return null;

  return (
    <div className="rounded-md border border-[var(--cmg-border)] bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-[var(--cmg-muted)]" />
        <h3 className="text-sm font-semibold text-[var(--cmg-ink)]">Saved results for {selectedLead.label}</h3>
      </div>
      {historyLoading && <p className="text-sm text-[var(--cmg-muted)]">Loading…</p>}
      {!historyLoading && history.length === 0 && (
        <p className="text-sm text-[var(--cmg-muted)]">No results saved to this lead yet.</p>
      )}
      {!historyLoading && history.length > 0 && (
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--cmg-border)] px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-[var(--cmg-ink)]">{toolLabels[item.tool] || item.tool}</span>
                <span className="ml-2 text-xs uppercase text-[var(--cmg-muted)]">{item.country}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--cmg-muted)]">
                {item.headlineScore && <span className="font-semibold text-[var(--cmg-ink)]">{item.headlineScore}</span>}
                <span>{item.employeeName || 'Unknown'}</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
