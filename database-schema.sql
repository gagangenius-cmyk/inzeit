-- Global Navigator CRM — current schema
-- Generated from the live database on 2026-09-12
-- Contains only the 155 tables actually used by the app (crm_ naming).

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table: appointments
-- ----------------------------
CREATE TABLE `appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadid` int DEFAULT NULL,
  `date` varchar(50) DEFAULT NULL,
  `appointtime` time NOT NULL DEFAULT '09:00:00',
  `counsilorid` int DEFAULT NULL,
  `booked` int DEFAULT '1',
  `done` int DEFAULT '0',
  `not_done` int DEFAULT '0',
  `region` int DEFAULT NULL,
  `branch` int NOT NULL DEFAULT '0',
  `screenshot` varchar(255) NOT NULL DEFAULT '',
  `second_done` int NOT NULL DEFAULT '0',
  `second_meet_date` date DEFAULT NULL,
  `meeting_status` varchar(20) DEFAULT NULL,
  `meeting_verified` tinyint DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `foe_remark` varchar(500) DEFAULT NULL,
  `remarks` text,
  `cross_branch` tinyint(1) NOT NULL DEFAULT '0',
  `assigned_branch` int DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `acknowledged` tinyint(1) NOT NULL DEFAULT '0',
  `acknowledged_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_appointments_lead` (`leadid`),
  KEY `idx_appointments_counselor` (`counsilorid`),
  KEY `idx_appointments_date` (`date`),
  KEY `idx_appointments_branch` (`branch`),
  KEY `idx_appointments_region` (`region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: branch_target
-- ----------------------------
CREATE TABLE `branch_target` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch` int DEFAULT NULL,
  `month` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `appointment` int DEFAULT NULL,
  `sales` int DEFAULT NULL,
  `leads` int DEFAULT NULL,
  `target_date_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `counsilorid` (`branch`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: client_status
-- ----------------------------
CREATE TABLE `client_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadid` int DEFAULT NULL,
  `type` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `date` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `file` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `counselorid` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `leadid` (`leadid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_3party_payment
-- ----------------------------
CREATE TABLE `crm_3party_payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `date` date DEFAULT NULL,
  `currency_id` int NOT NULL,
  `amount` double(10,2) NOT NULL DEFAULT '0.00',
  `Tax` double(20,2) NOT NULL DEFAULT '0.00',
  `payMethod` varchar(55) DEFAULT NULL,
  `emp_id` int NOT NULL DEFAULT '0',
  `receipt_date` datetime NOT NULL,
  `cc_number` varchar(50) NOT NULL,
  `receipt` varchar(255) NOT NULL,
  `counselor_receipt` varchar(255) NOT NULL,
  `trans_or_ref_number` varchar(255) NOT NULL,
  `remarks` longtext NOT NULL,
  `payoption` varchar(100) NOT NULL,
  `paycardoption` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `leadId` (`leadId`),
  KEY `leadId_2` (`leadId`),
  CONSTRAINT `crm_3party_payment_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_3party_payment_det
-- ----------------------------
CREATE TABLE `crm_3party_payment_det` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payId` int NOT NULL,
  `particular` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `payId` (`payId`),
  CONSTRAINT `crm_3party_payment_det_ibfk_1` FOREIGN KEY (`payId`) REFERENCES `crm_3party_payment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_accounts
-- ----------------------------
CREATE TABLE `crm_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_no` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bank_address` varchar(1024) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bank_beneficiary` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `iban` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `branch_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_additional_documents
-- ----------------------------
CREATE TABLE `crm_additional_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `document` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_auto_reassignment_rules
-- ----------------------------
CREATE TABLE `crm_auto_reassignment_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(255) NOT NULL,
  `description` text,
  `inactive_hours_threshold` int NOT NULL DEFAULT '6',
  `auto_reassign` tinyint(1) NOT NULL DEFAULT '1',
  `reassign_to_role` varchar(50) NOT NULL DEFAULT 'available',
  `reassign_to_branch` int NOT NULL DEFAULT '0',
  `priority_filter` varchar(50) NOT NULL DEFAULT '',
  `lead_quality_filter` varchar(100) NOT NULL DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_auto_reassignment_runs
-- ----------------------------
CREATE TABLE `crm_auto_reassignment_runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `processed` int NOT NULL DEFAULT '0',
  `reassigned` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_b2b
-- ----------------------------
CREATE TABLE `crm_b2b` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_b2b_invoices
-- ----------------------------
CREATE TABLE `crm_b2b_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `region` int DEFAULT NULL,
  `receipt` varchar(255) NOT NULL,
  `branch` int DEFAULT NULL,
  `company` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `purpose` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `narration` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `vat` int DEFAULT NULL,
  `taxAmt` int DEFAULT NULL,
  `totPayAmt` int DEFAULT NULL,
  `payBalance` double(10,2) NOT NULL,
  `payment_mode` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `discount` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `created` date DEFAULT NULL,
  `Counsilor` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_batch
-- ----------------------------
CREATE TABLE `crm_batch` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `vendor_id` int NOT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_branch
-- ----------------------------
CREATE TABLE `crm_branch` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(555) NOT NULL,
  `ar_name` longtext CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL,
  `branch` varchar(75) NOT NULL,
  `region` int NOT NULL,
  `abbrv` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `ar_address` longtext CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL,
  `email` varchar(555) NOT NULL,
  `mobile` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `website` varchar(255) NOT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `vat_gst_percent` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_branch_allocations
-- ----------------------------
CREATE TABLE `crm_branch_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `branches` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_branch_allocations_employee` (`emp_id`),
  KEY `idx_branch_allocations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_branch_exchange_rate_map
-- ----------------------------
CREATE TABLE `crm_branch_exchange_rate_map` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `exchange_rate_id` int NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_id` (`branch_id`),
  KEY `fk_ber_rate` (`exchange_rate_id`),
  CONSTRAINT `fk_ber_branch` FOREIGN KEY (`branch_id`) REFERENCES `crm_branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ber_rate` FOREIGN KEY (`exchange_rate_id`) REFERENCES `crm_exchange_rate` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_call_requests
-- ----------------------------
CREATE TABLE `crm_call_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `lead_id` int DEFAULT NULL,
  `opportunity_id` int DEFAULT NULL,
  `requested_by` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `is_high_escalation` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_call_requests_branch` (`branch_id`),
  KEY `idx_call_requests_status` (`status`),
  KEY `idx_call_requests_lead` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_campaigns
-- ----------------------------
CREATE TABLE `crm_campaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaign` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_client_checklist_stages
-- ----------------------------
CREATE TABLE `crm_client_checklist_stages` (
  `stage_id` char(36) NOT NULL,
  `opportunity_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `product_type` varchar(40) NOT NULL,
  `stage_key` varchar(60) NOT NULL,
  `stage_label` varchar(150) NOT NULL,
  `sequence` int NOT NULL,
  `status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  `status_note` text,
  `completed_at` datetime DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stage_id`),
  UNIQUE KEY `uniq_client_checklist_stage` (`opportunity_id`,`stage_key`),
  KEY `idx_client_checklist_lead` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_client_conversations
-- ----------------------------
CREATE TABLE `crm_client_conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `opportunity_id` int DEFAULT NULL,
  `case_manager` int NOT NULL,
  `chat_from_client` int NOT NULL,
  `client_id` int NOT NULL,
  `text` longtext CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `file` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `status` int NOT NULL,
  `read_msg` int NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `leadId` (`leadId`),
  KEY `idx_client_conversations_lead_opp` (`leadId`,`opportunity_id`),
  CONSTRAINT `crm_client_conversations_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_client_credentials
