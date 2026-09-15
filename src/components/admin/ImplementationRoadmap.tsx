'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import type { ImplementationRoadmapSprint } from '@/services/implementation-roadmap-service';

type RoadmapResponse = {
  sprints: ImplementationRoadmapSprint[];
  phases: Array<{
    phaseNumber: number;
    phase: string;
    weeks: string;
    sprints: ImplementationRoadmapSprint[];
  }>;
  summary: {
    totalSprints: number;
    implemented: number;
    validation: number;
    planned: number;
    totalWeeks: number;
  };
};

const fallbackRoadmap: RoadmapResponse = {
  sprints: [],
  phases: [],
  summary: { totalSprints: 0, implemented: 0, validation: 0, planned: 0, totalWeeks: 16 },
};

const badge = (status: string) => {
  const classes: Record<string, string> = {
    Implemented: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Validation: 'border-blue-200 bg-blue-50 text-blue-700',
    'In Progress': 'border-amber-200 bg-amber-50 text-amber-700',
    Planned: 'border-slate-200 bg-slate-50 text-slate-700',
    HR: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    PRO: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    Foundation: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Platform: 'border-violet-200 bg-violet-50 text-violet-700',
  };

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${classes[status] || classes.Planned}`}>
      {status}
    </span>
  );
};

export default function ImplementationRoadmap() {
  const [roadmap, setRoadmap] = useState<RoadmapResponse>(fallbackRoadmap);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        const response = await fetch('/api/admin/implementation-roadmap');
        if (response.ok) setRoadmap(await response.json());
      } catch (error) {
        console.error('Failed to load implementation roadmap:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, []);

  const completionPercent = roadmap.summary.totalSprints
    ? Math.round((roadmap.summary.implemented / roadmap.summary.totalSprints) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">HR & PRO Works Module</p>
          <h1 className="text-3xl font-bold text-slate-950">Implementation Roadmap</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Recommended phased delivery across foundation, HR core, HR advanced, PRO core, PRO advanced, and polish sprints.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {loading ? 'Loading roadmap...' : `${completionPercent}% implemented`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Metric label="Total sprints" value={roadmap.summary.totalSprints.toString()} icon={<ListChecks className="h-5 w-5" />} />
        <Metric label="Implemented" value={roadmap.summary.implemented.toString()} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Metric label="Validation" value={roadmap.summary.validation.toString()} icon={<Clock className="h-5 w-5" />} />
        <Metric label="Delivery weeks" value={roadmap.summary.totalWeeks.toString()} icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">Phase Timeline</h2>
          {badge(`${roadmap.summary.planned} Planned`)}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {roadmap.phases.map((phase) => (
            <div key={phase.phaseNumber} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Phase {phase.phaseNumber}</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950">{phase.phase}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">Weeks {phase.weeks}</span>
              </div>
              <div className="mt-4 space-y-3">
                {phase.sprints.map((sprint) => (
                  <div key={sprint.sprint} className="rounded-md bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-950">Sprint {sprint.sprint}</p>
                      {badge(sprint.status)}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{sprint.title}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Phase', 'Sprint', 'Deliverables', 'Weeks', 'Module', 'Status'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {roadmap.sprints.map((sprint) => (
              <tr key={sprint.sprint}>
                <td className="px-4 py-3 text-sm font-medium text-slate-950">Phase {sprint.phaseNumber} — {sprint.phase}</td>
                <td className="px-4 py-3 text-sm text-slate-700">Sprint {sprint.sprint}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{sprint.deliverables}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{sprint.weeks}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{badge(sprint.module)}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{badge(sprint.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-blue-700">{icon}</div>
      </div>
    </div>
  );
}
