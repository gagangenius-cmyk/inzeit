-- Company now operates a single branch. Removed Abu Dhabi (id 1), Kuwait
-- (id 3), Doha Old Airport Road (id 4), and Hyderabad (id 5) from
-- crm_branch, keeping only Dubai SZR (id 2).
--
-- Blast-radius check before running (see INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- for every FK referencing crm_branch): crm_employee (10 rows, all already
-- branch=2), appointments (1 row, already branch=2), and
-- crm_forum_leads/crm_branch_exchange_rate_map (0 rows) needed no cleanup.
-- crm_fee was the only table with real rows on the removed branches (121 of
-- 170 rows) — deleted first since it holds the only FK into crm_branch with
-- live non-Dubai data.
--
-- scripts/seed-branches.js, scripts/seed-employees.js and
-- scripts/seed-fees.js were updated in the same change to stop
-- creating/expecting these branches, so re-running the seeders won't bring
-- them back.

DELETE FROM crm_fee WHERE branch != 2;
DELETE FROM crm_branch WHERE id != 2;
