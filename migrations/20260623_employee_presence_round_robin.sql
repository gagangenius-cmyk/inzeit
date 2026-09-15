-- Round-robin eligibility is based on an employee being checked in today.
CREATE TABLE IF NOT EXISTS crm_employee_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  ip_address VARCHAR(255) NULL,
  device VARCHAR(255) NULL,
  agent TEXT NULL,
  login_time DATETIME NULL,
  logout_time DATETIME NULL,
  total_hours FLOAT NULL,
  short_fall FLOAT NULL,
  remarks TEXT NULL,
  watch_by INT NULL,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT NOT NULL DEFAULT 1,
  checkin INT NOT NULL DEFAULT 0,
  checkout INT NOT NULL DEFAULT 0,
  logout_ip_address VARCHAR(255) NULL,
  extra_hours FLOAT NULL,
  INDEX idx_employee_attendance_presence (emp_id, created, checkin, checkout)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
