-- New leads should enter the CRM unassigned; only FOE/Branch Manager/CEO
-- assign them afterward via the Lead Pool / Assign Lead flows. assignTo,
-- Counsilor and case_officer were NOT NULL, which forced every intake path
-- (web-to-leads, Meta leads, lead-intake, Excel import) to immediately
-- round-robin the lead to a real employee -- including a silent fallback to
-- employee id 1 when nobody was checked in. Making these nullable lets a
-- lead genuinely have no owner until a human assigns one.
ALTER TABLE crm_forum_leads
  MODIFY assignTo INT NULL,
  MODIFY Counsilor INT NULL,
  MODIFY case_officer INT NULL;
