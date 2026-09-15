import { CrmcNotifications } from '@/models';

type NotificationChannel = 'in_app' | 'email' | 'sms';
type ModuleNotificationInput = {
  userIds: number[];
  title: string;
  message: string;
  type: 'renewal_alert' | 'payroll_completion' | 'leave_approval' | 'automation_alert';
  priority?: 'low' | 'medium' | 'normal' | 'high' | 'urgent';
  channels?: NotificationChannel[];
};

type DeliveryResult = {
  channel: NotificationChannel;
  status: 'sent' | 'queued' | 'skipped';
  reason?: string;
};

export class ModuleNotificationService {
  static async send(input: ModuleNotificationInput) {
    const channels = input.channels || ['in_app'];
    const notifications = channels.includes('in_app')
      ? await Promise.all(input.userIds.map((userId) => CrmcNotifications.create({
          user_id: userId,
          type: input.type,
          title: input.title,
          message: input.message,
          priority: input.priority || 'normal',
        })))
      : [];

    const deliveries = await Promise.all(channels.map((channel) => this.dispatchChannel(channel, input)));

    return {
      notifications,
      deliveries,
    };
  }

  static sendRenewalAlert(input: Omit<ModuleNotificationInput, 'type'>) {
    return this.send({ ...input, type: 'renewal_alert', priority: input.priority || 'high' });
  }

  static sendPayrollCompletion(input: Omit<ModuleNotificationInput, 'type'>) {
    return this.send({ ...input, type: 'payroll_completion', priority: input.priority || 'normal' });
  }

  static sendLeaveApproval(input: Omit<ModuleNotificationInput, 'type'>) {
    return this.send({ ...input, type: 'leave_approval', priority: input.priority || 'medium' });
  }

  static sendAutomationAlert(input: Omit<ModuleNotificationInput, 'type'>) {
    return this.send({ ...input, type: 'automation_alert', priority: input.priority || 'high' });
  }

  private static async dispatchChannel(channel: NotificationChannel, input: ModuleNotificationInput): Promise<DeliveryResult> {
    if (channel === 'in_app') return { channel, status: 'queued' };

    if (channel === 'email' && !process.env.EMAIL_PROVIDER) {
      console.log('Email notification skipped; EMAIL_PROVIDER is not configured.', {
        title: input.title,
        recipients: input.userIds,
      });
      return { channel, status: 'skipped', reason: 'EMAIL_PROVIDER is not configured' };
    }

    if (channel === 'sms' && !process.env.SMS_PROVIDER) {
      console.log('SMS notification skipped; SMS_PROVIDER is not configured.', {
        title: input.title,
        recipients: input.userIds,
      });
      return { channel, status: 'skipped', reason: 'SMS_PROVIDER is not configured' };
    }

    return { channel, status: 'queued' };
  }
}
