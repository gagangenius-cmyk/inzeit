'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import LeadOpportunityWizard from '../opportunity';

function OpportunityPageContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');

  const handleOpportunityCreated = (opportunityId: number) => {
    console.log('Opportunity created:', opportunityId);
    // You can add additional logic here, like redirecting or showing a success message
  };

  if (!leadId) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">No lead ID provided. Please access this page from the leads management page.</p>
        </div>
      </div>
    );
  }

  return (
    <LeadOpportunityWizard 
      leadId={parseInt(leadId)} 
      onOpportunityCreated={handleOpportunityCreated} 
    />
  );
}

export default function OpportunityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OpportunityPageContent />
    </Suspense>
  );
}
