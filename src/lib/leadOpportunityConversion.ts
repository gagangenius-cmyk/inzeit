export interface Lead {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  mobile: string;
  nationality: string;
  address: string;
  dob: Date;
  gender: string;
  country_interest: string;
  service_interest: string;
  market_source: string;
  status: string;
  priority: string;
  regdate: Date;
  assignTo: number;
  case_officer: number;
  Counsilor: number;
  branch: number;
  region: number;
  payTotal: number;
  paidYet: number;
  payBalance: number;
  feeAgreeDate: Date;
  demandAmt: number;
  lead_remark: string;
  created: Date;
  created_by: number;
  type: string;
  campaign: string;
  no_of_applicants: number;
}

export interface Opportunity {
  id: string;
  leadId: number;
  opportunityName: string;
  opportunityType: string;
  estimatedValue: number;
  priority: string;
  description: string;
  serviceRequired: string;
  status: 'prospect' | 'quotation' | 'payment' | 'documents' | 'agreement' | 'signed-agreement' | 'retained' | 'rentention' | 'closed';
  stage: string;
  assignedTo: number;
  caseOfficer: number;
  createdAt: Date;
  updatedAt: Date;
  conversionDate: Date;
  conversionBy: number;
  quotationData?: QuotationData;
  paymentData?: PaymentData;
  documentData?: DocumentData;
  agreementData?: AgreementData;
}

export interface QuotationData {
  quotationNumber: string;
  validUntil: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  terms: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

export interface PaymentData {
  paymentStructure: 'full' | 'installment' | 'milestone';
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  status: 'pending' | 'partial' | 'completed';
}

export interface DocumentData {
  documents: Array<{
    name: string;
    category: string;
    status: string;
    uploadDate: string;
    url: string;
  }>;
  allDocsVerified: boolean;
  missingDocs: string[];
}

export interface AgreementData {
  agreementType: string;
  agreementTitle: string;
  duration: string;
  startDate: string;
  endDate: string;
  amount: number;
  terms: string;
  specialConditions: string;
  status: 'draft' | 'generated' | 'sent' | 'signed';
  documentUrl: string;
}

export interface CaseOfficer {
  id: number;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  maxCases: number;
  currentCases: number;
  available: boolean;
  branch: number;
  region: number;
  performance: {
    conversionRate: number;
    avgProcessingTime: number;
    satisfactionScore: number;
  };
}

export class LeadOpportunityConversion {
  private leads: Lead[] = [];
  private opportunities: Opportunity[] = [];
  private caseOfficers: CaseOfficer[] = [];

  constructor(leads: Lead[], caseOfficers: CaseOfficer[]) {
    this.leads = leads;
    this.caseOfficers = caseOfficers;
  }

  // Convert Lead to Opportunity
  convertLeadToOpportunity(leadId: number, opportunityData: Partial<Opportunity>): Opportunity {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Check if opportunity already exists
    const existingOpportunity = this.opportunities.find(o => o.leadId === leadId);
    if (existingOpportunity) {
      throw new Error('Opportunity already exists for this lead');
    }

    // Assign case officer based on specialization and workload
    const caseOfficer = this.assignCaseOfficer(lead);

    const opportunity: Opportunity = {
      id: `OPP_${Date.now()}_${leadId}`,
      leadId: lead.id,
      opportunityName: opportunityData.opportunityName || `${lead.fname} ${lead.lname} - ${lead.service_interest}`,
      opportunityType: opportunityData.opportunityType || 'new_business',
      estimatedValue: opportunityData.estimatedValue || lead.demandAmt,
      priority: opportunityData.priority || lead.priority,
      description: opportunityData.description || `Converted from lead: ${lead.lead_remark}`,
      serviceRequired: lead.service_interest,
      status: 'prospect',
      stage: 'prospect',
      assignedTo: lead.assignTo,
      caseOfficer: caseOfficer.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      conversionDate: new Date(),
      conversionBy: lead.Counsilor,
      quotationData: opportunityData.quotationData,
      paymentData: opportunityData.paymentData,
      documentData: opportunityData.documentData,
      agreementData: opportunityData.agreementData
    };

    this.opportunities.push(opportunity);
    
    // Update lead status
    lead.status = 'converted';
    lead.case_officer = caseOfficer.id;

    return opportunity;
  }

  // Assign Case Officer based on specialization and workload
  private assignCaseOfficer(lead: Lead): CaseOfficer {
    const availableOfficers = this.caseOfficers.filter(officer => {
      if (!officer.available) return false;
      if (officer.currentCases >= officer.maxCases) return false;
      if (officer.branch !== lead.branch) return false;
      if (officer.region !== lead.region) return false;
      
      // Check specialization match
      return officer.specializations.includes(lead.service_interest) || 
             officer.specializations.includes('general');
    });

    if (availableOfficers.length === 0) {
      throw new Error('No available case officers for this lead');
    }

    // Sort by performance and workload
    availableOfficers.sort((a, b) => {
      const aScore = (a.performance.conversionRate * 0.4) + 
                    (a.performance.avgProcessingTime * 0.3) + 
                    (a.performance.satisfactionScore * 0.3) -
                    (a.currentCases / a.maxCases) * 10;
      const bScore = (b.performance.conversionRate * 0.4) + 
                    (b.performance.avgProcessingTime * 0.3) + 
                    (b.performance.satisfactionScore * 0.3) -
                    (b.currentCases / b.maxCases) * 10;
      return bScore - aScore;
    });

    const selectedOfficer = availableOfficers[0];
    selectedOfficer.currentCases++;
    
    return selectedOfficer;
  }

