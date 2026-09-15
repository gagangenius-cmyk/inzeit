CREATE TABLE IF NOT EXISTS crm_forum_leads_remarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `lead` INT NOT NULL,
  `date` DATE NULL,
  remark TEXT NULL,
  emp INT NOT NULL DEFAULT 0,
  created TIME NULL,
  `status` INT NOT NULL DEFAULT 1,
  INDEX idx_lead_remarks_lead (`lead`),
  INDEX idx_lead_remarks_emp (emp),
  INDEX idx_lead_remarks_date (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
