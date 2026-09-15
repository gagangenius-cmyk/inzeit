export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'assignment' | 'conversion' | 'workflow' | 'performance' | 'communication' | 'system' | 'security';
  userId: number;
  userRole: 'counselor' | 'case_officer' | 'admin' | 'system';
  action: string;
  details: Record<string, any>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  result?: 'success' | 'failure' | 'partial';
  errorMessage?: string;
}

interface CounselorActivity {
  counselorId: number;
  counselorName: string;
  action: string;
  timestamp: Date;
  details: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: 'lead' | 'opportunity' | 'workflow' | 'document' | 'case_officer' | 'client';
  outcome?: string;
  duration?: number;
  notes?: string;
}

interface PerformanceMetrics {
  counselorId: number;
  period: 'daily' | 'weekly' | 'monthly';
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  avgProcessingTime: number;
  satisfactionScore: number;
  workloadUtilization: number;
  completedTasks: number;
  failedTasks: number;
  totalRevenue: number;
}

export class CounselorLogger {
  private logs: LogEntry[] = [];
  private activities: CounselorActivity[] = [];
  private maxLogs: number = 10000;
  private enableConsole: boolean = true;
  private enableFile: boolean = true;
  private logFile: string = 'logs/counselor-activities.log';

  constructor() {
    this.initializeLogger();
  }

  private initializeLogger() {
    // Create logs directory if it doesn't exist
    if (typeof window === 'undefined') return;
    
    // In production, this would be handled by your logging service
    console.log('Counselor Logger initialized');
  }

  // Main logging method
  log(level: LogEntry['level'], category: LogEntry['category'], action: string, details: Record<string, any>, context?: {
    userId?: number;
    userRole?: LogEntry['userRole'];
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
  }): void {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      category,
      action,
      details,
      userId: context?.userId || 0,
      userRole: context?.userRole || 'system',
      sessionId: context?.sessionId,
      ipAddress: context?.ipAddress || 'unknown',
      userAgent: context?.userAgent || 'unknown',
      duration: context?.duration
    };

    this.logs.push(entry);
    
    // Trim logs if over limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console
    if (this.enableConsole) {
      this.outputToConsole(entry);
    }

