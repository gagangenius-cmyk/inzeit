import { CounselorLogger } from './counselorLogger';

export interface Counselor {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  specialties: string[];
  maxLeads: number;
  currentLeads: number;
  availability: {
    autoAssignEnabled: boolean;
    workingHours: {
      start: string;
      end: string;
    };
    daysOff: string[];
  };
  performance: {
    conversionRate: number;
    responseTime: number;
    satisfactionScore: number;
  };
  lastAssigned: Date | null;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'website' | 'facebook' | 'instagram' | 'linkedin' | 'google' | 'referral' | 'other';
  program: string;
  country: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  timeline?: string;
  message?: string;
  receivedAt: Date;
  assignedTo?: string;
  status: 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'lost';
}

export interface AssignmentRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: {
    source?: string[];
    program?: string[];
    country?: string[];
    priority?: string[];
    budget?: {
      min?: number;
      max?: number;
    };
  };
  actions: {
    assignTo?: string[];
    assignToBranch?: string;
    roundRobin?: boolean;
    workloadBased?: boolean;
    performanceBased?: boolean;
  };
}

export class CounselorAssignmentSystem {
  private counselors: Counselor[] = [];
  private rules: AssignmentRule[] = [];
  private logger: CounselorLogger;

  constructor(counselors: Counselor[], rules: AssignmentRule[]) {
    this.counselors = counselors;
    this.rules = rules;
    this.logger = new CounselorLogger();
  }

  // Main assignment method
  assignLead(lead: Lead): Counselor | null {
    const startTime = Date.now();
    
    // Check if auto-assignment is enabled for any counselor
    const availableCounselors = this.getAvailableCounselors();
    
    if (availableCounselors.length === 0) {
      this.logger.logSystemEvent('Lead assignment failed - No available counselors', {
        leadId: lead.id,
        leadName: lead.name,
        leadEmail: lead.email,
        source: lead.source,
        priority: lead.priority
      }, 'warn');
      return null;
    }

    // Apply assignment rules
    const assignedCounselor = this.applyAssignmentRules(lead, availableCounselors);
    
    if (assignedCounselor) {
      const duration = Date.now() - startTime;
      
      // Update counselor workload
      this.updateCounselorWorkload(assignedCounselor.id);
      lead.assignedTo = assignedCounselor.id;
      lead.status = 'assigned';
      lead.receivedAt = new Date();
      
      // Log the assignment
      this.logger.logAssignment(
        parseInt(assignedCounselor.id),
        assignedCounselor.name,
        parseInt(lead.id),
        {
          fname: lead.name.split(' ')[0],
          lname: lead.name.split(' ').slice(1).join(' '),
          email: lead.email,
          phone: lead.phone,
          service_interest: lead.program,
          priority: lead.priority,
          market_source: lead.source
        },
        'success',
        duration,
        `Lead ${lead.name} assigned to ${assignedCounselor.name}`
      );
      
      // Log system event
      this.logger.logSystemEvent('Lead assigned successfully', {
        leadId: lead.id,
        counselorId: assignedCounselor.id,
        counselorName: assignedCounselor.name,
        assignmentDuration: duration
      }, 'info');
    }

    return assignedCounselor;
  }

  // Get counselors available for auto-assignment
  private getAvailableCounselors(): Counselor[] {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    return this.counselors.filter(counselor => {
      // Check if auto-assign is enabled
      if (!counselor.availability.autoAssignEnabled) {
        return false;
      }

      // Check if counselor is at max capacity
      if (counselor.currentLeads >= counselor.maxLeads) {
        return false;
      }

      // Check if today is a day off
      if (counselor.availability.daysOff.includes(currentDay.toLowerCase())) {
        return false;
      }

      // Check if within working hours
      const workingStart = counselor.availability.workingHours.start;
      const workingEnd = counselor.availability.workingHours.end;
      if (currentTime < workingStart || currentTime > workingEnd) {
        return false;
      }

      return true;
    });
  }

