import { Lead, Opportunity, CaseOfficer } from './leadOpportunityConversion';

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'pending' | 'current' | 'completed' | 'rejected' | 'skipped';
  requiredDocuments: string[];
  optionalDocuments: string[];
  estimatedDuration: number; // in days
  dependencies: string[]; // other stages that must be completed first
  assigneeRole: 'counselor' | 'case_officer' | 'admin' | 'compliance';
  automated: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  serviceType: string;
  countryType: string;
  stages: WorkflowStage[];
  totalEstimatedDuration: number;
  active: boolean;
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  opportunityId: string;
  leadId: number;
  currentStage: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  startDate: Date;
  endDate?: Date;
  assignedTo: number;
  caseOfficer: number;
  progress: number;
  stages: WorkflowStage[];
  stageHistory: Array<{
    stageId: string;
    status: string;
    startDate: Date;
    endDate?: Date;
    assignedTo: number;
    notes?: string;
  }>;
  documents: Array<{
    stageId: string;
    documentName: string;
    documentUrl: string;
    status: 'pending' | 'uploaded' | 'verified' | 'rejected';
    uploadedBy: number;
    uploadedAt: Date;
  }>;
  notifications: Array<{
    id: string;
    type: 'reminder' | 'alert' | 'info' | 'deadline';
    message: string;
    recipientId: number;
    recipientRole: string;
    stageId: string;
    sentAt: Date;
    readAt?: Date;
  }>;
}

export class WorkflowManagement {
  private templates: WorkflowTemplate[] = [];
  private instances: WorkflowInstance[] = [];
  private leads: Lead[];
  private opportunities: Opportunity[];
  private caseOfficers: CaseOfficer[];

  constructor(leads: Lead[], opportunities: Opportunity[], caseOfficers: CaseOfficer[]) {
    this.leads = leads;
    this.opportunities = opportunities;
    this.caseOfficers = caseOfficers;
    this.initializeTemplates();
  }

