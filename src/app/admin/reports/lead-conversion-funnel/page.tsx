'use client';

import { useEffect, useState } from 'react';

export default function LeadConversionFunnelPage() {
  const [stages, setStages] = useState<Array<{ label: string; count: number; rate: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Used to fetch up to 500 raw lead rows and reduce() these stage
        // counts client-side, silently computing an incomplete funnel (no
        // indication to the viewer) once total leads passed 500 - now a
        // real SQL aggregate, scoped and cached like every other report.
        const response = await fetch('/api/reports?type=funnel');
        const json = await response.json();
        setStages(json.data?.stages || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6 text-gray-600">Loading conversion funnel...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Conversion Funnel</h1>
        <p className="mt-1 text-gray-600">Live progression from leads to converted clients.</p>
      </div>
      <div className="space-y-4 rounded-lg bg-white p-6 shadow">
        {stages.map((stage) => (
          <div key={stage.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{stage.label}</span>
              <span className="text-gray-600">{stage.count} ({stage.rate.toFixed(1)}%)</span>
            </div>
            <div className="h-4 overflow-hidden rounded bg-gray-100">
              <div className="h-full bg-blue-600" style={{ width: `${Math.min(stage.rate, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
