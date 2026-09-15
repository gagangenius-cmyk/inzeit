/**
 * CMG CRM Process Flow — End-to-End Test Script
 *
 * Tests the complete flow:
 *   Seed data → Submit for Finance → Finance Rejection → Re-submit →
 *   Finance Approved → Compliance Rejection → Re-submit →
 *   Compliance Approved → Client Created → Case Activation →
 *   Case Notes → Audit Logs → Dashboard
 *
 * Run:  node scripts/test-crm-workflow.js
 */

const BASE = 'http://localhost:3000';

let leadId;
let opportunityId;
let financeOfficerId = 0;
let complianceOfficerId = 0;
let caseOfficerId = 0;
let counselorId = 0;
let testEmployeeId = 0;

let passed = 0;
let failed = 0;
let total = 0;

// ─── Helpers ───────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

function log(label, result) {
  const status = result.status;
  const ok = status >= 200 && status < 300;
  const icon = ok ? '✅' : '❌';
  console.log(`\n${icon}  [${status}] ${label}`);
  if (result.json) {
    const data = JSON.stringify(result.json, null, 2);
    if (data.length > 2000) {
      console.log(data.substring(0, 2000) + '\n... (truncated)');
    } else {
      console.log(data);
    }
  }
}

function check(label, condition, detail) {
  total++;
  if (condition) {
    passed++;
    console.log(`   ✓ ${label}`);
  } else {
    failed++;
    console.error(`   ✗ ${label} ${detail ? '(' + detail + ')' : ''}`);
  }
}

// ─── Phase 0: Seed test data directly via SQL ──────────────
async function seedViaSQL() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 0: SEED TEST DATA VIA SQL');
  console.log('='.repeat(70));

  // Get an existing employee to use as counselor
  const empRes = await api('GET', '/api/employees?limit=1');
  const empList = empRes.json?.employees || empRes.json?.data || (Array.isArray(empRes.json) ? empRes.json : []);
  if (empList.length > 0) {
    testEmployeeId = empList[0].id;
  }
  check('Get existing employee', testEmployeeId > 0, `employeeId=${testEmployeeId}`);
  counselorId = testEmployeeId;
  financeOfficerId = testEmployeeId;
  complianceOfficerId = testEmployeeId;
  caseOfficerId = testEmployeeId;

  // Try to find an existing lead via leads-simple (no auth required for GET)
  const leadListRes = await api('GET', '/api/leads-simple?limit=1');
  let leadRows = [];
  if (Array.isArray(leadListRes.json)) {
    leadRows = leadListRes.json;
  } else if (leadListRes.json?.data && Array.isArray(leadListRes.json.data)) {
    leadRows = leadListRes.json.data;
  }

  if (leadRows.length > 0 && leadRows[0].id) {
    leadId = leadRows[0].id;
    console.log(`   → Using existing lead: ${leadId}`);
  }

  // Create opportunity — the crm_opportunities table may lack AUTO_INCREMENT,
  // so we allocate the ID explicitly.
  const maxIdRes = await api('GET', '/api/opportunities');
  const allOpps = Array.isArray(maxIdRes.json) ? maxIdRes.json : (maxIdRes.json?.data || []);
  const maxId = allOpps.reduce((max, o) => Math.max(max, o.id || 0), 0);
  const newOppId = maxId + 1;

  const oppRes = await api('POST', '/api/opportunities', {
    id: newOppId,
    leadId: leadId || 1,
    opportunityName: `CRM Workflow Test ${Date.now()}`,
    estimatedValue: 15000,
    currency: 'AED',
    priority: 'high',
    status: 'prospect',
    stage: 'initial',
    probability: 30,
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    serviceRequired: 'Canada PR',
    assignedTo: counselorId || 1,
    createdBy: counselorId || 1,
    branchId: 1,
  });
  log('Create opportunity', oppRes);

  if (oppRes.json?.id) {
    opportunityId = oppRes.json.id;
  } else if (oppRes.json?.data?.id) {
    opportunityId = oppRes.json.data.id;
  } else {
    opportunityId = newOppId;
  }

  if (!leadId && oppRes.json?.leadId) {
    leadId = oppRes.json.leadId;
  }
  check('opportunityId determined', !!opportunityId, `opportunityId=${opportunityId}`);
  check('leadId determined', !!leadId, `leadId=${leadId}`);

  if (!opportunityId) {
    console.error('\n❌  Cannot proceed without an opportunityId. Aborting.');
    process.exit(1);
  }
}

