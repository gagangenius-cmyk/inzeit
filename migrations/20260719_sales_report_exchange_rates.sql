-- Sales Report (Accounts) needs a way to normalize each branch's local-currency
-- sales figures into a single AED total. crm_currency.rate is keyed by country
-- for fee pricing and is never used as an AED conversion factor anywhere in
-- the app, so it isn't reused here. This adds a dedicated, admin-editable
-- exchange rate table plus a branch->rate mapping table so the mapping can be
-- changed later without touching the rate definitions themselves. A branch
-- absent from the mapping table defaults to AED (rate 1).
CREATE TABLE IF NOT EXISTS crm_exchange_rate (
  id INT AUTO_INCREMENT PRIMARY KEY,
  currency_code VARCHAR(10) NOT NULL UNIQUE,
  rate_to_aed DECIMAL(12,6) NOT NULL DEFAULT 1.000000,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO crm_exchange_rate (currency_code, rate_to_aed, status)
SELECT 'AED', 1.000000, 1
WHERE NOT EXISTS (SELECT 1 FROM crm_exchange_rate WHERE currency_code = 'AED');

CREATE TABLE IF NOT EXISTS crm_branch_exchange_rate_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL UNIQUE,
  exchange_rate_id INT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ber_branch FOREIGN KEY (branch_id) REFERENCES crm_branch(id) ON DELETE CASCADE,
  CONSTRAINT fk_ber_rate FOREIGN KEY (exchange_rate_id) REFERENCES crm_exchange_rate(id) ON DELETE RESTRICT
);
