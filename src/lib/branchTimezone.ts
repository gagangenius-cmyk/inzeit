import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { UAE_BRANCH_KEYWORDS } from '@/lib/branchCurrency';

// crm_branch.branch holds the country name as free text (see branchCurrency.ts
// for the same pattern used to resolve currency) - map the countries this
// company actually operates in to their IANA zone. Falls back to Asia/Dubai
// (UAE HQ) for anything unrecognized rather than UTC, since every known
// branch is several hours ahead of UTC and UTC would just reintroduce the
// original "server-local time" bug for an unmapped branch.
const COUNTRY_TIMEZONES: Array<{ pattern: RegExp; timeZone: string }> = [
  { pattern: new RegExp(UAE_BRANCH_KEYWORDS, 'i'), timeZone: 'Asia/Dubai' },
  { pattern: /kuwait/i, timeZone: 'Asia/Kuwait' },
  { pattern: /qatar|doha/i, timeZone: 'Asia/Qatar' },
  { pattern: /india|hyderabad/i, timeZone: 'Asia/Kolkata' },
];

const DEFAULT_TIMEZONE = 'Asia/Dubai';

export function resolveCountryTimezone(countryText: string | null | undefined): string {
  const text = String(countryText || '');
  for (const { pattern, timeZone } of COUNTRY_TIMEZONES) {
    if (pattern.test(text)) return timeZone;
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Resolves the IANA timezone of the branch an employee belongs to, so
 * attendance/clock-in timestamps reflect the employee's local wall-clock
 * time rather than whatever timezone the app server happens to run in
 * (commonly UTC on cloud hosts, which put every clock-in hours off).
 */
export async function resolveEmployeeTimezone(employeeId: string | number): Promise<string> {
  const [row] = await sequelize.query<{ branchCountry: string | null }>(
    `SELECT b.branch AS branchCountry
     FROM crm_employee e
     LEFT JOIN crm_branch b ON b.id = e.branch
     WHERE e.id = :employeeId
     LIMIT 1`,
    { replacements: { employeeId }, type: QueryTypes.SELECT }
  );
  return resolveCountryTimezone(row?.branchCountry);
}

/**
 * Formats `date` as wall-clock date/time in `timeZone`, matching the
 * `YYYY-MM-DD` / `HH:MM:SS` shapes the DATE/TIME columns expect.
 */
export function formatInTimezone(date: Date, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}:${get('second')}`,
  };
}
