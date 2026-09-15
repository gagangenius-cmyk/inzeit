import type { MetaRawLead, MetaCampaign } from './types';

function apiVersion(): string {
  return process.env.META_GRAPH_API_VERSION || 'v21.0';
}

function pageToken(): string {
  const t = process.env.META_PAGE_ACCESS_TOKEN;
  if (!t) throw new Error('META_PAGE_ACCESS_TOKEN is not configured');
  return t;
}

const BASE = 'https://graph.facebook.com';

/** Fetches a single lead record from Meta Graph API */
export async function fetchLeadFromMeta(leadgenId: string): Promise<MetaRawLead> {
  const fields = [
    'id', 'created_time', 'page_id', 'ad_id', 'adset_id', 'campaign_id', 'form_id', 'field_data',
  ].join(',');

  const url = `${BASE}/${apiVersion()}/${leadgenId}?fields=${fields}&access_token=${pageToken()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Meta Graph API error ${res.status}: ${errText}`);
  }

  return res.json() as Promise<MetaRawLead>;
}

/** Fetches lead form details (name) from Meta Graph API */
export async function fetchFormName(formId: string): Promise<string | null> {
  try {
    const url = `${BASE}/${apiVersion()}/${formId}?fields=name&access_token=${pageToken()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = await res.json() as { name?: string };
    return data.name ?? null;
  } catch {
    return null;
  }
}

/** Fetches campaign info from Meta Marketing API */
export async function fetchCampaigns(adAccountId: string): Promise<MetaCampaign[]> {
  const fields = 'id,name,status,objective,daily_budget,lifetime_budget,insights{spend,impressions,clicks}';
  const results: MetaCampaign[] = [];
  let nextUrl: string | null =
    `${BASE}/${apiVersion()}/act_${adAccountId}/campaigns?fields=${fields}&limit=100&access_token=${pageToken()}`;

  // Handle pagination
  while (nextUrl) {
    const res = await fetch(nextUrl, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Meta Marketing API error ${res.status}: ${err}`);
    }
    const data = await res.json() as { data: MetaCampaign[]; paging?: { next?: string } };
    results.push(...(data.data ?? []));
    nextUrl = data.paging?.next ?? null;
  }

  return results;
}

/** Verifies the configured access token is valid */
export async function testMetaConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const token = pageToken();
    const url = `${BASE}/${apiVersion()}/me?fields=id,name&access_token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, message: `API returned ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = await res.json() as { id?: string; name?: string };
    return { ok: true, message: `Connected as: ${data.name ?? data.id ?? 'unknown'}` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
