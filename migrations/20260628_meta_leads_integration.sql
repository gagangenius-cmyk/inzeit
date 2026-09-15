-- Meta Lead Ads Integration Schema
-- MySQL 8 compatible. Safe to run more than once (CREATE TABLE IF NOT EXISTS).
-- Run: mysql -u <user> -p <database> < migrations/20260628_meta_leads_integration.sql

-- ── 1. Integration Settings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_meta_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  is_enabled TINYINT(1) NOT NULL DEFAULT 0,
  page_id VARCHAR(64) NULL,
  page_name VARCHAR(255) NULL,
  ad_account_id VARCHAR(64) NULL,
  graph_api_version VARCHAR(16) NOT NULL DEFAULT 'v21.0',
  default_branch VARCHAR(128) NULL,
  default_lead_source VARCHAR(128) NOT NULL DEFAULT 'Facebook Lead Ads',
  default_utm_source VARCHAR(128) NOT NULL DEFAULT 'Facebook Lead Ads',
  last_webhook_at DATETIME NULL,
  last_campaign_sync_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert a default settings row so there is always exactly one row
INSERT IGNORE INTO crm_meta_settings (id, is_enabled) VALUES (1, 0);

-- ── 2. Webhook Events (raw receipt queue) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_meta_webhook_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 of raw payload for deduplication',
  leadgen_id VARCHAR(64) NULL,
  page_id VARCHAR(64) NULL,
  form_id VARCHAR(64) NULL,
  campaign_id VARCHAR(64) NULL,
  adset_id VARCHAR(64) NULL,
  ad_id VARCHAR(64) NULL,
  raw_payload JSON NOT NULL,
  signature_validated TINYINT(1) NOT NULL DEFAULT 0,
  processing_status ENUM('pending','processing','processed','failed') NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  INDEX idx_mwe_leadgen (leadgen_id),
  INDEX idx_mwe_status (processing_status),
  INDEX idx_mwe_received (received_at),
  UNIQUE KEY uq_mwe_hash (event_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Normalized Meta Leads ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_meta_leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meta_lead_id VARCHAR(64) NOT NULL COMMENT 'leadgen_id from Meta',
  webhook_event_id INT UNSIGNED NULL,
  page_id VARCHAR(64) NULL,
  form_id VARCHAR(64) NULL,
  form_name VARCHAR(255) NULL,
  campaign_id VARCHAR(64) NULL,
  campaign_name VARCHAR(255) NULL,
  adset_id VARCHAR(64) NULL,
  adset_name VARCHAR(255) NULL,
  ad_id VARCHAR(64) NULL,
  ad_name VARCHAR(255) NULL,
  full_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  raw_lead_data JSON NULL COMMENT 'Full Meta Graph API response',
  normalized_lead_data JSON NULL COMMENT 'Computed CRM payload before delivery',
  meta_created_time DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ml_meta_lead_id (meta_lead_id),
  INDEX idx_ml_email (email),
  INDEX idx_ml_phone (phone),
  INDEX idx_ml_campaign (campaign_id),
  INDEX idx_ml_form (form_id),
  INDEX idx_ml_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Field Mappings (global / campaign / form scope) ─────────────────────
CREATE TABLE IF NOT EXISTS crm_meta_lead_mappings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scope_type ENUM('GLOBAL','CAMPAIGN','FORM') NOT NULL DEFAULT 'GLOBAL',
  campaign_id VARCHAR(64) NULL COMMENT 'Only set when scope_type = CAMPAIGN',
  form_id VARCHAR(64) NULL COMMENT 'Only set when scope_type = FORM',
  meta_field_key VARCHAR(255) NOT NULL COMMENT 'Meta field name or custom question label',
  crm_field_key VARCHAR(128) NOT NULL COMMENT 'CRM payload field name',
  fallback_value VARCHAR(512) NULL COMMENT 'Used when Meta field is missing',
  transform_type VARCHAR(64) NULL COMMENT 'e.g. uppercase, trim, phone_e164',
  is_enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mlm_scope (scope_type, campaign_id, form_id),
  INDEX idx_mlm_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default system mappings
INSERT IGNORE INTO crm_meta_lead_mappings
  (scope_type, meta_field_key, crm_field_key, fallback_value, is_enabled, sort_order)
VALUES
  ('GLOBAL', 'full_name',           'lastName',          NULL,                 1,  1),
  ('GLOBAL', 'email',               'email',             NULL,                 1,  2),
  ('GLOBAL', 'phone_number',        'phone',             NULL,                 1,  3),
  ('GLOBAL', 'age_range',           'AgeRange',          NULL,                 1,  4),
  ('GLOBAL', 'immigration_type',    'ImmigrationType',   NULL,                 1,  5),
  ('GLOBAL', 'country',             'ResidentCountry',   NULL,                 1,  6),
  ('GLOBAL', 'education',           'Education',         NULL,                 1,  7),
  ('GLOBAL', 'destination_country', 'DestinationCountry',NULL,                 1,  8),
  ('GLOBAL', '__utm_source',        'UTMSource',         'Facebook Lead Ads',  1,  9),
  ('GLOBAL', '__lead_source',       'LeadSource',        'Facebook Lead Ads',  1, 10),
  ('GLOBAL', '__roundrobin',        'roundrobin',        'true',               1, 11);

-- ── 5. CRM Delivery Attempts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_meta_lead_deliveries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meta_lead_id INT UNSIGNED NOT NULL,
  crm_endpoint VARCHAR(512) NOT NULL,
  request_payload JSON NOT NULL,
  response_status SMALLINT UNSIGNED NULL,
  response_body TEXT NULL,
  status ENUM('pending','processing','delivered','failed','retry_scheduled') NOT NULL DEFAULT 'pending',
  retry_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_retry_at DATETIME NULL,
  last_error TEXT NULL,
  delivered_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mld_meta_lead (meta_lead_id),
  INDEX idx_mld_status (status),
  INDEX idx_mld_next_retry (next_retry_at),
  CONSTRAINT fk_mld_meta_lead FOREIGN KEY (meta_lead_id) REFERENCES crm_meta_leads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Campaign Cache ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_meta_campaign_cache (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id VARCHAR(64) NOT NULL,
  campaign_name VARCHAR(255) NULL,
  status VARCHAR(32) NULL,
  objective VARCHAR(64) NULL,
  daily_budget DECIMAL(14,2) NULL,
  lifetime_budget DECIMAL(14,2) NULL,
  spend DECIMAL(14,2) NULL DEFAULT 0,
  impressions INT UNSIGNED NULL DEFAULT 0,
  clicks INT UNSIGNED NULL DEFAULT 0,
  leads_count INT UNSIGNED NOT NULL DEFAULT 0,
  raw_data JSON NULL,
  last_synced_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_mcc_campaign_id (campaign_id),
  INDEX idx_mcc_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