  // Apply assignment rules to determine best counselor
  private applyAssignmentRules(lead: Lead, availableCounselors: Counselor[]): Counselor | null {
    // Sort rules by priority (higher number = higher priority)
    const sortedRules = this.rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.ruleMatchesLead(rule, lead)) {
        const candidates = this.getCandidatesFromRule(rule, availableCounselors);
        if (candidates.length > 0) {
          return this.selectBestCandidate(candidates, rule);
        }
      }
    }

    // If no rules match, use default assignment logic
    return this.defaultAssignment(availableCounselors);
  }

  // Check if lead matches rule conditions
  private ruleMatchesLead(rule: AssignmentRule, lead: Lead): boolean {
    const conditions = rule.conditions;

    // Check source
    if (conditions.source && !conditions.source.includes(lead.source)) {
      return false;
    }

    // Check program
    if (conditions.program && !conditions.program.includes(lead.program)) {
      return false;
    }

    // Check country
    if (conditions.country && !conditions.country.includes(lead.country)) {
      return false;
    }

    // Check priority
    if (conditions.priority && !conditions.priority.includes(lead.priority)) {
      return false;
    }

    // Check budget range
    if (conditions.budget && lead.budget) {
      if (conditions.budget.min && lead.budget < conditions.budget.min) {
        return false;
      }
      if (conditions.budget.max && lead.budget > conditions.budget.max) {
        return false;
      }
    }

    return true;
  }

  // Get counselor candidates based on rule actions
  private getCandidatesFromRule(rule: AssignmentRule, availableCounselors: Counselor[]): Counselor[] {
    const actions = rule.actions;
    let candidates = availableCounselors;

    // Filter by specific counselors
    if (actions.assignTo && actions.assignTo.length > 0) {
      candidates = candidates.filter(c => actions.assignTo!.includes(c.id));
    }

    // Filter by branch
    if (actions.assignToBranch) {
      candidates = candidates.filter(c => c.branch === actions.assignToBranch);
    }

    return candidates;
  }

  // Select best candidate from available options
  private selectBestCandidate(candidates: Counselor[], rule: AssignmentRule): Counselor {
    const actions = rule.actions;

    if (actions.workloadBased) {
      return this.selectByWorkload(candidates);
    }

    if (actions.performanceBased) {
      return this.selectByPerformance(candidates);
    }

    if (actions.roundRobin) {
      return this.selectRoundRobin(candidates);
    }

    // Default to workload-based selection
    return this.selectByWorkload(candidates);
  }

  // Selection strategies
  private selectByWorkload(counselors: Counselor[]): Counselor {
    return counselors.reduce((best, current) => 
      current.currentLeads < best.currentLeads ? current : best
    );
  }

  private selectByPerformance(counselors: Counselor[]): Counselor {
    return counselors.reduce((best, current) => {
      const currentScore = (current.performance.conversionRate * 0.4) + 
                         (current.performance.responseTime * 0.3) + 
                         (current.performance.satisfactionScore * 0.3);
      const bestScore = (best.performance.conversionRate * 0.4) + 
                       (best.performance.responseTime * 0.3) + 
                       (best.performance.satisfactionScore * 0.3);
      return currentScore > bestScore ? current : best;
    });
  }

  private selectRoundRobin(counselors: Counselor[]): Counselor {
    const sortedByLastAssigned = counselors.sort((a, b) => {
      if (!a.lastAssigned) return -1;
      if (!b.lastAssigned) return 1;
      return a.lastAssigned.getTime() - b.lastAssigned.getTime();
    });
    return sortedByLastAssigned[0];
  }

  // Default assignment when no rules match
  private defaultAssignment(availableCounselors: Counselor[]): Counselor {
    // Use workload-based assignment as default
    return this.selectByWorkload(availableCounselors);
  }

  // Update counselor workload after assignment
  private updateCounselorWorkload(counselorId: string): void {
    const counselor = this.counselors.find(c => c.id === counselorId);
    if (counselor) {
      counselor.currentLeads++;
      counselor.lastAssigned = new Date();
    }
  }

  // Manual reassignment
  reassignLead(leadId: string, newCounselorId: string): boolean {
    const counselor = this.counselors.find(c => c.id === newCounselorId);
    if (!counselor || counselor.currentLeads >= counselor.maxLeads) {
      return false;
    }

    // Update workload (this would typically update the database)
    counselor.currentLeads++;
    counselor.lastAssigned = new Date();

    return true;
  }

  // Toggle counselor auto-assignment
  toggleAutoAssign(counselorId: string): void {
    const counselor = this.counselors.find(c => c.id === counselorId);
    if (counselor) {
      const previousState = counselor.availability.autoAssignEnabled;
      counselor.availability.autoAssignEnabled = !counselor.availability.autoAssignEnabled;
      
      // Log the toggle action
      this.logger.logSystemEvent(`Counselor auto-assignment ${counselor.availability.autoAssignEnabled ? 'enabled' : 'disabled'}`, {
        counselorId: parseInt(counselorId),
        counselorName: counselor.name,
        previousState,
        newState: counselor.availability.autoAssignEnabled
      }, 'info');
    }
  }

  // Get counselor statistics
  getCounselorStats(counselorId: string): any {
    const counselor = this.counselors.find(c => c.id === counselorId);
    if (!counselor) return null;

    return {
      name: counselor.name,
      currentLoad: counselor.currentLeads,
      maxCapacity: counselor.maxLeads,
      utilizationRate: (counselor.currentLeads / counselor.maxLeads) * 100,
      autoAssignEnabled: counselor.availability.autoAssignEnabled,
      performance: counselor.performance
    };
  }

  // Get system statistics
  getSystemStats(): any {
    const totalCounselors = this.counselors.length;
    const activeCounselors = this.counselors.filter(c => c.availability.autoAssignEnabled).length;
    const totalCapacity = this.counselors.reduce((sum, c) => sum + c.maxLeads, 0);
    const currentLoad = this.counselors.reduce((sum, c) => sum + c.currentLeads, 0);
    const utilizationRate = totalCapacity > 0 ? (currentLoad / totalCapacity) * 100 : 0;

    return {
      totalCounselors,
      activeCounselors,
      totalCapacity,
      currentLoad,
      utilizationRate,
      availableSlots: totalCapacity - currentLoad
    };
  }
}
