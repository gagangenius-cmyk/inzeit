'use client';

import { useEffect, useState } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { TrendingUp } from 'lucide-react';

type SourceRow = {
  source: string;
  count: number;
  convertedCount: number;
  conversionRate: number;
};

export default function LeadSourceAnalyticsPage() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [summary, setSummary] = useState({ totalLeads: 0, totalConverted: 0, overallConversionRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/lead-source-analytics?timeRange=6months');
        const data = await response.json();
        setSources(data.sources || []);
        setSummary(data.summary || { totalLeads: 0, totalConverted: 0, overallConversionRate: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { sorted: sortedSources, sortKey: sourceSortKey, sortDirection: sourceSortDirection, toggleSort: toggleSourceSort } = useSortableData(
    sources,
    {
      source: (s) => s.source,
      leads: (s) => s.count,
      converted: (s) => s.convertedCount,
      conversion: (s) => s.conversionRate,
    },
  );

  if (loading) return <div className="p-6 text-gray-600">Loading lead source analytics...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Source Analytics</h1>
        <p className="mt-1 text-gray-600">Source quality and conversion performance from live lead data.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Total leads" value={summary.totalLeads} />
        <Stat label="Converted" value={summary.totalConverted} />
        <Stat label="Conversion rate" value={`${Number(summary.overallConversionRate || 0).toFixed(1)}%`} />
      </div>
      <div className="rounded-lg bg-white p-3 shadow">
        <SortButtonRow
          options={[
            ['source', 'Source'],
            ['leads', 'Leads'],
            ['converted', 'Converted'],
            ['conversion', 'Conversion'],
          ] as const}
          activeKey={sourceSortKey}
          direction={sourceSortDirection}
          onSort={toggleSourceSort}
        />
        <RecordList
          isEmpty={sortedSources.length === 0}
          emptyIcon={TrendingUp}
          emptyTitle="No lead sources found"
          emptyDescription="Try changing filters or search terms."
        >
          {sortedSources.map((source) => (
            <RecordCard
              key={source.source}
              avatar={<TrendingUp className="h-4 w-4" />}
              avatarColorClass="from-blue-600 to-cyan-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{source.source}</span>}
              stats={[
                { label: 'Leads', value: source.count },
                { label: 'Converted', value: source.convertedCount },
                { label: 'Conversion', value: `${Number(source.conversionRate || 0).toFixed(1)}%` },
              ]}
            />
          ))}
        </RecordList>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
