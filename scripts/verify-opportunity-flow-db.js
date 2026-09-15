const mysql = require('mysql2/promise');
require('dotenv').config();

const REQUIRED_COLUMNS = {
  crm_opportunity_workflow_audit_logs: ['id', 'opportunity_id', 'action', 'previous_status', 'new_status', 'actor_id', 'actor_role', 'notes', 'created_at'],
  crm_forum_leads: ['id', 'opportunity_id', 'opportunity_status', 'opportunity_stage', 'client_actual_name', 'payTotal', 'paidYet', 'payBalance'],
  crm_opportunities: ['id', 'leadId', 'opportunityNumber', 'opportunityName', 'opportunityType', 'serviceType', 'serviceRequired', 'product_type', 'estimatedValue', 'currency', 'priority', 'status', 'stage', 'paymentReceived', 'agreementGenerated', 'agreementId', 'agreementSigned', 'documentsVerified', 'createdBy', 'assignedTo', 'branchId'],
  crm_opportunity_payments: ['id', 'opportunityId', 'leadId', 'paymentNumber', 'receiptNumber', 'paymentStructure', 'totalAmount', 'paidAmount', 'remainingBalance', 'balanceAmount', 'currency', 'paymentMethod', 'transactionId', 'paymentDate', 'status', 'dueDate', 'receiptType', 'clientName', 'clientEmail', 'clientPhone', 'serviceName', 'branchName', 'taxAmount', 'discountAmount', 'accountantStatus', 'accountantRemarks', 'accountantId', 'accountantVerifiedAt', 'createdBy'],
  crm_opportunity_agreements: ['id', 'opportunityId', 'agreementNumber', 'agreementType', 'agreementTitle', 'title', 'duration', 'startDate', 'endDate', 'amount', 'totalAmount', 'currency', 'terms', 'termsAndConditions', 'specialConditions', 'status', 'generatedDate', 'signedDate', 'clientSignature', 'signatureDate', 'documentUrl', 'clientName', 'clientEmail', 'clientPhone', 'companyName', 'companyAddress', 'uploadedToCrm', 'uploadedBy', 'content', 'createdBy'],
  crm_opportunity_documents: ['id', 'opportunityId', 'documentType', 'documentName', 'fileName', 'filePath', 'fileSize', 'mimeType', 'category', 'status', 'uploadDate', 'verifiedDate', 'verifiedBy', 'required', 'uploadedBy'],
  crm_opportunity_compliance_approvals: ['id', 'leadId', 'opportunityId', 'signedAgreementUrl', 'clientSignature', 'signatureDate', 'status', 'submittedBy', 'reviewedBy', 'reviewerRole', 'reviewNotes', 'submittedAt', 'reviewedAt'],
  crm_discount_approvals: ['id', 'leadId', 'opportunityId', 'discountType', 'discountAmount', 'originalAmount', 'discountedAmount', 'currency', 'reason', 'requestedBy', 'approvedBy', 'status', 'requestedDate', 'approvedDate', 'rejectedDate', 'notes', 'createdBy', 'is_deleted', 'superseded_by'],
  crm_opportunity_workflow_reviews: ['id', 'opportunity_id', 'lead_id', 'workflow_status', 'official_id_data', 'payment_data', 'finance_status', 'finance_checklist', 'finance_reason', 'finance_reviewed_by', 'finance_reviewed_at', 'compliance_status', 'compliance_checklist', 'compliance_reason', 'compliance_reviewed_by', 'compliance_reviewed_at', 'formal_client_id', 'case_activated_at'],
  crm_pay_history: ['id', 'leadId', 'counselor_receipt', 'proof_url'],
};

async function connect() {
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm');
  return mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || 'root'),
    password: decodeURIComponent(url.password || ''),
    database: url.pathname.slice(1),
  });
}

async function verifyColumns(db) {
  let missingCount = 0;
  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    const [rows] = await db.query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = SCHEMA() AND TABLE_NAME = ?',
      [table]
    );
    const present = new Set(rows.map((row) => row.COLUMN_NAME));
    const missing = columns.filter((column) => !present.has(column));
    if (missing.length) {
      missingCount += missing.length;
      console.log(`MISSING ${table}: ${missing.join(', ')}`);
    } else {
      console.log(`OK ${table}`);
    }
  }
  if (missingCount) throw new Error(`${missingCount} required opportunity-flow column(s) are missing`);
}

