-- The Opportunity Flow wizard (src/app/admin/leads/opportunity-flow-wizard.tsx)
-- only ever tracked which stage a lead was on in local component state, so
-- reopening the wizard always restarted at "Prospect" even after a counselor
-- had already progressed to Payment/Documents/etc. Persist the furthest-reached
-- stage id here so counselor/Branch Manager/CEO all see the same current stage
-- whenever they open this lead's opportunity flow.
ALTER TABLE crm_forum_leads
  ADD COLUMN opportunity_stage VARCHAR(30) NULL;
