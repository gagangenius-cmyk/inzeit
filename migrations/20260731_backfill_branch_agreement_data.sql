-- Backfill the real trade-licence/registration numbers and VAT/GST rates for
-- the 5 known branches, taken from their signed "Agreement for Advisory
-- Services" PDFs. license_number/vat_gst_percent already exist (see
-- 20260711_add_branch_license_vat_gst.sql) but were never populated, so
-- branchTax.ts/receiptTemplate.ts/the agreement renderer all fell back to
-- blank/guessed values. Matched by `abbrv`, the stable branch key already
-- used by resolveBranchCurrency (src/lib/branchCurrency.ts) and
-- branchAgreementProfiles.ts.
UPDATE crm_branch SET license_number = '766222', vat_gst_percent = 5.00 WHERE abbrv = 'DXB SZR';
UPDATE crm_branch SET license_number = 'CN-2539189', vat_gst_percent = 5.00 WHERE abbrv = 'AUH';
UPDATE crm_branch SET license_number = '2019/36987', vat_gst_percent = 0.00 WHERE abbrv = 'KWD';
UPDATE crm_branch SET license_number = '133895', vat_gst_percent = 0.00 WHERE abbrv = 'DOH old airport rd';
UPDATE crm_branch SET vat_gst_percent = 18.00 WHERE abbrv = 'HYD';
