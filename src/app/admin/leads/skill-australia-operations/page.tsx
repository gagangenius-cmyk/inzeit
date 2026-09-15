'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SkillAustraliaOperationsWizard from '../skill-australia-operations-wizard';

function SkillAustraliaOperationsContent() {
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get('opportunityId');
  const leadId = searchParams.get('leadId');
  const clientName = searchParams.get('clientName') || 'Client';

  if (!opportunityId || !leadId) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">Missing required parameters.</p>
          <button
            onClick={() => (window.location.href = '/admin/leads')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <SkillAustraliaOperationsWizard
      opportunityId={parseInt(opportunityId)}
      leadId={parseInt(leadId)}
      clientName={decodeURIComponent(clientName)}
    />
  );
}

export default function SkillAustraliaOperationsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div></div>}>
      <SkillAustraliaOperationsContent />
    </Suspense>
  );
}
