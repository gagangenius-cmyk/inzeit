import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

type LeadReferenceTable = 'crm_country_proces' | 'crm_service' | 'crm_source';

type LeadReferenceSpec = {
  table: LeadReferenceTable;
  label: string;
};

const referenceSpecs: Record<string, LeadReferenceSpec> = {
  country_interest: { table: 'crm_country_proces', label: 'country interest' },
  service_interest: { table: 'crm_service', label: 'service interest' },
  market_source: { table: 'crm_source', label: 'market source' },
};

const referenceAliases: Partial<Record<string, Record<string, string[]>>> = {
  country_interest: {
    uk: ['United Kingdom'],
    'u.k.': ['United Kingdom'],
    'u.k': ['United Kingdom'],
    gb: ['United Kingdom'],
    'great britain': ['United Kingdom'],
    'united states': ['USA', 'United States of America'],
    'united states of america': ['USA', 'United States of America'],
    us: ['USA', 'United States of America'],
    'u.s.': ['USA', 'United States of America'],
    'u.s': ['USA', 'United States of America'],
  },
  market_source: {
    'livechat seo': ['Livechat - SEO'],
    'live chat seo': ['Livechat - SEO'],
    'livechat - seo': ['Livechat - SEO'],
    'livechat google ads': ['Livechat - Google Ads'],
    'live chat google ads': ['Livechat - Google Ads'],
    'livechat - google ads': ['Livechat - Google Ads'],
    // The bare word "WhatsApp" has no exact crm_source row of its own - only
    // the prefixed variants below exist - so it must be aliased or every
    // imported row using it silently fails to resolve and gets dropped.
    whatsapp: ['WhatsApp (Direct)', 'WhatsApp Ads', 'WhatsApp SEO'],
  },
};

function isBlankReference(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

export async function resolveLeadReferenceId(field: string, value: unknown): Promise<number | null> {
  if (isBlankReference(value)) return null;

  const spec = referenceSpecs[field];
  if (!spec) {
    throw new Error(`Unsupported lead reference field: ${field}`);
  }

  const rawValue = String(value).trim();
  const numericValue = Number(rawValue);
  const nameCandidates = [rawValue, ...(referenceAliases[field]?.[rawValue.toLowerCase()] || [])];

  if (Number.isInteger(numericValue) && numericValue > 0 && String(numericValue) === rawValue) {
    const [row] = await sequelize.query<{ id: number }>(
      `SELECT id FROM ${spec.table} WHERE id = :id LIMIT 1`,
      { replacements: { id: numericValue }, type: QueryTypes.SELECT }
    );
    if (row?.id) return row.id;
  }

  const [row] = await sequelize.query<{ id: number }>(
    `SELECT id FROM ${spec.table} WHERE LOWER(TRIM(name)) IN (:names) LIMIT 1`,
    {
      replacements: { names: nameCandidates.map((name) => name.toLowerCase()) },
      type: QueryTypes.SELECT,
    }
  );

  if (!row?.id) {
    throw new Error(`No matching ${spec.label} found for "${rawValue}"`);
  }

  return row.id;
}

export async function resolveLeadReferences<T extends Record<string, unknown>>(data: T): Promise<T> {
  const resolved = { ...data };

  for (const field of Object.keys(referenceSpecs)) {
    if (Object.prototype.hasOwnProperty.call(resolved, field)) {
      resolved[field as keyof T] = await resolveLeadReferenceId(field, resolved[field]) as T[keyof T];
    }
  }

  return resolved;
}
