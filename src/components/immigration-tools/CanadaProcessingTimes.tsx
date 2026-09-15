'use client';

import { canadaProcessingTimes } from '@/lib/immigrationTools/canada';
import { ToolCard, ProcessingTimesTable } from './shared';

export default function CanadaProcessingTimes() {
  return (
    <ToolCard
      title="Processing Times — Canada"
      description="Indicative ranges by program, for setting client expectations during a sales conversation."
    >
      <ProcessingTimesTable
        referencePoint={canadaProcessingTimes.referencePoint}
        groups={canadaProcessingTimes.groups}
        footnote={canadaProcessingTimes.footnote}
      />
    </ToolCard>
  );
}
