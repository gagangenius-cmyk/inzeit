-- The Edit Lead form (src/app/admin/leads/[id]/edit/page.tsx) has always
-- rendered inputs for salutation, suffix, address state/postal code, age,
-- UTM tracking, re-enquiry tracking, call-attempt tracking, and a few
-- boolean flags (chat/bot lead, roundrobin, whatsapp opt-in), but none of
-- these ever had a backing column on crm_forum_leads — every edit to them
-- was silently discarded on save. Add the columns so PUT /api/leads/[id]
-- can actually persist them.
ALTER TABLE crm_forum_leads
  ADD COLUMN salutation VARCHAR(10) NULL,
  ADD COLUMN suffix VARCHAR(20) NULL,
  ADD COLUMN state VARCHAR(100) NULL,
  ADD COLUMN postal_code VARCHAR(20) NULL,
  ADD COLUMN age INT NULL,
  ADD COLUMN utm_source VARCHAR(255) NULL,
  ADD COLUMN utm_medium VARCHAR(255) NULL,
  ADD COLUMN gclid VARCHAR(255) NULL,
  ADD COLUMN re_enquiry TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN re_enquiry_counter INT NOT NULL DEFAULT 0,
  ADD COLUMN call_attempt_1 DATETIME NULL,
  ADD COLUMN call_back_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN call_attempts_deadline DATETIME NULL,
  ADD COLUMN watnot_bot TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN roundrobin TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN whatsapp TINYINT(1) NOT NULL DEFAULT 0;
