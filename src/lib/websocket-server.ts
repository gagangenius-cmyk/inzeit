// @ts-nocheck
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { CrmcNotifications, CrmcFollowUpReminders, CrmcMeetingSchedules } from '@/models';
import { Op } from 'sequelize';

export class WebSocketNotificationServer {
  private io: SocketIOServer;
  private connectedUsers: Map<number, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    this.startNotificationScheduler();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle user authentication and registration
      socket.on('authenticate', async (data) => {
        const { userId, token } = data;
        
        // In production, verify token here
        if (userId) {
          this.connectedUsers.set(parseInt(userId), socket.id);
          socket.userId = parseInt(userId);
          
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
          
          // Send pending notifications
          await this.sendPendingNotifications(parseInt(userId), socket);
          
          // Send upcoming follow-ups and meetings
          await this.sendUpcomingReminders(parseInt(userId), socket);
        }
      });

      // Handle notification read status
      socket.on('mark_notifications_read', async (data) => {
        const { notificationIds } = data;
        
        try {
          await CrmcNotifications.update(
            { isRead: true },
            {
              where: {
                id: { [Op.in]: notificationIds },
                userId: socket.userId
              }
            }
          );
          
          socket.emit('notifications_marked_read', { notificationIds });
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      });

      // Handle follow-up reminder actions
      socket.on('followup_action', async (data) => {
        const { reminderId, action, notes } = data;
        
        try {
          let updateData: any = {};
          
          switch (action) {
            case 'complete':
              updateData = {
                status: 'completed',
                completedAt: new Date(),
                notes: notes || null
              };
              break;
            case 'reschedule':
              updateData = {
                status: 'rescheduled',
                scheduledAt: new Date(data.rescheduledAt),
                notes: notes || null
              };
              break;
            case 'cancel':
              updateData = {
                status: 'cancelled',
                notes: notes || null
              };
              break;
          }
          
          await CrmcFollowUpReminders.update(updateData, {
            where: { id: parseInt(reminderId) }
          });
          
          socket.emit('followup_updated', { reminderId, action });
        } catch (error) {
          console.error('Error updating follow-up:', error);
        }
      });

      // Handle meeting actions
      socket.on('meeting_action', async (data) => {
        const { meetingId, action, outcome, nextAction, notes } = data;
        
        try {
          let updateData: any = {};
          
          switch (action) {
            case 'start':
              updateData = { status: 'in_progress' };
              break;
            case 'complete':
              updateData = {
                status: 'completed',
                outcome: outcome || null,
                nextAction: nextAction || null,
                notes: notes || null
              };
              break;
            case 'reschedule':
              updateData = {
                status: 'rescheduled',
                scheduledAt: new Date(data.rescheduledAt),
                reminderSent: false,
                notes: notes || null
              };
              break;
            case 'cancel':
              updateData = {
                status: 'cancelled',
                notes: notes || null
              };
              break;
          }
          
          await CrmcMeetingSchedules.update(updateData, {
            where: { id: parseInt(meetingId) }
          });
          
          socket.emit('meeting_updated', { meetingId, action });
        } catch (error) {
          console.error('Error updating meeting:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove user from connected users
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
      });
    });
  }

  private async sendPendingNotifications(userId: number, socket: any) {
    try {
      const notifications = await CrmcNotifications.findAll({
        where: {
          userId,
          isRead: false
        },
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      socket.emit('pending_notifications', { notifications });
    } catch (error) {
      console.error('Error sending pending notifications:', error);
    }
  }

  private async sendUpcomingReminders(userId: number, socket: any) {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

      // Get upcoming follow-ups
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

      // Get upcoming meetings
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

      socket.emit('upcoming_reminders', { followUps, meetings });
    } catch (error) {
      console.error('Error sending upcoming reminders:', error);
    }
  }

  // Method to send real-time notification to specific user
  public async sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
    }
  }

  // Method to send notification to multiple users
  public async sendNotificationToUsers(userIds: number[], notification: any) {
    const socketIds = userIds.map(userId => this.connectedUsers.get(userId)).filter(Boolean);
    
    if (socketIds.length > 0) {
      this.io.to(socketIds).emit('new_notification', notification);
    }
  }

  // Method to broadcast notification to all connected users
  public async broadcastNotification(notification: any) {
    this.io.emit('broadcast_notification', notification);
  }

  private startNotificationScheduler() {
    // Check for upcoming reminders every minute
    setInterval(async () => {
      await this.checkAndSendReminders();
    }, 60000); // 1 minute

    // Clean up old notifications every hour
    setInterval(async () => {
      await this.cleanupOldNotifications();
    }, 3600000); // 1 hour
  }

  private async checkAndSendReminders() {
    try {
      const now = new Date();
      const reminderThreshold = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes from now

      // Check follow-up reminders
      const followUpsNeedingReminder = await CrmcFollowUpReminders.findAll({
        where: {
          status: 'pending',
          scheduledAt: {
            [Op.lte]: reminderThreshold
          }
        },
        include: [
          {
            association: 'dmEmployee',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      for (const followUp of followUpsNeedingReminder) {
        const notification = {
          userId: followUp.employeeId,
          type: 'followup',
          title: `Follow-up Reminder: ${followUp.subject}`,
          message: `You have a ${followUp.reminderType} follow-up scheduled for ${new Date(followUp.scheduledAt).toLocaleString()}`,
          priority: followUp.priority,
          relatedId: followUp.id,
          relatedType: 'lead'
        };

        await this.sendNotificationToUser(followUp.employeeId, notification);
      }

      // Check meeting reminders
      const meetingsNeedingReminder = await CrmcMeetingSchedules.findAll({
        where: {
          status: 'scheduled',
          reminderSent: false,
          scheduledAt: {
            [Op.lte]: reminderThreshold
          }
        },
        include: [
          {
            association: 'dmEmployee',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      for (const meeting of meetingsNeedingReminder) {
        const notification = {
          userId: meeting.employeeId,
          type: 'meeting',
          title: `Meeting Reminder: ${meeting.title}`,
          message: `You have a ${meeting.meetingType} meeting scheduled for ${new Date(meeting.scheduledAt).toLocaleString()}`,
          priority: meeting.priority,
          relatedId: meeting.id,
          relatedType: 'appointment'
        };

        await this.sendNotificationToUser(meeting.employeeId, notification);

        // Mark reminder as sent
        await CrmcMeetingSchedules.update(
          { reminderSent: true },
          { where: { id: meeting.id } }
        );
      }

    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  private async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      await CrmcNotifications.destroy({
        where: {
          createdAt: {
            [Op.lt]: thirtyDaysAgo
          },
          isRead: true
        }
      });
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  public isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}

export default WebSocketNotificationServer;
