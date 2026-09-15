import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { validateWebhookSignature, webhookEventHash, extractLeadgenChanges } from '@/lib/meta/webhook';
import { processWebhookEvent } from '@/lib/meta/processor';
import type { MetaWebhookPayload } from '@/lib/meta/types';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

/**
 * GET /api/webhooks/meta
 * Meta webhook verification challenge.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const configuredToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!configuredToken) {
    console.error('[Meta Webhook] META_WEBHOOK_VERIFY_TOKEN is not set');
    return new NextResponse('Server misconfiguration', { status: 500 });
  }

  if (mode === 'subscribe' && token === configuredToken) {
    console.log('[Meta Webhook] Verification successful');
    return new NextResponse(challenge ?? '', { status: 200 });
  }

  console.warn('[Meta Webhook] Verification failed: invalid token or mode');
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * POST /api/webhooks/meta
 * Receives lead gen event notifications from Meta.
 * - Validates HMAC-SHA256 signature
 * - Stores raw event immediately so no lead is lost
 * - Returns 200 immediately, then processes asynchronously
 */
export async function POST(request: NextRequest) {
  // Read raw body BEFORE any parsing — needed for HMAC verification
  const rawBody = await request.text();

  const signature = request.headers.get('x-hub-signature-256');
  if (!validateWebhookSignature(rawBody, signature)) {
    console.warn('[Meta Webhook] Invalid signature rejected');
    return new NextResponse('Invalid signature', { status: 403 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  // Only handle page leadgen events
  if (payload.object !== 'page') {
    return new NextResponse('OK', { status: 200 });
  }

  const changes = extractLeadgenChanges(payload);
  if (changes.length === 0) {
    return new NextResponse('OK', { status: 200 });
  }

  await ensureDB();

  // Persist each leadgen change as a separate webhook event before returning
  const eventIds: number[] = [];

  for (const change of changes) {
    const hash = webhookEventHash(change.leadgenId + rawBody);

    try {
      const [[insertId]] = await sequelize.query(
        `INSERT IGNORE INTO crm_meta_webhook_events
           (event_hash, leadgen_id, page_id, form_id, campaign_id, adset_id, ad_id,
            raw_payload, signature_validated, processing_status)
         VALUES
           (:hash, :leadgenId, :pageId, :formId, :campaignId, :adsetId, :adId,
            :rawPayload, 1, 'pending')`,
        {
          replacements: {
            hash,
            leadgenId: change.leadgenId,
            pageId: change.pageId,
            formId: change.formId,
            campaignId: change.campaignId,
            adsetId: change.adsetId,
            adId: change.adId,
            rawPayload: rawBody,
          },
          type: QueryTypes.INSERT,
        }
      ) as unknown as [[number, number]];

      if (insertId > 0) {
        eventIds.push(insertId);
      }
    } catch (err) {
      // Log but don't fail — Meta expects 200 even on partial failures
      console.error('[Meta Webhook] Failed to store event:', err);
    }
  }

  // Return 200 immediately so Meta doesn't retry
  // Process leads asynchronously (fire-and-forget with error capture)
  if (eventIds.length > 0) {
    // Use setImmediate to avoid blocking the response
    const processAll = async () => {
      for (const id of eventIds) {
        await processWebhookEvent(id).catch(err =>
          console.error(`[Meta Webhook] Async processing failed for event ${id}:`, err)
        );
      }
    };
    // Fire-and-forget; Node.js keeps the event loop alive for in-flight promises
    processAll().catch(err => console.error('[Meta Webhook] Batch processing error:', err));
  }

  return new NextResponse('OK', { status: 200 });
}

// Compute a deduplication hash (re-exported so it can be tested)
export { crypto };