async function getColumns(db, table) {
  const [rows] = await db.query(
    'SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = SCHEMA() AND TABLE_NAME = ?',
    [table]
  );
  return rows;
}

function defaultValueForColumn(column) {
  const name = column.COLUMN_NAME.toLowerCase();
  const type = column.DATA_TYPE;
  if (type.includes('int') || ['decimal', 'double', 'float'].includes(type)) return 0;
  if (['date', 'datetime', 'timestamp', 'time'].includes(type)) return new Date();
  if (type === 'enum') {
    if (name.includes('gender')) return 'N/A';
    if (name.includes('status')) return 'Active';
    return '';
  }
  if (name.includes('email')) return `rollback-${Date.now()}@example.test`;
  if (name.includes('mobile') || name.includes('phone')) return '0000000000';
  if (name.includes('password')) return '';
  return 'rollback';
}

async function insertExistingColumns(db, table, values) {
  const metadata = await getColumns(db, table);
  const columns = new Set(metadata.map((row) => row.COLUMN_NAME));
  const completeValues = { ...values };
  for (const column of metadata) {
    const isRequired = column.IS_NULLABLE === 'NO'
      && column.COLUMN_DEFAULT === null
      && !String(column.EXTRA || '').includes('auto_increment');
    if (isRequired && columns.has(column.COLUMN_NAME) && completeValues[column.COLUMN_NAME] === undefined) {
      completeValues[column.COLUMN_NAME] = defaultValueForColumn(column);
    }
  }
  const entries = Object.entries(completeValues).filter(([column]) => columns.has(column));
  const names = entries.map(([column]) => column);
  const params = entries.map(([, value]) => value);
  const placeholders = names.map(() => '?').join(', ');
  const [result] = await db.query(
    `INSERT INTO ${table} (${names.join(', ')}) VALUES (${placeholders})`,
    params
  );
  return result.insertId;
}

