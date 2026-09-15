import { revalidateTag } from 'next/cache';

// Shared cache-tag vocabulary for Next.js's built-in data cache
// (unstable_cache), used to cache the expensive dashboard/report
// aggregates in src/app/api/admin/dashboard, /api/analytics,
// /api/monitoring, /api/reports* etc. Previously every one of those routes
// recomputed its full aggregation from scratch on every single request -
// no caching layer of any kind existed anywhere in this codebase.
//
// Each cached query function (defined per-route with `unstable_cache(fn,
// [key], { tags, revalidate })`, Next's own documented pattern - see any of
// the routes above) is tagged with whichever of these describe the tables
// it reads. `invalidateReportCaches()` is called from the handful of
// high-traffic write choke points every mutation already funnels through
// (insertLeadRecord, recordLeadAssignment - see their own call sites) so a
// lead being created/reassigned/status-changed shows up immediately rather
// than waiting out the revalidate window. The per-route `revalidate`
// seconds is the safety-net upper bound on staleness for every write path
// that *isn't* explicitly hooked (most payment/appointment mutations) -
// pick something reasonable per route, not "revalidate: false".
export const CACHE_TAGS = {
  leads: 'data:leads',
  appointments: 'data:appointments',
  payments: 'data:payments',
  employees: 'data:employees',
  targets: 'data:targets',
} as const;

export type ReportCacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

export function invalidateReportCaches(tags: ReportCacheTag[]): void {
  for (const tag of tags) {
    try {
      // This Next.js build's revalidateTag requires an explicit cache-life
      // "profile" as a second argument (newer signature than the classic
      // single-arg revalidateTag docs still describe) - { expire: 0 } says
      // "this tag's data is stale as of now", which is exactly on-demand
      // invalidation's intent. Verified empirically (see the live cache
      // test run alongside this change) that a call immediately after this
      // one is treated as a cache miss rather than serving stale data.
      revalidateTag(tag, { expire: 0 });
    } catch (error) {
      // revalidateTag throws if called outside a request/action context in
      // some Next.js execution modes (e.g. a cron tick) - never let a cache
      // invalidation failure break the write it's attached to.
      console.error(`Failed to revalidate cache tag "${tag}":`, error);
    }
  }
}
