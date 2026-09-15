export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'transactional' | 'notification' | 'newsletter' | 'custom';
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: EmailVariable[];
  status: 'active' | 'inactive' | 'draft';
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
    version: number;
    usageCount: number;
    lastUsed?: Date;
  };
  settings: {
    trackOpens: boolean;
    trackClicks: boolean;
    unsubscribeLink: boolean;
    priority: 'low' | 'normal' | 'high';
    senderName?: string;
    senderEmail?: string;
    replyTo?: string;
  };
  tags: string[];
  thumbnail?: string;
}

export interface EmailVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email';
  description: string;
  required: boolean;
  defaultValue?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    options?: string[];
  };
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  templateName: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  recipients: EmailRecipient[];
  scheduledFor?: Date;
  sentAt?: Date;
  completedAt?: Date;
  settings: {
    batchSize: number;
    delayBetweenBatches: number; // in minutes
    retryAttempts: number;
    retryDelay: number; // in minutes
    timezone: string;
  };
  performance: {
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    bouncedCount: number;
    unsubscribedCount: number;
    failedCount: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt?: Date;
  };
  customFields?: Record<string, any>;
}

export interface EmailRecipient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  position?: string;
  phone?: string;
  country?: string;
  language?: string;
  timezone?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'unsubscribed' | 'bounced';
  metadata: {
    source: string;
    addedAt: Date;
    lastEmail?: Date;
    totalEmails: number;
    openedCount: number;
    clickedCount: number;
    bouncedCount: number;
  };
  customFields?: Record<string, any>;
}

export interface EmailSendResult {
  id: string;
  campaignId: string;
  templateId: string;
  recipientId: string;
  recipientEmail: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  errorMessage?: string;
  trackingId: string;
  customData?: Record<string, any>;
}

export interface EmailAnalytics {
  campaignId: string;
  templateId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
    totalFailed: number;
    openRate: number;
    clickRate: number;
    deliveryRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    averageOpenTime?: number; // in minutes
    averageClickTime?: number; // in minutes
  };
  breakdown: {
    byDate: Array<{
      date: string;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
    }>;
    byHour: Array<{
      hour: number;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
    }>;
    byCountry: Array<{
      country: string;
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
    }>;
    byDevice: Array<{
      device: string;
      opened: number;
      clicked: number;
    }>;
  };
}

export class EmailTemplateSystem {
  private templates: EmailTemplate[];
  private campaigns: EmailCampaign[];
  private recipients: EmailRecipient[];
  private sendResults: EmailSendResult[];

