CREATE TABLE IF NOT EXISTS crm_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permission_key VARCHAR(120) NOT NULL UNIQUE,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(40) NOT NULL,
  label VARCHAR(160) NOT NULL,
  description TEXT NULL,
  status INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dm_permissions_module (module),
  INDEX idx_dm_permissions_status (status)
);

CREATE TABLE IF NOT EXISTS crm_role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  status INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_dm_role_permission (role_id, permission_id),
  INDEX idx_dm_role_permissions_role (role_id),
  INDEX idx_dm_role_permissions_permission (permission_id),
  INDEX idx_dm_role_permissions_status (status)
);
