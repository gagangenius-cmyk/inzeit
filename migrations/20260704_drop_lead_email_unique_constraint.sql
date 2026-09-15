-- The "duplicate leads" feature needs a second lead with the same email/mobile
-- to be createable (and then flagged as a duplicate) rather than rejected
-- outright. crm_forum_leads.email carries a UNIQUE index (`email`) that blocks
-- this; a second, non-unique index (`email_2`) already covers lookup
-- performance, so the unique one is safe to drop.
ALTER TABLE crm_forum_leads DROP INDEX `email`;

-- Same problem on `mobile`: it's UNIQUE with no secondary index, and most
-- imported/manually-created leads leave it blank, so two such leads already
-- collide on the empty string today. Drop the unique constraint.
ALTER TABLE crm_forum_leads DROP INDEX `mobile`;
