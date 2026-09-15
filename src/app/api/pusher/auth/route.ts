import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { requireClientAuth, isClientAuthError } from '@/lib/clientApiAuth';
import { authorizeChannel } from '@/lib/pusherServer';
import { canViewAllBranches } from '@/lib/roleChecks';

// Pusher's client SDK POSTs here (form-encoded: socket_id, channel_name)
// whenever a browser tries to subscribe to a private-* channel — Pusher
// itself has no idea who our users are, so it calls back here and only
// opens the subscription if we return a signed auth response. Without this,
// "private-ops-chat-{opportunityId}" would either reject everyone or (if left
// public/unauthenticated) let any signed-in client guess another case's
// channel name and read their conversation — and "private-notifications-{userId}"
// would let anyone read anyone else's notification feed live, the exact IDOR
// /api/notifications GET was fixed to close (see that route's comment).
const CHAT_CHANNEL_PATTERN = /^private-ops-chat-(\d+)$/;
const NOTIFICATION_CHANNEL_PATTERN = /^private-notifications-(\d+)$/;
const LEAD_POOL_CHANNEL_PATTERN = /^private-lead-pool-(\d+)$/;

// Any authenticated staff member with operations access may join any case's
// channel — this mirrors the existing GET/POST permission on
// /api/admin/operations/client-chat, which has no per-case ownership check
// either.
async function isStaffAllowed(request: NextRequest): Promise<boolean> {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  return !isAuthError(auth);
}

async function isClientAllowed(request: NextRequest, opportunityId: number): Promise<boolean> {
  const client = requireClientAuth(request);
  if (isClientAuthError(client)) return false;

  const [row] = await sequelize.query<{ id: number }>(
    `SELECT id FROM crm_opportunities WHERE id = :opportunityId AND leadId = :leadId LIMIT 1`,
    { replacements: { opportunityId, leadId: client.leadId }, type: QueryTypes.SELECT },
  );
  return Boolean(row);
}

// A notification channel is strictly personal — only the employee it
// belongs to may ever subscribe to it, no exceptions (not even a manager
// viewing "their team's" notifications — that concept doesn't exist here).
async function isOwnNotificationChannel(request: NextRequest, channelUserId: number): Promise<boolean> {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return false;
  return Number(auth.id) === channelUserId;
}

// The pool for a branch is visible to any active employee in that branch
// (the same self-serve claim access the pool API itself grants), plus
// anyone with company-wide visibility watching from a leadership view.
async function isLeadPoolChannelAllowed(request: NextRequest, branchId: number): Promise<boolean> {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return false;
  return Number(auth.branch) === branchId || canViewAllBranches(auth);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const socketId = String(form.get('socket_id') || '');
  const channelName = String(form.get('channel_name') || '');

  const chatMatch = CHAT_CHANNEL_PATTERN.exec(channelName);
  const notificationMatch = NOTIFICATION_CHANNEL_PATTERN.exec(channelName);
  const leadPoolMatch = LEAD_POOL_CHANNEL_PATTERN.exec(channelName);
  if (!socketId || (!chatMatch && !notificationMatch && !leadPoolMatch)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }

  const allowed = chatMatch
    ? (await isStaffAllowed(request)) || (await isClientAllowed(request, Number(chatMatch[1])))
    : notificationMatch
      ? await isOwnNotificationChannel(request, Number(notificationMatch[1]))
      : await isLeadPoolChannelAllowed(request, Number(leadPoolMatch![1]));
  if (!allowed) {
    return NextResponse.json({ error: 'Not authorized for this channel' }, { status: 403 });
  }

  const authResponse = authorizeChannel(socketId, channelName);
  if (!authResponse) {
    return NextResponse.json({ error: 'Realtime updates are not configured' }, { status: 503 });
  }

  return NextResponse.json(authResponse);
}