  private initializeTemplates() {
    this.templates = [
      {
        id: 'student-visa-canada',
        name: 'Student Visa - Canada',
        description: 'Complete workflow for Canadian student visa applications',
        serviceType: 'Student',
        countryType: 'Canada',
        stages: [
          {
            id: 'initial-consultation',
            name: 'Initial Consultation',
            description: 'Counsel initial consultation with student',
            icon: 'users',
            status: 'pending',
            requiredDocuments: ['passport', 'academic_transcripts'],
            optionalDocuments: ['english_test_score'],
            estimatedDuration: 1,
            dependencies: [],
            assigneeRole: 'counselor',
            automated: false
          },
          {
            id: 'document-collection',
            name: 'Document Collection',
            description: 'Collect all required documents',
            icon: 'folder',
            status: 'pending',
            requiredDocuments: ['passport', 'academic_transcripts', 'english_test_score', 'statement_of_purpose'],
            optionalDocuments: ['letters_of_recommendation', 'financial_documents'],
            estimatedDuration: 3,
            dependencies: ['initial-consultation'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'application-submission',
            name: 'Application Submission',
            description: 'Submit application to immigration authorities',
            icon: 'send',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 1,
            dependencies: ['document-collection'],
            assigneeRole: 'case_officer',
            automated: true
          },
          {
            id: 'biometric-appointment',
            name: 'Biometric Appointment',
            description: 'Schedule and attend biometric appointment',
            icon: 'fingerprint',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 7,
            dependencies: ['application-submission'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'medical-examination',
            name: 'Medical Examination',
            description: 'Complete medical examination',
            icon: 'heart',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 5,
            dependencies: ['application-submission'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'visa-decision',
            name: 'Visa Decision',
            description: 'Wait for visa decision',
            icon: 'gavel',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 30,
            dependencies: ['biometric-appointment', 'medical-examination'],
            assigneeRole: 'case_officer',
            automated: true
          },
          {
            id: 'post-arrival',
            name: 'Post-Arrival Services',
            description: 'Post-arrival support and services',
            icon: 'home',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 7,
            dependencies: ['visa-decision'],
            assigneeRole: 'counselor',
            automated: false
          }
        ],
        totalEstimatedDuration: 54,
        active: true
      },
      {
        id: 'work-permit-canada',
        name: 'Work Permit - Canada',
        description: 'Complete workflow for Canadian work permit applications',
        serviceType: 'Work',
        countryType: 'Canada',
        stages: [
          {
            id: 'job-offer-validation',
            name: 'Job Offer Validation',
            description: 'Validate job offer and LMIA',
            icon: 'briefcase',
            status: 'pending',
            requiredDocuments: ['job_offer_letter', 'lmia_approval'],
            optionalDocuments: ['company_profile'],
            estimatedDuration: 2,
            dependencies: [],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'application-preparation',
            name: 'Application Preparation',
            description: 'Prepare work permit application',
            icon: 'file-text',
            status: 'pending',
            requiredDocuments: ['passport', 'job_offer_letter', 'lmia_approval'],
            optionalDocuments: ['educational_credentials', 'work_experience'],
            estimatedDuration: 3,
            dependencies: ['job-offer-validation'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'application-submission',
            name: 'Application Submission',
            description: 'Submit work permit application',
            icon: 'send',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 1,
            dependencies: ['application-preparation'],
            assigneeRole: 'case_officer',
            automated: true
          },
          {
            id: 'biometric-collection',
            name: 'Biometric Collection',
            description: 'Complete biometric collection',
            icon: 'fingerprint',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 5,
            dependencies: ['application-submission'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'permit-approval',
            name: 'Work Permit Approval',
            description: 'Wait for work permit approval',
            icon: 'check-circle',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 45,
            dependencies: ['biometric-collection'],
            assigneeRole: 'case_officer',
            automated: true
          }
        ],
        totalEstimatedDuration: 56,
        active: true
      },
      {
        id: 'visit-visa-uk',
        name: 'Visit Visa - UK',
        description: 'Complete workflow for UK visit visa applications',
        serviceType: 'Visit',
        countryType: 'UK',
        stages: [
          {
            id: 'eligibility-check',
            name: 'Eligibility Check',
            description: 'Check eligibility for UK visit visa',
            icon: 'check-square',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 1,
            dependencies: [],
            assigneeRole: 'counselor',
            automated: false
          },
          {
            id: 'document-preparation',
            name: 'Document Preparation',
            description: 'Prepare required documents',
            icon: 'folder',
            status: 'pending',
            requiredDocuments: ['passport', 'bank_statements', 'employment_letter'],
            optionalDocuments: ['accommodation_proof', 'itinerary'],
            estimatedDuration: 2,
            dependencies: ['eligibility-check'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'online-application',
            name: 'Online Application',
            description: 'Complete online visa application',
            icon: 'laptop',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 2,
            dependencies: ['document-preparation'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'appointment-scheduling',
            name: 'Appointment Scheduling',
            description: 'Schedule visa appointment',
            icon: 'calendar',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 7,
            dependencies: ['online-application'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'visa-interview',
            name: 'Visa Interview',
            description: 'Attend visa interview if required',
            icon: 'users',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 1,
            dependencies: ['appointment-scheduling'],
            assigneeRole: 'case_officer',
            automated: false
          },
          {
            id: 'visa-decision',
            name: 'Visa Decision',
            description: 'Wait for visa decision',
            icon: 'gavel',
            status: 'pending',
            requiredDocuments: [],
            optionalDocuments: [],
            estimatedDuration: 15,
            dependencies: ['visa-interview'],
            assigneeRole: 'case_officer',
            automated: true
          }
        ],
        totalEstimatedDuration: 28,
        active: true
      }
    ];
  }

  // Create workflow instance for opportunity
  createWorkflowInstance(opportunityId: string): WorkflowInstance {
    const opportunity = this.opportunities.find(o => o.id === opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const lead = this.leads.find(l => l.id === opportunity.leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Find appropriate template
    const template = this.findTemplate(lead.type, lead.country_interest);
    if (!template) {
      throw new Error('No workflow template found for this service type');
    }

    const instance: WorkflowInstance = {
      id: `WF_${Date.now()}_${opportunityId}`,
      templateId: template.id,
      opportunityId,
      leadId: lead.id,
      currentStage: template.stages[0].id,
      status: 'active',
      startDate: new Date(),
      assignedTo: opportunity.assignedTo,
      caseOfficer: opportunity.caseOfficer,
      progress: 0,
      stages: template.stages.map(stage => ({ ...stage, status: 'pending' })),
      stageHistory: [{
        stageId: template.stages[0].id,
        status: 'current',
        startDate: new Date(),
        assignedTo: opportunity.caseOfficer
      }],
      documents: [],
      notifications: []
    };

    this.instances.push(instance);
    return instance;
  }

  // Find appropriate template
  private findTemplate(serviceType: string, countryInterest: string): WorkflowTemplate | null {
    const countryType = this.getCountryType(countryInterest);
    
    return this.templates.find(template => 
      template.serviceType === serviceType && 
      template.countryType === countryType &&
      template.active
    ) || null;
  }

  // Get country type from country interest
  private getCountryType(countryInterest: string): string {
    const countryMap: { [key: string]: string } = {
      '1': 'Canada',
      '2': 'Canada', 
      '3': 'UK',
      '8': 'UK',
      '14': 'Australia',
      'default': 'Other'
    };
    
    return countryMap[countryInterest] || countryMap['default'];
  }

  // Update workflow stage
  updateWorkflowStage(instanceId: string, stageId: string, status: WorkflowStage['status'], notes?: string): void {
    const instance = this.instances.find(i => i.id === instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    const stage = instance.stages.find(s => s.id === stageId);
    if (!stage) {
      throw new Error('Stage not found');
    }

    // Update stage status
    stage.status = status;

    // Update stage history
    const historyEntry = {
      stageId,
      status,
      startDate: new Date(),
      assignedTo: instance.caseOfficer,
      notes
    };

    // Find existing history entry
    const existingEntry = instance.stageHistory.find(h => h.stageId === stageId);
    if (existingEntry) {
      existingEntry.status = status;
      existingEntry.endDate = new Date();
      existingEntry.notes = notes;
    } else {
      instance.stageHistory.push(historyEntry);
    }

    // Update current stage
    if (status === 'completed') {
      const nextStage = this.getNextStage(instance, stageId);
      if (nextStage) {
        instance.currentStage = nextStage.id;
        nextStage.status = 'current';
        instance.stageHistory.push({
          stageId: nextStage.id,
          status: 'current',
          startDate: new Date(),
          assignedTo: instance.caseOfficer
        });
      }
    }

    // Update progress
    this.updateProgress(instance);

    // Check if workflow is complete
    this.checkWorkflowCompletion(instance);
  }

  // Get next stage
  private getNextStage(instance: WorkflowInstance, currentStageId: string): WorkflowStage | null {
    const template = this.templates.find(t => t.id === instance.templateId);
    if (!template) return null;

    const currentIndex = template.stages.findIndex(s => s.id === currentStageId);
    if (currentIndex === -1 || currentIndex === template.stages.length - 1) {
      return null;
    }

    return template.stages[currentIndex + 1];
  }

  // Update progress
  private updateProgress(instance: WorkflowInstance): void {
    const completedStages = instance.stages.filter(s => s.status === 'completed').length;
    const totalStages = instance.stages.length;
    instance.progress = (completedStages / totalStages) * 100;
  }

  // Check workflow completion
  private checkWorkflowCompletion(instance: WorkflowInstance): void {
    const allStagesCompleted = instance.stages.every(s => s.status === 'completed' || s.status === 'skipped');
    if (allStagesCompleted) {
      instance.status = 'completed';
      instance.endDate = new Date();
    }
  }

  // Get workflow instance by opportunity
  getWorkflowByOpportunity(opportunityId: string): WorkflowInstance | null {
    return this.instances.find(i => i.opportunityId === opportunityId) || null;
  }

  // Get workflows for case officer
  getWorkflowsForCaseOfficer(caseOfficerId: number): WorkflowInstance[] {
    return this.instances.filter(i => i.caseOfficer === caseOfficerId);
  }

  // Get workflow statistics
  getWorkflowStats() {
    const totalInstances = this.instances.length;
    const activeInstances = this.instances.filter(i => i.status === 'active').length;
    const completedInstances = this.instances.filter(i => i.status === 'completed').length;
    const avgProgress = totalInstances > 0 
      ? this.instances.reduce((sum, i) => sum + i.progress, 0) / totalInstances 
      : 0;

    return {
      totalInstances,
      activeInstances,
      completedInstances,
      avgProgress,
      completionRate: totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0
    };
  }

  // Get overdue stages
  getOverdueStages() {
    const overdue = [];
    const now = new Date();

    for (const instance of this.instances) {
      if (instance.status !== 'active') continue;

      for (const stage of instance.stages) {
        if (stage.status !== 'current') continue;

        const historyEntry = instance.stageHistory.find(h => h.stageId === stage.id && h.status === 'current');
        if (!historyEntry) continue;

        const daysElapsed = Math.floor((now.getTime() - historyEntry.startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysElapsed > stage.estimatedDuration * 1.5) { // 50% buffer
          overdue.push({
            instanceId: instance.id,
            opportunityId: instance.opportunityId,
            stageId: stage.id,
            stageName: stage.name,
            overdueDays: daysElapsed - stage.estimatedDuration,
            caseOfficer: instance.caseOfficer
          });
        }
      }
    }

    return overdue;
  }

  // Generate notifications
  generateNotifications(instanceId: string): void {
    const instance = this.instances.find(i => i.id === instanceId);
    if (!instance) return;

    const currentStage = instance.stages.find(s => s.id === instance.currentStage);
    if (!currentStage) return;

    const notifications = [];

    // Deadline reminders
    const historyEntry = instance.stageHistory.find(h => h.stageId === currentStage.id && h.status === 'current');
    if (historyEntry) {
      const daysElapsed = Math.floor((new Date().getTime() - historyEntry.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysElapsed === currentStage.estimatedDuration - 3) {
        notifications.push({
          id: `notif_${Date.now()}_deadline`,
          type: 'reminder' as const,
          message: `Stage "${currentStage.name}" deadline approaching in 3 days`,
          recipientId: instance.caseOfficer,
          recipientRole: 'case_officer',
          stageId: currentStage.id,
          sentAt: new Date()
        });
      }

      if (daysElapsed === currentStage.estimatedDuration) {
        notifications.push({
          id: `notif_${Date.now()}_overdue`,
          type: 'alert' as const,
          message: `Stage "${currentStage.name}" is overdue`,
          recipientId: instance.caseOfficer,
          recipientRole: 'case_officer',
          stageId: currentStage.id,
          sentAt: new Date()
        });
      }
    }

    instance.notifications.push(...notifications);
  }
}
