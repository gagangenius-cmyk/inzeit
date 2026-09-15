'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Check, Clock, Calendar, Users, AlertCircle, TrendingUp, Phone, Mail, MapPin, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getPusherClient, notificationChannelName, type NotificationPushPayload } from '@/lib/pusherClient';

interface Notification {
  id: number;
  type: 'followup' | 'appointment' | 'meeting' | 'lead_assigned' | 'lead_updated' | 'opportunity_created' | 'discount_approval' | 'reassignment' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
  relatedType?: 'lead' | 'opportunity' | 'appointment' | 'discount_approval' | 'reassignment';
  link?: string | null;
}

// Fallback for notifications created before related links were tracked, or
// where no explicit link was set on creation — every relatedType in the
// union above needs a case here, since a missing one silently makes that
// notification unclickable (see discount-approvals/route.ts's outcome
// notification, which hit exactly this before it started setting `link`).
function resolveNotificationLink(notification: Notification): string | null {
  if (notification.link) return notification.link;
  if (!notification.relatedId) return null;
  switch (notification.relatedType) {
    case 'lead':
      return `/admin/leads/${notification.relatedId}/edit`;
    case 'opportunity':
      return `/admin/leads/opportunity-flow?leadId=${notification.relatedId}`;
    case 'appointment':
      return '/admin/appointments';
    case 'discount_approval':
      return '/admin/discount-approvals';
    case 'reassignment':
      return '/admin/reassignment';
    default:
      return null;
  }
}

interface FollowUpReminder {
  id: number;
  leadId: number;
  employeeId: number;
  reminderType: 'call' | 'email' | 'meeting' | 'sms' | 'task';
  scheduledAt: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dmcForumLead?: {
    id: number;
    fname: string;
    lname: string;
    email: string;
    phone: string;
  };
}

