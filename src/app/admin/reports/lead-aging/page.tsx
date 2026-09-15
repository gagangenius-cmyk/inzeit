'use client';

import { useEffect, useState } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { Clock3 } from 'lucide-react';

type LeadRow = { id: number; fname?: string; lname?: string; created?: string; regdate?: string; status?: string; assigned_to_name?: string };

export default function LeadAgingReportPage() {
  const [buckets, setBuckets] = useState<Record<string, number>>({});
  const [oldLeads, setOldLeads] = useState<Array<LeadRow & { age: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Used to fetch up to 500 raw lead rows and compute age buckets +
        // the "20 oldest" list client-side from that same capped set - both
        // silently wrong (missing older leads past the first 500) once the
        // table grew. Real SQL aggregate + ORDER BY instead.
        const response = await fetch('/api/reports?type=aging');
        const json = await response.json();
        setBuckets(json.data?.buckets || {});
        setOldLeads(json.data?.oldLeads || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { sorted: sortedOldLeads, sortKey: oldLeadSortKey, sortDirection: oldLeadSortDirection, toggleSort: toggleOldLeadSort } = useSortableData(
    oldLeads,
    {
      lead: (lead) => `${lead.fname || ''} ${lead.lname || ''}`,
      status: (lead) => lead.status,
      assigned: (lead) => lead.assigned_to_name,
      age: (lead) => lead.age,
    },
  );

  if (loading) return <div className="p-6 text-gray-600">Loading lead aging...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Aging</h1>
        <p className="mt-1 text-gray-600">Aging buckets and oldest open leads from live CRM data.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {['0-7 days', '8-30 days', '31-60 days', '60+ days'].map((bucket) => (
          <div key={bucket} className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm text-gray-500">{bucket}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{buckets[bucket] || 0}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-white p-3 shadow">
        <SortButtonRow
          options={[
            ['lead', 'Lead'],
            ['status', 'Status'],
            ['assigned', 'Assigned'],
            ['age', 'Age'],
          ] as const}
          activeKey={oldLeadSortKey}
          direction={oldLeadSortDirection}
          onSort={toggleOldLeadSort}
        />
        <RecordList
          isEmpty={sortedOldLeads.length === 0}
          emptyIcon={Clock3}
          emptyTitle="No aging leads found"
        >
          {sortedOldLeads.map((lead) => (
            <RecordCard
              key={lead.id}
              avatar={<Clock3 className="h-4 w-4" />}
              avatarColorClass="from-blue-600 to-cyan-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{lead.fname} {lead.lname}</span>}
              titleBadges={<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{lead.status || 'N/A'}</span>}
              stats={[
                { label: 'Assigned', value: lead.assigned_to_name || 'Unassigned' },
                { label: 'Age', value: `${lead.age} days` },
              ]}
            />
          ))}
        </RecordList>
      </div>
    </div>
  );
}
