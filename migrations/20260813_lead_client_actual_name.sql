-- Client Actual Name: captured as a mandatory field on the Documents stage of
-- the Opportunity Flow wizard (client-provided legal name, which can differ
-- from the lead's fname/lname on file) — this is the name that must appear
-- on the generated agreement and receipt instead of fname+lname.

SET @lead_schema := DATABASE();

SET @lead_sql := IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @lead_schema AND table_name = 'crm_forum_leads' AND column_name = 'client_actual_name') = 0,
  'ALTER TABLE crm_forum_leads ADD COLUMN client_actual_name VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE lead_statement FROM @lead_sql; EXECUTE lead_statement; DEALLOCATE PREPARE lead_statement;
