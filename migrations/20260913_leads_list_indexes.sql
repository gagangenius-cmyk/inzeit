-- src/app/api/leads/route.ts filters by status/priority/region/lead_quality
-- and every list query sorts ORDER BY l.created DESC, but crm_forum_leads
-- had no index on any of these columns (only branch/Counsilor/assignTo/
-- case_officer/country_interest/service_interest/market_source are
-- indexed) - a full table scan + filesort on the single most-used list
-- page at any real production lead volume.
ALTER TABLE crm_forum_leads
  ADD INDEX idx_forum_leads_status (status),
  ADD INDEX idx_forum_leads_priority (priority),
  ADD INDEX idx_forum_leads_region (region),
  ADD INDEX idx_forum_leads_lead_quality (lead_quality),
  ADD INDEX idx_forum_leads_created (created),
  ADD INDEX idx_forum_leads_branch_status_created (branch, status, created);
