'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import OpportunityFlowWizard from '../opportunity-flow-wizard';

function OpportunityFlowContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const opportunityId = searchParams.get('opportunityId');
  const initialStage = searchParams.get('stage') || undefined;

  if (!leadId) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">No lead ID provided.</p>
          <button
            onClick={() => window.location.href = '/admin/leads'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <OpportunityFlowWizard
      leadId={parseInt(leadId)}
      initialStage={initialStage}
      initialOpportunityId={opportunityId ? Number(opportunityId) : undefined}
    />
  );
}

export default function OpportunityFlowPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    }>
      <OpportunityFlowContent />
    </Suspense>
  );
}