  constructor() {
    this.templates = [];
    this.campaigns = [];
    this.recipients = [];
    this.sendResults = [];
    this.initializeDefaultTemplates();
    this.initializeMockData();
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'template-001',
        name: 'Welcome Email',
        description: 'Welcome email for new users',
        category: 'transactional',
        subject: 'Welcome to {{companyName}}!',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{companyName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 200px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{companyLogo}}" alt="{{companyName}}" class="logo">
        </div>
        <div class="content">
            <h1>Welcome {{firstName}}!</h1>
            <p>Thank you for joining {{companyName}}. We're excited to have you on board!</p>
            <p>Your account has been successfully created with the email {{email}}.</p>
            <p>To get started, please click the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{activationLink}}" class="button">Activate Your Account</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>{{activationLink}}</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
            <p>{{companyAddress}}</p>
        </div>
    </div>
</body>
</html>
        `,
        textContent: `
Welcome {{firstName}}!

Thank you for joining {{companyName}}. We're excited to have you on board!

Your account has been successfully created with the email {{email}}.

To get started, please visit: {{activationLink}}

Best regards,
The {{companyName}} Team
        `,
        variables: [
          { name: 'firstName', type: 'text', description: 'Recipient first name', required: true },
          { name: 'email', type: 'email', description: 'Recipient email', required: true },
          { name: 'companyName', type: 'text', description: 'Company name', required: true },
          { name: 'companyLogo', type: 'url', description: 'Company logo URL', required: false },
          { name: 'activationLink', type: 'url', description: 'Account activation link', required: true },
          { name: 'currentYear', type: 'number', description: 'Current year', required: false },
          { name: 'companyAddress', type: 'text', description: 'Company address', required: false }
        ],
        status: 'active',
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          version: 1,
          usageCount: 0
        },
        settings: {
          trackOpens: true,
          trackClicks: true,
          unsubscribeLink: true,
          priority: 'normal'
        },
        tags: ['welcome', 'onboarding', 'transactional']
      },
      {
        id: 'template-002',
        name: 'Marketing Newsletter',
        description: 'Monthly marketing newsletter',
        category: 'marketing',
        subject: '{{companyName}} Newsletter - {{month}} {{year}}',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{companyName}} Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #007bff; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .article { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .article:last-child { border-bottom: none; margin-bottom: 0; }
        .article h3 { color: #007bff; margin-bottom: 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{companyName}} Newsletter</h1>
            <p>{{month}} {{year}} Edition</p>
        </div>
        <div class="content">
            {{#each articles}}
            <div class="article">
                <h3>{{title}}</h3>
                <p>{{summary}}</p>
                <a href="{{link}}" class="button">Read More</a>
            </div>
            {{/each}}
        </div>
        <div class="footer">
            <p>You're receiving this email because you subscribed to {{companyName}} newsletter.</p>
            <p><a href="{{unsubscribeLink}}">Unsubscribe</a> | <a href="{{preferencesLink}}">Update Preferences</a></p>
            <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `,
        variables: [
          { name: 'companyName', type: 'text', description: 'Company name', required: true },
          { name: 'month', type: 'text', description: 'Month name', required: true },
          { name: 'year', type: 'number', description: 'Year', required: true },
          { name: 'articles', type: 'text', description: 'Newsletter articles array', required: true },
          { name: 'unsubscribeLink', type: 'url', description: 'Unsubscribe link', required: true },
          { name: 'preferencesLink', type: 'url', description: 'Preferences link', required: true },
          { name: 'currentYear', type: 'number', description: 'Current year', required: false }
        ],
        status: 'active',
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          version: 1,
          usageCount: 0
        },
        settings: {
          trackOpens: true,
          trackClicks: true,
          unsubscribeLink: true,
          priority: 'low'
        },
        tags: ['newsletter', 'marketing', 'monthly']
      },
      {
        id: 'template-003',
        name: 'Password Reset',
        description: 'Password reset email',
        category: 'transactional',
        subject: 'Reset your {{companyName}} password',
        htmlContent: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="alert">
            <strong>Security Alert:</strong> A password reset was requested for your account.
        </div>
        <div class="content">
            <h1>Reset Your Password</h1>
            <p>Hello {{firstName}},</p>
            <p>We received a request to reset the password for your {{companyName}} account associated with this email address.</p>
            <p>If you made this request, please click the button below to reset your password:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" class="button">Reset Password</a>
            </p>
            <p><strong>Important:</strong></p>
            <ul>
                <li>This link will expire in {{expiryHours}} hours.</li>
                <li>If you didn't request this reset, please ignore this email.</li>
                <li>Never share this link with anyone.</li>
            </ul>
        </div>
        <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste this link into your browser:</p>
            <p>{{resetLink}}</p>
            <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `,
        variables: [
          { name: 'firstName', type: 'text', description: 'Recipient first name', required: true },
          { name: 'companyName', type: 'text', description: 'Company name', required: true },
          { name: 'resetLink', type: 'url', description: 'Password reset link', required: true },
          { name: 'expiryHours', type: 'number', description: 'Link expiry in hours', required: true },
          { name: 'currentYear', type: 'number', description: 'Current year', required: false }
        ],
        status: 'active',
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          version: 1,
          usageCount: 0
        },
        settings: {
          trackOpens: true,
          trackClicks: true,
          unsubscribeLink: false,
          priority: 'high'
        },
        tags: ['security', 'password', 'transactional']
      }
    ];
  }

  private initializeMockData(): void {
    this.recipients = [];
  }

  // Template Management
  public createTemplate(template: Omit<EmailTemplate, 'id' | 'metadata'>): EmailTemplate {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        version: 1,
        usageCount: 0
      }
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  public updateTemplate(id: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) {
      return null;
    }

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      metadata: {
        ...this.templates[index].metadata,
        updatedBy: 'system',
        updatedAt: new Date(),
        version: this.templates[index].metadata.version + 1
      }
    };

    return this.templates[index];
  }

  public deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }

    // Check if template is being used in campaigns
    const inUse = this.campaigns.some(c => c.templateId === id);
    if (inUse) {
      throw new Error('Cannot delete template that is in use by active campaigns');
    }

    this.templates.splice(index, 1);
    return true;
  }

  public getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  public getTemplates(filters?: {
    category?: string;
    status?: string;
    search?: string;
    tags?: string[];
  }): EmailTemplate[] {
    let filteredTemplates = this.templates;

    if (filters) {
      if (filters.category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
      }

      if (filters.status) {
        filteredTemplates = filteredTemplates.filter(t => t.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.subject.toLowerCase().includes(searchLower)
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredTemplates = filteredTemplates.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }
    }

    return filteredTemplates;
  }

  public duplicateTemplate(id: string, newName?: string): EmailTemplate | null {
    const originalTemplate = this.getTemplate(id);
    if (!originalTemplate) {
      return null;
    }

    const duplicatedTemplate: EmailTemplate = {
      ...originalTemplate,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName || `${originalTemplate.name} (Copy)`,
      metadata: {
        createdBy: 'system',
        createdAt: new Date(),
        version: 1,
        usageCount: 0
      }
    };

    this.templates.push(duplicatedTemplate);
    return duplicatedTemplate;
  }

  // Campaign Management
  public createCampaign(campaign: Omit<EmailCampaign, 'id' | 'metadata' | 'performance'>): EmailCampaign {
    const newCampaign: EmailCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'draft',
      performance: {
        totalRecipients: campaign.recipients.length,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        unsubscribedCount: 0,
        failedCount: 0,
        openRate: 0,
        clickRate: 0,
        deliveryRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0
      },
      metadata: {
        createdBy: 'system',
        createdAt: new Date()
      }
    };

    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  public async sendCampaign(campaignId: string): Promise<EmailCampaign> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const template = this.getTemplate(campaign.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Update campaign status
    campaign.status = 'sending';
    campaign.sentAt = new Date();
    campaign.metadata.updatedAt = new Date();

    // Process recipients in batches
    const batchSize = campaign.settings.batchSize;
    const delay = campaign.settings.delayBetweenBatches * 60 * 1000; // Convert to milliseconds

    for (let i = 0; i < campaign.recipients.length; i += batchSize) {
      const batch = campaign.recipients.slice(i, i + batchSize);
      
      // Process each recipient in the batch
      for (const recipient of batch) {
        await this.sendEmailToRecipient(campaign, template, recipient);
      }

      // Add delay between batches (except for the last batch)
      if (i + batchSize < campaign.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Update campaign status
    campaign.status = 'sent';
    campaign.completedAt = new Date();
    campaign.metadata.updatedAt = new Date();

    // Update template usage count
    template.metadata.usageCount++;
    template.metadata.lastUsed = new Date();

    return campaign;
  }

  private async sendEmailToRecipient(
    campaign: EmailCampaign,
    template: EmailTemplate,
    recipient: EmailRecipient
  ): Promise<EmailSendResult> {
    const trackingId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Process template variables
    const processedSubject = this.processTemplateVariables(template.subject, recipient, campaign);
    const processedHtml = this.processTemplateVariables(template.htmlContent, recipient, campaign);
    const processedText = template.textContent ? 
      this.processTemplateVariables(template.textContent, recipient, campaign) : undefined;

    const sendResult: EmailSendResult = {
      id: `send-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      campaignId: campaign.id,
      templateId: template.id,
      recipientId: recipient.id,
      recipientEmail: recipient.email,
      status: 'sent',
      sentAt: new Date(),
      trackingId,
      customData: {
        templateName: template.name,
        campaignName: campaign.name
      }
    };

    // In a real implementation, this would integrate with an email service like SendGrid, AWS SES, etc.
    console.log(`Sending email to ${recipient.email}:`, {
      subject: processedSubject,
      trackingId,
      templateId: template.id,
      campaignId: campaign.id
    });

    this.sendResults.push(sendResult);

    // Update recipient metadata
    recipient.metadata.totalEmails++;
    recipient.metadata.lastEmail = new Date();

    // Update campaign performance
    campaign.performance.sentCount++;

    return sendResult;
  }

  private processTemplateVariables(
    content: string,
    recipient: EmailRecipient,
    campaign?: EmailCampaign
  ): string {
    let processedContent = content;

    // Process standard variables
    const variables = {
      firstName: recipient.firstName || '',
      lastName: recipient.lastName || '',
      fullName: recipient.fullName || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim(),
      email: recipient.email,
      company: recipient.company || '',
      position: recipient.position || '',
      phone: recipient.phone || '',
      country: recipient.country || '',
      language: recipient.language || 'en',
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      unsubscribeLink: `${process.env.APP_URL || ''}/unsubscribe?email=${recipient.email}`,
      preferencesLink: `${process.env.APP_URL || ''}/preferences?email=${recipient.email}`,
      // Campaign-specific variables
      campaignName: campaign?.name || '',
      campaignDescription: campaign?.description || ''
    };

    // Replace {{variable}} patterns
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, String(variables[key as keyof typeof variables]));
    });

    return processedContent;
  }

  // Recipient Management
  public addRecipient(recipient: Omit<EmailRecipient, 'id' | 'metadata'>): EmailRecipient {
    const newRecipient: EmailRecipient = {
      ...recipient,
      id: `recipient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        source: 'manual',
        addedAt: new Date(),
        totalEmails: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0
      }
    };

    this.recipients.push(newRecipient);
    return newRecipient;
  }

  public updateRecipient(id: string, updates: Partial<EmailRecipient>): EmailRecipient | null {
    const index = this.recipients.findIndex(r => r.id === id);
    if (index === -1) {
      return null;
    }

    this.recipients[index] = { ...this.recipients[index], ...updates };
    return this.recipients[index];
  }

  public deleteRecipient(id: string): boolean {
    const index = this.recipients.findIndex(r => r.id === id);
    if (index === -1) {
      return false;
    }

    this.recipients.splice(index, 1);
    return true;
  }

  public getRecipients(filters?: {
    status?: string;
    search?: string;
    tags?: string[];
    source?: string;
  }): EmailRecipient[] {
    let filteredRecipients = this.recipients;

    if (filters) {
      if (filters.status) {
        filteredRecipients = filteredRecipients.filter(r => r.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredRecipients = filteredRecipients.filter(r => 
          r.email.toLowerCase().includes(searchLower) ||
          (r.fullName && r.fullName.toLowerCase().includes(searchLower)) ||
          (r.company && r.company.toLowerCase().includes(searchLower))
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredRecipients = filteredRecipients.filter(r => 
          filters.tags!.some(tag => r.tags.includes(tag))
        );
      }

      if (filters.source) {
        filteredRecipients = filteredRecipients.filter(r => r.metadata.source === filters.source);
      }
    }

    return filteredRecipients;
  }

  // Analytics
  public getCampaignAnalytics(campaignId: string, dateRange?: { start: Date; end: Date }): EmailAnalytics {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const campaignResults = this.sendResults.filter(r => r.campaignId === campaignId);
    
    const analytics: EmailAnalytics = {
      campaignId,
      templateId: campaign.templateId,
      dateRange: dateRange || {
        start: campaign.sentAt || new Date(),
        end: new Date()
      },
      metrics: {
        totalSent: campaign.performance.sentCount,
        totalDelivered: campaign.performance.deliveredCount,
        totalOpened: campaign.performance.openedCount,
        totalClicked: campaign.performance.clickedCount,
        totalBounced: campaign.performance.bouncedCount,
        totalUnsubscribed: campaign.performance.unsubscribedCount,
        totalFailed: campaign.performance.failedCount,
        openRate: campaign.performance.openRate,
        clickRate: campaign.performance.clickRate,
        deliveryRate: campaign.performance.deliveryRate,
        bounceRate: campaign.performance.bounceRate,
        unsubscribeRate: campaign.performance.unsubscribeRate
      },
      breakdown: {
        byDate: this.groupResultsByDate(campaignResults),
        byHour: this.groupResultsByHour(campaignResults),
        byCountry: this.groupResultsByCountry(campaignResults),
        byDevice: this.groupResultsByDevice(campaignResults)
      }
    };

    return analytics;
  }

  private groupResultsByDate(results: EmailSendResult[]): Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }> {
    const grouped = results.reduce((acc, result) => {
      const date = result.sentAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { date, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
      }
      
      acc[date].sent++;
      if (result.status === 'delivered') acc[date].delivered++;
      if (result.status === 'opened') acc[date].opened++;
      if (result.status === 'clicked') acc[date].clicked++;
      if (result.status === 'bounced') acc[date].bounced++;
      if (result.status === 'unsubscribed') acc[date].unsubscribed++;
      
      return acc;
    }, {} as any);

    return Object.values(grouped);
  }

  private groupResultsByHour(results: EmailSendResult[]): Array<{
    hour: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }> {
    const grouped = results.reduce((acc, result) => {
      const hour = result.sentAt.getHours();
      
      if (!acc[hour]) {
        acc[hour] = { hour, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
      }
      
      acc[hour].sent++;
      if (result.status === 'delivered') acc[hour].delivered++;
      if (result.status === 'opened') acc[hour].opened++;
      if (result.status === 'clicked') acc[hour].clicked++;
      if (result.status === 'bounced') acc[hour].bounced++;
      if (result.status === 'unsubscribed') acc[hour].unsubscribed++;
      
      return acc;
    }, {} as any);

    return Object.values(grouped);
  }

  private groupResultsByCountry(results: EmailSendResult[]): Array<{
    country: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }> {
    // This would require additional data about recipient countries
    // For now, return empty array
    return [];
  }

  private groupResultsByDevice(results: EmailSendResult[]): Array<{
    device: string;
    opened: number;
    clicked: number;
  }> {
    // This would require additional tracking data
    // For now, return empty array
    return [];
  }

  // Getters
  public getCampaigns(filters?: {
    status?: string;
    templateId?: string;
    search?: string;
  }): EmailCampaign[] {
    let filteredCampaigns = this.campaigns;

    if (filters) {
      if (filters.status) {
        filteredCampaigns = filteredCampaigns.filter(c => c.status === filters.status);
      }

      if (filters.templateId) {
        filteredCampaigns = filteredCampaigns.filter(c => c.templateId === filters.templateId);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCampaigns = filteredCampaigns.filter(c => 
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
        );
      }
    }

    return filteredCampaigns;
  }

  public getSendResults(filters?: {
    campaignId?: string;
    templateId?: string;
    status?: string;
    dateRange?: { start: Date; end: Date };
  }): EmailSendResult[] {
    let filteredResults = this.sendResults;

    if (filters) {
      if (filters.campaignId) {
        filteredResults = filteredResults.filter(r => r.campaignId === filters.campaignId);
      }

      if (filters.templateId) {
        filteredResults = filteredResults.filter(r => r.templateId === filters.templateId);
      }

      if (filters.status) {
        filteredResults = filteredResults.filter(r => r.status === filters.status);
      }

      if (filters.dateRange) {
        filteredResults = filteredResults.filter(r => 
          r.sentAt >= filters.dateRange!.start && r.sentAt <= filters.dateRange!.end
        );
      }
    }

    return filteredResults;
  }

  public getSystemStatistics(): {
    totalTemplates: number;
    activeTemplates: number;
    totalCampaigns: number;
    totalRecipients: number;
    activeRecipients: number;
    totalEmailsSent: number;
    averageOpenRate: number;
    averageClickRate: number;
    templatesByCategory: Record<string, number>;
    campaignsByStatus: Record<string, number>;
  } {
    const totalTemplates = this.templates.length;
    const activeTemplates = this.templates.filter(t => t.status === 'active').length;
    const totalCampaigns = this.campaigns.length;
    const totalRecipients = this.recipients.length;
    const activeRecipients = this.recipients.filter(r => r.status === 'active').length;
    const totalEmailsSent = this.sendResults.length;

    const completedCampaigns = this.campaigns.filter(c => c.status === 'sent');
    const totalOpens = completedCampaigns.reduce((sum, c) => sum + c.performance.openedCount, 0);
    const totalClicks = completedCampaigns.reduce((sum, c) => sum + c.performance.clickedCount, 0);
    const totalDelivered = completedCampaigns.reduce((sum, c) => sum + c.performance.deliveredCount, 0);

    const averageOpenRate = totalDelivered > 0 ? (totalOpens / totalDelivered) * 100 : 0;
    const averageClickRate = totalDelivered > 0 ? (totalClicks / totalDelivered) * 100 : 0;

    const templatesByCategory = this.templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const campaignsByStatus = this.campaigns.reduce((acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTemplates,
      activeTemplates,
      totalCampaigns,
      totalRecipients,
      activeRecipients,
      totalEmailsSent,
      averageOpenRate,
      averageClickRate,
      templatesByCategory,
      campaignsByStatus
    };
  }
}
