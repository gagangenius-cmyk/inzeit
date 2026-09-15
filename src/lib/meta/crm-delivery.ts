import type { CrmPayload, DeliveryResult } from './types';

const CRM_ENDPOINT =
  process.env.META_LEADS_CRM_ENDPOINT || 'https://cmgone.org/api/web-to-leads';

/** Exponential backoff delay in seconds for each retry attempt (0-indexed) */
const RETRY_DELAYS_SECONDS = [
  5 * 60,       // Retry 1: 5 min
  15 * 60,      // Retry 2: 15 min
  60 * 60,      // Retry 3: 1 hour
  6 * 60 * 60,  // Retry 4: 6 hours
  24 * 60 * 60, // Retry 5: 24 hours
];

export const MAX_RETRY_COUNT = RETRY_DELAYS_SECONDS.length;

/** Returns the next retry datetime ISO string, or null if max retries exceeded */
export function nextRetryAt(retryCount: number): string | null {
  const delay = RETRY_DELAYS_SECONDS[retryCount];
  if (delay === undefined) return null;
  return new Date(Date.now() + delay * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Sends a normalized CRM payload to the configured endpoint.
 * Returns DeliveryResult; never throws — errors are captured.
 */
export async function deliverToCrm(payload: CrmPayload): Promise<DeliveryResult> {
  try {
    const res = await fetch(CRM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    const body = await res.text().catch(() => '');
    return {
      success: res.ok,
      status: res.status,
      body: body.slice(0, 2000), // cap stored response
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      status: null,
      body: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sends a test CRM delivery using a sample payload.
 * Only called from the admin test endpoint — never in production lead flow.
 */
export async function testCrmDelivery(): Promise<DeliveryResult> {
  const samplePayload: CrmPayload = {
    lastName: 'Test Lead - Meta Integration',
    email: 'test-meta@example.com',
    phone: '+971500000000',
    AgeRange: '25-34',
    ImmigrationType: 'Student Visa',
    Branch: 'Test',
    ResidentCountry: 'UAE',
    UTMSource: 'Facebook Lead Ads',
    Education: 'Bachelor',
    DestinationCountry: 'Canada',
    LeadSource: 'Facebook Lead Ads',
    roundrobin: 'true',
  };
  return deliverToCrm(samplePayload);
}