  // Update Opportunity Status
  updateOpportunityStatus(opportunityId: string, status: Opportunity['status'], stage: string): void {
    const opportunity = this.opportunities.find(o => o.id === opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    opportunity.status = status;
    opportunity.stage = stage;
    opportunity.updatedAt = new Date();

    // If status is 'retained', update case officer workload
    if (status === 'retained') {
      const caseOfficer = this.caseOfficers.find(co => co.id === opportunity.caseOfficer);
      if (caseOfficer) {
        caseOfficer.currentCases--;
      }
    }
  }

  // Get Operations Route for Opportunity
  getOperationsRoute(opportunityId: string): string {
    const opportunity = this.opportunities.find(o => o.id === opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const lead = this.leads.find(l => l.id === opportunity.leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const baseParams = `opportunityId=${opportunityId}&leadId=${lead.id}&clientName=${encodeURIComponent(`${lead.fname} ${lead.lname}`)}`;

    // Route based on service type and country
    if (lead.type === 'Visit') {
      return `/admin/leads/visit-visa-operations?${baseParams}`;
    }

    if (lead.type === 'Student') {
      return `/admin/leads/student-visa-operations?${baseParams}`;
    }

    // EIP Canada services
    const eipServices = [211, 213, 214, 215, 216, 218];
    if ((lead.type === 'Skill' || lead.type === 'Work') && eipServices.includes(Number(lead.service_interest))) {
      return `/admin/leads/eip-canada-operations?${baseParams}`;
    }

    // Job Search / RMS services
    const jobSearchServices = [321, 322, 332, 333, 331, 327, 326, 341, 338, 339, 352, 349, 343, 344, 354, 250, 248, 251, 252];
    if (jobSearchServices.includes(Number(lead.service_interest))) {
      return `/admin/leads/rms-operations?${baseParams}`;
    }

    // Poland Visa services
    const polandServices = [39, 280, 254, 278, 285, 298, 293, 288, 287, 286, 303, 315, 316, 317, 309, 294, 264, 279, 329];
    if (polandServices.includes(Number(lead.service_interest))) {
      return `/admin/leads/poland-visa-operations?${baseParams}`;
    }

    // Skill Australia
    if (lead.type === 'Skill' && (Number(lead.country_interest) === 1 || Number(lead.country_interest) === 14)) {
      return `/admin/leads/skill-australia-operations?${baseParams}`;
    }

    // Skill Canada
    if (lead.type === 'Skill' && Number(lead.country_interest) === 2) {
      return `/admin/leads/skill-canada-operations?${baseParams}`;
    }

    // Default to Visit Visa for Work permits to UK/Europe
    if (lead.type === 'Work' && (Number(lead.country_interest) === 3 || Number(lead.country_interest) === 8)) {
      return `/admin/leads/visit-visa-operations?${baseParams}`;
    }

    return `/admin/leads/visit-visa-operations?${baseParams}`;
  }

  // Get Opportunity by Lead ID
  getOpportunityByLeadId(leadId: number): Opportunity | null {
    return this.opportunities.find(o => o.leadId === leadId) || null;
  }

  // Get All Opportunities for Case Officer
  getOpportunitiesForCaseOfficer(caseOfficerId: number): Opportunity[] {
    return this.opportunities.filter(o => o.caseOfficer === caseOfficerId);
  }

  // Get Conversion Statistics
  getConversionStats() {
    const totalLeads = this.leads.length;
    const convertedLeads = this.leads.filter(l => l.status === 'converted').length;
    const totalOpportunities = this.opportunities.length;
    const retainedOpportunities = this.opportunities.filter(o => o.status === 'retained').length;
    
    return {
      totalLeads,
      convertedLeads,
      totalOpportunities,
      retainedOpportunities,
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      retentionRate: totalOpportunities > 0 ? (retainedOpportunities / totalOpportunities) * 100 : 0
    };
  }

  // Get Case Officer Performance
  getCaseOfficerPerformance(caseOfficerId: number) {
    const caseOfficer = this.caseOfficers.find(co => co.id === caseOfficerId);
    if (!caseOfficer) {
      throw new Error('Case officer not found');
    }

    const opportunities = this.getOpportunitiesForCaseOfficer(caseOfficerId);
    const retainedOpportunities = opportunities.filter(o => o.status === 'retained').length;
    
    return {
      caseOfficer,
      totalOpportunities: opportunities.length,
      retainedOpportunities,
      retentionRate: opportunities.length > 0 ? (retainedOpportunities / opportunities.length) * 100 : 0,
      utilizationRate: (caseOfficer.currentCases / caseOfficer.maxCases) * 100
    };
  }
}