async function insertWithRollback(db) {
  await db.beginTransaction();
  try {
    const stamp = Date.now();

    const roleId = await insertExistingColumns(db, 'crm_role', {
      name: `Rollback Role ${stamp}`,
      hierarchy: 999,
      status: 1,
      type: 'rollback',
      department_id: 0,
    });

    const branchId = await insertExistingColumns(db, 'crm_branch', {
      branch: `Rollback Branch ${stamp}`,
      name: `Rollback Branch ${stamp}`,
      address: 'Rollback Address',
      email: `rollback-${stamp}@example.test`,
      mobile: '0000000000',
      license_number: 'TEST-LIC',
      vat_gst_percent: 0,
      abbrv: 'RBT',
      region: 1,
      status: 1,
      created: new Date(),
      created_by: 1,
    });

    const employeeId = await insertExistingColumns(db, 'crm_employee', {
      name: `Rollback Employee ${stamp}`,
      email: `rollback-employee-${stamp}@example.test`,
      phone: '0000000000',
      address: 'Rollback Address',
      role: roleId,
      branch: branchId,
      region: 1,
      password: '',
      status: 1,
      created: new Date(),
      created_by: 1,
      religion: 'N/A',
      gender: 'N/A',
      crea: 1,
      wfh: 0,
    });

    const leadId = await insertExistingColumns(db, 'crm_forum_leads', {
      fname: 'Rollback',
      mname: '',
      lname: 'Lead',
      email: `rollback-lead-${stamp}@example.test`,
      phone: '0000000000',
      mobile: '0000000000',
      nationality: 'N/A',
      address: 'Rollback Address',
      dob: new Date(),
      gender: 'N/A',
      id_number: 'ID-TEST',
      id_expiry: new Date(),
      id_issue_date: new Date(),
      country_interest: '1',
      sub_country_interest: 0,
      service_interest: '1',
      market_source: '1',
      sub_market_source: 0,
      appointment: new Date(),
      followup: new Date(),
      folowuptime: '09:00',
      followupstat: 0,
      enquiry: 'General Inquiry',
      convet: 'New',
      priority: 'Medium',
      regdate: new Date(),
      regtime: new Date(),
      last_updated: new Date(),
      last_updtd_time: new Date(),
      stepComplete: 0,
      assignTo: employeeId,
      case_officer: employeeId,
      Counsilor: employeeId,
      branch: branchId,
      region: 1,
      payTotal: 1000,
      discount: 0,
      paidYet: 0,
      payBalance: 1000,
      demandAmt: 1000,
      status: 'New',
      status_date: new Date(),
      notf: 0,
      type: '',
      transfer_time: '',
      transfered_by: 0,
      exist: 0,
      no_of_applicants: 1,
      advanced: 0,
      do_status: 0,
      arm_status: 0,
      gm_status: 0,
      discount_status: 0,
      discount_remarks: '',
      discount_by: 0,
      discount_date: new Date(),
      campaign: '',
      campaign_group: '',
      pa_fname: '',
      pa_lname: '',
      lead_remark: 'Rollback opportunity-flow verification',
      created: new Date(),
      created_by: employeeId,
      alert: 0,
      area: '',
      lead_quality: 'Warm',
      transferred_remark_update: 0,
      untouch_transfer: 0,
      lead_nq_reason: '',
      tele_caller_alert: 0,
      tele_caller_remark: '',
      tele_caller_remark_by: 0,
      tele_date: new Date(),
      lead_date: new Date(),
      duplicate: 0,
      duplicate_count: 0,
      ref_remark: '',
      na_record: 0,
      old_assgined: 0,
      nal_count: 0,
      campaign_id: 0,
      old_branch: 0,
    });

    const [oppResult] = await db.query(
      `INSERT INTO crm_opportunities
        (leadId, opportunityNumber, opportunityName, opportunityType, serviceType, serviceRequired, product_type, estimatedValue,
         actualValue, currency, priority, status, stage, probability, expectedCloseDate, description, source, leadSource,
         assignedTo, branchId, createdBy, createdAt, updatedAt, agreementGenerated, agreementSent, agreementSigned,
         paymentReceived, documentsVerified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, 0, 0, 1, 0)`,
      [leadId, `ROLLBACK-OPP-${stamp}`, 'Rollback Opportunity Flow Test', 'new_business', 'Test Service', 'Opportunity Flow DB Test', 'general', 1000, 1000, 'AED', 'medium', 'prospect', 'payment', 50, 'rollback test', 'system', 'test', employeeId, branchId, employeeId]
    );
    const opportunityId = oppResult.insertId;

    await db.query(
      `INSERT INTO crm_opportunity_workflow_reviews
        (opportunity_id, lead_id, workflow_status, official_id_data, payment_data, finance_status, finance_checklist,
         compliance_status, compliance_checklist, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [opportunityId, leadId, 'pending_finance_review', JSON.stringify({ passportNumber: 'TEST' }), JSON.stringify({ receiptNumber: `ROLLBACK-RCT-${stamp}` }), 'pending', JSON.stringify({}), 'pending', JSON.stringify({})]
    );

    await db.query(
      `INSERT INTO crm_opportunity_payments
        (opportunityId, leadId, paymentNumber, receiptNumber, paymentStructure, totalAmount, amount, paidAmount, remainingBalance,
         balanceAmount, currency, paymentMethod, transactionId, paymentDate, status, dueDate, receiptType, clientName, clientEmail,
         clientPhone, serviceName, branchName, taxAmount, discountAmount, accountantStatus, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'full', 1000, 1000, 1000, 0, 0, 'AED', 'cash', ?, NOW(), 'paid', NOW(), 'payment', ?, ?, ?, ?, ?, 0, 0, 'pending', ?, NOW(), NOW())`,
      [opportunityId, leadId, `ROLLBACK-PAY-${stamp}`, `ROLLBACK-RCT-${stamp}`, 'ROLLBACK-TXN', 'Rollback Client', `rollback-client-${stamp}@example.test`, '0000000000', 'Test Service', 'Test Branch', employeeId]
    );

    await db.query(
      `INSERT INTO crm_opportunity_agreements
        (opportunityId, agreementNumber, agreementType, agreementTitle, title, duration, startDate, endDate, amount, totalAmount,
         currency, terms, termsAndConditions, specialConditions, status, generatedDate, clientName, clientEmail, clientPhone,
         companyName, companyAddress, uploadedToCrm, uploadedBy, content, createdBy, createdAt, updatedAt)
       VALUES (?, ?, 'service_agreement', 'Rollback Agreement', 'Rollback Agreement', '12 Months', NOW(), DATE_ADD(NOW(), INTERVAL 12 MONTH),
         1000, 1000, 'AED', 'Terms', 'Terms', '', 'generated', NOW(), ?, ?, ?, 'Company', 'Address', 0, ?, 'content', ?, NOW(), NOW())`,
      [opportunityId, `ROLLBACK-AGR-${stamp}`, 'Rollback Client', `rollback-client-${stamp}@example.test`, '0000000000', employeeId, employeeId]
    );

    await db.query(
      `INSERT INTO crm_opportunity_documents
        (opportunityId, documentType, documentName, fileName, filePath, fileSize, mimeType, category, status, uploadDate,
         required, notes, uploadedBy, createdAt, updatedAt)
       VALUES (?, 'id_proof', 'ID Proof', 'id.pdf', '/tmp/id.pdf', 1, 'application/pdf', 'identity', 'uploaded', NOW(), 1, 'rollback', ?, NOW(), NOW())`,
      [opportunityId, employeeId]
    );

    await db.query(
      `INSERT INTO crm_discount_approvals
        (leadId, opportunityId, discountType, discountAmount, originalAmount, discountedAmount, currency, reason, requestedBy,
         status, requestedDate, createdBy, createdAt, updatedAt)
       VALUES (?, ?, 'fixed', 0, 1000, 1000, 'AED', 'rollback test', ?, 'approved', NOW(), ?, NOW(), NOW())`,
      [leadId, opportunityId, employeeId, employeeId]
    );

    await db.query(
      `INSERT INTO crm_opportunity_compliance_approvals
        (leadId, opportunityId, signedAgreementUrl, clientSignature, signatureDate, status, submittedBy, submittedAt, createdAt, updatedAt)
       VALUES (?, ?, '/tmp/signed.pdf', 'Rollback Client', CURDATE(), 'pending', ?, NOW(), NOW(), NOW())`,
      [leadId, opportunityId, employeeId]
    );

    await db.query(
      `INSERT INTO crm_opportunity_workflow_audit_logs
        (opportunity_id, action, previous_status, new_status, actor_id, actor_role, notes, created_at)
       VALUES (?, 'rollback_test', NULL, 'pending_finance_review', ?, 'system', 'rollback write test', NOW())`,
      [opportunityId, employeeId]
    );

    await insertExistingColumns(db, 'crm_pay_history', {
      leadId,
      amount: 1000,
      counselor_receipt: `ROLLBACK-RCT-${stamp}`,
      tabby: 0,
      date: new Date(),
      payMethod: 'cash',
      payoption: 'full',
      paycardoption: '',
      payNextDate: new Date(),
      payBalance: 0,
      tax: 0,
      payCategory: 'payment',
      payment_remarks: 'rollback test',
      remark: 'rollback test',
      status: 1,
      proof_url: '/tmp/proof.pdf',
      thirdPartyAmt: 0,
      dmAmt: 1000,
      dmTax: 0,
      dmRefundAmt: 0,
      curValue: 0,
      refNumber: `ROLLBACK-TXN-${stamp}`,
      created_by: employeeId,
      stage: 'opportunity_conversion',
      totaltillnow: 1000,
      admin_fee_included: 0,
      admin_fee_amount: 0,
    });

    const [[counts]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM crm_opportunity_payments WHERE opportunityId = ?) payments,
        (SELECT COUNT(*) FROM crm_opportunity_agreements WHERE opportunityId = ?) agreements,
        (SELECT COUNT(*) FROM crm_opportunity_documents WHERE opportunityId = ?) documents,
        (SELECT COUNT(*) FROM crm_opportunity_workflow_reviews WHERE opportunity_id = ?) reviews,
        (SELECT COUNT(*) FROM crm_opportunity_compliance_approvals WHERE opportunityId = ?) compliance,
        (SELECT COUNT(*) FROM crm_discount_approvals WHERE opportunityId = ?) discounts,
        (SELECT COUNT(*) FROM crm_opportunity_workflow_audit_logs WHERE opportunity_id = ?) audits,
        (SELECT COUNT(*) FROM crm_pay_history WHERE counselor_receipt = ? AND proof_url = '/tmp/proof.pdf') payHistoryProofs`,
      [opportunityId, opportunityId, opportunityId, opportunityId, opportunityId, opportunityId, opportunityId, `ROLLBACK-RCT-${stamp}`]
    );

    console.log('ROLLBACK_WRITE_TEST_OK', JSON.stringify({ opportunityId, ...counts }));
    await db.rollback();
  } catch (error) {
    await db.rollback();
    throw error;
  }
}

(async () => {
  const db = await connect();
  try {
    console.log('Connected to', db.config.database);
    await verifyColumns(db);
    await insertWithRollback(db);
    console.log('Opportunity flow database verification passed.');
  } finally {
    await db.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
