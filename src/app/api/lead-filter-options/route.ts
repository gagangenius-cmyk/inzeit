import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

interface RawOption {
  value: string | number | null;
  label?: string | null;
  region?: string | number | null;
}

interface FilterOption {
  value: string;
  label: string;
  region?: string;
}

let dbInitialized = false;

const ensureDBConnection = async () => {
  if (!dbInitialized) {
    await connectDB();
    dbInitialized = true;
  }
};

// 'untouched' (lowercase) matches the literal value every lead-creation path
// writes for an unassigned lead (see src/lib/leadRemarks.ts's recordLeadAssignment
// and the various lead-creation routes) — keep the casing identical here so
// this fallback option's value lines up with what's actually stored.
const baseStatuses = ['untouched', 'New', 'Contacted', 'Qualified', 'Converted', 'Closed'];
const basePriorities = ['Hot', 'Warm', 'Cold', 'High', 'Medium', 'Low'];
const baseLeadQualities = ['Hot', 'Warm', 'Cold'];

const addOption = (map: Map<string, FilterOption>, value: unknown, label?: unknown, region?: unknown) => {
  if (value === null || value === undefined || String(value).trim() === '') return;

  const optionValue = String(value).trim();
  const optionLabel = label === null || label === undefined || String(label).trim() === ''
    ? optionValue
    : String(label).trim();

  if (!map.has(optionValue)) {
    map.set(optionValue, {
      value: optionValue,
      label: optionLabel,
      ...(region === null || region === undefined || String(region).trim() === '' ? {} : { region: String(region).trim() })
    });
  }
};

const toOptions = (rows: RawOption[], defaults: string[] = []) => {
  const map = new Map<string, FilterOption>();
  defaults.forEach((value) => addOption(map, value));
  rows.forEach((row) => addOption(map, row.value, row.label, row.region));
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
};

// Callers sometimes pass a human-readable country name instead of the
// numeric crm_country_proces id (e.g. from a lead's saved country_interest) -
// resolve by name in that case, mirroring resolveId in admin/fees/lookup.
const resolveCountryId = async (value: string): Promise<number | null> => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const rows = await sequelize.query<{ id: number }>(
    'SELECT id FROM crm_country_proces WHERE LOWER(name) = LOWER(:name) LIMIT 1',
    { replacements: { name: value }, type: QueryTypes.SELECT }
  );
  return rows[0]?.id ?? null;
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    await ensureDBConnection();

    const { searchParams } = new URL(request.url);
    const countryParam = searchParams.get('country');

    // Optional country scoping for services/programs: crm_fee is the only
    // table that actually links a program to the destination country it's
    // priced/offered for (crm_service itself has no country column). Only
    // engaged when a country is passed - every existing caller of this route
    // (main Leads filter bar, Add/Edit Lead form) gets the same full,
    // unscoped service list as before.
    let countryScopedServices: RawOption[] | null = null;
    if (countryParam) {
      const countryId = await resolveCountryId(countryParam);
      if (countryId) {
        countryScopedServices = await sequelize.query<RawOption>(
          `SELECT DISTINCT s.id AS value, s.name AS label
           FROM crm_service s
           INNER JOIN crm_fee f ON f.service = s.id AND f.status = 1
           WHERE s.status = 1 AND (f.country = :countryId OR f.country IS NULL)
           ORDER BY s.name ASC`,
          { replacements: { countryId }, type: QueryTypes.SELECT }
        );
      } else {
        countryScopedServices = [];
      }
    }

    const [
      statuses,
      priorities,
      leadQualities,
      branches,
      regions,
      countries,
      countryValues,
      programTypes,
      services,
      serviceValues,
      sources,
      sourceValues
    ] = await Promise.all([
      sequelize.query<RawOption>(
        "SELECT DISTINCT status as value FROM crm_forum_leads WHERE status IS NOT NULL AND status <> ''",
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        "SELECT DISTINCT priority as value FROM crm_forum_leads WHERE priority IS NOT NULL AND priority <> ''",
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        "SELECT DISTINCT lead_quality as value FROM crm_forum_leads WHERE lead_quality IS NOT NULL AND lead_quality <> ''",
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        'SELECT id as value, branch as label, region FROM crm_branch WHERE status = 1 ORDER BY branch ASC',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        'SELECT id as value, name as label FROM crm_region WHERE status = 1 ORDER BY name ASC',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        'SELECT id as value, name as label FROM crm_country_proces WHERE status = 1 ORDER BY name ASC',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        "SELECT DISTINCT country_interest as value FROM crm_forum_leads WHERE country_interest IS NOT NULL AND country_interest <> ''",
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        'SELECT id as value, type as label FROM crm_program_type WHERE status = 1 ORDER BY type ASC',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        'SELECT id as value, name as label FROM crm_service WHERE status = 1 ORDER BY name ASC',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        "SELECT DISTINCT service_interest as value FROM crm_forum_leads WHERE service_interest IS NOT NULL AND service_interest <> ''",
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        'SELECT id as value, name as label FROM crm_source WHERE status = 1 ORDER BY name ASC',
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<RawOption>(
        "SELECT DISTINCT market_source as value FROM crm_forum_leads WHERE market_source IS NOT NULL AND market_source <> ''",
        { type: QueryTypes.SELECT }
      )
    ]);

    const countryMap = new Map<string, FilterOption>();
    countries.forEach((row) => addOption(countryMap, row.value, row.label));
    countryValues.forEach((row) => addOption(countryMap, row.value));

    let serviceOptions: FilterOption[];
    if (countryScopedServices !== null) {
      const scopedMap = new Map<string, FilterOption>();
      countryScopedServices.forEach((row) => addOption(scopedMap, row.value, row.label));
      serviceOptions = Array.from(scopedMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    } else {
      const serviceMap = new Map<string, FilterOption>();
      programTypes.forEach((row) => addOption(serviceMap, row.value, row.label));
      services.forEach((row) => addOption(serviceMap, row.value, row.label));
      serviceValues.forEach((row) => addOption(serviceMap, row.value));
      serviceOptions = Array.from(serviceMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    const sourceMap = new Map<string, FilterOption>();
    sources.forEach((row) => addOption(sourceMap, row.value, row.label));
    sourceValues.forEach((row) => addOption(sourceMap, row.value));

    return NextResponse.json({
      statuses: toOptions(statuses, baseStatuses),
      priorities: toOptions(priorities, basePriorities),
      branches: toOptions(branches),
      regions: toOptions(regions),
      countries: Array.from(countryMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      services: serviceOptions,
      sources: Array.from(sourceMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      leadQualities: toOptions(leadQualities, baseLeadQualities)
    });
  } catch (error) {
    console.error('Error fetching lead filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead filter options' },
      { status: 500 }
    );
  }
}
