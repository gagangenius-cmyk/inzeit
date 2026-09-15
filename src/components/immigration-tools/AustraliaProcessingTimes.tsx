'use client';

import { australiaProcessingTimes } from '@/lib/immigrationTools/australia';
import { ToolCard, ProcessingTimesTable } from './shared';

export default function AustraliaProcessingTimes() {
  return (
    <ToolCard
      title="Processing Times — Australia"
      description="Indicative ranges by visa subclass, for setting client expectations during a sales conversation."
    >
      <ProcessingTimesTable
        referencePoint={australiaProcessingTimes.referencePoint}
        groups={australiaProcessingTimes.groups}
        footnote={australiaProcessingTimes.footnote}
      />
    </ToolCard>
  );
}
