-- Lead Pool: turns the existing "unassigned lead" concept (assignTo IS NULL,
-- already used by src/app/api/admin/lead-pool/route.ts's bulk-transfer tool)
-- into a genuine self-serve claim queue for individual agents, with an SLA
-- fallback to round-robin auto-assignment if nobody claims a lead in time.
--
-- pool_entered_at marks *when* a lead most recently became poolable. It is
-- deliberately left NULL for a brand-new unassigned lead (crm_forum_leads.created
-- is already an equally valid "entered the pool at" timestamp for that case,
-- and every read path here uses COALESCE(pool_entered_at, created) rather than
-- requiring every lead-creation call site to additionally stamp this column) -
-- it is only ever written explicitly when a manager manually releases an
-- already-owned lead back into the pool (src/lib/leadPool.ts releaseToPool()),
-- since for that case `created` would be stale and make the lead look far
-- more overdue than it really is.
ALTER TABLE crm_forum_leads ADD COLUMN pool_entered_at DATETIME NULL;

-- Powers both the SLA sweep's WHERE clause and the pool list's ORDER BY.
CREATE INDEX idx_leads_pool_lookup ON crm_forum_leads (assignTo, pool_entered_at, created);
