/**
 * Core lead processing pipeline.
 * Called after a webhook event is stored; runs asynchronously.
 *
 * Flow:
 *  1. Load webhook event from DB
 *  2. Fetch full lead from Meta Graph API
 *  3. Upsert into crm_meta_leads (dedup on meta_lead_id)
 *  4. Load active field mappings
 *  5. Build CRM payload
 *  6. Store delivery record (status=pending)
 *  7. Attempt CRM delivery
 *  8. Update delivery + event status
 */

import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { fetchLeadFromMeta, fetchFormName } from './graph-api';
import { parseFieldData, buildCrmPayload } from './mapping-engine';
import { deliverToCrm, nextRetryAt } from './crm-delivery';
import type { MetaLeadMapping, MetaLeadParsed } from './types';

const CRM_ENDPOINT =
  process.env.META_LEADS_CRM_ENDPOINT || 'https://cmgone.org/api/web-to-leads';

async function getActiveSettings() {
  const [row] = await sequelize.query<{
    is_enabled: number;
    default_branch: string | null;
  }>(
    `SELECT is_enabled, default_branch FROM crm_meta_settings WHERE id = 1 LIMIT 1`,
    { type: QueryTypes.SELECT }
  );
  return row ?? { is_enabled: 0, default_branch: null };
}

async function getActiveMappings(): Promise<MetaLeadMapping[]> {
  return sequelize.query<MetaLeadMapping>(
    `SELECT id, scope_type, campaign_id, form_id, meta_field_key, crm_field_key,
            fallback_value, transform_type, is_enabled, sort_order
     FROM crm_meta_lead_mappings
     WHERE is_enabled = 1
     ORDER BY sort_order ASC, id ASC`,
    { type: QueryTypes.SELECT }
  );
}

async function markEventProcessed(eventId: number, status: 'processed' | 'failed', error?: string) {
  await sequelize.query(
    `UPDATE crm_meta_webhook_events
     SET processing_status = :status,
         processed_at = NOW(),
         error_message = :error
     WHERE id = :id`,
    {
      replacements: { status, error: error ?? null, id: eventId },
      type: QueryTypes.UPDATE,
    }
  );
}

/**
 * Processes a single webhook event identified by its DB row id.
 * This is called asynchronously after the webhook receiver returns 200.
 */
