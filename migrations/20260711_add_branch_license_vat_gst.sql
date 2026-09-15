-- Per-branch tax treatment (Opportunity Flow > Quotation) previously guessed
-- VAT/GST from the billing currency, then from branch name substring
-- matching (kuwait/qatar/abu dhabi/india keywords) - fragile since crm_branch
-- had no dedicated column for it. Add an explicit, admin-editable rate per
-- branch (Dubai/Abu Dhabi 5% VAT, India 18% GST, Qatar/Kuwait 0%), plus the
-- branch's trade license number since it's the natural companion field for
-- tax configuration and is already needed on receipts/invoices.
ALTER TABLE crm_branch
  ADD COLUMN license_number VARCHAR(100) NULL,
  ADD COLUMN vat_gst_percent DECIMAL(5,2) NULL;
