-- IT Support Ticketing module schema
-- MySQL 8 compatible. Safe to run more than once for table creation.

CREATE TABLE IF NOT EXISTS crm_it_tickets (
  id CHAR(36) PRIMARY KEY,
  ticket_seq INT NOT NULL AUTO_INCREMENT UNIQUE,
  ticket_number VARCHAR(30) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category ENUM('Laptop / Desktop Hardware', 'Access & Accounts', 'New Procurement', 'Network & Internet', 'Email & Communication', 'Software & Licensing') NOT NULL,
  priority ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  estimated_cost_aed DECIMAL(12,2) NULL,
  raised_by INT NOT NULL,
  branch_id INT NOT NULL,
  status ENUM('Open', 'Resolved', 'Closed', 'Rejected') NOT NULL DEFAULT 'Open',
  workflow_status ENUM('IT Manager Review', 'Branch Manager Review', 'Director Review', 'Assigned', 'In Progress', 'Resolved Awaiting Confirmation', 'Closed', 'Rejected') NOT NULL DEFAULT 'IT Manager Review',
  requires_branch_approval BOOLEAN NOT NULL DEFAULT false,
  requires_director_approval BOOLEAN NOT NULL DEFAULT false,
  it_manager_id INT NULL,
  it_manager_status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  it_manager_reviewed_at DATETIME NULL,
  it_manager_comment TEXT NULL,
  branch_manager_id INT NULL,
  branch_manager_status ENUM('Pending', 'Approved', 'Rejected', 'Not Required') NOT NULL DEFAULT 'Not Required',
  branch_manager_reviewed_at DATETIME NULL,
  branch_manager_comment TEXT NULL,
  director_id INT NULL,
  director_status ENUM('Pending', 'Approved', 'Rejected', 'Not Required') NOT NULL DEFAULT 'Not Required',
  director_reviewed_at DATETIME NULL,
  director_comment TEXT NULL,
  assigned_to INT NULL,
  assigned_by INT NULL,
  assigned_at DATETIME NULL,
  in_progress_at DATETIME NULL,
  resolved_by INT NULL,
  resolved_at DATETIME NULL,
  resolution_notes TEXT NULL,
  confirmed_by INT NULL,
  confirmed_at DATETIME NULL,
  closed_at DATETIME NULL,
  reopened_count INT NOT NULL DEFAULT 0,
  rejected_by INT NULL,
  rejected_at DATETIME NULL,
  rejected_stage VARCHAR(40) NULL,
  rejection_reason TEXT NULL,
  due_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_it_ticket_number (ticket_number),
  INDEX idx_it_tickets_status (status),
  INDEX idx_it_tickets_workflow_status (workflow_status),
  INDEX idx_it_tickets_branch (branch_id),
  INDEX idx_it_tickets_raised_by (raised_by),
  INDEX idx_it_tickets_assigned_to (assigned_to),
  INDEX idx_it_tickets_priority (priority),
  INDEX idx_it_tickets_due_at (due_at),
  INDEX idx_it_tickets_category (category)
);

CREATE TABLE IF NOT EXISTS crm_it_ticket_comments (
  id CHAR(36) PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  author_id INT NOT NULL,
  comment_type ENUM('Comment', 'StatusChange', 'System') NOT NULL DEFAULT 'Comment',
  body TEXT NOT NULL,
  old_value VARCHAR(120) NULL,
  new_value VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_it_ticket_comments_ticket (ticket_id, created_at)
);

CREATE TABLE IF NOT EXISTS crm_it_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_by INT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO crm_it_settings (setting_key, setting_value) VALUES ('director_approval_threshold_aed', '2000');