interface MeetingSchedule {
  id: number;
  title: string;
  meetingType: 'call' | 'video' | 'in_person' | 'email' | 'presentation';
  scheduledAt: string;
  duration: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  meetingLink?: string;
  dmcForumLead?: {
    id: number;
    fname: string;
    lname: string;
    email: string;
    phone: string;
  };
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUpReminder[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingSchedule[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'notifications' | 'followups' | 'meetings'>('notifications');
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      setUserId(Number(user.id));
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserId(Number(parsedUser.id || 0) || null);
      } catch (error) {
        console.error('Error parsing stored user for notifications:', error);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();
    fetchUpcomingReminders();

    const interval = window.setInterval(() => {
      fetchNotifications();
      fetchUpcomingReminders();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [userId]);

  // Live push on top of the poll above — when Pusher is configured, a new
  // notification arrives here the instant it's created (see the afterCreate
  // hook on the CrmcNotifications model) instead of waiting up to 30s for
  // the next poll tick. Mirrors the same pattern ClientChatPanel.tsx already
  // uses for chat messages.
  useEffect(() => {
    if (!userId) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(notificationChannelName(userId));
    const handleNewNotification = (payload: NotificationPushPayload) => {
      setNotifications((prev) => (prev.some((n) => n.id === payload.id) ? prev : [
        {
          id: payload.id,
          type: payload.type as Notification['type'],
          title: payload.title,
          message: payload.message,
          priority: payload.priority as Notification['priority'],
          isRead: payload.isRead,
          createdAt: payload.createdAt,
          relatedId: payload.relatedId ?? undefined,
          relatedType: payload.relatedType as Notification['relatedType'],
          link: payload.link,
        },
        ...prev,
      ]));
      if (!payload.isRead) setUnreadCount((prev) => prev + 1);
    };
    channel.bind('new-notification', handleNewNotification);

    return () => {
      channel.unbind('new-notification', handleNewNotification);
      pusher.unsubscribe(notificationChannelName(userId));
    };
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?limit=20`);
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUpcomingReminders = async () => {
    try {
      const response = await fetch(`/api/notifications`);
      const data = await response.json();
      setUpcomingFollowUps((data.upcomingFollowUps || []).map((followUp: any) => ({
        ...followUp,
        dmcForumLead: {
          id: followUp.leadId,
          fname: followUp.fname || '',
          lname: followUp.lname || '',
          email: followUp.email || '',
          phone: followUp.phone || ''
        }
      })));
      setUpcomingMeetings((data.upcomingMeetings || []).map((appointment: any) => ({
        ...appointment,
        dmcForumLead: {
          id: appointment.leadId,
          fname: appointment.fname || '',
          lname: appointment.lname || '',
          email: appointment.email || '',
          phone: appointment.phone || ''
        }
      })));
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
    }
  };

  const markAsRead = async (notificationIds: number[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          action: 'mark_read'
        })
      });

      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    const target = resolveNotificationLink(notification);
    if (!notification.isRead) markAsRead([notification.id]);
    if (target) {
      setIsOpen(false);
      router.push(target);
    }
  };

  const goToLead = (leadId?: number) => {
    if (!leadId) return;
    setIsOpen(false);
    router.push(`/admin/leads/${leadId}/edit`);
  };

  const deleteNotifications = async (notificationIds: number[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          action: 'delete'
        })
      });

      setNotifications(prev => 
        prev.filter(notif => !notificationIds.includes(notif.id))
      );
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const completeFollowUp = async (reminderId: number) => {
    try {
      await fetch('/api/follow-up-reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderId,
          action: 'complete',
          completedAt: new Date().toISOString()
        })
      });

      setUpcomingFollowUps(prev => 
        prev.filter(reminder => reminder.id !== reminderId)
      );
    } catch (error) {
      console.error('Error completing follow-up:', error);
    }
  };

  const completeMeeting = async (meetingId: number) => {
    try {
      await fetch(`/api/appointments/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          done: 1,
          not_done: 0,
          booked: 1
        })
      });

      setUpcomingMeetings(prev => 
        prev.filter(meeting => meeting.id !== meetingId)
      );
    } catch (error) {
      console.error('Error completing meeting:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'followup':
        return <Phone className="w-4 h-4" />;
      case 'appointment':
      case 'meeting':
        return <Calendar className="w-4 h-4" />;
      case 'lead_assigned':
        return <Users className="w-4 h-4" />;
      case 'lead_updated':
        return <TrendingUp className="w-4 h-4" />;
      case 'opportunity_created':
        return <Target className="w-4 h-4" />;
      case 'discount_approval':
        return <AlertCircle className="w-4 h-4" />;
      case 'reassignment':
        return <Users className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Notifications ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'followups'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Follow-ups ({upcomingFollowUps.length})
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'meetings'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
            Appointments ({upcomingMeetings.length})
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-80">
            {activeTab === 'notifications' && (
              <div className="p-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const target = resolveNotificationLink(notification);
                    return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 mb-2 rounded-lg border ${target ? 'cursor-pointer hover:shadow-sm' : ''} ${
                        notification.isRead
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                            <p className="text-gray-400 text-xs mt-1">{formatTime(notification.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead([notification.id]); }}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3 text-gray-600" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotifications([notification.id]); }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Delete"
                          >
                            <X className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'followups' && (
              <div className="p-2">
                {upcomingFollowUps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No upcoming follow-ups</p>
                  </div>
                ) : (
                  upcomingFollowUps.map((followUp) => (
                    <div
                      key={followUp.id}
                      onClick={() => goToLead(followUp.dmcForumLead?.id)}
                      className="p-3 mb-2 rounded-lg border border-gray-200 bg-yellow-50 cursor-pointer hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${getPriorityColor(followUp.priority)}`}>
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">{followUp.subject}</h4>
                            <p className="text-gray-600 text-sm">
                              {followUp.dmcForumLead?.fname} {followUp.dmcForumLead?.lname}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(followUp.scheduledAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); completeFollowUp(followUp.id); }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Mark as complete"
                        >
                          <Check className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="p-2">
                {upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No upcoming appointments</p>
                  </div>
                ) : (
                  upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => goToLead(meeting.dmcForumLead?.id)}
                      className="p-3 mb-2 rounded-lg border border-gray-200 bg-green-50 cursor-pointer hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-lg ${getPriorityColor(meeting.priority)}`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm">{meeting.title}</h4>
                            <p className="text-gray-600 text-sm">
                              {meeting.dmcForumLead?.fname} {meeting.dmcForumLead?.lname}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(meeting.scheduledAt).toLocaleString()} ({meeting.duration} min)
                            </p>
                            {meeting.location && (
                              <p className="text-gray-500 text-xs flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {meeting.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); completeMeeting(meeting.id); }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Mark as complete"
                        >
                          <Check className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
