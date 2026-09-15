-- Payment schedules for installment/milestone-based opportunities.
-- Created from DmOpportunityPaymentSchedule model.
CREATE TABLE IF NOT EXISTS crm_opportunity_payment_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT NOT NULL,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status ENUM('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
  paid_date DATE NULL,
  receipt_number VARCHAR(100) NULL,
  receipt_url VARCHAR(500) NULL,
  notes TEXT NULL,
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_schedule_opportunity (opportunity_id),
  INDEX idx_payment_schedule_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
