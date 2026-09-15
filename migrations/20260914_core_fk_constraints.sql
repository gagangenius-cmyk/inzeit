-- Adds referential integrity to core deal/money/audit tables that had zero
-- FK protection (confirmed via INFORMATION_SCHEMA.KEY_COLUMN_USAGE - only
-- 51 real FK constraints existed against 171 FK-shaped columns schema-wide).
--
-- ON DELETE choices are deliberate, not uniform:
--   - RESTRICT wherever the column is NOT NULL (mandatory attribution, e.g.
--     createdBy/requestedBy/fromEmployeeId/generated_by) or is a money-table
--     lead/opportunity reference - you cannot delete an employee who is the
--     mandatory actor on a real historical record, or a lead/opportunity
--     that still has payment/discount history, without first dealing with
--     it explicitly. This is the DB-level backstop for the same caution
--     already applied by hand in this project's employee-deletion work
--     (deactivate by default; hard-delete only after verifying no real
--     history references the row).
--   - SET NULL only on columns that are already nullable and are pure
--     "nice to know who" attribution (accountantId, approvedBy) - losing
--     that on a deleted employee is acceptable, the record itself survives.
--   - CASCADE only on crm_notifications.user_id (a personal inbox has no
--     reason to survive its owner) and crm_lead_reassignments.leadId
--     (reassignment history for a lead that no longer exists at all isn't
--     independently meaningful, mirroring crm_forum_leads' own cascade on
--     assignTo/case_officer/Counsilor).
--
-- The HR module's employee_id columns (crm_hr_leave_requests,
-- crm_hr_payslips, crm_hr_employee_compensation, crm_hr_employee_documents,
-- crm_hr_employee_letters, crm_hr_eosb_settlements, crm_hr_exit_*,
-- crm_hr_recruitment_candidates) are deliberately NOT touched here - they
-- are CHAR(36) UUIDs generated independently at HR onboarding
-- (src/services/hr-joining-exit-service.ts's onboardCandidate(), which does
-- `crypto.randomUUID()`), not foreign keys to crm_employee.id (an INTEGER).
-- Adding a real FK there is not a missing-constraint fix - it would require
-- first reconciling two incompatible identity schemes, which is a separate,
-- much larger data-migration project. crm_hr_letter_log.generated_by is the
-- one HR-adjacent column that IS a real INTEGER crm_employee.id reference,
-- so it's included below.

ALTER TABLE crm_opportunities ADD CONSTRAINT fk_opportunities_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT;
-- assignedTo/createdBy are NOT NULL here (unlike the nullable accountantId/
-- approvedBy columns elsewhere), so RESTRICT rather than SET NULL.
ALTER TABLE crm_opportunities ADD CONSTRAINT fk_opportunities_assigned_to FOREIGN KEY (assignedTo) REFERENCES crm_employee(id) ON DELETE RESTRICT;
ALTER TABLE crm_opportunities ADD CONSTRAINT fk_opportunities_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT;

ALTER TABLE crm_opportunity_payments ADD CONSTRAINT fk_opp_payments_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT;
ALTER TABLE crm_opportunity_payments ADD CONSTRAINT fk_opp_payments_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE RESTRICT;
ALTER TABLE crm_opportunity_payments ADD CONSTRAINT fk_opp_payments_accountant FOREIGN KEY (accountantId) REFERENCES crm_employee(id) ON DELETE SET NULL;
ALTER TABLE crm_opportunity_payments ADD CONSTRAINT fk_opp_payments_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT;

ALTER TABLE crm_discount_approvals ADD CONSTRAINT fk_discount_approvals_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE RESTRICT;
ALTER TABLE crm_discount_approvals ADD CONSTRAINT fk_discount_approvals_opportunity FOREIGN KEY (opportunityId) REFERENCES crm_opportunities(id) ON DELETE RESTRICT;
ALTER TABLE crm_discount_approvals ADD CONSTRAINT fk_discount_approvals_requested_by FOREIGN KEY (requestedBy) REFERENCES crm_employee(id) ON DELETE RESTRICT;
ALTER TABLE crm_discount_approvals ADD CONSTRAINT fk_discount_approvals_approved_by FOREIGN KEY (approvedBy) REFERENCES crm_employee(id) ON DELETE SET NULL;
ALTER TABLE crm_discount_approvals ADD CONSTRAINT fk_discount_approvals_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT;

ALTER TABLE crm_lead_reassignments ADD CONSTRAINT fk_lead_reassignments_lead FOREIGN KEY (leadId) REFERENCES crm_forum_leads(id) ON DELETE CASCADE;
ALTER TABLE crm_lead_reassignments ADD CONSTRAINT fk_lead_reassignments_from_employee FOREIGN KEY (fromEmployeeId) REFERENCES crm_employee(id) ON DELETE RESTRICT;
ALTER TABLE crm_lead_reassignments ADD CONSTRAINT fk_lead_reassignments_to_employee FOREIGN KEY (toEmployeeId) REFERENCES crm_employee(id) ON DELETE RESTRICT;
ALTER TABLE crm_lead_reassignments ADD CONSTRAINT fk_lead_reassignments_created_by FOREIGN KEY (createdBy) REFERENCES crm_employee(id) ON DELETE RESTRICT;
ALTER TABLE crm_lead_reassignments ADD CONSTRAINT fk_lead_reassignments_approved_by FOREIGN KEY (approvedBy) REFERENCES crm_employee(id) ON DELETE SET NULL;

ALTER TABLE crm_notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES crm_employee(id) ON DELETE CASCADE;

ALTER TABLE crm_hr_letter_log ADD CONSTRAINT fk_hr_letter_log_generated_by FOREIGN KEY (generated_by) REFERENCES crm_employee(id) ON DELETE RESTRICT;