export async function processWebhookEvent(eventId: number): Promise<void> {
  let leadgenId: string | null = null;

  try {
    // Load the event
    const [event] = await sequelize.query<{
      id: number;
      leadgen_id: string;
      campaign_id: string | null;
      adset_id: string | null;
      ad_id: string | null;
    }>(
      `SELECT id, leadgen_id, campaign_id, adset_id, ad_id
       FROM crm_meta_webhook_events
       WHERE id = :id AND processing_status = 'pending'
       LIMIT 1`,
      { replacements: { id: eventId }, type: QueryTypes.SELECT }
    );

    if (!event) return; // Already processed or not found

    leadgenId = event.leadgen_id;

    // Mark event as processing to prevent duplicate runs
    await sequelize.query(
      `UPDATE crm_meta_webhook_events SET processing_status = 'processing' WHERE id = :id`,
      { replacements: { id: eventId }, type: QueryTypes.UPDATE }
    );

    // Respect the admin on/off switch — mirrors the check in meta-campaign-sync.
    const settingsGate = await getActiveSettings();
    if (!settingsGate.is_enabled) {
      await markEventProcessed(eventId, 'processed', 'Skipped: Meta Lead Ads integration is disabled in settings');
      return;
    }

    // Check deduplication: if this leadgen_id is already in crm_meta_leads, skip graph API
    const [existing] = await sequelize.query<{ id: number }>(
      `SELECT id FROM crm_meta_leads WHERE meta_lead_id = :leadgenId LIMIT 1`,
      { replacements: { leadgenId }, type: QueryTypes.SELECT }
    );
    if (existing) {
      await markEventProcessed(eventId, 'processed');
      return;
    }

    // Fetch full lead from Meta
    const rawLead = await fetchLeadFromMeta(leadgenId);
    const fields = parseFieldData(rawLead.field_data ?? []);

    // Resolve names
    const firstName = fields['first_name'] ?? '';
    const lastName  = fields['last_name'] ?? '';
    const joinedName = [firstName, lastName].filter(Boolean).join(' ');
    const fullName  = (fields['full_name'] ?? joinedName) || null;

    // Fetch form name (best-effort)
    const formName = rawLead.form_id ? await fetchFormName(rawLead.form_id) : null;

    const parsed: MetaLeadParsed = {
      metaLeadId: rawLead.id,
      fullName,
      email: fields['email'] ?? null,
      phone: fields['phone_number'] ?? null,
      pageId: rawLead.page_id ?? null,
      formId: rawLead.form_id ?? null,
      formName,
      campaignId: rawLead.campaign_id ?? event.campaign_id ?? null,
      campaignName: null,
      adsetId: rawLead.adset_id ?? event.adset_id ?? null,
      adsetName: null,
      adId: rawLead.ad_id ?? event.ad_id ?? null,
      adName: null,
      metaCreatedTime: rawLead.created_time ?? null,
      rawLeadData: rawLead,
      fields,
    };

    const mappings = await getActiveMappings();
    const crmPayload = buildCrmPayload(parsed, mappings, settingsGate.default_branch);

    // Upsert meta lead
    await sequelize.query(
      `INSERT INTO crm_meta_leads
         (meta_lead_id, webhook_event_id, page_id, form_id, form_name,
          campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name,
          full_name, email, phone,
          raw_lead_data, normalized_lead_data, meta_created_time)
       VALUES
         (:metaLeadId, :eventId, :pageId, :formId, :formName,
          :campaignId, :campaignName, :adsetId, :adsetName, :adId, :adName,
          :fullName, :email, :phone,
          :rawLeadData, :normalizedLeadData, :metaCreatedTime)
       ON DUPLICATE KEY UPDATE
         normalized_lead_data = VALUES(normalized_lead_data),
         updated_at = NOW()`,
      {
        replacements: {
          metaLeadId: parsed.metaLeadId,
          eventId,
          pageId: parsed.pageId,
          formId: parsed.formId,
          formName: parsed.formName,
          campaignId: parsed.campaignId,
          campaignName: parsed.campaignName,
          adsetId: parsed.adsetId,
          adsetName: parsed.adsetName,
          adId: parsed.adId,
          adName: parsed.adName,
          fullName: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
          rawLeadData: JSON.stringify(rawLead),
          normalizedLeadData: JSON.stringify(crmPayload),
          metaCreatedTime: parsed.metaCreatedTime,
        },
        type: QueryTypes.INSERT,
      }
    );

    // Get the inserted/existing meta_lead id
    const [metaLead] = await sequelize.query<{ id: number }>(
      `SELECT id FROM crm_meta_leads WHERE meta_lead_id = :metaLeadId LIMIT 1`,
      { replacements: { metaLeadId: parsed.metaLeadId }, type: QueryTypes.SELECT }
    );

    if (!metaLead) {
      await markEventProcessed(eventId, 'failed', 'Failed to retrieve meta_lead row after insert');
      return;
    }

    // Create delivery record
    const [[deliveryResult]] = await sequelize.query(
      `INSERT INTO crm_meta_lead_deliveries
         (meta_lead_id, crm_endpoint, request_payload, status)
       VALUES (:metaLeadId, :endpoint, :payload, 'pending')`,
      {
        replacements: {
          metaLeadId: metaLead.id,
          endpoint: CRM_ENDPOINT,
          payload: JSON.stringify(crmPayload),
        },
        type: QueryTypes.INSERT,
      }
    ) as unknown as [[number, number]];

    const deliveryId = deliveryResult;

    // Attempt CRM delivery
    const result = await deliverToCrm(crmPayload);

    if (result.success) {
      await sequelize.query(
        `UPDATE crm_meta_lead_deliveries
         SET status = 'delivered', response_status = :status, response_body = :body,
             delivered_at = NOW(), updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: { status: result.status, body: result.body, id: deliveryId },
          type: QueryTypes.UPDATE,
        }
      );
    } else {
      const retryAt = nextRetryAt(0); // first retry
      await sequelize.query(
        `UPDATE crm_meta_lead_deliveries
         SET status = :status, response_status = :respStatus, response_body = :body,
             last_error = :error, retry_count = 0, next_retry_at = :retryAt, updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            status: retryAt ? 'retry_scheduled' : 'failed',
            respStatus: result.status,
            body: result.body,
            error: result.error,
            retryAt,
            id: deliveryId,
          },
          type: QueryTypes.UPDATE,
        }
      );
    }

    await markEventProcessed(eventId, 'processed');

    // Update settings.last_webhook_at
    await sequelize.query(
      `UPDATE crm_meta_settings SET last_webhook_at = NOW() WHERE id = 1`,
      { type: QueryTypes.UPDATE }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Meta Processor] Failed to process event ${eventId} (leadgen: ${leadgenId}):`, msg);
    await markEventProcessed(eventId, 'failed', msg).catch(() => {});
  }
}

/**
 * Retries all scheduled delivery records where next_retry_at <= NOW().
 * Called from the cron endpoint.
 */
export async function retryFailedDeliveries(): Promise<{ processed: number; errors: number }> {
  const due = await sequelize.query<{
    id: number;
    meta_lead_id: number;
    request_payload: string;
    retry_count: number;
  }>(
    `SELECT id, meta_lead_id, request_payload, retry_count
     FROM crm_meta_lead_deliveries
     WHERE status = 'retry_scheduled'
       AND next_retry_at <= NOW()
     ORDER BY next_retry_at ASC
     LIMIT 50`,
    { type: QueryTypes.SELECT }
  );

  let processed = 0;
  let errors = 0;

  for (const delivery of due) {
    try {
      // Mark as processing
      await sequelize.query(
        `UPDATE crm_meta_lead_deliveries SET status = 'processing', updated_at = NOW() WHERE id = :id`,
        { replacements: { id: delivery.id }, type: QueryTypes.UPDATE }
      );

      const payload = JSON.parse(delivery.request_payload);
      const result = await deliverToCrm(payload);
      const newRetryCount = delivery.retry_count + 1;

      if (result.success) {
        await sequelize.query(
          `UPDATE crm_meta_lead_deliveries
           SET status = 'delivered', response_status = :status, response_body = :body,
               delivered_at = NOW(), updated_at = NOW()
           WHERE id = :id`,
          { replacements: { status: result.status, body: result.body, id: delivery.id }, type: QueryTypes.UPDATE }
        );
      } else {
        const retryAt = nextRetryAt(newRetryCount);
        await sequelize.query(
          `UPDATE crm_meta_lead_deliveries
           SET status = :status, response_status = :respStatus, response_body = :body,
               last_error = :error, retry_count = :retryCount, next_retry_at = :retryAt, updated_at = NOW()
           WHERE id = :id`,
          {
            replacements: {
              status: retryAt ? 'retry_scheduled' : 'failed',
              respStatus: result.status,
              body: result.body,
              error: result.error,
              retryCount: newRetryCount,
              retryAt,
              id: delivery.id,
            },
            type: QueryTypes.UPDATE,
          }
        );
      }
      processed++;
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Meta Retry] Delivery ${delivery.id} failed:`, msg);
      await sequelize.query(
        `UPDATE crm_meta_lead_deliveries
         SET status = 'retry_scheduled', last_error = :error, updated_at = NOW()
         WHERE id = :id`,
        { replacements: { error: msg, id: delivery.id }, type: QueryTypes.UPDATE }
      ).catch(() => {});
    }
  }

  return { processed, errors };
}
