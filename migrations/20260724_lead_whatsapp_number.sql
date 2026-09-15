-- The Add/Edit Lead forms have a "WhatsApp Number" input, but it previously
-- just aliased the existing `mobile` column (same data, different label).
-- Give it a real, distinct column so a lead can have a WhatsApp number that
-- differs from their mobile number, and so the lead list can link straight
-- to a WhatsApp chat with it.
ALTER TABLE crm_forum_leads
  ADD COLUMN whatsapp_number VARCHAR(50) NULL;
