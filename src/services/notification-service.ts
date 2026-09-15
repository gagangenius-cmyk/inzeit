// @ts-nocheck
import { CrmcNotifications, CrmcFollowUpReminders, CrmcMeetingSchedules } from '@/models';
import { Op } from 'sequelize';

export class NotificationService {
  private static instance: NotificationService;
  private websocketServer: any;

  constructor() {
    // Singleton pattern
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setWebSocketServer(websocketServer: any) {
    this.websocketServer = websocketServer;
  }

  // Create notification for lead assignment
  public async createLeadAssignmentNotification(userId: number, leadId: number, leadName: string) {
    try {
      const notification = await CrmcNotifications.create({
        userId,
        type: 'lead_assigned',
        title: 'New Lead Assigned',
        message: `You have been assigned a new lead: ${leadName}`,
        priority: 'medium',
        relatedId: leadId,
        relatedType: 'lead'
      });

      if (this.websocketServer) {
        await this.websocketServer.sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating lead assignment notification:', error);
      throw error;
    }
  }

  // Create notification for lead status update
  public async createLeadUpdateNotification(userId: number, leadId: number, leadName: string, oldStatus: string, newStatus: string) {
    try {
      const notification = await CrmcNotifications.create({
        userId,
        type: 'lead_updated',
        title: 'Lead Status Updated',
        message: `Lead ${leadName} status changed from ${oldStatus} to ${newStatus}`,
        priority: 'medium',
        relatedId: leadId,
        relatedType: 'lead'
      });

      if (this.websocketServer) {
        await this.websocketServer.sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating lead update notification:', error);
      throw error;
    }
  }

  // Create notification for opportunity creation
  public async createOpportunityNotification(userId: number, opportunityId: number, leadName: string) {
    try {
      const notification = await CrmcNotifications.create({
        userId,
        type: 'opportunity_created',
        title: 'Opportunity Created',
        message: `New opportunity created for lead: ${leadName}`,
        priority: 'high',
        relatedId: opportunityId,
        relatedType: 'opportunity'
      });

      if (this.websocketServer) {
        await this.websocketServer.sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating opportunity notification:', error);
      throw error;
    }
  }

  // Create notification for discount approval
  public async createDiscountApprovalNotification(userId: number, discountId: number, leadName: string, status: string) {
    try {
      const notification = await CrmcNotifications.create({
        userId,
        type: 'discount_approval',
        title: `Discount ${status}`,
        message: `Discount request for lead ${leadName} has been ${status}`,
        priority: status === 'approved' ? 'high' : 'medium',
        relatedId: discountId,
        relatedType: 'discount_approval'
      });

      if (this.websocketServer) {
        await this.websocketServer.sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating discount approval notification:', error);
      throw error;
    }
  }

  // Create notification for lead reassignment
  public async createReassignmentNotification(userId: number, reassignmentId: number, leadName: string, fromEmployee: string, toEmployee: string) {
    try {
      const notification = await CrmcNotifications.create({
        userId,
        type: 'reassignment',
        title: 'Lead Reassigned',
        message: `Lead ${leadName} reassigned from ${fromEmployee} to ${toEmployee}`,
        priority: 'high',
        relatedId: reassignmentId,
        relatedType: 'reassignment'
      });

      if (this.websocketServer) {
        await this.websocketServer.sendNotificationToUser(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating reassignment notification:', error);
      throw error;
    }
  }

  // Create follow-up reminder notification
  public async createFollowUpReminder(reminderId: number) {
    try {
      const reminder = await CrmcFollowUpReminders.findByPk(reminderId, {
        include: [
          {
            association: 'dmcForumLead',
            attributes: ['id', 'fname', 'lname', 'email', 'phone']
          },
          {
            association: 'dmEmployee',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!reminder) {
        throw new Error('Follow-up reminder not found');
      }

      const notification = await CrmcNotifications.create({
        userId: reminder.employeeId,
        type: 'followup',
        title: `Follow-up Reminder: ${reminder.subject}`,
        message: `You have a ${reminder.reminderType} follow-up scheduled for ${new Date(reminder.scheduledAt).toLocaleString()}`,
        priority: reminder.priority,
        relatedId: reminder.id,
        relatedType: 'lead',
        scheduledAt: reminder.scheduledAt
      });

      if (this.websocketServer) {
        await this.websocketServer.sendNotificationToUser(reminder.employeeId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating follow-up reminder notification:', error);
      throw error;
    }
  }

  // Create meeting reminder notification
  public async createMeetingReminder(meetingId: number) {
    try {
      const meeting = await CrmcMeetingSchedules.findByPk(meetingId, {
        include: [
          {
            association: 'dmcForumLead',
            attributes: ['id', 'fname', 'lname', 'email', 'phone']
          },
          {
            association: 'dmEmployee',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const notification = await CrmcNotifications.create({
        userId: meeting.employeeId,
        type: 'meeting',
        title: `Meeting Reminder: ${meeting.title}`,
        message: `You have a ${meeting.meetingType} meeting scheduled for ${new Date(meeting.scheduledAt).toLocaleString()}`,
        priority: meeting.priority,
        relatedId: meeting.id,
        relatedType: 'appointment',
        scheduledAt: meeting.scheduledAt
      });

      if (this.websocketServer) {
        await this.websocketServer.sendNotificationToUser(meeting.employeeId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating meeting reminder notification:', error);
      throw error;
    }
  }

  // Create system notification
  public async createSystemNotification(userIds: number[], title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    try {
      const notifications = await Promise.all(
        userIds.map(userId =>
          CrmcNotifications.create({
            userId,
            type: 'system',
            title,
            message,
            priority
          })
        )
      );

      if (this.websocketServer) {
        for (let i = 0; i < userIds.length; i++) {
          await this.websocketServer.sendNotificationToUser(userIds[i], {
            id: notifications[i].id,
            type: notifications[i].type,
            title: notifications[i].title,
            message: notifications[i].message,
            priority: notifications[i].priority,
            createdAt: notifications[i].createdAt
          });
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  // Get user notifications
  public async getUserNotifications(userId: number, limit: number = 50) {
    try {
      const notifications = await CrmcNotifications.findAll({
        where: { userId },
        include: [
          {
            association: 'dmEmployee',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit
      });

      const unreadCount = await CrmcNotifications.count({
        where: {
          userId,
          isRead: false
        }
      });

      return {
        notifications,
        unreadCount
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notifications as read
  public async markNotificationsAsRead(userId: number, notificationIds: number[]) {
    try {
      await CrmcNotifications.update(
        { isRead: true },
        {
          where: {
            id: { [Op.in]: notificationIds },
            userId
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // Delete notifications
  public async deleteNotifications(userId: number, notificationIds: number[]) {
    try {
      await CrmcNotifications.destroy({
        where: {
          id: { [Op.in]: notificationIds },
          userId
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }

  // Get upcoming follow-ups and meetings for user
  public async getUpcomingReminders(userId: number) {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      const followUps = await CrmcFollowUpReminders.findAll({
        where: {
          employeeId: userId,
          status: 'pending',
          scheduledAt: {
            [Op.between]: [now, nextWeek]
          }
        },
        include: [
          {
            association: 'dmcForumLead',
            attributes: ['id', 'fname', 'lname', 'email', 'phone']
          }
        ],
        order: [['scheduledAt', 'ASC']],
        limit: 10
      });

      const meetings = await CrmcMeetingSchedules.findAll({
        where: {
          employeeId: userId,
          status: 'scheduled',
          scheduledAt: {
            [Op.between]: [now, nextWeek]
          }
        },
        include: [
          {
            association: 'dmcForumLead',
            attributes: ['id', 'fname', 'lname', 'email', 'phone']
          }
        ],
        order: [['scheduledAt', 'ASC']],
        limit: 10
      });

      return {
        followUps,
        meetings
      };
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      throw error;
    }
  }
}

export default NotificationService.getInstance();