    // Output to file (in production)
    if (this.enableFile) {
      this.outputToFile(entry);
    }
  }

  // Specific logging methods for different counselor activities
  logAssignment(counselorId: number, counselorName: string, leadId: number, leadInfo: any, outcome: string, duration?: number, notes?: string): void {
    const activity: CounselorActivity = {
      counselorId,
      counselorName,
      action: 'lead_assigned',
      timestamp: new Date(),
      details: {
        leadId,
        leadName: `${leadInfo.fname} ${leadInfo.lname}`,
        leadEmail: leadInfo.email,
        leadPhone: leadInfo.phone,
        serviceInterest: leadInfo.service_interest,
        priority: leadInfo.priority,
        source: leadInfo.market_source
      },
      relatedEntityId: leadId.toString(),
      relatedEntityType: 'lead',
      outcome,
      duration,
      notes
    };

    this.activities.push(activity);
    
    this.log('info', 'assignment', 'Lead assigned to counselor', {
      action: 'lead_assigned',
      counselorId,
      counselorName,
      leadId,
      leadInfo,
      outcome,
      duration,
      notes
    }, {
        userId: counselorId,
        userRole: 'counselor'
      });

    // Update counselor workload
    this.updateCounselorWorkload(counselorId, 1);
  }

  logConversion(counselorId: number, counselorName: string, leadId: number, opportunityData: any, outcome: string, duration?: number): void {
    const activity: CounselorActivity = {
      counselorId,
      counselorName,
      action: 'lead_converted',
      timestamp: new Date(),
      details: {
        leadId,
        opportunityName: opportunityData.opportunityName,
        opportunityType: opportunityData.opportunityType,
        estimatedValue: opportunityData.estimatedValue,
        serviceRequired: opportunityData.serviceRequired,
        priority: opportunityData.priority
      },
      relatedEntityId: opportunityData.id,
      relatedEntityType: 'opportunity',
      outcome,
      duration
    };

    this.activities.push(activity);
    
    this.log('info', 'conversion', 'Lead converted to opportunity', {
      action: 'lead_converted',
      counselorId,
      counselorName,
      leadId,
      opportunityData,
      outcome,
      duration
    }, {
        userId: counselorId,
        userRole: 'counselor'
      });

    // Update counselor performance metrics
    this.updateCounselorPerformance(counselorId, 'conversion', 1);
  }

  logWorkflowStage(counselorId: number, counselorName: string, workflowId: string, stageId: string, action: string, details: any, outcome: string, duration?: number): void {
    const activity: CounselorActivity = {
      counselorId,
      counselorName,
      action: `workflow_${action}`,
      timestamp: new Date(),
      details: {
        workflowId,
        stageId,
        action,
        ...details
      },
      relatedEntityId: workflowId,
      relatedEntityType: 'workflow',
      outcome,
      duration
    };

    this.activities.push(activity);
    
    this.log('info', 'workflow', `Workflow stage ${action}`, {
      action: `workflow_${action}`,
      counselorId,
      counselorName,
      workflowId,
      stageId,
      workflowAction: action,
      details,
      outcome,
      duration
    }, {
        userId: counselorId,
        userRole: 'case_officer'
    });
  }

  logCommunication(counselorId: number, counselorName: string, communicationType: 'email' | 'phone' | 'sms' | 'in_person', recipientId: number, recipientType: 'lead' | 'client' | 'case_officer', subject: string, content: string, outcome: string, duration?: number): void {
    const activity: CounselorActivity = {
      counselorId,
      counselorName,
      action: `communication_${communicationType}`,
      timestamp: new Date(),
      details: {
        communicationType,
        recipientId,
        recipientType,
        subject,
        content: content.substring(0, 100), // Truncate long content
        email: content.length > 100 ? '...' : ''
      },
      relatedEntityId: recipientId?.toString(),
      relatedEntityType: recipientType,
      outcome,
      duration
    };

    this.activities.push(activity);
    
    this.log('info', 'communication', `${communicationType} communication sent`, {
      action: `communication_${communicationType}`,
      counselorId,
      counselorName,
      communicationType,
      recipientId,
      recipientType,
      subject,
      content: content.substring(0, 100),
      outcome,
      duration
    }, {
        userId: counselorId,
        userRole: 'counselor'
      });
  }

  logPerformance(counselorId: number, metricType: string, value: number, details?: any): void {
    const activity: CounselorActivity = {
      counselorId,
      counselorName: `Counselor ${counselorId}`,
      action: `performance_${metricType}`,
      timestamp: new Date(),
      details: {
        metricType,
        value,
        ...details
      },
      outcome: 'success'
    };

    this.activities.push(activity);
    
    this.log('info', 'performance', `Performance metric updated: ${metricType}`, {
      action: `performance_${metricType}`,
      counselorId,
      counselorName: `Counselor ${counselorId}`,
      metricType,
      value,
      details
    }, {
        userId: counselorId,
        userRole: 'counselor'
      });
  }

  logSystemEvent(event: string, details: Record<string, any>, level: LogEntry['level'] = 'info'): void {
    this.log(level, 'system', event, {
      action: event,
      details
    });
  }

  // Private methods
  private generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private outputToConsole(entry: LogEntry): void {
    const logMethod = entry.level === 'error' || entry.level === 'critical' ? 'error' : 'log';
    const timestamp = entry.timestamp.toISOString();
    const message = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] [${entry.action}] [User:${entry.userId}] - ${entry.userRole}] ${JSON.stringify(entry.details)}`;
    
    console[logMethod](message);
  }

  private outputToFile(entry: LogEntry): void {
    // In production, this would write to a log file
    console.log('Would write to file:', entry);
  }

  private updateCounselorWorkload(counselorId: number, delta: number): void {
    // Update workload metrics
    this.log('debug', 'performance', 'Counselor workload updated', {
      action: 'workload_update',
      counselorId,
      delta
    }, {
        userId: counselorId,
        userRole: 'counselor'
      });
  }

  private updateCounselorPerformance(counselorId: number, metricType: string, value: number): void {
    // Update performance metrics
    this.log('debug', 'performance', 'Counselor performance updated', {
      action: 'performance_update',
      counselorId,
      metricType,
      value
    }, {
        userId: counselorId,
        userRole: 'counselor'
      });
  }

  // Query methods
  getLogs(filters?: {
    level?: LogEntry['level'][];
    category?: LogEntry['category'][];
    userId?: number;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    // Apply filters
    if (filters?.level && filters.level.length > 0) {
      filteredLogs = filteredLogs.filter(log => filters.level!.includes(log.level));
    }
    
    if (filters?.category && filters.category.length > 0) {
      filteredLogs = filteredLogs.filter(log => filters.category!.includes(log.category));
    }
    
    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    
    if (filters?.dateFrom) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.dateFrom!);
    }
    
    if (filters?.dateTo) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.dateTo!);
    }
    
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs;
  }

  getActivities(counselorId?: number, dateFrom?: Date, dateTo?: Date): CounselorActivity[] {
    let filteredActivities = [...this.activities];

    if (counselorId) {
      filteredActivities = filteredActivities.filter(activity => activity.counselorId === counselorId);
    }
    
    if (dateFrom) {
      filteredActivities = filteredActivities.filter(activity => activity.timestamp >= dateFrom);
    }
    
    if (dateTo) {
      filteredActivities = filteredActivities.filter(activity => activity.timestamp <= dateTo);
    }

    return filteredActivities;
  }

  getPerformanceMetrics(counselorId: number, period: 'daily' | 'weekly' | 'monthly'): PerformanceMetrics | null {
    const activities = this.getActivities(counselorId);
    
    // Calculate metrics based on activities
    const totalLeads = activities.filter(a => a.action === 'lead_assigned').length;
    const convertedLeads = activities.filter(a => a.action === 'lead_converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    const responseTimes = activities
      .filter(a => a.action === 'communication_phone' || a.action === 'communication_email')
      .map(a => a.duration || 0)
      .filter(time => time > 0);
    
    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
    
    const processingTimes = activities
      .filter(a => a.action.startsWith('workflow_'))
      .map(a => a.duration || 0)
      .filter(time => time > 0);
    
    const avgProcessingTime = processingTimes.length > 0 ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length : 0;

    return {
      counselorId,
      period,
      totalLeads,
      convertedLeads,
      conversionRate,
      avgResponseTime,
      avgProcessingTime,
      satisfactionScore: 0, // Would be calculated from client feedback
      workloadUtilization: 0, // Would be calculated from current/max cases
      completedTasks: activities.filter(a => a.outcome === 'success').length,
      failedTasks: activities.filter(a => a.outcome === 'failure').length,
      totalRevenue: 0 // Would be calculated from opportunity values
    };
  }

  getAuditTrail(entityId: string, entityType: 'lead' | 'opportunity' | 'workflow' | 'document'): LogEntry[] {
    return this.logs.filter(log => 
      log.details.relatedEntityId === entityId && 
      log.details.relatedEntityType === entityType
    );
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === 'error' || log.level === 'critical');
  }

  getRecentActivities(counselorId?: number, limit: number = 50): CounselorActivity[] {
    let activities = this.getActivities(counselorId);
    
    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return activities.slice(0, limit);
  }

  // Export methods
  exportLogs(format: 'json' | 'csv' | 'txt'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      case 'csv':
        return this.convertToCSV(this.logs);
      case 'txt':
        return this.convertToText(this.logs);
      default:
        return this.logs.map(log => 
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.category}] [${log.action}] User:${log.userId} - ${log.userRole}] ${JSON.stringify(log.details)}`
        ).join('\n');
    }
  }

  exportActivities(format: 'json' | 'csv' | 'txt'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.activities, null, 2);
      case 'csv':
        return this.convertActivitiesToCSV(this.activities);
      case 'txt':
        return this.convertActivitiesToText(this.activities);
      default:
        return this.activities.map(activity => 
          `[${activity.timestamp.toISOString()}] [${activity.counselorName}] [${activity.action}] [${activity.relatedEntityId || 'N/A'}] [${activity.relatedEntityType || 'N/A'}] [${activity.outcome || 'pending'}] [${activity.duration || 0}] ${activity.notes || ''}`
        ).join('\n');
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = ['timestamp', 'level', 'category', 'action', 'userId', 'userRole', 'sessionId', 'ipAddress', 'duration', 'result', 'errorMessage'];
    const csvContent = [
      headers.join(','),
      ...data.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        log.action,
        log.userId,
        log.userRole,
        log.sessionId || '',
        log.ipAddress || 'unknown',
        log.duration || '',
        log.result || '',
        log.errorMessage || ''
      ])
    ];
    
    return csvContent.join('\n');
  }

  private convertToText(data: any[]): string {
    return data.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.category}] [${log.action}] [User:${log.userId} - ${log.userRole}] ${JSON.stringify(log.details)}`
    ).join('\n');
  }

  private convertActivitiesToCSV(activities: CounselorActivity[]): string {
    if (activities.length === 0) return '';
    
    const headers = ['timestamp', 'counselorId', 'counselorName', 'action', 'relatedEntityId', 'relatedEntityType', 'outcome', 'duration', 'notes'];
    const csvContent = [
      headers.join(','),
      ...activities.map(activity => [
        activity.timestamp.toISOString(),
        activity.counselorId,
        activity.counselorName,
        activity.action,
        activity.relatedEntityId || '',
        activity.relatedEntityType || '',
        activity.outcome || '',
        activity.duration || '',
        activity.notes || ''
      ])
    ];
    
    return csvContent.join('\n');
  }

  private convertActivitiesToText(activities: CounselorActivity[]): string {
    return activities.map(activity => 
      `[${activity.timestamp.toISOString()}] [${activity.counselorName}] [${activity.action}] [${activity.relatedEntityId || 'N/A'}] [${activity.relatedEntityType || 'N/A'} [${activity.outcome || 'pending'}] [${activity.duration || 0}] ${activity.notes || ''}`
    ).join('\n');
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
    this.activities = [];
    this.log('info', 'system', 'Logs cleared', {}, {
      userId: 0,
      userRole: 'system'
    });
  }

  // Archive old logs
  archiveLogs(daysOld: number): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    const archivedCount = beforeCount - this.logs.length;
    
    this.log('info', 'system', `Archived ${archivedCount} old log entries`, {
      daysOld,
      archivedCount,
      beforeCount,
      afterCount: this.logs.length
    }, {
      userId: 0,
      userRole: 'system'
    });
  }
}
