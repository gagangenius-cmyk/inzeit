-- Self-healing backfill for crm_opportunities.product_type: the create-time fix in
-- src/app/api/lead-to-opportunity/route.ts (deriveProductTypeFromLabel in
-- src/lib/clientPortalProducts.ts) stops all *future* opportunities from being created with
-- product_type NULL, but does nothing for opportunities already created between 2026-07-28 (when
-- product_type was added by migrations/20260728_client_portal_products.sql) and that fix
-- shipping. This migration re-runs the exact same regex UPDATEs from that migration (same
-- order/patterns, verbatim) so any row that slipped through - regardless of when it was created -
-- gets product_type filled in.
-- Confirmed via read-only prod query: opportunity ids 55, 60, 61 (leadIds 2134, 2172, 2178) were
-- NULL and match a pattern below. Id 61 (leadId 2178) is already finance+compliance approved with
-- status='won', so this immediately unblocks that client's "No active product yet" client-portal
-- bug without waiting for an app deploy.
-- MySQL 8 compatible. Idempotent: every UPDATE is scoped to `product_type IS NULL`, so re-running
-- this file (or all of scripts/setup-database.js) is always safe. Rows whose serviceType/
-- serviceRequired don't match any pattern (e.g. "Consulting Service", "SINP") are left NULL on
-- purpose - there's no safe generic guess and no corresponding client-portal product.
-- Keep this pattern list, migrations/20260728_client_portal_products.sql's pattern list, and
-- src/lib/clientPortalProducts.ts's deriveProductTypeFromLabel() in sync if patterns ever change.

UPDATE crm_opportunities
SET product_type = 'eip'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'eip|express entry|economic immigration';

UPDATE crm_opportunities
SET product_type = 'student-visa'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'student|study permit|university';

UPDATE crm_opportunities
SET product_type = 'visit-visa'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'visit visa|visitor visa|tourist visa|trv';

UPDATE crm_opportunities
SET product_type = 'rms'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'resume marketing|rms';

UPDATE crm_opportunities
SET product_type = 'australia-pr'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'australia';

UPDATE crm_opportunities
SET product_type = 'canada-pr'
WHERE product_type IS NULL
  AND LOWER(CONCAT(COALESCE(serviceType, ''), ' ', COALESCE(serviceRequired, ''))) REGEXP 'skilled|permanent residence|canada';
