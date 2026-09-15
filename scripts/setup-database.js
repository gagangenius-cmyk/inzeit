const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { seedRolePermissions } = require('./seed-roles-permissions');
const { seedSources } = require('./seed-sources');
const { seedBranches } = require('./seed-branches');
const { seedCurrency } = require('./seed-currency');
const { seedCountries } = require('./seed-countries');
const { seedFees } = require('./seed-fees');
const { seedEmployees } = require('./seed-employees');
const { seedProgramValidity } = require('./seed-program-validity');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm';
const parsedUrl = new URL(databaseUrl);
const database = parsedUrl.pathname.replace(/^\//, '');

const baseConfig = {
  host: parsedUrl.hostname || 'localhost',
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username || 'root'),
  password: decodeURIComponent(parsedUrl.password || ''),
  multipleStatements: false,
};

const migrations = [
  `CREATE TABLE IF NOT EXISTS appointments (
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
  )`,
  `CREATE TABLE IF NOT EXISTS crm_follow_up_reminders (
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
  )`,
  `CREATE TABLE IF NOT EXISTS crm_notifications (
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
  )`,
  `CREATE TABLE IF NOT EXISTS crm_forum_leads_remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    \`lead\` INT NOT NULL,
    \`date\` DATE NULL,
    remark TEXT NULL,
    emp INT NOT NULL DEFAULT 0,
    created TIME NULL,
    \`status\` INT NOT NULL DEFAULT 1,
    INDEX idx_lead_remarks_lead (\`lead\`),
    INDEX idx_lead_remarks_emp (emp),
    INDEX idx_lead_remarks_date (\`date\`)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leadId INT NOT NULL,
    opportunityNumber VARCHAR(50) NOT NULL UNIQUE,
    opportunityName VARCHAR(255) NOT NULL,
    opportunityType VARCHAR(100) NULL,
    serviceType VARCHAR(255) NULL,
    serviceRequired VARCHAR(255) NULL,
    estimatedValue DECIMAL(15,2) NOT NULL DEFAULT 0,
    actualValue DECIMAL(15,2) NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    priority VARCHAR(30) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'prospect',
    stage VARCHAR(100) NOT NULL DEFAULT 'initial',
    probability INT NOT NULL DEFAULT 0,
    expectedCloseDate DATETIME NULL,
    actualCloseDate DATETIME NULL,
    description TEXT NULL,
    source VARCHAR(100) NULL,
    leadSource VARCHAR(255) NULL,
    campaign VARCHAR(100) NULL,
    assignedTo INT NOT NULL,
    branchId INT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lostReason TEXT NULL,
    competitor VARCHAR(255) NULL,
    nextAction VARCHAR(255) NULL,
    nextActionDate DATETIME NULL,
    tags VARCHAR(500) NULL,
    notes TEXT NULL,
    conversionDate DATETIME NULL,
    retentionAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
    retentionStatus VARCHAR(30) NOT NULL DEFAULT 'pending',
    retentionDate DATETIME NULL,
    agreementGenerated TINYINT(1) NOT NULL DEFAULT 0,
    agreementId INT NULL,
    agreementSent TINYINT(1) NOT NULL DEFAULT 0,
    agreementSigned TINYINT(1) NOT NULL DEFAULT 0,
    paymentReceived TINYINT(1) NOT NULL DEFAULT 0,
    documentsVerified TINYINT(1) NOT NULL DEFAULT 0,
    INDEX idx_dmc_opportunities_lead (leadId),
    INDEX idx_dmc_opportunities_assigned (assignedTo),
    INDEX idx_dmc_opportunities_branch (branchId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_opportunity_quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunityId INT NOT NULL,
    quotationNumber VARCHAR(50) NOT NULL UNIQUE,
    version INT NOT NULL DEFAULT 1,
    validUntil DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discountType VARCHAR(30) NOT NULL DEFAULT 'percentage',
    tax DECIMAL(15,2) NOT NULL DEFAULT 0,
    taxRate DECIMAL(5,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    terms TEXT NULL,
    notes TEXT NULL,
    sentDate DATETIME NULL,
    acceptedDate DATETIME NULL,
    rejectedDate DATETIME NULL,
    rejectedReason TEXT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_opp_quotes_opportunity (opportunityId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotationId INT NOT NULL,
    itemType VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unitPrice DECIMAL(15,2) NOT NULL DEFAULT 0,
    totalPrice DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    category VARCHAR(100) NULL,
    serviceType VARCHAR(100) NULL,
    duration VARCHAR(50) NULL,
    notes TEXT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quote_items_quotation (quotationId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_opportunity_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunityId INT NOT NULL,
    paymentNumber VARCHAR(50) NOT NULL UNIQUE,
    paymentStructure VARCHAR(30) NOT NULL DEFAULT 'full',
    paymentType VARCHAR(100) NULL,
    totalAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount DECIMAL(15,2) NULL,
    paidAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
    remainingBalance DECIMAL(15,2) NOT NULL DEFAULT 0,
    balanceAmount DECIMAL(15,2) NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    paymentMethod VARCHAR(50) NOT NULL,
    transactionId VARCHAR(255) NULL,
    paymentDate DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    dueDate DATETIME NOT NULL,
    installmentNumber INT NULL,
    totalInstallments INT NULL,
    milestoneName VARCHAR(255) NULL,
    gateway VARCHAR(50) NULL,
    gatewayTransactionId VARCHAR(255) NULL,
    receiptUrl VARCHAR(500) NULL,
    description TEXT NULL,
    notes TEXT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_opp_payments_opportunity (opportunityId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_opportunity_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunityId INT NOT NULL,
    documentType VARCHAR(100) NOT NULL,
    documentName VARCHAR(255) NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    filePath VARCHAR(500) NOT NULL,
    fileSize INT NOT NULL,
    mimeType VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    uploadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verifiedDate DATETIME NULL,
    verifiedBy INT NULL,
    expiryDate DATETIME NULL,
    required TINYINT(1) NOT NULL DEFAULT 1,
    notes TEXT NULL,
    uploadedBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_opp_documents_opportunity (opportunityId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_opportunity_agreements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunityId INT NOT NULL,
    agreementNumber VARCHAR(50) NOT NULL UNIQUE,
    agreementType VARCHAR(100) NOT NULL,
    templateId INT NULL,
    agreementTitle VARCHAR(255) NULL,
    title VARCHAR(255) NULL,
    description TEXT NULL,
    duration VARCHAR(50) NULL,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    totalAmount DECIMAL(15,2) NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    terms TEXT NULL,
    termsAndConditions TEXT NULL,
    specialConditions TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    generatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sentDate DATETIME NULL,
    signedDate DATETIME NULL,
    clientSignature TEXT NULL,
    signatureDate DATETIME NULL,
    documentUrl VARCHAR(500) NULL,
    clientName VARCHAR(255) NULL,
    clientEmail VARCHAR(255) NULL,
    clientPhone VARCHAR(80) NULL,
    companyName VARCHAR(255) NULL,
    companyAddress TEXT NULL,
    uploadedToCrm TINYINT(1) NOT NULL DEFAULT 0,
    uploadedBy INT NULL,
    content LONGTEXT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_opp_agreements_opportunity (opportunityId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_opportunity_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opportunityId INT NOT NULL,
    activityType VARCHAR(100) NOT NULL,
    activityTitle VARCHAR(255) NOT NULL,
    description TEXT NULL,
    activityDate DATETIME NOT NULL,
    duration INT NULL DEFAULT 0,
    outcome TEXT NULL,
    nextStep VARCHAR(255) NULL,
    assignedTo INT NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
    location VARCHAR(255) NULL,
    attendees TEXT NULL,
    notes TEXT NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_opp_activities_opportunity (opportunityId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_discount_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leadId INT NOT NULL,
    opportunityId INT NULL,
    discountType VARCHAR(30) NOT NULL DEFAULT 'percentage',
    discountAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
    originalAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discountedAmount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    reason TEXT NOT NULL,
    requestedBy INT NOT NULL,
    approvedBy INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    requestedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approvedDate DATETIME NULL,
    rejectedDate DATETIME NULL,
    expiryDate DATETIME NULL,
    notes TEXT NULL,
    approvedAt DATETIME NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_discount_lead (leadId),
    INDEX idx_discount_status (status)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_lead_reassignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leadId INT NOT NULL,
    fromEmployeeId INT NOT NULL,
    toEmployeeId INT NOT NULL,
    reassignmentType VARCHAR(30) NOT NULL DEFAULT 'manual',
    reason TEXT NOT NULL,
    previousStatus VARCHAR(50) NOT NULL,
    newStatus VARCHAR(50) NOT NULL,
    reassignmentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    approvedBy INT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    approvedAt DATETIME NULL,
    createdBy INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reassign_lead (leadId),
    INDEX idx_reassign_status (status)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_auto_reassignment_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    inactive_hours_threshold INT NOT NULL DEFAULT 6,
    auto_reassign TINYINT(1) NOT NULL DEFAULT 1,
    reassign_to_role VARCHAR(50) NOT NULL DEFAULT 'available',
    reassign_to_branch INT NOT NULL DEFAULT 0,
    priority_filter VARCHAR(50) NOT NULL DEFAULT '',
    lead_quality_filter VARCHAR(100) NOT NULL DEFAULT '',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS crm_auto_reassignment_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    processed INT NOT NULL DEFAULT 0,
    reassigned INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS crm_opportunity_compliance_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leadId INT NOT NULL,
    opportunityId INT NULL,
    signedAgreementUrl TEXT NOT NULL,
    clientSignature VARCHAR(255) NULL,
    signatureDate DATE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    submittedBy INT NULL,
    reviewedBy VARCHAR(255) NULL,
    reviewerRole VARCHAR(80) NULL,
    reviewNotes TEXT NULL,
    submittedAt DATETIME NOT NULL,
    reviewedAt DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_compliance_lead (leadId),
    INDEX idx_compliance_status (status)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_prospects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agreementNumber VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    oldNew VARCHAR(20) NOT NULL DEFAULT 'new',
    noc VARCHAR(255) NOT NULL,
    counselorId INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prospects_status (status),
    INDEX idx_prospects_counselor (counselorId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_prospect_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prospectId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    uploadDate DATE NOT NULL,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(80) NOT NULL DEFAULT 'document',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prospect_documents_prospect (prospectId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_prospect_remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prospectId INT NOT NULL,
    date DATE NOT NULL,
    remark TEXT NOT NULL,
    employeeId INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prospect_remarks_prospect (prospectId)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_counsilor_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    counsilors VARCHAR(255) NOT NULL,
    status INT NOT NULL DEFAULT 1,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL DEFAULT 1,
    INDEX idx_counsilor_allocations_branch (branch_id),
    INDEX idx_counsilor_allocations_status (status)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_branch_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    branches VARCHAR(255) NOT NULL,
    status INT NOT NULL DEFAULT 1,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL DEFAULT 1,
    INDEX idx_branch_allocations_employee (emp_id),
    INDEX idx_branch_allocations_status (status)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_lead_round_robin_state (
    branch_id INT NOT NULL PRIMARY KEY,
    last_employee_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lead_round_robin_employee (last_employee_id)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_operation_stage_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module VARCHAR(80) NOT NULL,
    leadId INT NOT NULL,
    opportunityId INT NULL,
    stage VARCHAR(80) NOT NULL,
    stageData LONGTEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_operation_stage_data (module, leadId, opportunityId, stage),
    INDEX idx_operation_stage_data_lead (leadId),
    INDEX idx_operation_stage_data_opportunity (opportunityId),
    INDEX idx_operation_stage_data_module (module)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_ops_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    opsId INT NULL,
    doc_type VARCHAR(100) NULL,
    doc_uploaded_for VARCHAR(255) NULL,
    leadId INT NULL,
    tab INT NULL,
    name VARCHAR(555) NULL,
    file VARCHAR(555) NULL,
    created DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL DEFAULT 1,
    status INT NOT NULL DEFAULT 0,
    remarks TEXT NULL,
    download_file INT NOT NULL DEFAULT 0,
    INDEX idx_ops_documents_lead (leadId),
    INDEX idx_ops_documents_ops (opsId),
    INDEX idx_ops_documents_type (doc_type),
    INDEX idx_ops_documents_status (status)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_operation_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_officer INT NOT NULL,
    branch INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL DEFAULT 1,
    status INT NOT NULL DEFAULT 1,
    is_deleted INT NOT NULL DEFAULT 0,
    INDEX idx_operation_allocations_officer (case_officer),
    INDEX idx_operation_allocations_branch (branch),
    INDEX idx_operation_allocations_active (status, is_deleted)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_permissions (
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
  )`,
  `CREATE TABLE IF NOT EXISTS crm_role_permissions (
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
  )`,
  `INSERT INTO crm_auto_reassignment_rules
    (rule_name, description, inactive_hours_threshold, auto_reassign, reassign_to_role, reassign_to_branch, is_active)
   SELECT 'Default 6-Hour Rule', 'Auto reassign leads untouched for 6+ hours', 6, 1, 'available', 0, 1
   WHERE NOT EXISTS (SELECT 1 FROM crm_auto_reassignment_rules LIMIT 1)`,
  // Otherwise only ever created lazily at runtime (src/app/api/admin/hr/letter-log/route.ts),
  // so a fresh database lacks it when 20260914_core_fk_constraints.sql tries to FK-constrain it.
  `CREATE TABLE IF NOT EXISTS crm_hr_letter_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id VARCHAR(20) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    ref_number VARCHAR(100) NOT NULL,
    letter_date DATE NULL,
    generated_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hr_letter_log_generated_by (generated_by)
  )`,
  `CREATE TABLE IF NOT EXISTS crm_meeting_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    user_id INT NOT NULL,
    meeting_date DATETIME NOT NULL,
    meeting_type VARCHAR(50) NOT NULL,
    location VARCHAR(255) NULL,
    agenda TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    notes TEXT NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_meeting_schedules_lead (lead_id),
    INDEX idx_meeting_schedules_user (user_id),
    INDEX idx_meeting_schedules_status (status),
    INDEX idx_meeting_schedules_date (meeting_date)
  )`,
];

