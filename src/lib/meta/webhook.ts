import crypto from 'crypto';
import type { MetaWebhookPayload } from './types';

/**
 * Validates the X-Hub-Signature-256 header sent by Meta.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function validateWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error('[Meta Webhook] META_APP_SECRET is not set — cannot validate signature');
    return false;
  }
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const received = signatureHeader.replace(/^sha256=/, '');

  try {
    // timingSafeEqual requires same-length buffers
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(received, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Computes a deduplication hash for a webhook event payload */
export function webhookEventHash(rawBody: string): string {
  return crypto.createHash('sha256').update(rawBody, 'utf8').digest('hex');
}

/** Extracts leadgen change entries from a Meta webhook payload */
export function extractLeadgenChanges(payload: MetaWebhookPayload) {
  const results: Array<{
    leadgenId: string;
    pageId: string;
    formId: string;
    adId: string | null;
    adsetId: string | null;
    campaignId: string | null;
  }> = [];

  if (payload.object !== 'page') return results;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue;
      const v = change.value;
      results.push({
        leadgenId: v.leadgen_id,
        pageId: v.page_id,
        formId: v.form_id,
        adId: v.ad_id ?? null,
        adsetId: v.adset_id ?? v.adgroup_id ?? null,
        campaignId: v.campaign_id ?? null,
      });
    }
  }

  return results;
}
