'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';

interface ChecklistStage {
  stageKey: string;
  stageLabel: string;
  sequence: number;
  status: 'not_started' | 'in_progress' | 'completed';
  statusNote: string | null;
}

interface Overview {
  productLabel: string;
  caseManagerName: string | null;
  caseOpened: string | null;
  caseStatus: string | null;
  checklistProgress: { completed: number; total: number };
  documentsUploaded: number;
  agreementStatus: string | null;
  stages: ChecklistStage[];
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function ProductOverviewPage() {
  const { client } = useClientAuth();
  const params = useParams<{ opportunityId: string }>();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/clientportal/${params.opportunityId}/overview`)
      .then((res) => res.json())
      .then((json) => setOverview(json.overview || null))
      .finally(() => setIsLoading(false));
  }, [params.opportunityId]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }
  if (!overview) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">This case could not be loaded.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back{client ? `, ${client.name}` : ''} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">Here&apos;s a quick snapshot of where your case currently stands.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Active product</span>
            <span className="text-sm font-medium text-slate-900">{overview.productLabel}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Case manager</span>
            <span className="text-sm font-medium text-slate-900">{overview.caseManagerName || 'Not yet assigned'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Case opened</span>
            <span className="text-sm font-medium text-slate-900">{formatDate(overview.caseOpened)}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Case status</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{overview.caseStatus || 'In process'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Checklist progress</span>
            <span className="text-sm font-medium text-slate-900">{overview.checklistProgress.completed} of {overview.checklistProgress.total} steps</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Documents uploaded</span>
            <span className="text-sm font-medium text-slate-900">{overview.documentsUploaded}</span>
          </div>
        </div>
        <div className="sm:col-span-2 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-500">Agreement status</span>
          <span className="text-sm font-medium text-slate-900">
            {overview.agreementStatus ? overview.agreementStatus[0].toUpperCase() + overview.agreementStatus.slice(1) : 'Not yet available'}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Stage-by-stage status</h2>
        <p className="mt-1 text-xs text-slate-500">Where the case currently stands across every stage of the process.</p>
        <div className="mt-6 flex items-start overflow-x-auto pb-2">
          {overview.stages.map((stage, index) => (
            <div key={stage.stageKey} className="flex min-w-[120px] flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div className={`h-px flex-1 ${index === 0 ? 'invisible' : stage.status !== 'not_started' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
                ) : stage.status === 'in_progress' ? (
                  <div className="h-6 w-6 shrink-0 rounded-full border-2 border-amber-500 bg-amber-100" />
                ) : (
                  <Circle className="h-6 w-6 shrink-0 text-slate-300" />
                )}
                <div className={`h-px flex-1 ${index === overview.stages.length - 1 ? 'invisible' : stage.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-800">{stage.stageLabel}</p>
              <p className={`text-[10px] font-semibold uppercase ${stage.status === 'completed' ? 'text-emerald-600' : stage.status === 'in_progress' ? 'text-amber-600' : 'text-slate-400'}`}>
                {stage.status.replace('_', ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