const columnMigrations = [
  ['appointments', 'leadid', 'INT NULL'],
  ['appointments', 'date', 'VARCHAR(50) NULL'],
  ['appointments', 'appointtime', "TIME NOT NULL DEFAULT '09:00:00'"],
  ['appointments', 'counsilorid', 'INT NULL'],
  ['appointments', 'booked', 'INT NULL DEFAULT 1'],
  ['appointments', 'done', 'INT NULL DEFAULT 0'],
  ['appointments', 'not_done', 'INT NULL DEFAULT 0'],
  ['appointments', 'region', 'INT NULL'],
  ['appointments', 'branch', 'INT NOT NULL DEFAULT 0'],
  ['appointments', 'screenshot', "VARCHAR(255) NOT NULL DEFAULT ''"],
  ['appointments', 'second_done', 'INT NOT NULL DEFAULT 0'],
  ['appointments', 'second_meet_date', 'DATE NULL'],
  ['crm_follow_up_reminders', 'lead_id', 'INT NOT NULL'],
  ['crm_follow_up_reminders', 'user_id', 'INT NOT NULL'],
  ['crm_follow_up_reminders', 'reminder_date', 'DATETIME NOT NULL'],
  ['crm_follow_up_reminders', 'message', 'TEXT NOT NULL'],
  ['crm_follow_up_reminders', 'status', "VARCHAR(20) NOT NULL DEFAULT 'pending'"],
  ['crm_follow_up_reminders', 'priority', "VARCHAR(20) NOT NULL DEFAULT 'medium'"],
  ['crm_follow_up_reminders', 'completed_at', 'DATETIME NULL'],
  ['crm_follow_up_reminders', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ['crm_follow_up_reminders', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ['crm_notifications', 'user_id', 'INT NOT NULL'],
  ['crm_notifications', 'type', 'VARCHAR(50) NOT NULL'],
  ['crm_notifications', 'title', 'VARCHAR(255) NOT NULL'],
  ['crm_notifications', 'message', 'TEXT NOT NULL'],
  ['crm_notifications', 'is_read', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['crm_notifications', 'priority', "VARCHAR(20) NOT NULL DEFAULT 'normal'"],
  ['crm_notifications', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ['crm_notifications', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ['crm_forum_leads_remarks', 'lead', 'INT NOT NULL'],
  ['crm_forum_leads_remarks', 'date', 'DATE NULL'],
  ['crm_forum_leads_remarks', 'remark', 'TEXT NULL'],
  ['crm_forum_leads_remarks', 'emp', 'INT NOT NULL DEFAULT 0'],
  ['crm_forum_leads_remarks', 'created', 'TIME NULL'],
  ['crm_forum_leads_remarks', 'status', 'INT NOT NULL DEFAULT 1'],
  ['crm_forum_leads', 'opportunity_id', 'INT NULL'],
  ['crm_forum_leads', 'opportunity_status', 'VARCHAR(50) NULL'],
  ['crm_forum_leads', 'conversion_date', 'DATETIME NULL'],
  ['crm_forum_leads', 'conversion_reason', 'TEXT NULL'],
  ['crm_forum_leads', 'lost_reason', 'TEXT NULL'],
  ['crm_forum_leads', 'competitor', 'VARCHAR(255) NULL'],
  ['crm_forum_leads', 'qualification_score', 'INT NULL'],
  ['appointments', 'meeting_status', "VARCHAR(20) NULL"],
  ['appointments', 'meeting_verified', 'TINYINT NULL DEFAULT NULL'],
  ['appointments', 'verified_by', 'INT NULL'],
  ['appointments', 'verified_at', 'DATETIME NULL'],
  ['appointments', 'foe_remark', 'VARCHAR(500) NULL'],
  ['crm_forum_leads', 'lead_quality', "VARCHAR(50) NOT NULL DEFAULT 'Warm'"],
  ['crm_opportunities', 'opportunityNumber', 'VARCHAR(50) NULL'],
  ['crm_opportunities', 'description', 'TEXT NULL'],
  ['crm_opportunities', 'serviceType', 'VARCHAR(255) NULL'],
  ['crm_opportunities', 'serviceRequired', 'VARCHAR(255) NULL'],
  ['crm_opportunities', 'actualValue', 'DECIMAL(15,2) NULL DEFAULT 0'],
  ['crm_opportunities', 'actualCloseDate', 'DATETIME NULL'],
  ['crm_opportunities', 'priority', "VARCHAR(30) NOT NULL DEFAULT 'medium'"],
  ['crm_opportunities', 'source', 'VARCHAR(100) NULL'],
  ['crm_opportunities', 'campaign', 'VARCHAR(100) NULL'],
  ['crm_opportunities', 'leadSource', 'VARCHAR(255) NULL'],
  ['crm_opportunities', 'branchId', 'INT NULL'],
  ['crm_opportunities', 'assignedTo', 'INT NULL'],
  ['crm_opportunities', 'createdBy', 'INT NULL'],
  ['crm_opportunities', 'lostReason', 'TEXT NULL'],
  ['crm_opportunities', 'competitor', 'VARCHAR(255) NULL'],
  ['crm_opportunities', 'nextAction', 'VARCHAR(255) NULL'],
  ['crm_opportunities', 'nextActionDate', 'DATETIME NULL'],
  ['crm_opportunities', 'tags', 'VARCHAR(500) NULL'],
  ['crm_opportunities', 'notes', 'TEXT NULL'],
  ['crm_opportunities', 'conversionDate', 'DATETIME NULL'],
  ['crm_opportunities', 'retentionAmount', 'DECIMAL(15,2) NOT NULL DEFAULT 0'],
  ['crm_opportunities', 'retentionStatus', "VARCHAR(30) NOT NULL DEFAULT 'pending'"],
  ['crm_opportunities', 'retentionDate', 'DATETIME NULL'],
  ['crm_opportunities', 'agreementGenerated', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['crm_opportunities', 'agreementId', 'INT NULL'],
  ['crm_opportunities', 'agreementSent', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['crm_opportunities', 'agreementSigned', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['crm_opportunities', 'paymentReceived', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['crm_opportunities', 'documentsVerified', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['crm_opportunity_payments', 'paymentType', 'VARCHAR(100) NULL'],
  ['crm_opportunity_payments', 'paymentNumber', 'VARCHAR(50) NULL'],
  ['crm_opportunity_payments', 'receiptNumber', 'VARCHAR(50) NULL'],
  ['crm_opportunity_payments', 'paymentStructure', "VARCHAR(30) NOT NULL DEFAULT 'full'"],
  ['crm_opportunity_payments', 'totalAmount', 'DECIMAL(15,2) NOT NULL DEFAULT 0'],
  ['crm_opportunity_payments', 'amount', 'DECIMAL(15,2) NULL'],
  ['crm_opportunity_payments', 'paidAmount', 'DECIMAL(15,2) NOT NULL DEFAULT 0'],
  ['crm_opportunity_payments', 'remainingBalance', 'DECIMAL(15,2) NOT NULL DEFAULT 0'],
  ['crm_opportunity_payments', 'balanceAmount', 'DECIMAL(15,2) NULL'],
  ['crm_opportunity_payments', 'dueDate', 'DATETIME NULL'],
  ['crm_opportunity_payments', 'installmentNumber', 'INT NULL'],
  ['crm_opportunity_payments', 'totalInstallments', 'INT NULL'],
  ['crm_opportunity_payments', 'milestoneName', 'VARCHAR(255) NULL'],
  ['crm_opportunity_payments', 'gateway', 'VARCHAR(50) NULL'],
  ['crm_opportunity_payments', 'gatewayTransactionId', 'VARCHAR(255) NULL'],
  ['crm_opportunity_payments', 'receiptUrl', 'VARCHAR(500) NULL'],
  ['crm_opportunity_payments', 'description', 'TEXT NULL'],
  ['crm_opportunity_payments', 'notes', 'TEXT NULL'],
  ['crm_opportunity_payments', 'createdBy', 'INT NULL'],
  ['crm_opportunity_payments', 'receiptType', 'VARCHAR(50) NULL'],
  ['crm_opportunity_payments', 'clientName', 'VARCHAR(255) NULL'],
  ['crm_opportunity_payments', 'clientEmail', 'VARCHAR(255) NULL'],
  ['crm_opportunity_payments', 'clientPhone', 'VARCHAR(80) NULL'],
  ['crm_opportunity_payments', 'clientAddress', 'TEXT NULL'],
  ['crm_opportunity_payments', 'serviceName', 'VARCHAR(255) NULL'],
  ['crm_opportunity_payments', 'branchName', 'VARCHAR(255) NULL'],
  ['crm_opportunity_payments', 'consultantName', 'VARCHAR(255) NULL'],
  ['crm_opportunity_payments', 'taxAmount', 'DECIMAL(15,2) NULL DEFAULT 0'],
  ['crm_opportunity_payments', 'discountAmount', 'DECIMAL(15,2) NULL DEFAULT 0'],
  ['crm_opportunity_agreements', 'templateId', 'INT NULL'],
  ['crm_opportunity_agreements', 'agreementTitle', 'VARCHAR(255) NULL'],
  ['crm_opportunity_agreements', 'title', 'VARCHAR(255) NULL'],
  ['crm_opportunity_agreements', 'description', 'TEXT NULL'],
  ['crm_opportunity_agreements', 'duration', 'VARCHAR(50) NULL'],
  ['crm_opportunity_agreements', 'startDate', 'DATETIME NULL'],
  ['crm_opportunity_agreements', 'endDate', 'DATETIME NULL'],
  ['crm_opportunity_agreements', 'amount', 'DECIMAL(15,2) NOT NULL DEFAULT 0'],
  ['crm_opportunity_agreements', 'totalAmount', 'DECIMAL(15,2) NULL'],
  ['crm_opportunity_agreements', 'currency', "VARCHAR(10) NOT NULL DEFAULT 'AED'"],
  ['crm_opportunity_agreements', 'terms', 'TEXT NULL'],
  ['crm_opportunity_agreements', 'termsAndConditions', 'TEXT NULL'],
  ['crm_opportunity_agreements', 'specialConditions', 'TEXT NULL'],
  ['crm_opportunity_agreements', 'sentDate', 'DATETIME NULL'],
  ['crm_opportunity_agreements', 'clientSignature', 'TEXT NULL'],
  ['crm_opportunity_agreements', 'signatureDate', 'DATETIME NULL'],
  ['crm_opportunity_agreements', 'documentUrl', 'VARCHAR(500) NULL'],
  ['crm_opportunity_agreements', 'clientName', 'VARCHAR(255) NULL'],
  ['crm_opportunity_agreements', 'clientEmail', 'VARCHAR(255) NULL'],
  ['crm_opportunity_agreements', 'clientPhone', 'VARCHAR(80) NULL'],
  ['crm_opportunity_agreements', 'companyName', 'VARCHAR(255) NULL'],
  ['crm_opportunity_agreements', 'companyAddress', 'TEXT NULL'],
  ['crm_opportunity_agreements', 'uploadedToCrm', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['crm_opportunity_agreements', 'uploadedBy', 'INT NULL'],
  ['crm_opportunity_agreements', 'createdBy', 'INT NULL'],
  ['crm_opportunity_agreements', 'content', 'LONGTEXT NULL'],
  ['crm_employee', 'work_location', "ENUM('Onshore', 'Offshore', 'Remote-UAE', 'GCC-Branch') NOT NULL DEFAULT 'Onshore'"],
  ['crm_employee', 'work_country', "VARCHAR(255) NULL DEFAULT 'UAE'"],
  ['crm_employee', 'work_city', 'VARCHAR(255) NULL'],
  ['crm_employee', 'work_site', 'VARCHAR(255) NULL'],
  ['crm_employee', 'employment_type', "ENUM('Full-time', 'Contract', 'Freelance', 'Part-time') NOT NULL DEFAULT 'Full-time'"],
  ['crm_service', 'validity', 'VARCHAR(50) NULL'],
  ['crm_opportunity_payments', 'accountantStatus', "VARCHAR(20) NOT NULL DEFAULT 'pending'"],
  ['crm_opportunity_payments', 'accountantRemarks', 'TEXT NULL'],
  ['crm_opportunity_payments', 'accountantId', 'INT NULL'],
  ['crm_opportunity_payments', 'accountantVerifiedAt', 'DATETIME NULL'],
  ['crm_opportunity_payments', 'leadId', 'INT NULL'],
];

async function ensureColumn(connection, tableName, columnName, definition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, tableName, columnName]
  );

  if (Number(rows[0].count) === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
}

async function ensureColumnType(connection, tableName, columnName, columnType, definition) {
  const [rows] = await connection.query(
    `SELECT COLUMN_TYPE AS columnType
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, tableName, columnName]
  );

  if (rows.length && rows[0].columnType !== columnType) {
    await connection.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${definition}`);
  }
}

async function ensureForeignKey(connection, tableName, constraintName, definition) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [database, tableName, constraintName]
  );

  if (Number(rows[0].count) === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` ${definition}`);
  }
}

async function ensureIndex(connection, tableName, indexName, columns) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [database, tableName, indexName]
  );

  if (Number(rows[0].count) === 0) {
    await connection.query(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${columns})`);
  }
}

async function runSqlMigrations(connection) {
  const directory = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(directory)) return 0;
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const contents = fs.readFileSync(path.join(directory, file), 'utf8');
    // Stored-procedure migrations use mysql-client DELIMITER directives and are
    // already handled by the idempotent JS schema checks below. mysql2 cannot
    // execute them as ordinary statements.
    if (/^\s*DELIMITER\s+/mi.test(contents)) continue;
    const sql = contents
      .replace(/--[^\r\n]*/g, '')
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of sql) {
      try {
        await connection.query(statement);
      } catch (error) {
        // Older migrations pre-date IF NOT EXISTS for indexes/columns. Treat
        // their duplicate-object errors as the intended idempotent outcome.
        if (!['ER_DUP_KEYNAME', 'ER_DUP_FIELDNAME', 'ER_TABLE_EXISTS_ERROR', 'ER_FK_DUP_NAME', 'ER_CANT_DROP_FIELD_OR_KEY'].includes(error.code)) throw error;
      }
    }
  }
  return files.length;
}

async function run() {
  if (!database) {
    throw new Error('DATABASE_URL must include a database name');
  }

  const server = await mysql.createConnection(baseConfig);
  await server.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await server.end();

  const db = await mysql.createConnection({ ...baseConfig, database });
  for (const sql of migrations) {
    await db.query(sql);
  }
  const sqlMigrationCount = await runSqlMigrations(db);
  for (const [tableName, columnName, definition] of columnMigrations) {
    await ensureColumn(db, tableName, columnName, definition);
  }
  await ensureIndex(db, 'appointments', 'idx_appointments_lead', '`leadid`');
  await ensureIndex(db, 'appointments', 'idx_appointments_counselor', '`counsilorid`');
  await ensureIndex(db, 'appointments', 'idx_appointments_date', '`date`');
  await ensureIndex(db, 'appointments', 'idx_appointments_branch', '`branch`');
  await ensureIndex(db, 'appointments', 'idx_appointments_region', '`region`');
  await ensureIndex(db, 'crm_follow_up_reminders', 'idx_followups_lead', '`lead_id`');
  await ensureIndex(db, 'crm_follow_up_reminders', 'idx_followups_user', '`user_id`');
  await ensureIndex(db, 'crm_follow_up_reminders', 'idx_followups_status', '`status`');
  await ensureIndex(db, 'crm_follow_up_reminders', 'idx_followups_priority', '`priority`');
  await ensureIndex(db, 'crm_follow_up_reminders', 'idx_followups_reminder_date', '`reminder_date`');
  await ensureIndex(db, 'crm_notifications', 'idx_notifications_user', '`user_id`');
  await ensureIndex(db, 'crm_notifications', 'idx_notifications_type', '`type`');
  await ensureIndex(db, 'crm_notifications', 'idx_notifications_read', '`is_read`');
  await ensureIndex(db, 'crm_notifications', 'idx_notifications_created', '`created_at`');
  await ensureIndex(db, 'crm_forum_leads_remarks', 'idx_lead_remarks_lead', '`lead`');
  await ensureIndex(db, 'crm_forum_leads_remarks', 'idx_lead_remarks_emp', '`emp`');
  await ensureIndex(db, 'crm_forum_leads_remarks', 'idx_lead_remarks_date', '`date`');
  const rolePermissionSeed = await seedRolePermissions(db);
  await db.query(`DELETE rp FROM crm_role_permissions rp LEFT JOIN crm_role r ON r.id = rp.role_id WHERE r.id IS NULL`);
  await db.query(`DELETE rp FROM crm_role_permissions rp LEFT JOIN crm_permissions p ON p.id = rp.permission_id WHERE p.id IS NULL`);
  await ensureIndex(db, 'crm_role', 'idx_dm_role_id', '`id`');
  await ensureIndex(db, 'crm_permissions', 'idx_dm_permissions_id', '`id`');
  await ensureColumnType(db, 'crm_role_permissions', 'role_id', 'int', 'INT NOT NULL');
  await ensureForeignKey(
    db,
    'crm_role_permissions',
    'fk_dm_role_permissions_role',
    'FOREIGN KEY (`role_id`) REFERENCES `crm_role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
  );
  await ensureForeignKey(
    db,
    'crm_role_permissions',
    'fk_dm_role_permissions_permission',
    'FOREIGN KEY (`permission_id`) REFERENCES `crm_permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
  );

  const sourceSeed = await seedSources(db);
  const branchSeed = await seedBranches(db);
  const currencySeed = await seedCurrency(db);
  const countrySeed = await seedCountries(db);
  const feeSeed = await seedFees(db);
  const programValiditySeed = await seedProgramValidity(db);
  const employeeSeed = await seedEmployees(db);

  await db.end();

  console.log(`Database ${database} is ready. Applied ${migrations.length} built-in and ${sqlMigrationCount} SQL migration files, checked ${columnMigrations.length} columns, and seeded ${rolePermissionSeed.roles} roles / ${rolePermissionSeed.permissions} permissions, ${sourceSeed.sources} lead sources, ${branchSeed.branches} branches, ${currencySeed.currencies} currencies, ${countrySeed.countries} countries, ${feeSeed.fees} fee rows / ${feeSeed.services} services, ${programValiditySeed.programValidity} program validity rows, and employees (created ${employeeSeed.created}, updated ${employeeSeed.updated}, skipped ${employeeSeed.skipped}).`);
}

run().catch((error) => {
  console.error('Database setup failed:', error);
  process.exit(1);
});