// ─── Phase 1: Validation & Error Handling ──────────────────
async function testValidation() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 1: VALIDATION & ERROR HANDLING');
  console.log('='.repeat(70));

  // 1a: Submit without Official ID
  const r1 = await api('POST', '/api/crm-workflow/submit-for-finance', {
    opportunityId,
    leadId,
    discussionNotes: [{ discussionType: 'Initial Consultation', discussionSummary: 'Test summary with enough characters for validation' }],
    paymentInput: { totalServiceFee: 10000, netPayableAmount: 10000, paymentMethod: 'Cash', firstInstallmentAmount: 5000, receiptNumber: 'R001', receiptDate: '2026-06-23', paymentSchedule: [{ dueDate: '2026-07-01', amount: 5000 }] },
    actorId: counselorId,
    actorRole: 'account_manager',
  });
  log('1a: Submit WITHOUT official ID (expect rejection)', r1);
  check('Rejects missing official ID', r1.json?.success === false || r1.json?.errors?.length > 0);

  // 1b: Submit with empty discussion notes
  const r2 = await api('POST', '/api/crm-workflow/submit-for-finance', {
    opportunityId,
    leadId,
    officialId: { passportCopy: 'p.pdf', passportNumber: 'X1', passportIssueDate: '2020-01-01', passportExpiryDate: '2030-01-01', nationalIdCopy: 'n.pdf', nationalIdNumber: 'N1', nationalIdExpiryDate: '2028-01-01', dateOfBirth: '1990-01-01', gender: 'Male' },
    discussionNotes: [],
    paymentInput: { totalServiceFee: 10000, netPayableAmount: 10000, paymentMethod: 'Cash', firstInstallmentAmount: 5000, receiptNumber: 'R001', receiptDate: '2026-06-23', paymentSchedule: [{ dueDate: '2026-07-01', amount: 5000 }] },
    actorId: counselorId,
    actorRole: 'account_manager',
  });
  log('1b: Submit with EMPTY notes (expect rejection)', r2);
  check('Rejects empty discussion notes', r2.json?.success === false || r2.json?.errors?.length > 0);

  // 1c: Discount without approval ref
  const r3 = await api('POST', '/api/crm-workflow/submit-for-finance', {
    opportunityId,
    leadId,
    officialId: { passportCopy: 'p.pdf', passportNumber: 'X1', passportIssueDate: '2020-01-01', passportExpiryDate: '2030-01-01', nationalIdCopy: 'n.pdf', nationalIdNumber: 'N1', nationalIdExpiryDate: '2028-01-01', dateOfBirth: '1990-01-01', gender: 'Male' },
    discussionNotes: [{ discussionType: 'Follow-up', discussionSummary: 'Test summary with enough characters for validation purposes here' }],
    paymentInput: { totalServiceFee: 10000, discountAmount: 2000, netPayableAmount: 8000, paymentMethod: 'Cash', firstInstallmentAmount: 4000, receiptNumber: 'R002', receiptDate: '2026-06-23', paymentSchedule: [{ dueDate: '2026-07-01', amount: 4000 }] },
    actorId: counselorId,
    actorRole: 'account_manager',
  });
  log('1c: Discount WITHOUT approval ref (expect rejection)', r3);
  check('Rejects discount without approval ref', r3.json?.success === false || r3.json?.errors?.length > 0);

  // 1d: Finance review before submission
  const r4 = await api('POST', '/api/crm-workflow/finance-review', {
    opportunityId,
    decision: 'approved',
    checklist: {},
    actorId: financeOfficerId,
    actorRole: 'finance_officer',
  });
  log('1d: Finance review BEFORE submit (expect rejection)', r4);
  check('Rejects premature finance review', r4.json?.success === false || r4.json?.errors?.length > 0);
}

