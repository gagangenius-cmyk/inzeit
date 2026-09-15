'use client';

import { ReactNode, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useImmigrationTools } from './ImmigrationToolsContext';

export function ToolCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <label className="mb-1 block text-sm font-semibold text-[var(--cmg-red)]">{label}</label>
      {children}
    </div>
  );
}

const controlClass =
  'block w-full rounded-md border border-[var(--cmg-border)] bg-white px-3 py-2 text-sm text-[var(--cmg-ink)] shadow-sm focus:border-[var(--cmg-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--cmg-blue)]';

export function SelectInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={controlClass}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
}: {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step ?? 0.5}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      className={controlClass}
    />
  );
}

export function CalculateButton({ onClick, label = 'Calculate', accent = 'red' }: { onClick: () => void; label?: string; accent?: 'red' | 'blue' }) {
  return (
    <Button
      onClick={onClick}
      className={accent === 'red'
        ? 'bg-[var(--cmg-red)] text-white hover:bg-[var(--cmg-red-dark)]'
        : 'bg-blue-600 text-white hover:bg-blue-700'}
    >
      {label}
    </Button>
  );
}

export function ResultsPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-[var(--cmg-border)] bg-[var(--cmg-blue-soft)] p-4">
      {children}
    </div>
  );
}

const fitStyles: Record<'strong' | 'possible' | 'unlikely', string> = {
  strong: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  possible: 'bg-amber-100 text-amber-800 border-amber-300',
  unlikely: 'bg-slate-100 text-slate-600 border-slate-300',
};

const fitLabels: Record<'strong' | 'possible' | 'unlikely', string> = {
  strong: 'Strong fit',
  possible: 'Possible fit',
  unlikely: 'Unlikely fit',
};

export function PathwayList({ suggestions }: { suggestions: Array<{ pathway: string; fit: 'strong' | 'possible' | 'unlikely'; reason: string }> }) {
  if (suggestions.length === 0) return null;
  return (
    <div className="space-y-3">
      {suggestions.map((item, index) => (
        <div key={`${item.pathway}-${index}`} className="rounded-md border border-[var(--cmg-border)] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-[var(--cmg-ink)]">{item.pathway}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${fitStyles[item.fit]}`}>{fitLabels[item.fit]}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--cmg-muted)]">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}

export function StreamList({ matches }: { matches: Array<{ stream: string; reason: string }> }) {
  if (matches.length === 0) return null;
  return (
    <div className="space-y-3">
      {matches.map((item, index) => (
        <div key={`${item.stream}-${index}`} className="rounded-md border border-[var(--cmg-border)] bg-white p-3">
          <span className="font-semibold text-[var(--cmg-ink)]">{item.stream}</span>
          <p className="mt-1 text-sm text-[var(--cmg-muted)]">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}

export function ProcessingTimesTable({ referencePoint, groups, footnote }: {
  referencePoint: string;
  groups: Array<{ title: string; rows: Array<{ program: string; range: string; notes: string }> }>;
  footnote: string;
}) {
  return (
    <div className="space-y-6">
      <div className="inline-block rounded-full border border-[var(--cmg-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--cmg-muted)]">
        Reference point: {referencePoint}
      </div>
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--cmg-red)]">{group.title}</h3>
          <div className="overflow-x-auto rounded-md border border-[var(--cmg-border)]">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--cmg-blue-soft)] text-left">
                  <th className="px-3 py-2 font-semibold text-[var(--cmg-ink)]">Program</th>
                  <th className="px-3 py-2 font-semibold text-[var(--cmg-ink)]">Typical range</th>
                  <th className="px-3 py-2 font-semibold text-[var(--cmg-ink)]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr key={row.program} className="border-t border-[var(--cmg-border)]">
                    <td className="px-3 py-2 align-top">{row.program}</td>
                    <td className="px-3 py-2 align-top font-semibold whitespace-nowrap">{row.range}</td>
                    <td className="px-3 py-2 align-top text-[var(--cmg-muted)]">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="text-xs text-[var(--cmg-muted)]">{footnote}</p>
    </div>
  );
}

export function SaveResultButton({
  country,
  tool,
  headlineScore,
  input,
  result,
}: {
  country: 'canada' | 'australia';
  tool: string;
  headlineScore: string;
  input: unknown;
  result: unknown;
}) {
  const { selectedLead, saveResult } = useImmigrationTools();
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveResult({ country, tool, headlineScore, input, result });
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4 flex items-center gap-2 border-t border-[var(--cmg-border)] pt-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={!selectedLead || isSaving}
        title={selectedLead ? 'Save this result to the linked lead' : 'Link a lead above to save this result'}
      >
        {justSaved ? <Check className="mr-1.5 h-4 w-4 text-emerald-600" /> : <Save className="mr-1.5 h-4 w-4" />}
        {justSaved ? 'Saved to lead' : isSaving ? 'Saving…' : 'Save to lead'}
      </Button>
      {!selectedLead && <span className="text-xs text-[var(--cmg-muted)]">Link a lead above to save this result to their file.</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function ScorePill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[var(--cmg-border)] bg-white px-4 py-3 text-center">
      <div className="text-2xl font-bold text-[var(--cmg-ink)]">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--cmg-muted)]">{label}</div>
    </div>
  );
}
