import Pusher from 'pusher';

// Real-time transport for (1) the client<->case-officer chat
// (crm_client_conversations) and (2) the internal employee notification bell
// (crm_notifications). This app deploys as serverless Next.js API routes (no
// persistent process a self-hosted Socket.IO server could attach to), so a
// managed pub/sub service is the only way to get genuine WebSocket push here
// — see src/lib/websocket-server.ts for the dead in-process Socket.IO server
// this replaces.
//
// Deliberately optional: every call site here works fine with these env vars
// unset — the REST endpoints still persist everything to the database and
// the UI still polls — Pusher only adds the instant push on top. Set
// PUSHER_APP_ID / PUSHER_KEY / PUSHER_SECRET / PUSHER_CLUSTER (and the
// client-visible NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER, which
// must match PUSHER_KEY / PUSHER_CLUSTER) to turn on live push.
let pusherInstance: Pusher | null | undefined;

function getPusher(): Pusher | null {
  if (pusherInstance !== undefined) return pusherInstance;

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    pusherInstance = null;
    return null;
  }

  pusherInstance = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return pusherInstance;
}

export const isRealtimeChatConfigured = (): boolean => getPusher() !== null;

// Keyed on opportunityId alone (not leadId too) - an opportunity belongs to
// exactly one lead, so it's already a unique case key, and the client-portal
// page only has opportunityId available client-side (leadId lives in its
// server-side session, not exposed to the browser).
export const chatChannelName = (opportunityId: number): string =>
  `private-ops-chat-${opportunityId}`;

export interface ChatPushMessage {
  id: number;
  text: string;
  file: string | null;
  fromClient: boolean;
  created: string;
}

// Fire-and-forget: a Pusher outage must never fail the message send itself,
// since the row is already durably persisted in crm_client_conversations by
// the time this is called — push is purely an enhancement on top of that.
export async function pushChatMessage(opportunityId: number, message: ChatPushMessage): Promise<void> {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(chatChannelName(opportunityId), 'new-message', message);
  } catch (error) {
    console.error('Failed to push chat message via Pusher:', error);
  }
}

export function authorizeChannel(
  socketId: string,
  channelName: string,
): Pusher.ChannelAuthResponse | null {
  const pusher = getPusher();
  if (!pusher) return null;
  return pusher.authorizeChannel(socketId, channelName);
}

// Personal channel, one per employee — strictly private, see
// isOwnNotificationChannel in src/app/api/pusher/auth/route.ts. Never
// combine with the userId-in-query-string mistake that /api/notifications
// GET had before it was fixed to always derive the user from the auth token.
export const notificationChannelName = (userId: number): string =>
  `private-notifications-${userId}`;

export interface NotificationPushPayload {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  relatedId: number | null;
  relatedType: string | null;
  link: string | null;
}

// Fire-and-forget, same reasoning as pushChatMessage above — called from
// CrmcNotifications' afterCreate hook once the row is already durably
// persisted, so a Pusher outage must never affect notification creation
// itself. Hooking the model (rather than each of the ~7 call sites that
// create a notification) means every current and future notification path
// gets live delivery for free.
export async function pushNotification(userId: number, notification: NotificationPushPayload): Promise<void> {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(notificationChannelName(userId), 'new-notification', notification);
  } catch (error) {
    console.error('Failed to push notification via Pusher:', error);
  }
}

// One channel per branch — every agent watching the pool for their branch
// sees the same claims/arrivals live, matching the branch-scoping the pool
// API itself already enforces (see src/lib/leadPool.ts, src/app/api/admin/lead-pool).
export const leadPoolChannelName = (branchId: number): string =>
  `private-lead-pool-${branchId}`;

export type LeadPoolEvent = 'lead-pool:new' | 'lead-pool:claimed';

// Fire-and-forget, same reasoning as pushChatMessage/pushNotification above -
// the pool list itself is always fetched fresh from the database, so a
// missed or failed push only costs a bit of live-ness, never correctness.
export async function pushLeadPoolEvent(
  branchId: number,
  event: LeadPoolEvent,
  payload: { leadId: number; branchId?: number },
): Promise<void> {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(leadPoolChannelName(branchId), event, payload);
  } catch (error) {
    console.error('Failed to push lead pool event via Pusher:', error);
  }
}