-- ----------------------------
CREATE TABLE `crm_client_credentials` (
  `client_credential_id` char(36) NOT NULL,
  `lead_id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `temporary_password` varchar(255) DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('active','revoked') NOT NULL DEFAULT 'active',
  `generated_by` char(36) DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`client_credential_id`),
  UNIQUE KEY `uniq_client_credential_lead` (`lead_id`),
  UNIQUE KEY `uniq_client_credential_email` (`email`),
  KEY `idx_client_credential_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_client_documents
-- ----------------------------
CREATE TABLE `crm_client_documents` (
  `document_id` char(36) NOT NULL,
  `lead_id` int NOT NULL,
  `opportunity_id` int DEFAULT NULL,
  `checklist_key` varchar(100) NOT NULL,
  `document_label` varchar(255) NOT NULL,
  `mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `accepted_formats` varchar(255) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `status` enum('Pending','Submitted','Approved','Rejected','Resubmit Requested') NOT NULL DEFAULT 'Pending',
  `reviewer_id` char(36) DEFAULT NULL,
  `review_note` text,
  `uploaded_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  UNIQUE KEY `uniq_client_document_item` (`lead_id`,`opportunity_id`,`checklist_key`),
  KEY `idx_client_document_lead` (`lead_id`),
  KEY `idx_client_document_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_client_form_submissions
-- ----------------------------
CREATE TABLE `crm_client_form_submissions` (
  `submission_id` char(36) NOT NULL,
  `lead_id` int NOT NULL,
  `opportunity_id` int DEFAULT NULL,
  `form_key` varchar(60) NOT NULL,
  `form_data` longtext NOT NULL,
  `status` enum('submitted','reviewed') NOT NULL DEFAULT 'submitted',
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`submission_id`),
  KEY `idx_form_submissions_lead` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_client_logs
-- ----------------------------
CREATE TABLE `crm_client_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `log` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_client_profile_change_requests
-- ----------------------------
CREATE TABLE `crm_client_profile_change_requests` (
  `request_id` char(36) NOT NULL,
  `lead_id` int NOT NULL,
  `field` varchar(60) NOT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `requested_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `idx_profile_change_lead` (`lead_id`),
  KEY `idx_profile_change_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_client_status_log
-- ----------------------------
CREATE TABLE `crm_client_status_log` (
  `log_id` char(36) NOT NULL,
  `lead_id` int NOT NULL,
  `opportunity_id` int DEFAULT NULL,
  `posted_by` char(36) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_client_status_log_lead` (`lead_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_client_upload_checklist_items
-- ----------------------------
CREATE TABLE `crm_client_upload_checklist_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `portal_id` int NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '1',
  `status` enum('pending','uploaded','verified','rejected') NOT NULL DEFAULT 'pending',
  `file_url` varchar(500) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_client_checklist_portal` (`portal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_client_upload_portals
-- ----------------------------
CREATE TABLE `crm_client_upload_portals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` varchar(40) NOT NULL,
  `lead_id` int NOT NULL,
  `opportunity_id` int DEFAULT NULL,
  `agreement_number` varchar(100) DEFAULT NULL,
  `access_token` char(64) NOT NULL,
  `status` enum('active','closed','expired') NOT NULL DEFAULT 'active',
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_id` (`client_id`),
  UNIQUE KEY `access_token` (`access_token`),
  KEY `idx_client_portal_lead` (`lead_id`),
  KEY `idx_client_portal_opportunity` (`opportunity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_clients
-- ----------------------------
CREATE TABLE `crm_clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `first_name` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `last_name` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `email` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `image` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `dob` date NOT NULL,
  `address` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `full_address` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `token` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `token_validity` datetime NOT NULL,
  `verify` int NOT NULL,
  `password` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `hash_password` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `status` int NOT NULL,
  `accept` int NOT NULL,
  `created` date NOT NULL,
  `case_manager` int NOT NULL,
  `backend_person` int NOT NULL,
  `is_deleted` int NOT NULL,
  `city` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `nationality` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `leadId` (`leadId`),
  CONSTRAINT `crm_clients_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_coa_accounts
-- ----------------------------
CREATE TABLE `crm_coa_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `name` varchar(150) NOT NULL,
  `group_name` varchar(50) NOT NULL,
  `nature` enum('DR','CR') NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_contract_file
-- ----------------------------
CREATE TABLE `crm_contract_file` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country` int NOT NULL,
  `service` int NOT NULL,
  `file` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_counsilor_allocations
-- ----------------------------
CREATE TABLE `crm_counsilor_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `counsilors` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_counsilor_allocations_branch` (`branch_id`),
  KEY `idx_counsilor_allocations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_countries_type_program
-- ----------------------------
CREATE TABLE `crm_countries_type_program` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country` int NOT NULL,
  `type` int NOT NULL,
  `program` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_country_proces
-- ----------------------------
CREATE TABLE `crm_country_proces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `sub_counteries` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_crm_entries
-- ----------------------------
CREATE TABLE `crm_crm_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `opportunityId` int DEFAULT NULL,
  `entry_type` varchar(60) NOT NULL DEFAULT 'Direct Inquiry',
  `source` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sub_category` varchar(150) DEFAULT NULL,
  `service` varchar(150) DEFAULT NULL,
  `budget` varchar(100) DEFAULT NULL,
  `timeline` varchar(100) DEFAULT NULL,
  `expectations` text,
  `urgency` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `status` enum('initial_contact','qualification','consultation','proposal','agreement','onboarding','completed') NOT NULL DEFAULT 'initial_contact',
  `assigned_to` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_entries_lead` (`leadId`),
  KEY `idx_crm_entries_opportunity` (`opportunityId`),
  KEY `idx_crm_entries_status` (`status`),
  KEY `idx_crm_entries_assigned` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_crm_entry_documents
-- ----------------------------
CREATE TABLE `crm_crm_entry_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entry_id` int NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `status` enum('pending','submitted','approved','rejected') NOT NULL DEFAULT 'pending',
  `file_url` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_crm_entry_document` (`entry_id`,`document_type`),
  KEY `idx_crm_doc_entry` (`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_crm_entry_milestones
-- ----------------------------
CREATE TABLE `crm_crm_entry_milestones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entry_id` int NOT NULL,
  `phase` varchar(150) NOT NULL,
  `status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_milestone_entry` (`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_crm_entry_notes
-- ----------------------------
CREATE TABLE `crm_crm_entry_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entry_id` int NOT NULL,
  `note` text NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_note_entry` (`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_crm_entry_requirements
-- ----------------------------
CREATE TABLE `crm_crm_entry_requirements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entry_id` int NOT NULL,
  `requirement` varchar(500) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crm_req_entry` (`entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_currency
-- ----------------------------
CREATE TABLE `crm_currency` (
  `id` int NOT NULL AUTO_INCREMENT,
  `country` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `currency_code` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `rate` float(10,2) NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_department
-- ----------------------------
CREATE TABLE `crm_department` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_discount_approvals
-- ----------------------------
CREATE TABLE `crm_discount_approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `opportunityId` int DEFAULT NULL,
  `discountType` varchar(30) NOT NULL DEFAULT 'percentage',
  `discountAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `originalAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discountedAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) NOT NULL DEFAULT 'AED',
  `reason` text NOT NULL,
  `requestedBy` int NOT NULL,
  `approvedBy` int DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `requestedDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approvedDate` datetime DEFAULT NULL,
  `rejectedDate` datetime DEFAULT NULL,
  `expiryDate` datetime DEFAULT NULL,
  `notes` text,
  `approvedAt` datetime DEFAULT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `superseded_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_discount_lead` (`leadId`),
  KEY `idx_discount_status` (`status`),
  KEY `idx_dm_discount_approvals_lead_active` (`leadId`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_email_templates
-- ----------------------------
CREATE TABLE `crm_email_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `template` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `status` int NOT NULL,
  `ops` int NOT NULL,
  `sales` int NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_employee
-- ----------------------------
CREATE TABLE `crm_employee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(555) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cemail` varchar(50) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `cmobile` varchar(255) DEFAULT NULL,
  `paddress` longtext,
  `address` varchar(555) DEFAULT NULL,
  `photo` varchar(555) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `role` int DEFAULT NULL,
  `vendor_id` int NOT NULL,
  `branch` int DEFAULT NULL,
  `region` int DEFAULT NULL,
  `username` varchar(555) DEFAULT NULL,
  `password` varchar(555) DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  `ppNo` varchar(255) DEFAULT NULL,
  `visaExp` date DEFAULT NULL,
  `department` int DEFAULT NULL,
  `EID` text,
  `doj` date DEFAULT NULL,
  `nationality` varchar(555) DEFAULT NULL,
  `dol` varchar(50) DEFAULT NULL,
  `remark` text,
  `labexp` varchar(50) DEFAULT NULL,
  `bounce` int DEFAULT NULL,
  `em_local_name` varchar(255) DEFAULT NULL,
  `em_home_name` varchar(255) DEFAULT NULL,
  `em_local_number` varchar(255) DEFAULT NULL,
  `em_home_number` varchar(255) DEFAULT NULL,
  `religion` varchar(200) NOT NULL,
  `gender` varchar(200) NOT NULL,
  `crea` int NOT NULL,
  `wfh` int NOT NULL,
  `work_location` enum('Onshore','Offshore','Remote-UAE','GCC-Branch') NOT NULL DEFAULT 'Onshore',
  `work_country` varchar(255) DEFAULT 'UAE',
  `work_city` varchar(255) DEFAULT NULL,
  `work_site` varchar(255) DEFAULT NULL,
  `employment_type` enum('Full-time','Contract','Freelance','Part-time') NOT NULL DEFAULT 'Full-time',
  `manager_id` int DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `dm_employee_role_fk` (`role`),
  KEY `idx_dm_employee_manager` (`manager_id`),
  CONSTRAINT `dm_employee_role_fk` FOREIGN KEY (`role`) REFERENCES `crm_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_employee_access_log
-- ----------------------------
CREATE TABLE `crm_employee_access_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `action` enum('frozen','restored') NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `actor_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dm_employee_access_log_employee` (`employee_id`,`created_at`),
  KEY `fk_dm_employee_access_log_actor` (`actor_id`),
  CONSTRAINT `fk_dm_employee_access_log_actor` FOREIGN KEY (`actor_id`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dm_employee_access_log_employee` FOREIGN KEY (`employee_id`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_employee_attendance
-- ----------------------------
CREATE TABLE `crm_employee_attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `ip_address` varchar(100) NOT NULL,
  `device` varchar(255) NOT NULL,
  `agent` longtext NOT NULL,
  `login_time` time NOT NULL,
  `logout_time` time NOT NULL,
  `total_hours` double(10,2) NOT NULL,
  `short_fall` double(10,2) NOT NULL,
  `remarks` longtext NOT NULL,
  `watch_by` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `checkin` int NOT NULL,
  `checkout` int NOT NULL,
  `logout_ip_address` varchar(255) NOT NULL,
  `extra_hours` double(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_employer
-- ----------------------------
CREATE TABLE `crm_employer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(555) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `paddress` longtext,
  `vendor_id` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `website` varchar(100) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_europe_cases_verification
-- ----------------------------
CREATE TABLE `crm_europe_cases_verification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `passports_for_eu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `os_for_eu` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ops_status` int NOT NULL,
  `ops_approval` int NOT NULL,
  `ops_remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ops` int NOT NULL,
  `manager` int NOT NULL,
  `manager_status` int NOT NULL,
  `manager_approval` int NOT NULL,
  `manager_remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `approval_date` date NOT NULL,
  `rejection_date` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_evaluation_report_documents
-- ----------------------------
CREATE TABLE `crm_evaluation_report_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `document_label` varchar(255) NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','uploaded','verified','rejected') NOT NULL DEFAULT 'uploaded',
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `review_note` text,
  PRIMARY KEY (`id`),
  KEY `fk_eval_report_doc_uploader` (`uploaded_by`),
  KEY `fk_eval_report_doc_verifier` (`verified_by`),
  KEY `idx_eval_report_doc_lead` (`lead_id`),
  KEY `idx_eval_report_doc_status` (`status`),
  CONSTRAINT `fk_eval_report_doc_lead` FOREIGN KEY (`lead_id`) REFERENCES `crm_forum_leads` (`id`),
  CONSTRAINT `fk_eval_report_doc_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `crm_employee` (`id`),
  CONSTRAINT `fk_eval_report_doc_verifier` FOREIGN KEY (`verified_by`) REFERENCES `crm_employee` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_evaluation_reports
-- ----------------------------
CREATE TABLE `crm_evaluation_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `eligibility_summary` text NOT NULL,
  `fee_paid` decimal(10,2) NOT NULL,
  `discount_applied` decimal(10,2) NOT NULL DEFAULT '0.00',
  `receipt_number` varchar(255) DEFAULT NULL,
  `generated_by` int NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_eval_report_generator` (`generated_by`),
  KEY `idx_eval_report_lead` (`lead_id`),
  CONSTRAINT `fk_eval_report_generator` FOREIGN KEY (`generated_by`) REFERENCES `crm_employee` (`id`),
  CONSTRAINT `fk_eval_report_lead` FOREIGN KEY (`lead_id`) REFERENCES `crm_forum_leads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_exchange_rate
-- ----------------------------
CREATE TABLE `crm_exchange_rate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `currency_code` varchar(10) NOT NULL,
  `rate_to_aed` decimal(12,6) NOT NULL DEFAULT '1.000000',
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `currency_code` (`currency_code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_expense
-- ----------------------------
CREATE TABLE `crm_expense` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `particular` varchar(555) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `vat` decimal(10,2) NOT NULL,
  `addBy` int NOT NULL,
  `remark` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `region` int NOT NULL,
  `branch` int NOT NULL,
  `receipt` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `is_approval` int NOT NULL,
  `mgmt_approval` int NOT NULL,
  `expense_type` int NOT NULL,
  `transaction_type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `coa_account_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_expense_coa` (`coa_account_id`),
  CONSTRAINT `fk_expense_coa` FOREIGN KEY (`coa_account_id`) REFERENCES `crm_coa_accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- ----------------------------
-- Table: crm_fee
-- ----------------------------
CREATE TABLE `crm_fee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service` int DEFAULT NULL,
  `country` int DEFAULT NULL,
  `branch` int DEFAULT NULL,
  `currency` int DEFAULT NULL,
  `upfront` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prof_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `firstMonth` decimal(10,2) NOT NULL DEFAULT '0.00',
  `secondMonth` decimal(10,2) NOT NULL DEFAULT '0.00',
  `thirdMonth` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prof_fee_month` decimal(10,2) NOT NULL DEFAULT '0.00',
  `firstStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `secondStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `thirdStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `forthStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fifthStage` double(10,2) NOT NULL,
  `prof_fee_stage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fkfee_service_key` (`service`),
  KEY `fkfee_country_key` (`country`),
  KEY `fkfee_branch_key` (`branch`),
  KEY `fkfee_currency_key` (`currency`),
  KEY `id` (`id`),
  CONSTRAINT `fkfee_branch_key` FOREIGN KEY (`branch`) REFERENCES `crm_branch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fkfee_country_key` FOREIGN KEY (`country`) REFERENCES `crm_country_proces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fkfee_currency_key` FOREIGN KEY (`currency`) REFERENCES `crm_currency` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fkfee_service_key` FOREIGN KEY (`service`) REFERENCES `crm_service` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=171 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_follow_up_reminders
-- ----------------------------
CREATE TABLE `crm_follow_up_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `user_id` int NOT NULL,
  `reminder_date` datetime NOT NULL,
  `message` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `priority` varchar(20) NOT NULL DEFAULT 'medium',
  `completed_at` datetime DEFAULT NULL,
  `completion_notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_followups_lead` (`lead_id`),
  KEY `idx_followups_user` (`user_id`),
  KEY `idx_followups_status` (`status`),
  KEY `idx_followups_priority` (`priority`),
  KEY `idx_followups_reminder_date` (`reminder_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_forum_leads
-- ----------------------------
CREATE TABLE `crm_forum_leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fname` varchar(555) NOT NULL,
  `mname` varchar(555) NOT NULL,
  `lname` varchar(555) NOT NULL,
  `email` varchar(555) NOT NULL,
  `phone` varchar(555) NOT NULL,
  `mobile` varchar(555) NOT NULL,
  `nationality` varchar(555) NOT NULL,
  `passport_number` varchar(50) DEFAULT NULL,
  `address` text NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(55) NOT NULL,
  `id_number` varchar(255) NOT NULL,
  `id_expiry` date NOT NULL,
  `id_issue_date` date NOT NULL,
  `country_interest` varchar(555) DEFAULT NULL,
  `sub_country_interest` int NOT NULL,
  `service_interest` varchar(555) DEFAULT NULL,
  `market_source` varchar(555) DEFAULT NULL,
  `sub_market_source` int NOT NULL,
  `appointment` date DEFAULT NULL,
  `followup` date NOT NULL,
  `folowuptime` time NOT NULL,
  `followupstat` int NOT NULL DEFAULT '0',
  `enquiry` varchar(555) NOT NULL,
  `convet` varchar(555) NOT NULL,
  `priority` varchar(10) NOT NULL,
  `regdate` date NOT NULL,
  `regtime` time NOT NULL,
  `last_updated` varchar(30) NOT NULL,
  `last_updtd_time` varchar(50) NOT NULL,
  `stepComplete` int NOT NULL DEFAULT '1',
  `payType` varchar(55) DEFAULT NULL,
  `assignTo` int DEFAULT NULL,
  `case_officer` int DEFAULT NULL,
  `Counsilor` int DEFAULT NULL,
  `branch` int NOT NULL,
  `region` int NOT NULL,
  `payTotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `paidYet` decimal(10,2) DEFAULT '0.00',
  `payBalance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `feeAgreeDate` date DEFAULT NULL,
  `demandAmt` decimal(10,2) NOT NULL DEFAULT '0.00',
  `dueDate` date DEFAULT NULL,
  `demdRemark` text,
  `agreeDate` date DEFAULT NULL,
  `renDate` date DEFAULT NULL,
  `renExpiryDate` date DEFAULT NULL,
  `renew_type` varchar(50) DEFAULT NULL,
  `status` varchar(55) DEFAULT NULL,
  `status_date` date NOT NULL,
  `notf` int NOT NULL DEFAULT '0',
  `type` text NOT NULL,
  `password` varchar(30) DEFAULT NULL,
  `novat` int DEFAULT NULL,
  `i_p` varchar(50) DEFAULT NULL,
  `escalation` varchar(20) DEFAULT NULL,
  `transfer_date` date DEFAULT NULL,
  `transfer_time` varchar(20) NOT NULL,
  `transfered` int DEFAULT NULL,
  `transfered_by` int NOT NULL,
  `otp_status` int DEFAULT NULL,
  `otp` int DEFAULT NULL,
  `otp_date` datetime DEFAULT NULL,
  `otp_email` varchar(255) DEFAULT NULL,
  `browser` longtext,
  `hostname` longtext,
  `digital_signature` longtext,
  `lead_import_by` int DEFAULT NULL,
  `lead_import` int DEFAULT NULL,
  `education` varchar(255) DEFAULT NULL,
  `profession` varchar(255) DEFAULT NULL,
  `exist` int NOT NULL,
  `no_of_applicants` int NOT NULL,
  `advanced` int NOT NULL,
  `do_status` int NOT NULL,
  `arm_status` int NOT NULL,
  `gm_status` int NOT NULL,
  `discount_status` int NOT NULL,
  `discount_remarks` longtext NOT NULL,
  `discount_by` int NOT NULL,
  `discount_date` datetime NOT NULL,
  `campaign` varchar(200) NOT NULL,
  `campaign_group` varchar(50) NOT NULL,
  `pa_fname` varchar(255) NOT NULL,
  `pa_lname` varchar(255) NOT NULL,
  `lead_remark` text NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL,
  `alert` int NOT NULL,
  `area` varchar(100) NOT NULL,
  `lead_quality` varchar(100) NOT NULL,
  `transferred_remark_update` int NOT NULL,
  `untouch_transfer` int NOT NULL,
  `lead_nq_reason` varchar(100) NOT NULL,
  `tele_caller_alert` int NOT NULL,
  `tele_caller_remark` longtext NOT NULL,
  `tele_caller_remark_by` int NOT NULL,
  `tele_date` date NOT NULL,
  `lead_date` date NOT NULL,
  `duplicate` int NOT NULL,
  `duplicate_count` int NOT NULL,
  `ref_remark` longtext NOT NULL,
  `na_record` int NOT NULL,
  `old_assgined` int NOT NULL,
  `nal_count` int NOT NULL,
  `campaign_id` int NOT NULL,
  `old_branch` int NOT NULL,
  `conversion_reason` text,
  `lost_reason` text,
  `competitor` varchar(255) DEFAULT NULL,
  `qualification_score` int DEFAULT NULL,
  `opportunity_stage` varchar(30) DEFAULT NULL,
  `salutation` varchar(10) DEFAULT NULL,
  `suffix` varchar(20) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `utm_source` varchar(255) DEFAULT NULL,
  `utm_medium` varchar(255) DEFAULT NULL,
  `gclid` varchar(255) DEFAULT NULL,
  `re_enquiry` tinyint(1) NOT NULL DEFAULT '0',
  `re_enquiry_counter` int NOT NULL DEFAULT '0',
  `call_attempt_1` datetime DEFAULT NULL,
  `call_back_attempts` int NOT NULL DEFAULT '0',
  `call_attempts_deadline` datetime DEFAULT NULL,
  `watnot_bot` tinyint(1) NOT NULL DEFAULT '0',
  `roundrobin` tinyint(1) NOT NULL DEFAULT '0',
  `whatsapp` tinyint(1) NOT NULL DEFAULT '0',
  `whatsapp_number` varchar(50) DEFAULT NULL,
  `client_actual_name` varchar(255) DEFAULT NULL,
  `opportunity_id` int DEFAULT NULL,
  `opportunity_status` varchar(50) DEFAULT NULL,
  `conversion_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id` (`id`),
  KEY `fk_branch` (`branch`),
  KEY `fk_counsilor` (`Counsilor`),
  KEY `fk_assignto` (`assignTo`),
  KEY `fk_caseofficer` (`case_officer`),
  KEY `idx_dmc_forum_leads_country_interest` (`country_interest`),
  KEY `idx_dmc_forum_leads_service_interest` (`service_interest`),
  KEY `idx_dmc_forum_leads_market_source` (`market_source`),
  CONSTRAINT `fk_assignto` FOREIGN KEY (`assignTo`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_branch` FOREIGN KEY (`branch`) REFERENCES `crm_branch` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_caseofficer` FOREIGN KEY (`case_officer`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_counsilor` FOREIGN KEY (`Counsilor`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_forum_leads_assesment_desgn
-- ----------------------------
CREATE TABLE `crm_forum_leads_assesment_desgn` (
  `id` int NOT NULL AUTO_INCREMENT,
  `skillId` int NOT NULL,
  `leadId` int NOT NULL,
  `fromEmpRecMonth` varchar(555) DEFAULT NULL,
  `fromEmpRecYear` varchar(555) DEFAULT NULL,
  `toEmpRecMonth` varchar(555) DEFAULT NULL,
  `toEmpRecYear` varchar(555) DEFAULT NULL,
  `empRecName` varchar(555) DEFAULT NULL,
  `empRecDesign` varchar(555) DEFAULT NULL,
  `empRecType` varchar(555) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `skillId` (`skillId`),
  KEY `leadId` (`leadId`),
  CONSTRAINT `crm_forum_leads_assesment_desgn_ibfk_1` FOREIGN KEY (`skillId`) REFERENCES `crm_forum_leads_assesments` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `crm_forum_leads_assesment_desgn_ibfk_2` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_forum_leads_assesment_edu
-- ----------------------------
CREATE TABLE `crm_forum_leads_assesment_edu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `skillId` int NOT NULL,
  `leadId` int NOT NULL,
  `fromMonth` varchar(555) DEFAULT NULL,
  `fromYear` varchar(555) DEFAULT NULL,
  `toMonth` varchar(555) DEFAULT NULL,
  `toYear` varchar(555) DEFAULT NULL,
  `pSEduName` varchar(555) DEFAULT NULL,
  `pSEduCourse` varchar(555) DEFAULT NULL,
  `pSEduDegree` varchar(555) DEFAULT NULL,
  `pSEduType` varchar(555) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `skillId` (`skillId`),
  KEY `leadId` (`leadId`),
  KEY `leadId_2` (`leadId`),
  CONSTRAINT `crm_forum_leads_assesment_edu_ibfk_1` FOREIGN KEY (`skillId`) REFERENCES `crm_forum_leads_assesments` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `crm_forum_leads_assesment_edu_ibfk_2` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_forum_leads_assesments
-- ----------------------------
CREATE TABLE `crm_forum_leads_assesments` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `Type` varchar(55) DEFAULT NULL,
  `cob` varchar(555) DEFAULT NULL,
  `phOffice` varchar(555) DEFAULT NULL,
  `marStatus` varchar(555) DEFAULT NULL,
  `haveChild` varchar(555) DEFAULT NULL,
  `noOfChild` varchar(555) DEFAULT NULL,
  `spfname` varchar(255) DEFAULT NULL,
  `spmname` varchar(255) DEFAULT NULL,
  `splname` varchar(255) DEFAULT NULL,
  `spgender` varchar(255) DEFAULT NULL,
  `spdob` date DEFAULT NULL,
  `spcob` varchar(255) DEFAULT NULL,
  `spcitizenof` varchar(255) DEFAULT NULL,
  `spaddress` text,
  `spmobile` varchar(255) DEFAULT NULL,
  `spphHome` varchar(255) DEFAULT NULL,
  `spphOffice` varchar(255) DEFAULT NULL,
  `spemail` varchar(255) DEFAULT NULL,
  `relName` varchar(555) DEFAULT NULL,
  `reRelation` varchar(555) DEFAULT NULL,
  `reCountry` varchar(555) DEFAULT NULL,
  `reAddress` varchar(555) DEFAULT NULL,
  `reStatus` varchar(555) DEFAULT NULL,
  `moveAsset` varchar(555) DEFAULT NULL,
  `inmoveAsset` varchar(555) DEFAULT NULL,
  `interestIn` varchar(555) DEFAULT NULL,
  `ownership` varchar(555) DEFAULT NULL,
  `document` varchar(255) DEFAULT NULL,
  `assesment` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `leadId` (`leadId`),
  CONSTRAINT `crm_forum_leads_assesments_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_forum_leads_contracts
-- ----------------------------
CREATE TABLE `crm_forum_leads_contracts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `contract` varchar(555) NOT NULL,
  `unsigned_contract` varchar(255) NOT NULL,
  `new_contract` varchar(555) DEFAULT NULL,
  `ar_contract` varchar(255) NOT NULL,
  `garys` varchar(10) DEFAULT NULL,
  `verify` int NOT NULL DEFAULT '0',
  `remarks` longtext,
  `verify_by` int NOT NULL DEFAULT '0',
  `verify_date` datetime DEFAULT NULL,
  `batch_id` int NOT NULL,
  `wp_batch_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `employer_id` int NOT NULL,
  `old_crm_ag_id` int NOT NULL,
  `payment_status` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `leadId` (`leadId`),
  KEY `leadId_2` (`leadId`),
  CONSTRAINT `crm_forum_leads_contracts_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_forum_leads_fee
-- ----------------------------
CREATE TABLE `crm_forum_leads_fee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `taxAmt` decimal(10,2) NOT NULL,
  `payDate` date NOT NULL,
  `paidAmt` decimal(10,2) NOT NULL,
  `paidDate` date NOT NULL,
  `profAmt` decimal(10,2) NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `lead` (`lead`),
  CONSTRAINT `crm_forum_leads_fee_ibfk_1` FOREIGN KEY (`lead`) REFERENCES `crm_forum_leads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_forum_leads_observations
-- ----------------------------
CREATE TABLE `crm_forum_leads_observations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `sheet` varchar(555) NOT NULL,
  `emirateId` varchar(255) NOT NULL,
  `document` varchar(255) NOT NULL,
  `remark` text NOT NULL,
  `os_visit_sheet` varchar(255) NOT NULL,
  `visit_obs_type` varchar(100) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `leadId` (`leadId`),
  CONSTRAINT `crm_forum_leads_observations_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_forum_leads_remarks
-- ----------------------------
CREATE TABLE `crm_forum_leads_remarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead` int NOT NULL,
  `date` date DEFAULT NULL,
  `remark` text,
  `emp` int NOT NULL DEFAULT '0',
  `created` time DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_lead_remarks_lead` (`lead`),
  KEY `idx_lead_remarks_emp` (`emp`),
  KEY `idx_lead_remarks_date` (`date`),
  CONSTRAINT `crm_forum_leads_remarks_ibfk_1` FOREIGN KEY (`lead`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_attendance_breaks
-- ----------------------------
CREATE TABLE `crm_hr_attendance_breaks` (
  `break_id` char(36) NOT NULL,
  `attendance_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `break_type` enum('Lunch Break','Prayer Break','Short Break') NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`break_id`),
  KEY `idx_hr_attendance_breaks_attendance` (`attendance_id`),
  KEY `idx_hr_attendance_breaks_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_attendance_records
-- ----------------------------
CREATE TABLE `crm_hr_attendance_records` (
  `attendance_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `status` enum('Present','Absent','Late','Half-Day','Leave','Holiday') NOT NULL,
  `overtime_hours` decimal(5,2) DEFAULT '0.00',
  `source` enum('Manual','Biometric','Import') NOT NULL,
  `notes` text,
  `approved_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`attendance_id`),
  KEY `idx_hr_attendance_employee_date` (`employee_id`,`date`),
  KEY `idx_hr_attendance_status` (`status`),
  KEY `idx_hr_attendance_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_employee_compensation
-- ----------------------------
CREATE TABLE `crm_hr_employee_compensation` (
  `employee_id` char(36) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency_code` varchar(10) NOT NULL DEFAULT 'AED',
  `standard_allowances_json` text,
  `bank_name` varchar(255) DEFAULT NULL,
  `iban` varchar(80) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_employee_documents
-- ----------------------------
CREATE TABLE `crm_hr_employee_documents` (
  `document_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `document_type` varchar(120) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_url` varchar(500) NOT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`document_id`),
  KEY `idx_hr_employee_document_employee` (`employee_id`),
  KEY `idx_hr_employee_document_type` (`document_type`),
  KEY `idx_hr_employee_document_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_employee_letters
-- ----------------------------
CREATE TABLE `crm_hr_employee_letters` (
  `letter_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `letter_type` enum('relieving','experience') NOT NULL,
  `template_id` char(36) NOT NULL,
  `ref_number` varchar(80) NOT NULL,
  `issue_date` date NOT NULL,
  `last_working_day` date NOT NULL,
  `designation` varchar(150) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `rendered_body` text NOT NULL,
  `storage_key` varchar(500) NOT NULL,
  `signed_url` text NOT NULL,
  `signed_url_expires_at` datetime NOT NULL,
  `generated_by` char(36) DEFAULT NULL,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`letter_id`),
  UNIQUE KEY `uniq_hr_letter_ref` (`ref_number`),
  KEY `idx_hr_employee_letter_employee` (`employee_id`),
  KEY `idx_hr_employee_letter_type` (`letter_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_eosb_settlements
-- ----------------------------
CREATE TABLE `crm_hr_eosb_settlements` (
  `eosb_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `joining_date` date NOT NULL,
  `last_working_day` date NOT NULL,
  `years_of_service` decimal(6,2) NOT NULL DEFAULT '0.00',
  `separation_reason` enum('Resignation','Termination','Retirement','Death','Mutual') NOT NULL,
  `last_basic_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `eosb_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `leave_balance_days` int NOT NULL DEFAULT '0',
  `leave_encashment` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unpaid_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_payable` decimal(12,2) NOT NULL DEFAULT '0.00',
  `approved_by` char(36) NOT NULL,
  `settlement_date` date DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`eosb_id`),
  KEY `idx_hr_eosb_employee` (`employee_id`),
  KEY `idx_hr_eosb_reason` (`separation_reason`),
  KEY `idx_hr_eosb_settlement_date` (`settlement_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_exit_checklist_items
-- ----------------------------
CREATE TABLE `crm_hr_exit_checklist_items` (
  `item_id` char(36) NOT NULL,
  `checklist_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `department` varchar(50) NOT NULL,
  `item_text` varchar(255) NOT NULL,
  `owner_role` varchar(100) NOT NULL,
  `status` enum('Pending','Completed','Waived') NOT NULL DEFAULT 'Pending',
  `completed_by` char(36) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `notes` text,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`item_id`),
  KEY `idx_hr_exit_item_checklist` (`checklist_id`),
  KEY `idx_hr_exit_item_employee` (`employee_id`),
  KEY `idx_hr_exit_item_department` (`department`),
  KEY `idx_hr_exit_item_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_exit_checklists
-- ----------------------------
CREATE TABLE `crm_hr_exit_checklists` (
  `checklist_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `separation_reason` varchar(80) DEFAULT NULL,
  `last_working_day` date DEFAULT NULL,
  `status` enum('Open','Completed','Cancelled') NOT NULL DEFAULT 'Open',
  `assigned_by` char(36) DEFAULT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`checklist_id`),
  KEY `idx_hr_exit_checklist_employee` (`employee_id`),
  KEY `idx_hr_exit_checklist_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_exit_interviews
-- ----------------------------
CREATE TABLE `crm_hr_exit_interviews` (
  `exit_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `interview_date` date NOT NULL,
  `conducted_by` char(36) NOT NULL,
  `reason_leaving` enum('Better Opportunity','Salary','Relocation','Personal','Termination','Other') NOT NULL,
  `reason_details` text,
  `job_satisfaction` tinyint NOT NULL,
  `mgmt_satisfaction` tinyint NOT NULL,
  `work_env_rating` tinyint NOT NULL,
  `compensation_rating` tinyint NOT NULL,
  `growth_rating` tinyint NOT NULL,
  `recommend_company` tinyint(1) NOT NULL,
  `rehire_eligible` tinyint(1) NOT NULL,
  `feedback_text` text,
  `suggestions` text,
  `confidential` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`exit_id`),
  KEY `idx_hr_exit_interview_employee` (`employee_id`),
  KEY `idx_hr_exit_interview_reason` (`reason_leaving`),
  KEY `idx_hr_exit_interview_date` (`interview_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_exit_requests
-- ----------------------------
CREATE TABLE `crm_hr_exit_requests` (
  `exit_request_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `exit_type` enum('Resignation','Termination') NOT NULL,
  `submitted_by` char(36) NOT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` text NOT NULL,
  `reason_category` varchar(120) DEFAULT NULL,
  `requested_lwd` date DEFAULT NULL,
  `notice_period_days` int DEFAULT '30',
  `approved_lwd` date DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Completed','Withdrawn') NOT NULL DEFAULT 'Pending',
  `workflow_stage` enum('Submitted','Under Review','Acknowledged','Exit Process') NOT NULL DEFAULT 'Submitted',
  `exit_interview_id` char(36) DEFAULT NULL,
  `fnf_email_sent_at` datetime DEFAULT NULL,
  `fnf_email_status` enum('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending',
  `notes` text,
  `additional_comments` text,
  `branch_snapshot` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`exit_request_id`),
  KEY `idx_hr_exit_request_employee` (`employee_id`),
  KEY `idx_hr_exit_request_status` (`status`),
  KEY `idx_hr_exit_request_type` (`exit_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_handbook_documents
-- ----------------------------
CREATE TABLE `crm_hr_handbook_documents` (
  `document_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(120) NOT NULL DEFAULT 'General',
  `file_url` varchar(500) NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `is_current` tinyint(1) NOT NULL DEFAULT '1',
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `idx_hr_handbook_category` (`category`),
  KEY `idx_hr_handbook_current` (`is_current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_headcount_snapshots
-- ----------------------------
CREATE TABLE `crm_hr_headcount_snapshots` (
  `snapshot_id` char(36) NOT NULL,
  `snapshot_date` date NOT NULL,
  `snapshot_month` date NOT NULL,
  `total` int NOT NULL DEFAULT '0',
  `active` int NOT NULL DEFAULT '0',
  `inactive` int NOT NULL DEFAULT '0',
  `on_leave` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`snapshot_id`),
  UNIQUE KEY `uniq_hr_headcount_snapshot_month` (`snapshot_month`),
  KEY `idx_hr_headcount_snapshot_date` (`snapshot_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_holidays
-- ----------------------------
CREATE TABLE `crm_hr_holidays` (
  `holiday_id` char(36) NOT NULL,
  `holiday_date` date NOT NULL,
  `name` varchar(150) NOT NULL,
  `branch_id` int DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`holiday_id`),
  UNIQUE KEY `uniq_hr_holiday` (`holiday_date`,`branch_id`),
  KEY `idx_hr_holidays_date` (`holiday_date`),
  KEY `idx_hr_holidays_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_leave_balances
-- ----------------------------
CREATE TABLE `crm_hr_leave_balances` (
  `balance_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `leave_type` varchar(80) NOT NULL,
  `year` int NOT NULL,
  `entitlement_days` decimal(6,2) NOT NULL DEFAULT '0.00',
  `used_days` decimal(6,2) NOT NULL DEFAULT '0.00',
  `pending_days` decimal(6,2) NOT NULL DEFAULT '0.00',
  `remaining_days` decimal(6,2) NOT NULL DEFAULT '0.00',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`balance_id`),
  UNIQUE KEY `uniq_hr_leave_balance` (`employee_id`,`leave_type`,`year`),
  KEY `idx_hr_leave_balance_employee` (`employee_id`,`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_leave_requests
-- ----------------------------
CREATE TABLE `crm_hr_leave_requests` (
  `leave_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `manager_id` char(36) DEFAULT NULL,
  `leave_type` enum('Annual Leave','Sick Leave','Maternity Leave','Paternity Leave','Hajj Leave','Bereavement Leave','Unpaid Leave','Compensatory Leave','Emergency Leave') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_requested` decimal(6,2) NOT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  `workflow_status` enum('Manager Review','HR Confirmation','Completed','Cancelled') NOT NULL DEFAULT 'Manager Review',
  `reason` text,
  `medical_certificate_required` tinyint(1) NOT NULL DEFAULT '0',
  `document_url` text,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `manager_status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `manager_reviewed_at` datetime DEFAULT NULL,
  `manager_comment` text,
  `hr_status` enum('Pending','Confirmed','Overridden') NOT NULL DEFAULT 'Pending',
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`leave_id`),
  KEY `idx_hr_leave_employee_year` (`employee_id`,`start_date`),
  KEY `idx_hr_leave_status` (`status`),
  KEY `idx_hr_leave_type` (`leave_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_letter_templates
-- ----------------------------
CREATE TABLE `crm_hr_letter_templates` (
  `template_id` char(36) NOT NULL,
  `letter_type` enum('relieving','experience') NOT NULL,
  `template_name` varchar(150) NOT NULL,
  `body_template` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`template_id`),
  KEY `idx_hr_letter_template_type` (`letter_type`,`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_payslips
-- ----------------------------
CREATE TABLE `crm_hr_payslips` (
  `payslip_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `pay_year` int NOT NULL,
  `pay_month` int NOT NULL,
  `pay_period` varchar(20) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `allowances_json` json DEFAULT NULL,
  `overtime_hours` decimal(6,2) NOT NULL DEFAULT '0.00',
  `overtime_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `deductions_json` json DEFAULT NULL,
  `gross_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency_code` varchar(10) NOT NULL DEFAULT 'AED',
  `bank_name` varchar(255) DEFAULT NULL,
  `masked_iban` varchar(80) DEFAULT NULL,
  `ytd_earnings` decimal(12,2) NOT NULL DEFAULT '0.00',
  `storage_key` varchar(500) NOT NULL,
  `signed_url` text NOT NULL,
  `signed_url_expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payslip_id`),
  UNIQUE KEY `uniq_hr_payslip_employee_month` (`employee_id`,`pay_year`,`pay_month`),
  KEY `idx_hr_payslip_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_recruitment_candidates
-- ----------------------------
CREATE TABLE `crm_hr_recruitment_candidates` (
  `candidate_id` char(36) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `applied_position` varchar(180) NOT NULL,
  `applied_date` date NOT NULL,
  `source` varchar(120) DEFAULT NULL,
  `interview_date` datetime DEFAULT NULL,
  `interview_outcome` enum('Pending','Pass','Fail') NOT NULL DEFAULT 'Pending',
  `status` enum('Applied','Interviewed','Selected','Rejected','Offer Sent','Accepted','Joined') NOT NULL DEFAULT 'Applied',
  `rejection_reason` text,
  `offer_salary` decimal(12,2) DEFAULT NULL,
  `offer_designation` varchar(180) DEFAULT NULL,
  `offer_terms` text,
  `offer_letter_url` text,
  `offer_sent_at` datetime DEFAULT NULL,
  `offer_accepted_at` datetime DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `company_email` varchar(255) DEFAULT NULL,
  `crm_id_generated_at` datetime DEFAULT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `dos_approved_by` char(36) DEFAULT NULL,
  `dos_approved_at` datetime DEFAULT NULL,
  `acceptance_token` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`candidate_id`),
  KEY `idx_hr_candidate_status` (`status`),
  KEY `idx_hr_candidate_email` (`email`),
  KEY `idx_hr_candidate_interview` (`interview_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_hr_workflow_notifications
-- ----------------------------
CREATE TABLE `crm_hr_workflow_notifications` (
  `notification_id` char(36) NOT NULL,
  `workflow_type` varchar(80) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `status` enum('Queued','Sent','Failed') NOT NULL DEFAULT 'Queued',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_hr_workflow_notification_entity` (`entity_id`),
  KEY `idx_hr_workflow_notification_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_immigration_tool_results
-- ----------------------------
CREATE TABLE `crm_immigration_tool_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int DEFAULT NULL,
  `employee_id` int NOT NULL,
  `country` enum('canada','australia') NOT NULL,
  `tool` varchar(40) NOT NULL,
  `headline_score` varchar(60) DEFAULT NULL,
  `input` json NOT NULL,
  `result` json NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dm_immigration_tool_results_lead` (`lead_id`,`created_at`),
  KEY `idx_dm_immigration_tool_results_employee` (`employee_id`,`created_at`),
  CONSTRAINT `fk_dm_immigration_tool_results_employee` FOREIGN KEY (`employee_id`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dm_immigration_tool_results_lead` FOREIGN KEY (`lead_id`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_it_settings
-- ----------------------------
CREATE TABLE `crm_it_settings` (
  `setting_key` varchar(80) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `updated_by` int DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_it_ticket_comments
-- ----------------------------
CREATE TABLE `crm_it_ticket_comments` (
  `id` char(36) NOT NULL,
  `ticket_id` char(36) NOT NULL,
  `author_id` int NOT NULL,
  `comment_type` enum('Comment','StatusChange','System') NOT NULL DEFAULT 'Comment',
  `body` text NOT NULL,
  `old_value` varchar(120) DEFAULT NULL,
  `new_value` varchar(120) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_it_ticket_comments_ticket` (`ticket_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_it_tickets
-- ----------------------------
CREATE TABLE `crm_it_tickets` (
  `id` char(36) NOT NULL,
  `ticket_seq` int NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(30) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` enum('Laptop / Desktop Hardware','Access & Accounts','New Procurement','Network & Internet','Email & Communication','Software & Licensing') NOT NULL,
  `priority` enum('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `estimated_cost_aed` decimal(12,2) DEFAULT NULL,
  `raised_by` int NOT NULL,
  `branch_id` int NOT NULL,
  `status` enum('Open','Resolved','Closed','Rejected') NOT NULL DEFAULT 'Open',
  `workflow_status` enum('IT Manager Review','Branch Manager Review','Director Review','Assigned','In Progress','Resolved Awaiting Confirmation','Closed','Rejected') NOT NULL DEFAULT 'IT Manager Review',
  `requires_branch_approval` tinyint(1) NOT NULL DEFAULT '0',
  `requires_director_approval` tinyint(1) NOT NULL DEFAULT '0',
  `it_manager_id` int DEFAULT NULL,
  `it_manager_status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `it_manager_reviewed_at` datetime DEFAULT NULL,
  `it_manager_comment` text,
  `branch_manager_id` int DEFAULT NULL,
  `branch_manager_status` enum('Pending','Approved','Rejected','Not Required') NOT NULL DEFAULT 'Not Required',
  `branch_manager_reviewed_at` datetime DEFAULT NULL,
  `branch_manager_comment` text,
  `director_id` int DEFAULT NULL,
  `director_status` enum('Pending','Approved','Rejected','Not Required') NOT NULL DEFAULT 'Not Required',
  `director_reviewed_at` datetime DEFAULT NULL,
  `director_comment` text,
  `assigned_to` int DEFAULT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `in_progress_at` datetime DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolution_notes` text,
  `confirmed_by` int DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `reopened_count` int NOT NULL DEFAULT '0',
  `rejected_by` int DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_stage` varchar(40) DEFAULT NULL,
  `rejection_reason` text,
  `due_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_seq` (`ticket_seq`),
  UNIQUE KEY `uniq_it_ticket_number` (`ticket_number`),
  KEY `idx_it_tickets_status` (`status`),
  KEY `idx_it_tickets_workflow_status` (`workflow_status`),
  KEY `idx_it_tickets_branch` (`branch_id`),
  KEY `idx_it_tickets_raised_by` (`raised_by`),
  KEY `idx_it_tickets_assigned_to` (`assigned_to`),
  KEY `idx_it_tickets_priority` (`priority`),
  KEY `idx_it_tickets_due_at` (`due_at`),
  KEY `idx_it_tickets_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_lead_reassignments
-- ----------------------------
CREATE TABLE `crm_lead_reassignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `fromEmployeeId` int NOT NULL,
  `toEmployeeId` int NOT NULL,
  `reassignmentType` varchar(30) NOT NULL DEFAULT 'manual',
  `reason` text NOT NULL,
  `previousStatus` varchar(50) NOT NULL,
  `newStatus` varchar(50) NOT NULL,
  `reassignmentDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text,
  `approvedBy` int DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `approvedAt` datetime DEFAULT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reassign_lead` (`leadId`),
  KEY `idx_reassign_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_lead_round_robin_state
-- ----------------------------
CREATE TABLE `crm_lead_round_robin_state` (
  `branch_id` int NOT NULL,
  `last_employee_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`),
  KEY `idx_lead_round_robin_employee` (`last_employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_leave_history
-- ----------------------------
CREATE TABLE `crm_leave_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `custId` int NOT NULL,
  `applyDate` date NOT NULL,
  `fromDate` date NOT NULL,
  `toDate` date NOT NULL,
  `type` varchar(255) NOT NULL,
  `approvBy` varchar(555) NOT NULL,
  `requestedTo` varchar(255) NOT NULL,
  `requested_time_from` time NOT NULL,
  `requested_time_to` time NOT NULL,
  `remark` text NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `file` varchar(50) NOT NULL,
  `reject` varchar(100) NOT NULL,
  `reject_remarks` longtext NOT NULL,
  `notf` int NOT NULL,
  `approved_date` date NOT NULL,
  `reject_date` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_leave_type
-- ----------------------------
CREATE TABLE `crm_leave_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_library
-- ----------------------------
CREATE TABLE `crm_library` (
  `id` int NOT NULL AUTO_INCREMENT,
  `groups` int NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `files` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `file_type` int NOT NULL,
  `file_of_folder` int NOT NULL,
  `folder_id` int NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_meeting_schedules
-- ----------------------------
CREATE TABLE `crm_meeting_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `user_id` int NOT NULL,
  `meeting_date` datetime NOT NULL,
  `meeting_type` varchar(50) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `agenda` text,
  `status` varchar(20) NOT NULL DEFAULT 'scheduled',
  `priority` varchar(20) NOT NULL DEFAULT 'normal',
  `notes` text,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_meeting_schedules_lead` (`lead_id`),
  KEY `idx_meeting_schedules_user` (`user_id`),
  KEY `idx_meeting_schedules_status` (`status`),
  KEY `idx_meeting_schedules_date` (`meeting_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_meta_campaign_cache
-- ----------------------------
CREATE TABLE `crm_meta_campaign_cache` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `campaign_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `objective` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `daily_budget` decimal(14,2) DEFAULT NULL,
  `lifetime_budget` decimal(14,2) DEFAULT NULL,
  `spend` decimal(14,2) DEFAULT '0.00',
  `impressions` int unsigned DEFAULT '0',
  `clicks` int unsigned DEFAULT '0',
  `leads_count` int unsigned NOT NULL DEFAULT '0',
  `raw_data` json DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mcc_campaign_id` (`campaign_id`),
  KEY `idx_mcc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_meta_lead_deliveries
-- ----------------------------
CREATE TABLE `crm_meta_lead_deliveries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `meta_lead_id` int unsigned NOT NULL,
  `crm_endpoint` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_payload` json NOT NULL,
  `response_status` smallint unsigned DEFAULT NULL,
  `response_body` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','processing','delivered','failed','retry_scheduled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `retry_count` tinyint unsigned NOT NULL DEFAULT '0',
  `next_retry_at` datetime DEFAULT NULL,
  `last_error` text COLLATE utf8mb4_unicode_ci,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mld_meta_lead` (`meta_lead_id`),
  KEY `idx_mld_status` (`status`),
  KEY `idx_mld_next_retry` (`next_retry_at`),
  CONSTRAINT `fk_mld_meta_lead` FOREIGN KEY (`meta_lead_id`) REFERENCES `crm_meta_leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_meta_lead_mappings
-- ----------------------------
CREATE TABLE `crm_meta_lead_mappings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `scope_type` enum('GLOBAL','CAMPAIGN','FORM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GLOBAL',
  `campaign_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Only set when scope_type = CAMPAIGN',
  `form_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Only set when scope_type = FORM',
  `meta_field_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Meta field name or custom question label',
  `crm_field_key` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CRM payload field name',
  `fallback_value` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Used when Meta field is missing',
  `transform_type` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g. uppercase, trim, phone_e164',
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mlm_scope` (`scope_type`,`campaign_id`,`form_id`),
  KEY `idx_mlm_enabled` (`is_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_meta_leads
-- ----------------------------
CREATE TABLE `crm_meta_leads` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `meta_lead_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'leadgen_id from Meta',
  `webhook_event_id` int unsigned DEFAULT NULL,
  `page_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campaign_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campaign_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adset_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adset_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_lead_data` json DEFAULT NULL COMMENT 'Full Meta Graph API response',
  `normalized_lead_data` json DEFAULT NULL COMMENT 'Computed CRM payload before delivery',
  `meta_created_time` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ml_meta_lead_id` (`meta_lead_id`),
  KEY `idx_ml_email` (`email`),
  KEY `idx_ml_phone` (`phone`),
  KEY `idx_ml_campaign` (`campaign_id`),
  KEY `idx_ml_form` (`form_id`),
  KEY `idx_ml_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_meta_settings
-- ----------------------------
CREATE TABLE `crm_meta_settings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `page_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_account_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `graph_api_version` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v21.0',
  `default_branch` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_lead_source` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Facebook Lead Ads',
  `default_utm_source` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Facebook Lead Ads',
  `last_webhook_at` datetime DEFAULT NULL,
  `last_campaign_sync_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_meta_webhook_events
-- ----------------------------
CREATE TABLE `crm_meta_webhook_events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `event_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHA-256 of raw payload for deduplication',
  `leadgen_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campaign_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adset_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ad_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `raw_payload` json NOT NULL,
  `signature_validated` tinyint(1) NOT NULL DEFAULT '0',
  `processing_status` enum('pending','processing','processed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `received_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mwe_hash` (`event_hash`),
  KEY `idx_mwe_leadgen` (`leadgen_id`),
  KEY `idx_mwe_status` (`processing_status`),
  KEY `idx_mwe_received` (`received_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_notifications
-- ----------------------------
CREATE TABLE `crm_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` int DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL,
  `link` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `priority` varchar(20) NOT NULL DEFAULT 'normal',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_type` (`type`),
  KEY `idx_notifications_read` (`is_read`),
  KEY `idx_notifications_created` (`created_at`),
  KEY `idx_notifications_related` (`related_type`,`related_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_official_emails
-- ----------------------------
CREATE TABLE `crm_official_emails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch` int NOT NULL,
  `frontend` varchar(255) NOT NULL,
  `backend` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_operation_allocations
-- ----------------------------
CREATE TABLE `crm_operation_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `case_officer` int NOT NULL,
  `branch` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL DEFAULT '1',
  `status` int NOT NULL DEFAULT '1',
  `is_deleted` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_operation_allocations_officer` (`case_officer`),
  KEY `idx_operation_allocations_branch` (`branch`),
  KEY `idx_operation_allocations_active` (`status`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_operation_stage_data
-- ----------------------------
CREATE TABLE `crm_operation_stage_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `module` varchar(80) NOT NULL,
  `leadId` int NOT NULL,
  `opportunityId` int DEFAULT NULL,
  `stage` varchar(80) NOT NULL,
  `stageData` longtext NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_operation_stage_data` (`module`,`leadId`,`opportunityId`,`stage`),
  KEY `idx_operation_stage_data_lead` (`leadId`),
  KEY `idx_operation_stage_data_opportunity` (`opportunityId`),
  KEY `idx_operation_stage_data_module` (`module`),
  KEY `idx_operation_stage_data_case` (`module`,`leadId`,`opportunityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunities
-- ----------------------------
CREATE TABLE `crm_opportunities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `opportunityNumber` varchar(50) NOT NULL,
  `opportunityName` varchar(255) NOT NULL,
  `opportunityType` varchar(100) DEFAULT NULL,
  `serviceType` varchar(255) DEFAULT NULL,
  `serviceRequired` varchar(255) DEFAULT NULL,
  `product_type` varchar(40) DEFAULT NULL,
  `estimatedValue` decimal(15,2) NOT NULL DEFAULT '0.00',
  `actualValue` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(10) NOT NULL DEFAULT 'AED',
  `priority` varchar(30) NOT NULL DEFAULT 'medium',
  `status` varchar(50) NOT NULL DEFAULT 'prospect',
  `stage` varchar(100) NOT NULL DEFAULT 'initial',
  `probability` int NOT NULL DEFAULT '0',
  `expectedCloseDate` datetime DEFAULT NULL,
  `actualCloseDate` datetime DEFAULT NULL,
  `description` text,
  `source` varchar(100) DEFAULT NULL,
  `leadSource` varchar(255) DEFAULT NULL,
  `campaign` varchar(100) DEFAULT NULL,
  `assignedTo` int NOT NULL,
  `branchId` int DEFAULT NULL,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lostReason` text,
  `competitor` varchar(255) DEFAULT NULL,
  `nextAction` varchar(255) DEFAULT NULL,
  `nextActionDate` datetime DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `notes` text,
  `conversionDate` datetime DEFAULT NULL,
  `retentionAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `retentionStatus` varchar(30) NOT NULL DEFAULT 'pending',
  `retentionDate` datetime DEFAULT NULL,
  `agreementGenerated` tinyint(1) NOT NULL DEFAULT '0',
  `agreementId` int DEFAULT NULL,
  `agreementSent` tinyint(1) NOT NULL DEFAULT '0',
  `agreementSigned` tinyint(1) NOT NULL DEFAULT '0',
  `paymentReceived` tinyint(1) NOT NULL DEFAULT '0',
  `documentsVerified` tinyint(1) NOT NULL DEFAULT '0',
  `operations_status` enum('Active','Closed','Refund','On Hold','Visa Approved') NOT NULL DEFAULT 'Active',
  `operations_status_updated_by` int DEFAULT NULL,
  `operations_status_updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `opportunityNumber` (`opportunityNumber`),
  KEY `idx_dmc_opportunities_lead` (`leadId`),
  KEY `idx_dmc_opportunities_assigned` (`assignedTo`),
  KEY `idx_dmc_opportunities_branch` (`branchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_accounting_verifications
-- ----------------------------
CREATE TABLE `crm_opportunity_accounting_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `opportunity_id` int NOT NULL,
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `payment_received` tinyint(1) NOT NULL DEFAULT '0',
  `documents_complete` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `accountant_id` int DEFAULT NULL,
  `notes` text,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_accounting_verification_opportunity` (`opportunity_id`),
  KEY `idx_accounting_verification_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_activities
-- ----------------------------
CREATE TABLE `crm_opportunity_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunityId` int NOT NULL,
  `activityType` varchar(100) NOT NULL,
  `activityTitle` varchar(255) NOT NULL,
  `description` text,
  `activityDate` datetime NOT NULL,
  `duration` int DEFAULT '0',
  `outcome` text,
  `nextStep` varchar(255) DEFAULT NULL,
  `assignedTo` int NOT NULL,
  `priority` varchar(30) NOT NULL DEFAULT 'medium',
  `status` varchar(30) NOT NULL DEFAULT 'scheduled',
  `location` varchar(255) DEFAULT NULL,
  `attendees` text,
  `notes` text,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_opp_activities_opportunity` (`opportunityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_agreements
-- ----------------------------
CREATE TABLE `crm_opportunity_agreements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunityId` int NOT NULL,
  `agreementNumber` varchar(50) NOT NULL,
  `agreementType` varchar(100) NOT NULL,
  `templateId` int DEFAULT NULL,
  `agreementTitle` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `duration` varchar(50) DEFAULT NULL,
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(15,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'AED',
  `terms` text,
  `termsAndConditions` text,
  `specialConditions` text,
  `status` varchar(30) NOT NULL DEFAULT 'draft',
  `generatedDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sentDate` datetime DEFAULT NULL,
  `signedDate` datetime DEFAULT NULL,
  `clientSignature` text,
  `signatureDate` datetime DEFAULT NULL,
  `documentUrl` varchar(500) DEFAULT NULL,
  `clientName` varchar(255) DEFAULT NULL,
  `clientEmail` varchar(255) DEFAULT NULL,
  `clientPhone` varchar(80) DEFAULT NULL,
  `companyName` varchar(255) DEFAULT NULL,
  `companyAddress` text,
  `uploadedToCrm` tinyint(1) NOT NULL DEFAULT '0',
  `uploadedBy` int DEFAULT NULL,
  `content` longtext,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agreementNumber` (`agreementNumber`),
  KEY `idx_opp_agreements_opportunity` (`opportunityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_compliance_approvals
-- ----------------------------
CREATE TABLE `crm_opportunity_compliance_approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `opportunityId` int DEFAULT NULL,
  `signedAgreementUrl` text NOT NULL,
  `clientSignature` varchar(255) DEFAULT NULL,
  `signatureDate` date DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `submittedBy` int DEFAULT NULL,
  `reviewedBy` varchar(255) DEFAULT NULL,
  `reviewerRole` varchar(80) DEFAULT NULL,
  `reviewNotes` text,
  `submittedAt` datetime NOT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_compliance_lead` (`leadId`),
  KEY `idx_compliance_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_documents
-- ----------------------------
CREATE TABLE `crm_opportunity_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunityId` int NOT NULL,
  `documentType` varchar(100) NOT NULL,
  `documentName` varchar(255) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `filePath` varchar(500) NOT NULL,
  `fileSize` int NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `uploadDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verifiedDate` datetime DEFAULT NULL,
  `verifiedBy` int DEFAULT NULL,
  `expiryDate` datetime DEFAULT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text,
  `uploadedBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_opp_documents_opportunity` (`opportunityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_handover_notes
-- ----------------------------
CREATE TABLE `crm_opportunity_handover_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `opportunity_id` int DEFAULT NULL,
  `counselor_id` int DEFAULT NULL,
  `conversation_summary` text NOT NULL,
  `client_commitments` text,
  `next_action` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_handover_opportunity` (`opportunity_id`),
  KEY `idx_handover_lead` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_payment_schedules
-- ----------------------------
CREATE TABLE `crm_opportunity_payment_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunity_id` int NOT NULL,
  `installment_number` int NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
  `paid_date` date DEFAULT NULL,
  `receipt_number` varchar(100) DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_schedule_opportunity` (`opportunity_id`),
  KEY `idx_payment_schedule_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_payments
-- ----------------------------
CREATE TABLE `crm_opportunity_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunityId` int NOT NULL,
  `paymentNumber` varchar(50) NOT NULL,
  `paymentStructure` varchar(30) NOT NULL DEFAULT 'full',
  `paymentType` varchar(100) DEFAULT NULL,
  `totalAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(15,2) DEFAULT NULL,
  `paidAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `remainingBalance` decimal(15,2) NOT NULL DEFAULT '0.00',
  `balanceAmount` decimal(15,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'AED',
  `paymentMethod` varchar(50) NOT NULL,
  `transactionId` varchar(255) DEFAULT NULL,
  `paymentDate` datetime NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `dueDate` datetime NOT NULL,
  `installmentNumber` int DEFAULT NULL,
  `totalInstallments` int DEFAULT NULL,
  `milestoneName` varchar(255) DEFAULT NULL,
  `gateway` varchar(50) DEFAULT NULL,
  `gatewayTransactionId` varchar(255) DEFAULT NULL,
  `receiptUrl` varchar(500) DEFAULT NULL,
  `description` text,
  `notes` text,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `receiptNumber` varchar(50) DEFAULT NULL,
  `receiptType` varchar(50) DEFAULT NULL,
  `clientName` varchar(255) DEFAULT NULL,
  `clientEmail` varchar(255) DEFAULT NULL,
  `clientPhone` varchar(80) DEFAULT NULL,
  `clientAddress` text,
  `serviceName` varchar(255) DEFAULT NULL,
  `branchName` varchar(255) DEFAULT NULL,
  `consultantName` varchar(255) DEFAULT NULL,
  `taxAmount` decimal(15,2) DEFAULT '0.00',
  `discountAmount` decimal(15,2) DEFAULT '0.00',
  `accountantStatus` varchar(20) NOT NULL DEFAULT 'pending',
  `accountantRemarks` text,
  `accountantId` int DEFAULT NULL,
  `accountantVerifiedAt` datetime DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `paymentNumber` (`paymentNumber`),
  KEY `idx_opp_payments_opportunity` (`opportunityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_quotations
-- ----------------------------
CREATE TABLE `crm_opportunity_quotations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunityId` int NOT NULL,
  `quotationNumber` varchar(50) NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `validUntil` datetime NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'draft',
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discountType` varchar(30) NOT NULL DEFAULT 'percentage',
  `tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `taxRate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) NOT NULL DEFAULT 'AED',
  `terms` text,
  `notes` text,
  `sentDate` datetime DEFAULT NULL,
  `acceptedDate` datetime DEFAULT NULL,
  `rejectedDate` datetime DEFAULT NULL,
  `rejectedReason` text,
  `createdBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotationNumber` (`quotationNumber`),
  KEY `idx_opp_quotes_opportunity` (`opportunityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_workflow_audit_logs
-- ----------------------------
CREATE TABLE `crm_opportunity_workflow_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunity_id` int NOT NULL,
  `action` varchar(80) NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `actor_id` int DEFAULT NULL,
  `actor_role` varchar(80) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_audit_opportunity` (`opportunity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_opportunity_workflow_reviews
-- ----------------------------
CREATE TABLE `crm_opportunity_workflow_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opportunity_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `workflow_status` varchar(50) NOT NULL DEFAULT 'opportunity_created',
  `official_id_data` json DEFAULT NULL,
  `payment_data` json DEFAULT NULL,
  `finance_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `finance_checklist` json DEFAULT NULL,
  `finance_reason` text,
  `finance_reviewed_by` int DEFAULT NULL,
  `finance_reviewed_at` datetime DEFAULT NULL,
  `compliance_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `compliance_checklist` json DEFAULT NULL,
  `compliance_reason` text,
  `compliance_reviewed_by` int DEFAULT NULL,
  `compliance_reviewed_at` datetime DEFAULT NULL,
  `formal_client_id` varchar(40) DEFAULT NULL,
  `case_activated_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `opportunity_id` (`opportunity_id`),
  UNIQUE KEY `formal_client_id` (`formal_client_id`),
  KEY `idx_workflow_finance` (`finance_status`),
  KEY `idx_workflow_compliance` (`compliance_status`),
  KEY `idx_workflow_lead` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_ops_assignments
-- ----------------------------
CREATE TABLE `crm_ops_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('call','task','appointment') NOT NULL,
  `title` varchar(255) NOT NULL,
  `notes` text,
  `outcome_remark` text,
  `lead_id` int DEFAULT NULL,
  `opportunity_id` int DEFAULT NULL,
  `assigned_to` int NOT NULL,
  `assigned_by` int NOT NULL,
  `due_at` datetime DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dm_ops_assignments_assigned_to` (`assigned_to`,`status`),
  KEY `idx_dm_ops_assignments_assigned_by` (`assigned_by`),
  KEY `idx_dm_ops_assignments_type` (`type`),
  KEY `idx_dm_ops_assignments_lead` (`lead_id`),
  CONSTRAINT `fk_dm_ops_assignments_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dm_ops_assignments_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `crm_employee` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_ops_documents
-- ----------------------------
CREATE TABLE `crm_ops_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opsId` int DEFAULT NULL,
  `doc_type` varchar(100) DEFAULT NULL,
  `doc_uploaded_for` varchar(255) DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `name` varchar(555) DEFAULT NULL,
  `file` varchar(555) DEFAULT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL DEFAULT '1',
  `status` int NOT NULL DEFAULT '0',
  `remarks` text,
  `download_file` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_ops_documents_lead` (`leadId`),
  KEY `idx_ops_documents_ops` (`opsId`),
  KEY `idx_ops_documents_type` (`doc_type`),
  KEY `idx_ops_documents_status` (`status`),
  CONSTRAINT `crm_ops_documents_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pay_history
-- ----------------------------
CREATE TABLE `crm_pay_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `counselor_receipt` varchar(255) NOT NULL,
  `tabby` double(10,2) NOT NULL,
  `date` date DEFAULT NULL,
  `payMethod` varchar(555) DEFAULT NULL,
  `payoption` varchar(25) NOT NULL,
  `paycardoption` varchar(100) NOT NULL,
  `payNextDate` date NOT NULL,
  `payBalance` double(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payCategory` varchar(255) DEFAULT NULL,
  `payment_remarks` longtext NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `remark` text,
  `canDate` date DEFAULT NULL,
  `thirdPartyAmt` double(10,2) NOT NULL,
  `dmAmt` double(10,2) NOT NULL,
  `dmTax` double(10,2) NOT NULL,
  `dmRefundAmt` double(10,2) NOT NULL,
  `curValue` int NOT NULL,
  `refNumber` varchar(255) NOT NULL,
  `proof_url` varchar(500) DEFAULT NULL,
  `created_by` int NOT NULL,
  `stage` varchar(100) NOT NULL,
  `totaltillnow` decimal(10,2) NOT NULL,
  `admin_fee_included` tinyint(1) NOT NULL DEFAULT '0',
  `admin_fee_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `leadId` (`leadId`),
  CONSTRAINT `crm_pay_history_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_permissions
-- ----------------------------
CREATE TABLE `crm_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_key` varchar(120) NOT NULL,
  `module` varchar(80) NOT NULL,
  `action` varchar(40) NOT NULL,
  `label` varchar(160) NOT NULL,
  `description` text,
  `status` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_key` (`permission_key`),
  KEY `idx_dm_permissions_module` (`module`),
  KEY `idx_dm_permissions_status` (`status`),
  KEY `idx_dm_permissions_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_companies
-- ----------------------------
CREATE TABLE `crm_pro_companies` (
  `company_id` char(36) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `mohre_employer_code` varchar(255) DEFAULT NULL,
  `gdrfa_establishment_no` varchar(255) DEFAULT NULL,
  `tax_registration_no` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`company_id`),
  KEY `idx_pro_company_status` (`status`),
  KEY `idx_pro_company_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_documents
-- ----------------------------
CREATE TABLE `crm_pro_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` char(36) DEFAULT NULL,
  `company_id` char(36) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `doc_type` enum('Trade License','Chamber Certificate','Establishment Card','MOA','AOA','VAT Certificate','Tax Registration','Office Lease','Bank Account','Other') DEFAULT NULL,
  `doc_number` varchar(255) DEFAULT NULL,
  `issuing_authority` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `authority` varchar(255) DEFAULT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `reminder_days` json DEFAULT NULL,
  `status` enum('Valid','Expiring Soon','Expired','Renewal In Progress','Cancelled') NOT NULL DEFAULT 'Valid',
  `doc_file_url` varchar(500) DEFAULT NULL,
  `notes` text,
  `managed_by` char(36) DEFAULT NULL,
  `renewal_cost` decimal(12,2) DEFAULT NULL,
  `last_renewed` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pro_document_company` (`company_id`),
  KEY `idx_pro_document_expiry` (`expiry_date`),
  KEY `idx_pro_document_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_employee_immigration
-- ----------------------------
CREATE TABLE `crm_pro_employee_immigration` (
  `pro_emp_id` char(36) NOT NULL,
  `employee_id` char(36) NOT NULL,
  `visa_uid` varchar(255) NOT NULL,
  `visa_type` enum('Employment','Mission','Investor','Partner','Other') NOT NULL,
  `visa_issue_date` date NOT NULL,
  `visa_expiry_date` date NOT NULL,
  `visa_status` enum('Active','Expiring','Expired','Cancelled','Under Processing') NOT NULL DEFAULT 'Active',
  `labour_card_no` varchar(255) NOT NULL,
  `labour_card_expiry` date NOT NULL,
  `contract_type` enum('Limited','Unlimited') NOT NULL,
  `mohre_contract_ref` varchar(255) DEFAULT NULL,
  `medical_fitness` date DEFAULT NULL,
  `health_insurance_no` varchar(255) DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `entry_permit_no` varchar(255) DEFAULT NULL,
  `status_change_log` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pro_emp_id`),
  UNIQUE KEY `uniq_pro_employee_immigration_employee` (`employee_id`),
  KEY `idx_pro_employee_visa_expiry` (`visa_expiry_date`),
  KEY `idx_pro_employee_labour_expiry` (`labour_card_expiry`),
  KEY `idx_pro_employee_insurance_expiry` (`insurance_expiry`),
  KEY `idx_pro_employee_visa_status` (`visa_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_gcc_branch_documents
-- ----------------------------
CREATE TABLE `crm_pro_gcc_branch_documents` (
  `branch_id` char(36) NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  `country` enum('UAE','Saudi Arabia','Qatar','Bahrain','Kuwait','Oman') NOT NULL,
  `city` varchar(255) NOT NULL,
  `registration_no` varchar(255) NOT NULL,
  `registration_expiry` date NOT NULL,
  `licence_type` varchar(255) NOT NULL,
  `licence_expiry` date NOT NULL,
  `bank_account` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `branch_manager` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(100) DEFAULT NULL,
  `documents` json DEFAULT NULL,
  `notes` text,
  `status` enum('Active','Inactive','Renewal Pending') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `uniq_gcc_branch_registration` (`country`,`registration_no`),
  KEY `idx_gcc_branch_registration_expiry` (`registration_expiry`),
  KEY `idx_gcc_branch_licence_expiry` (`licence_expiry`),
  KEY `idx_gcc_branch_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_insurance_records
-- ----------------------------
CREATE TABLE `crm_pro_insurance_records` (
  `insurance_id` char(36) NOT NULL,
  `insurance_category` enum('Health','Vehicle','Office','Workmen Compensation','Other') NOT NULL DEFAULT 'Health',
  `employee_id` char(36) DEFAULT NULL,
  `insured_name` varchar(255) NOT NULL,
  `insurance_company` varchar(255) NOT NULL,
  `policy_number` varchar(255) NOT NULL,
  `policy_start` date NOT NULL,
  `policy_expiry` date NOT NULL,
  `coverage_amount` decimal(12,2) DEFAULT NULL,
  `premium_amount` decimal(12,2) DEFAULT NULL,
  `dependents` json DEFAULT NULL,
  `network_code` varchar(100) DEFAULT NULL,
  `card_url` varchar(500) DEFAULT NULL,
  `status` enum('Active','Expiring','Expired','Cancelled') NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`insurance_id`),
  UNIQUE KEY `uniq_pro_insurance_policy` (`policy_number`),
  KEY `idx_pro_insurance_expiry` (`policy_expiry`),
  KEY `idx_pro_insurance_status` (`status`),
  KEY `idx_pro_insurance_employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_monthly_tasks
-- ----------------------------
CREATE TABLE `crm_pro_monthly_tasks` (
  `task_id` char(36) NOT NULL,
  `task_month` date NOT NULL,
  `priority` enum('Critical','High','Medium','Low') NOT NULL,
  `task_label` varchar(255) NOT NULL,
  `entity_type` enum('Company','Employee','Insurance','Branch','Owner') NOT NULL,
  `entity_ref_id` char(36) NOT NULL,
  `doc_type` varchar(120) NOT NULL,
  `expiry_date` date NOT NULL,
  `est_cost_aed` decimal(12,2) DEFAULT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `status` enum('To Do','In Progress','Renewal Applied','Completed','On Hold') NOT NULL DEFAULT 'To Do',
  `due_date` date NOT NULL,
  `notes` text,
  `completed_at` datetime DEFAULT NULL,
  `completed_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`),
  UNIQUE KEY `uniq_pro_monthly_task_source` (`task_month`,`entity_type`,`entity_ref_id`,`doc_type`,`expiry_date`),
  KEY `idx_pro_monthly_task_month` (`task_month`),
  KEY `idx_pro_monthly_task_status` (`status`),
  KEY `idx_pro_monthly_task_priority` (`priority`),
  KEY `idx_pro_monthly_task_due` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_owner_documents
-- ----------------------------
CREATE TABLE `crm_pro_owner_documents` (
  `owner_id` char(36) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('Owner','Partner','Investor','Director','Signatory') NOT NULL,
  `nationality` varchar(255) NOT NULL,
  `passport_no` varchar(255) NOT NULL,
  `passport_expiry` date NOT NULL,
  `emirates_id` varchar(255) DEFAULT NULL,
  `emirates_id_expiry` date DEFAULT NULL,
  `residence_visa_no` varchar(255) DEFAULT NULL,
  `visa_expiry` date DEFAULT NULL,
  `share_percentage` decimal(6,2) DEFAULT NULL,
  `poa_document` varchar(500) DEFAULT NULL,
  `poa_expiry` date DEFAULT NULL,
  `signature_specimen` varchar(500) DEFAULT NULL,
  `bank_signatories` json DEFAULT NULL,
  `documents` json DEFAULT NULL,
  `access_level` enum('Restricted') NOT NULL DEFAULT 'Restricted',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`owner_id`),
  UNIQUE KEY `uniq_owner_passport` (`passport_no`),
  KEY `idx_owner_passport_expiry` (`passport_expiry`),
  KEY `idx_owner_eid_expiry` (`emirates_id_expiry`),
  KEY `idx_owner_visa_expiry` (`visa_expiry`),
  KEY `idx_owner_poa_expiry` (`poa_expiry`),
  KEY `idx_owner_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_tasks
-- ----------------------------
CREATE TABLE `crm_pro_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `due_date` date NOT NULL,
  `priority` varchar(50) NOT NULL DEFAULT 'Medium',
  `status` varchar(50) NOT NULL DEFAULT 'Open',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_wps_records
-- ----------------------------
CREATE TABLE `crm_pro_wps_records` (
  `wps_id` char(36) NOT NULL,
  `payroll_month` date NOT NULL,
  `employer_code` varchar(255) NOT NULL,
  `agent_id` varchar(255) NOT NULL,
  `total_employees` int NOT NULL DEFAULT '0',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sif_file_url` varchar(500) DEFAULT NULL,
  `submission_date` date DEFAULT NULL,
  `submission_ref` varchar(255) DEFAULT NULL,
  `status` enum('Draft','Generated','Submitted','Confirmed','Rejected') NOT NULL DEFAULT 'Draft',
  `rejection_reason` text,
  `processed_by` char(36) NOT NULL,
  `salary_records` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`wps_id`),
  KEY `idx_pro_wps_month` (`payroll_month`),
  KEY `idx_pro_wps_status` (`status`),
  KEY `idx_pro_wps_processed_by` (`processed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_pro_wps_runs
-- ----------------------------
CREATE TABLE `crm_pro_wps_runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `month_label` varchar(50) NOT NULL,
  `employees` int NOT NULL DEFAULT '0',
  `gross_payroll` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sif_status` varchar(50) NOT NULL DEFAULT 'Prepared',
  `bank` varchar(255) NOT NULL DEFAULT '',
  `transfer_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_program_type
-- ----------------------------
CREATE TABLE `crm_program_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_prospect_documents
-- ----------------------------
CREATE TABLE `crm_prospect_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prospectId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `uploadDate` date NOT NULL,
  `url` varchar(500) NOT NULL,
  `type` varchar(80) NOT NULL DEFAULT 'document',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prospect_documents_prospect` (`prospectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_prospect_remarks
-- ----------------------------
CREATE TABLE `crm_prospect_remarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prospectId` int NOT NULL,
  `date` date NOT NULL,
  `remark` text NOT NULL,
  `employeeId` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prospect_remarks_prospect` (`prospectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_prospects
-- ----------------------------
CREATE TABLE `crm_prospects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agreementNumber` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `oldNew` varchar(20) NOT NULL DEFAULT 'new',
  `noc` varchar(255) NOT NULL,
  `counselorId` int NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prospects_status` (`status`),
  KEY `idx_prospects_counselor` (`counselorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_quotation_items
-- ----------------------------
CREATE TABLE `crm_quotation_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quotationId` int NOT NULL,
  `itemType` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unitPrice` decimal(15,2) NOT NULL DEFAULT '0.00',
  `totalPrice` decimal(15,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) NOT NULL DEFAULT 'AED',
  `category` varchar(100) DEFAULT NULL,
  `serviceType` varchar(100) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quote_items_quotation` (`quotationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_refunds
-- ----------------------------
CREATE TABLE `crm_refunds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadId` int NOT NULL,
  `refund_amount` double(10,2) NOT NULL,
  `refund_file` varchar(255) NOT NULL,
  `refund_approved_by` int NOT NULL,
  `refund_date` date NOT NULL,
  `refund_department` int NOT NULL,
  `revenue_adjust` int NOT NULL,
  `revenue_deduct` int NOT NULL,
  `refund_approved_date` date NOT NULL,
  `refund_remarks` longtext NOT NULL,
  `refund_type` varchar(100) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_region
-- ----------------------------
CREATE TABLE `crm_region` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_remarks
-- ----------------------------
CREATE TABLE `crm_remarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int NOT NULL,
  `action` varchar(50) NOT NULL,
  `remark` text NOT NULL,
  `previous_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `actor_id` int DEFAULT NULL,
  `actor_role` varchar(80) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dm_remarks_lead` (`lead_id`,`created_at`),
  KEY `fk_dm_remarks_actor` (`actor_id`),
  CONSTRAINT `fk_dm_remarks_actor` FOREIGN KEY (`actor_id`) REFERENCES `crm_employee` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dm_remarks_lead` FOREIGN KEY (`lead_id`) REFERENCES `crm_forum_leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_role
-- ----------------------------
CREATE TABLE `crm_role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(555) NOT NULL,
  `hierarchy` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `type` varchar(55) NOT NULL,
  `department_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_dm_role_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_role_permissions
-- ----------------------------
CREATE TABLE `crm_role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_dm_role_permission` (`role_id`,`permission_id`),
  KEY `idx_dm_role_permissions_role` (`role_id`),
  KEY `idx_dm_role_permissions_permission` (`permission_id`),
  KEY `idx_dm_role_permissions_status` (`status`),
  CONSTRAINT `fk_dm_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `crm_permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dm_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `crm_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1801 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: crm_service
-- ----------------------------
CREATE TABLE `crm_service` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `flag` varchar(100) DEFAULT NULL,
  `slogan_logo` varchar(100) DEFAULT NULL,
  `validity` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1025 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_source
-- ----------------------------
CREATE TABLE `crm_source` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(555) NOT NULL,
  `category` varchar(60) DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  `sub_source` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2024 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_target_dates
-- ----------------------------
CREATE TABLE `crm_target_dates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `month` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_task
-- ----------------------------
CREATE TABLE `crm_task` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task` varchar(555) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `date_created` varchar(30) DEFAULT NULL,
  `stage` int NOT NULL DEFAULT '0',
  `asignTo` int NOT NULL DEFAULT '0',
  `asignBy` int NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT '0',
  `doc` varchar(30) DEFAULT NULL,
  `notf` int NOT NULL DEFAULT '0',
  `created` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `opportunity_id` int DEFAULT NULL,
  `visa_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dm_task_opportunity` (`opportunity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_teams
-- ----------------------------
CREATE TABLE `crm_teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `team` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_vendor_documents
-- ----------------------------
CREATE TABLE `crm_vendor_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_id` int DEFAULT NULL,
  `doc_type` varchar(100) DEFAULT NULL,
  `doc_uploaded_for` varchar(255) DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `name` varchar(555) DEFAULT NULL,
  `file` varchar(555) DEFAULT NULL,
  `created` date DEFAULT NULL,
  `created_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `remarks` longtext,
  `download_file` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `leadId` (`leadId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_vendor_invoice
-- ----------------------------
CREATE TABLE `crm_vendor_invoice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `ag_no` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice` int NOT NULL,
  `created` int NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: crm_vendors
-- ----------------------------
CREATE TABLE `crm_vendors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: crm_wp_cases
-- ----------------------------
CREATE TABLE `crm_wp_cases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vendor_id` int NOT NULL,
  `approve` int NOT NULL,
  `stage_2_approve` int NOT NULL,
  `stage_3_approve` int NOT NULL,
  `stage_2_denied` int NOT NULL,
  `stage_3_denied` int NOT NULL,
  `declined` int NOT NULL,
  `ag_no` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `amount_stage_2` decimal(10,2) NOT NULL,
  `amount_stage_3` decimal(10,2) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `batch_id` int NOT NULL,
  `account_approve` int NOT NULL,
  `account_approve_two` int NOT NULL,
  `account_approve_three` int NOT NULL,
  `ops_approve` int NOT NULL,
  `ops_approve_two` int NOT NULL,
  `ops_approve_three` int NOT NULL,
  `stage_2_file` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_3_file` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rejection` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table: data_access_audit_log
-- ----------------------------
CREATE TABLE `data_access_audit_log` (
  `audit_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `entity_type` varchar(80) NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `action` varchar(80) NOT NULL,
  `metadata` json DEFAULT NULL,
  `accessed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`),
  KEY `idx_data_access_entity` (`entity_type`,`entity_id`),
  KEY `idx_data_access_user` (`user_id`),
  KEY `idx_data_access_at` (`accessed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: expense_type
-- ----------------------------
CREATE TABLE `expense_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: gary_work_docs
-- ----------------------------
CREATE TABLE `gary_work_docs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ag_no` int DEFAULT NULL,
  `docs` varchar(70) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gary_work_docs_ibfk_1` (`ag_no`),
  CONSTRAINT `gary_work_docs_ibfk_1` FOREIGN KEY (`ag_no`) REFERENCES `crm_forum_leads_contracts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: ielts
-- ----------------------------
CREATE TABLE `ielts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timing` varchar(250) DEFAULT NULL,
  `link` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: monthly_report_log
-- ----------------------------
CREATE TABLE `monthly_report_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `period_month` char(7) NOT NULL,
  `recipient_id` int NOT NULL,
  `recipient_role` varchar(30) NOT NULL,
  `status` enum('Sent','Skipped','Failed') NOT NULL,
  `error_message` text,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_monthly_report_log` (`period_month`,`recipient_id`),
  KEY `idx_monthly_report_log_period` (`period_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: notification_log
-- ----------------------------
CREATE TABLE `notification_log` (
  `log_id` char(36) NOT NULL,
  `source_module` varchar(50) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `record_id` varchar(100) NOT NULL,
  `employee_id` char(36) DEFAULT NULL,
  `company_id` char(36) DEFAULT NULL,
  `threshold_days` int NOT NULL,
  `expiry_date` date NOT NULL,
  `notified_parties` json DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `channels` json DEFAULT NULL,
  `status` enum('Sent','Skipped','Failed') NOT NULL DEFAULT 'Sent',
  `error_message` text,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `uniq_notification_log` (`source_module`,`document_type`,`record_id`,`threshold_days`,`expiry_date`),
  KEY `idx_notification_log_expiry` (`expiry_date`),
  KEY `idx_notification_log_sent` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Table: qualification
-- ----------------------------
CREATE TABLE `qualification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `leadid` int DEFAULT NULL,
  `qualifctn` varchar(30) DEFAULT NULL,
  `specilization` varchar(100) DEFAULT NULL,
  `university` varchar(100) DEFAULT NULL,
  `assesment_body` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `rating` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: student_leads_logs
-- ----------------------------
CREATE TABLE `student_leads_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Counsilor` int DEFAULT NULL,
  `lead` int DEFAULT NULL,
  `date` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Counsilor` (`Counsilor`),
  CONSTRAINT `student_leads_logs_ibfk_1` FOREIGN KEY (`Counsilor`) REFERENCES `crm_employee` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: target
-- ----------------------------
CREATE TABLE `target` (
  `id` int NOT NULL AUTO_INCREMENT,
  `counsilorid` int DEFAULT NULL,
  `branch` int NOT NULL,
  `month` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `appointment` int DEFAULT NULL,
  `sales` int DEFAULT NULL,
  `branch_sales` int DEFAULT NULL,
  `leads` int DEFAULT NULL,
  `cold` int DEFAULT NULL,
  `target_date_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `counsilorid` (`counsilorid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table: task_remarks
-- ----------------------------
CREATE TABLE `task_remarks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `taskid` int DEFAULT NULL,
  `date` varchar(30) DEFAULT NULL,
  `remarks` text,
  `emp` varchar(150) DEFAULT NULL,
  `notf` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS = 1;
