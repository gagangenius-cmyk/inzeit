CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadid INT NULL,
  date VARCHAR(50) NULL,
  appointtime TIME NOT NULL DEFAULT '09:00:00',
  counsilorid INT NULL,
  booked INT NULL DEFAULT 1,
  done INT NULL DEFAULT 0,
  not_done INT NULL DEFAULT 0,
  region INT NULL,
  branch INT NOT NULL DEFAULT 0,
  screenshot VARCHAR(255) NOT NULL DEFAULT '',
  second_done INT NOT NULL DEFAULT 0,
  second_meet_date DATE NULL,
  INDEX idx_appointments_lead (leadid),
  INDEX idx_appointments_counselor (counsilorid),
  INDEX idx_appointments_date (date),
  INDEX idx_appointments_branch (branch),
  INDEX idx_appointments_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_follow_up_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  user_id INT NOT NULL,
  reminder_date DATETIME NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_followups_lead (lead_id),
  INDEX idx_followups_user (user_id),
  INDEX idx_followups_status (status),
  INDEX idx_followups_priority (priority),
  INDEX idx_followups_reminder_date (reminder_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crm_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