// ─── Phase 2: Happy Path ───────────────────────────────────
async function testHappyPath() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 2: HAPPY PATH — Full Workflow');
  console.log('='.repeat(70));

  const baseOfficialId = {
    passportCopy: '/uploads/passports/ahmed_passport.pdf',
    passportNumber: 'AB123456',
    passportIssueDate: '2020-01-01',
    passportExpiryDate: '2030-01-01',
    nationalIdCopy: '/uploads/ids/ahmed_nid.pdf',
    nationalIdNumber: '784-1234-5678901-2',
    nationalIdExpiryDate: '2028-06-15',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    maritalStatus: 'Married',
  };

  const basePayment = {
    totalServiceFee: 15000,
    netPayableAmount: 15000,
    paymentMethod: 'Bank Transfer',
    firstInstallmentAmount: 7500,
    receiptNumber: 'REC-2026-001',
    receiptDate: '2026-06-23',
    paymentSchedule: [
      { dueDate: '2026-07-15', amount: 3750 },
      { dueDate: '2026-08-15', amount: 3750 },
    ],
    bankTransferReference: 'TXN-REF-12345',
  };

  // ── STEP 1: Submit for Finance Review ──────────────────────
  const submitRes = await api('POST', '/api/crm-workflow/submit-for-finance', {
    opportunityId,
    leadId,
    officialId: baseOfficialId,
    discussionNotes: [
      {
        discussionType: 'Initial Consultation',
        discussionSummary: 'Client Ahmed discussed Canada PR pathway. He has 5 years of IT experience and is interested in Express Entry. Documents to be collected: passport, ID, educational certificates.',
        actionItems: 'Collect educational credential assessment documents',
        followUpDate: '2026-06-30',
      },
      {
        discussionType: 'Program Review',
        discussionSummary: 'Second follow-up with client regarding Canada Express Entry eligibility. Reviewed IELTS requirements and CRS score estimation.',
      },
    ],
    paymentInput: basePayment,
    actorId: counselorId,
    actorRole: 'account_manager',
  });
  log('STEP 1: Submit for Finance Review', submitRes);
  check('Submit succeeds', submitRes.json?.success === true);

  // Verify status
  let wf = await api('GET', `/api/crm-workflow/${opportunityId}`);
  check('Status = pending_finance_review', wf.json?.data?.workflow?.workflowStatus === 'pending_finance_review');
  console.log(`   → Current status: ${wf.json?.data?.workflow?.workflowStatus}`);

  // ── STEP 2: Finance REJECTS ───────────────────────────────
  const finReject = await api('POST', '/api/crm-workflow/finance-review', {
    opportunityId,
    decision: 'rejected',
    checklist: { firstInstallmentMatchesReceipt: true, paymentMethodCorrect: true, bankTransferReferenceConfirmed: false },
    reason: 'Bank transfer reference could not be confirmed with bank records.',
    actorId: financeOfficerId,
    actorRole: 'finance_officer',
  });
  log('STEP 2: Finance REJECTS', finReject);
  check('Finance reject succeeds', finReject.json?.success === true);

  wf = await api('GET', `/api/crm-workflow/${opportunityId}`);
  check('Status = finance_review_failed', wf.json?.data?.workflow?.workflowStatus === 'finance_review_failed');

  // ── STEP 3: Re-submit after finance rejection ─────────────
  const resubmit1 = await api('POST', '/api/crm-workflow/submit-for-finance', {
    opportunityId,
    leadId,
    officialId: baseOfficialId,
    discussionNotes: [{
      discussionType: 'Follow-up',
      discussionSummary: 'Client provided corrected bank transfer reference. Updated reference confirmed with bank records after finance rejection.',
    }],
    paymentInput: { ...basePayment, bankTransferReference: 'TXN-REF-99999' },
    actorId: counselorId,
    actorRole: 'account_manager',
  });
  log('STEP 3: Re-submit after finance rejection', resubmit1);
  check('Re-submit succeeds', resubmit1.json?.success === true);

  // ── STEP 4: Finance APPROVES ──────────────────────────────
  const finApprove = await api('POST', '/api/crm-workflow/finance-review', {
    opportunityId,
    decision: 'approved',
    checklist: { firstInstallmentMatchesReceipt: true, paymentMethodCorrect: true, bankTransferReferenceConfirmed: true, totalFeeWithinPricing: true, discountHasApproval: true, paymentScheduleRealistic: true, balanceCorrectlyCalculated: true, invoiceGenerated: true },
    actorId: financeOfficerId,
    actorRole: 'finance_officer',
  });
  log('STEP 4: Finance APPROVES', finApprove);
  check('Finance approve succeeds', finApprove.json?.success === true);

  wf = await api('GET', `/api/crm-workflow/${opportunityId}`);
  check('Status = pending_compliance', wf.json?.data?.workflow?.workflowStatus === 'pending_compliance');

  // ── STEP 5: Compliance REJECTS ────────────────────────────
  const compReject = await api('POST', '/api/crm-workflow/compliance-review', {
    opportunityId,
    decision: 'rejected',
    checklist: { fullNameMatchesPassport: false, dobMatchesPassport: true },
    reason: 'Client name on system shows "Ahmed Al Test" but passport shows "Ahmed Al Test bin Mohammed".',
    actorId: complianceOfficerId,
    actorRole: 'crm_compliance_officer',
  });
  log('STEP 5: Compliance REJECTS', compReject);
  check('Compliance reject succeeds', compReject.json?.success === true);

  wf = await api('GET', `/api/crm-workflow/${opportunityId}`);
  check('Status = compliance_review_failed', wf.json?.data?.workflow?.workflowStatus === 'compliance_review_failed');

  // ── STEP 6: Re-submit + Finance re-approve ────────────────
  const resubmit2 = await api('POST', '/api/crm-workflow/submit-for-finance', {
    opportunityId,
    leadId,
    officialId: baseOfficialId,
    discussionNotes: [{
      discussionType: 'Document Review',
      discussionSummary: 'Client updated name on system to exactly match passport after compliance rejection. All documents re-verified for accuracy.',
    }],
    paymentInput: basePayment,
    actorId: counselorId,
    actorRole: 'account_manager',
  });
  log('STEP 6a: Re-submit after compliance rejection', resubmit2);
  check('Re-submit 2 succeeds', resubmit2.json?.success === true);

  const finApprove2 = await api('POST', '/api/crm-workflow/finance-review', {
    opportunityId,
    decision: 'approved',
    checklist: { allItemsVerified: true },
    actorId: financeOfficerId,
    actorRole: 'finance_officer',
  });
  log('STEP 6b: Finance re-approves', finApprove2);
  check('Finance re-approve succeeds', finApprove2.json?.success === true);

  // ── STEP 7: Compliance APPROVES → Client Created ──────────
  const compApprove = await api('POST', '/api/crm-workflow/compliance-review', {
    opportunityId,
    decision: 'approved',
    checklist: { allItemsVerified: true },
    actorId: complianceOfficerId,
    actorRole: 'crm_compliance_officer',
  });
  log('STEP 7: Compliance APPROVES (triggers client creation)', compApprove);
  check('Compliance approve succeeds', compApprove.json?.success === true);

  wf = await api('GET', `/api/crm-workflow/${opportunityId}`);
  check('Status = client', wf.json?.data?.workflow?.workflowStatus === 'client');
  check('Client ID generated', !!wf.json?.data?.workflow?.formalClientId);
  console.log(`   → Client ID: ${wf.json?.data?.workflow?.formalClientId}`);
}

