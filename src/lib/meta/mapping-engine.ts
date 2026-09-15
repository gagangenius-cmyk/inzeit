import type { MetaLeadParsed, MetaLeadMapping, CrmPayload } from './types';

/** Applies a simple transform to a field value */
function applyTransform(value: string, transformType: string | null): string {
  if (!transformType || !value) return value;
  switch (transformType.toLowerCase()) {
    case 'uppercase': return value.toUpperCase();
    case 'lowercase': return value.toLowerCase();
    case 'trim': return value.trim();
    case 'phone_e164':
      // Strip non-digit characters then prefix + if not present
      return value.replace(/[^\d+]/g, '').replace(/^(?!\+)/, '+');
    default: return value;
  }
}

/**
 * Parses Meta field_data array into a flat map.
 * field_data: [{name: "email", values: ["a@b.com"]}, ...]
 */
export function parseFieldData(fieldData: Array<{ name: string; values: string[] }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fieldData) {
    const value = f.values?.[0] ?? '';
    // Store by canonical name AND by label (lowercase normalized)
    const key = f.name.toLowerCase().replace(/[\s-]/g, '_');
    map[key] = value;
  }
  return map;
}

/**
 * Selects the effective mappings for a lead, respecting priority:
 *   Form mapping > Campaign mapping > Global mapping
 */
function selectEffectiveMappings(
  mappings: MetaLeadMapping[],
  campaignId: string | null,
  formId: string | null,
): MetaLeadMapping[] {
  const enabled = mappings.filter(m => m.is_enabled === 1);
  const byField = new Map<string, MetaLeadMapping>();

  // Apply in ascending priority (global first, then overridden by campaign, then form)
  const global   = enabled.filter(m => m.scope_type === 'GLOBAL');
  const campaign = enabled.filter(m => m.scope_type === 'CAMPAIGN' && m.campaign_id === campaignId);
  const form     = enabled.filter(m => m.scope_type === 'FORM' && m.form_id === formId);

  for (const m of [...global, ...campaign, ...form]) {
    byField.set(m.crm_field_key, m);
  }

  return Array.from(byField.values());
}

/**
 * Builds the CRM payload from a parsed Meta lead using the effective mapping rules.
 */
export function buildCrmPayload(
  lead: MetaLeadParsed,
  mappings: MetaLeadMapping[],
  defaultBranch: string | null,
): CrmPayload {
  const effective = selectEffectiveMappings(mappings, lead.campaignId, lead.formId);
  const fields = lead.fields;

  // Built-in synthetic fields that can be referenced by meta_field_key
  const synthetic: Record<string, string> = {
    '__utm_source': 'Facebook Lead Ads',
    '__lead_source': 'Facebook Lead Ads',
    '__roundrobin': 'true',
    '__campaign_id': lead.campaignId ?? '',
    '__campaign_name': lead.campaignName ?? '',
    '__form_id': lead.formId ?? '',
    '__form_name': lead.formName ?? '',
    '__page_id': lead.pageId ?? '',
    '__ad_id': lead.adId ?? '',
    '__adset_id': lead.adsetId ?? '',
  };

  const payload: CrmPayload = {
    lastName: '',
    email: '',
    phone: '',
    UTMSource: 'Facebook Lead Ads',
    LeadSource: 'Facebook Lead Ads',
    roundrobin: 'true',
  };

  for (const mapping of effective) {
    const key = mapping.meta_field_key;

    // Look up value: fields map → synthetic map → fallback
    let value: string =
      fields[key] ??
      fields[key.toLowerCase().replace(/[\s-]/g, '_')] ??
      synthetic[key] ??
      mapping.fallback_value ??
      '';

    // Special handling: construct full_name from parts if missing
    if (key === 'full_name' && !value) {
      const first = fields['first_name'] ?? '';
      const last  = fields['last_name'] ?? '';
      value = [first, last].filter(Boolean).join(' ');
    }

    if (value) {
      value = applyTransform(value, mapping.transform_type);
    }

    if (value || mapping.fallback_value) {
      payload[mapping.crm_field_key] = value || (mapping.fallback_value ?? '');
    }
  }

  // Ensure required fields have sensible defaults
  if (!payload.lastName && lead.fullName) payload.lastName = lead.fullName;
  if (!payload.email && lead.email) payload.email = lead.email;
  if (!payload.phone && lead.phone) payload.phone = lead.phone;

  // Apply the default branch from settings when not mapped
  if (!payload.Branch && defaultBranch) {
    payload.Branch = defaultBranch;
  }

  return payload;
}
