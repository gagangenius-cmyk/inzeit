'use client';

import LeadManagement from '@/components/leads/LeadManagement';

export default function LeadsManagement() {
  const handleLeadSelect = (lead: any) => {
    console.log('Selected lead:', lead);
    // Handle lead selection - could open a modal or navigate to lead details
  };

  const handleConvertToOpportunity = (leadId: number) => {
    console.log('Converting lead to opportunity:', leadId);
    // Open the opportunity conversion wizard
    window.open(`/admin/leads/opportunity-flow?leadId=${leadId}`, '_blank');
  };

  return (
    <div className="p-3 lg:p-4">
      <LeadManagement
        onLeadSelect={handleLeadSelect}
        onConvertToOpportunity={handleConvertToOpportunity}
      />
    </div>
  );
}