// ─── Phase 3: Case Activation ──────────────────────────────
async function testCaseActivation() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 3: CASE PROCESS OFFICER HANDOFF');
  console.log('='.repeat(70));

  // ── STEP 8: Activate Case ─────────────────────────────────
  const activateRes = await api('POST', '/api/crm-workflow/activate-case', {
    opportunityId,
    caseOfficerId,
    actorId: complianceOfficerId,
    actorRole: 'admin',
  });
  log('STEP 8: Activate Case', activateRes);
  check('Case activation succeeds', activateRes.json?.success === true);

  let wf = await api('GET', `/api/crm-workflow/${opportunityId}`);
  check('Status = case_active', wf.json?.data?.workflow?.workflowStatus === 'case_active');
  check('caseActivatedAt set', !!wf.json?.data?.workflow?.caseActivatedAt);

  // ── STEP 9: Re-activate (should fail) ─────────────────────
  const activateAgain = await api('POST', '/api/crm-workflow/activate-case', {
    opportunityId,
    caseOfficerId,
    actorId: caseOfficerId,
    actorRole: 'case_process_officer',
  });
  log('STEP 9: Re-activate (expect rejection)', activateAgain);
  check('Re-activate rejected', activateAgain.json?.success === false);

  // ── STEP 10: Log case notes ───────────────────────────────
  const note1 = await api('POST', '/api/crm-workflow/case-notes', {
    opportunityId,
    caseOfficerId,
    noteText: 'Case activated. Initial document review completed. All submitted documents are verified and match the compliance-approved records.',
  });
  log('STEP 10a: Log case note', note1);
  check('Case note 1 logged', note1.json?.success === true);

  const note2 = await api('POST', '/api/crm-workflow/case-notes', {
    opportunityId,
    caseOfficerId,
    noteText: 'IELTS score report received from client. Overall band: 7.5. CRS score estimated at 470. Next step: submit Express Entry profile.',
  });
  log('STEP 10b: Log second case note', note2);
  check('Case note 2 logged', note2.json?.success === true);
}

