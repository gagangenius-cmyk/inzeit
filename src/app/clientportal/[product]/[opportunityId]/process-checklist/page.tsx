'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Circle, Loader2, Clock } from 'lucide-react';

interface Stage {
  stageKey: string;
  stageLabel: string;
  sequence: number;
  status: 'not_started' | 'in_progress' | 'completed';
  statusNote: string | null;
  completedAt: string | null;
}

const statusBadge = (status: Stage['status']) => {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'in_progress') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-500';
};

export default function ProcessChecklistPage() {
  const params = useParams<{ opportunityId: string }>();
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/clientportal/${params.opportunityId}/process-checklist`)
      .then((res) => res.json())
      .then((json) => setStages(json.stages || []))
      .finally(() => setIsLoading(false));
  }, [params.opportunityId]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }

  const completed = stages.filter((s) => s.status === 'completed').length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-900">Process Checklist</h1>
        <p className="mt-1 text-sm text-slate-500">Track each step of your process. Your case manager updates step status.</p>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${stages.length ? (completed / stages.length) * 100 : 0}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500">{completed} of {stages.length} steps complete</p>

        <div className="mt-6 divide-y divide-slate-100">
          {stages.map((stage) => (
            <div key={stage.stageKey} className="flex items-start justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : stage.status === 'in_progress' ? (
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                )}
                <div>
                  <p className={`text-sm font-medium ${stage.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{stage.stageLabel}</p>
                  {stage.completedAt && <p className="text-xs text-slate-400">Completed {new Date(stage.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                  {stage.statusNote && <p className="mt-1 text-xs text-slate-500">{stage.statusNote}</p>}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${statusBadge(stage.status)}`}>
                {stage.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
