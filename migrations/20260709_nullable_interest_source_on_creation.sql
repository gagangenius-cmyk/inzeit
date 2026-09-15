-- The Add Lead form's Program Country/Program/Program Type ("Interest") and
-- Lead Source ("Source") dropdowns are optional -- neither client-side nor
-- server-side validation requires them. But country_interest, service_interest,
-- and market_source were NOT NULL, so POST /api/leads silently fell back to
-- fake defaults ('Canada', 'Student Visa', 'Website') whenever they were left
-- unselected, making every unselected lead look like real interest data. Making
-- these nullable lets a lead genuinely have no interest/source recorded until
-- someone actually picks one.
--
-- Idempotent replay: migration 20260712_backfill_lead_interest_source_references
-- later converts these columns to INT and adds FK constraints to the lookup
-- tables. If this file is replayed after that one has already run once, MySQL
-- refuses the MODIFY-to-VARCHAR below because an active FK depends on the
-- column's type (ER_FK_INCOMPATIBLE_COLUMNS). Drop those FKs first -- if they
-- don't exist yet (fresh database), the DROP fails with
-- ER_CANT_DROP_FIELD_OR_KEY, which the migration runner already tolerates as
-- a no-op. 20260712 recreates the FKs afterward either way.
ALTER TABLE crm_forum_leads DROP FOREIGN KEY fk_dmc_forum_leads_country_interest;
ALTER TABLE crm_forum_leads DROP FOREIGN KEY fk_dmc_forum_leads_service_interest;
ALTER TABLE crm_forum_leads DROP FOREIGN KEY fk_dmc_forum_leads_market_source;

ALTER TABLE crm_forum_leads
  MODIFY country_interest VARCHAR(555) NULL,
  MODIFY service_interest VARCHAR(555) NULL,
  MODIFY market_source VARCHAR(555) NULL;
