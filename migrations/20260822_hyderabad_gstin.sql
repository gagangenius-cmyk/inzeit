-- Backfill the Hyderabad branch's GST registration number. The 5 Gulf
-- branches all got license_number set in 20260731_backfill_branch_agreement_data.sql,
-- but Hyderabad only got vat_gst_percent — license_number (which doubles as
-- the GSTIN field on receipts/agreements, see receiptTemplate.ts and
-- indiaAgreementTemplate.ts) was left blank, so the Hyderabad tax invoice
-- printed "Not on file" for its GSTIN. Matched by `abbrv`, the stable branch
-- key already used by resolveBranchCurrency (src/lib/branchCurrency.ts) and
-- branchAgreementProfiles.ts.
UPDATE crm_branch SET license_number = '36AAGCD8611D2ZU' WHERE abbrv = 'HYD';