// ─── Phase 4: Audit Trail & Dashboard ──────────────────────
async function testAuditAndDashboard() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 4: AUDIT TRAIL & DASHBOARD');
  console.log('='.repeat(70));

  // ── STEP 11: Get audit trail ──────────────────────────────
  const auditRes = await api('GET', `/api/crm-workflow/audit/${opportunityId}`);
  log('STEP 11: Audit trail', auditRes);
  check('Audit logs returned', Array.isArray(auditRes.json?.data));
  check('At least 8 audit entries', auditRes.json?.data?.length >= 8, `got ${auditRes.json?.data?.length}`);

  if (auditRes.json?.data) {
    const actions = auditRes.json.data.map(l => l.action);
    console.log(`   → Actions logged: ${actions.join(', ')}`);
    check('Has submit_for_finance', actions.includes('submit_for_finance'));
    check('Has finance_approve', actions.includes('finance_approve'));
    check('Has compliance_approve', actions.includes('compliance_approve'));
    check('Has client_account_created', actions.includes('client_account_created'));
    check('Has case_activated', actions.includes('case_activated'));

    // Verify each entry has required fields
    for (const entry of auditRes.json.data) {
      check(`Audit entry ${entry.action} has timestamp`, !!entry.created_at || !!entry.createdAt);
    }
  }

  // ── STEP 12: Dashboard ────────────────────────────────────
  const dashRes = await api('GET', '/api/crm-workflow/dashboard');
  log('STEP 12: Dashboard', dashRes);
  check('Dashboard returns success', dashRes.json?.success === true);
  check('Has statusCounts', Array.isArray(dashRes.json?.data?.statusCounts));
  check('Has pendingFinance count', typeof dashRes.json?.data?.pendingFinance === 'number');
  check('Has activeCases count', typeof dashRes.json?.data?.activeCases === 'number');
  console.log(`   → Active cases: ${dashRes.json?.data?.activeCases}`);

  // ── STEP 13: Full workflow detail ─────────────────────────
  const detailRes = await api('GET', `/api/crm-workflow/${opportunityId}`);
  log('STEP 13: Full workflow detail', detailRes);
  check('Workflow returned', !!detailRes.json?.data?.workflow);
  check('Lead data attached', !!detailRes.json?.data?.lead || !!detailRes.json?.data?.workflow?.leadId);
  check('Handover notes exist', detailRes.json?.data?.handoverNotes?.length > 0, `got ${detailRes.json?.data?.handoverNotes?.length}`);
  check('Payment schedule exists', detailRes.json?.data?.paymentSchedule?.length > 0, `got ${detailRes.json?.data?.paymentSchedule?.length}`);

  // ── STEP 14: Verify workflow NOT found for bad ID ─────────
  const badRes = await api('GET', '/api/crm-workflow/999999');
  log('STEP 14: Get non-existent workflow (expect 404)', badRes);
  check('Returns 404 for non-existent', badRes.status === 404 || badRes.json?.success === false);
}

// ─── Main ──────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   CMG CRM PROCESS FLOW — END-TO-END TEST SUITE                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try {
    await seedViaSQL();
    await testValidation();
    await testHappyPath();
    await testCaseActivation();
    await testAuditAndDashboard();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '═'.repeat(70));
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${total} total`);
    console.log('═'.repeat(70));

    if (failed > 0) {
      console.log(`\n❌  ${failed} TEST(S) FAILED  (${elapsed}s)`);
      process.exit(1);
    } else {
      console.log(`\n✅  ALL ${total} TESTS PASSED  (${elapsed}s)`);
    }
  } catch (err) {
    console.error('\n❌  TEST SUITE ERROR');
    console.error(err);
    process.exit(1);
  }
}

main();
