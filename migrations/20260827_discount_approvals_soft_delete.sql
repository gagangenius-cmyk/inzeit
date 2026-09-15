-- Lets a counselor re-apply for a discount when the original request/approval
-- was wrong (wrong amount, mis-approved, etc). Re-applying soft-deletes the
-- old crm_discount_approvals row immediately (superseded, not visible in any
-- active list) and creates a fresh row via the normal POST flow (same
-- tiering/auto-approval logic), so there's never more than one "live"
-- discount entry for a lead/opportunity at a time.
ALTER TABLE crm_discount_approvals ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE crm_discount_approvals ADD COLUMN superseded_by INT NULL;
CREATE INDEX idx_dm_discount_approvals_lead_active ON crm_discount_approvals (leadId, is_deleted);
