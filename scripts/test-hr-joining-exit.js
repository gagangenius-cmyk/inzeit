const http = require('http');
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:3000';
const API = '/api/hr';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

let passed = 0, failed = 0;
const log = (label, data) => console.log(`  ${data && data.success !== false ? '✓' : '✗'} ${label}`);
const check = (label, condition, extra) => {
  if (condition) { passed++; console.log(`   ✓ ${label}`); }
  else { failed++; console.log(`   ✗ ${label} ${extra ? '— ' + extra : ''}`); }
};

function api(method, path, body) {
  return new Promise((resolve) => {
    const isGet = method === 'GET';
    const opts = { method, hostname: 'localhost', port: 3000, path, headers: { 'Content-Type': 'application/json' }, timeout: 15000 };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(d); } catch { json = null; }
        resolve({ status: res.statusCode, json, ok: res.statusCode < 400 });
      });
    });
    req.on('error', e => resolve({ status: 0, json: { error: e.message }, ok: false }));
    if (!isGet) req.write(JSON.stringify(body));
    req.end();
  });
}

function authedApi(method, path, body) {
  return new Promise((resolve) => {
    const isGet = method === 'GET';
    const agentToken = jwt.sign({ id: 254, name: 'Test Agent', email: 'test@dm.com', role: 1, type: 'Administrator', permissions: ['hr.*'] }, JWT_SECRET, { expiresIn: '24h' });
    const hrToken = jwt.sign({ id: 255, name: 'HR User', email: 'hr@dm.com', role: 1, type: 'HR Manager', permissions: ['hr.*'] }, JWT_SECRET, { expiresIn: '24h' });
    const dosToken = jwt.sign({ id: 256, name: 'DOS User', email: 'dos@dm.com', role: 1, type: 'Director of Sales', permissions: [] }, JWT_SECRET, { expiresIn: '24h' });
    const tokens = { agent: agentToken, hr: hrToken, dos: dosToken, employee: agentToken, manager: dosToken };
    const token = tokens[body?.auth || 'hr'];
    const opts = { method, hostname: 'localhost', port: 3000, path, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, timeout: 15000 };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(d); } catch { json = null; }
        resolve({ status: res.statusCode, json, ok: res.statusCode < 400 });
      });
    });
    req.on('error', e => resolve({ status: 0, json: { error: e.message }, ok: false }));
    if (!isGet) req.write(JSON.stringify(body));
    req.end();
  });
}

function cleanBody(b) {
  if (b && b.auth) { const { auth, ...rest } = b; return rest; }
  return b;
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  HR JOINING & EXIT FLOW — COMPREHENSIVE TEST SUITE');
  console.log('═'.repeat(70));

  // ─── Session state ───
  let candidateId = '';
  let exitRequestId = '';

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: Joining Flow
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 1: JOINING FLOW');
  console.log('='.repeat(70));

  // 1a. Create candidate (HR auth)
  console.log('\n── Creating candidate ──');
  const createRes = await authedApi('POST', '/api/hr/recruitment/candidates', {
    full_name: 'Ahmed Al Test',
    email: 'ahmed.test@example.com',
    phone: '+971501234567',
    applied_position: 'Business Development Executive',
    source: 'LinkedIn',
    applied_date: '2026-06-01',
    auth: 'hr',
  });
  log('Create candidate', createRes);
  check('Status 201', createRes.status === 201, `Got ${createRes.status}`);
  check('Has candidate data', createRes.json?.candidate?.candidate_id);
  if (createRes.json?.candidate?.candidate_id) candidateId = createRes.json.candidate.candidate_id;
  check('Status = Applied', createRes.json?.candidate?.status === 'Applied');

  // 1b. List candidates
  console.log('\n── Listing candidates ──');
  const listRes = await authedApi('GET', '/api/hr/recruitment/candidates?auth=hr');
  log('List candidates', listRes);
  check('Status 200', listRes.status === 200);
  check('Returns array', Array.isArray(listRes.json?.candidates));
  check('New candidate in list', listRes.json?.candidates?.some(c => c.candidate_id === candidateId));

  // 1c. Filter candidates by status
  const filterStatusRes = await authedApi('GET', '/api/hr/recruitment/candidates?status=Applied&auth=hr');
  check('Filter by status works', filterStatusRes.ok);
  check('All results have Applied status', filterStatusRes.json?.candidates?.every(c => c.status === 'Applied'));

  // 1d. Get candidate by ID
  if (candidateId) {
    const getRes = await authedApi('GET', `/api/hr/recruitment/candidates/${candidateId}?auth=hr`);
    log('Get candidate', getRes);
        check('Correct candidate', getRes.json?.candidate?.full_name === 'Ahmed Al Test');
  }

  // 1e. Update status to Interviewed
  if (candidateId) {
    const updateRes = await authedApi('PUT', `/api/hr/recruitment/candidates/${candidateId}/status`, {
      status: 'Interviewed',
      interview_date: '2026-06-10T10:00:00',
      interview_outcome: 'Pass',
      auth: 'hr',
    });
    log('Update status to Interviewed', updateRes);
        check('Status = Interviewed', updateRes.json?.candidate?.status === 'Interviewed');
  }

  // 1f. Update to Selected
  if (candidateId) {
    const selectRes = await authedApi('PUT', `/api/hr/recruitment/candidates/${candidateId}/status`, {
      status: 'Selected',
      auth: 'hr',
    });
    log('Update to Selected', selectRes);
    check('Status = Selected', selectRes.json?.candidate?.status === 'Selected');
  }

  // 1g. Submit offer
  if (candidateId) {
    const offerRes = await authedApi('POST', `/api/hr/recruitment/candidates/${candidateId}/offer`, {
      offer_salary: 8000,
      offer_designation: 'Senior Business Development Executive',
      offer_terms: 'Standard UAE employment terms',
      auth: 'hr',
    });
    log('Submit offer', offerRes);
    check('Status 200', offerRes.status === 200);
    check('Has offer data', offerRes.json?.candidate?.offer_salary == 8000);
    check('Status = Selected', offerRes.json?.candidate?.status === 'Selected');
  }

  // 1h. Approve offer (DOS approval) + get acceptance token
  let acceptanceToken = '';
  if (candidateId) {
    const approveRes = await authedApi('PUT', `/api/hr/recruitment/candidates/${candidateId}/offer/approve`, { auth: 'dos' });
    log('Approve offer (DOS)', approveRes);
    check('Status 200', approveRes.status === 200);
    check('Status = Offer Sent', approveRes.json?.candidate?.status === 'Offer Sent');
    check('Has acceptance token', approveRes.json?.acceptance_token);
    if (approveRes.json?.acceptance_token) acceptanceToken = approveRes.json.acceptance_token;
    check('DOS approved', approveRes.json?.candidate?.dos_approved_by === '256');
  }

  // 1i. Accept offer (public token — no auth)
  if (candidateId && acceptanceToken) {
    const acceptRes = await api('POST', `/api/hr/recruitment/candidates/${candidateId}/accept`, { token: acceptanceToken });
    log('Accept offer', acceptRes);
    check('Status 200', acceptRes.status === 200);
    check('Status = Accepted', acceptRes.json?.candidate?.status === 'Accepted');
  }

  // 1j. Reject acceptance with bad token
  if (candidateId) {
    const badAcceptRes = await api('POST', `/api/hr/recruitment/candidates/${candidateId}/accept`, { token: 'invalid-token' });
    check('Rejects bad token', badAcceptRes.status === 400);
  }

  // 1k. View pipeline
  const pipelineRes = await authedApi('GET', '/api/hr/recruitment/pipeline?auth=hr');
  log('Pipeline', pipelineRes);
  check('Pipeline OK', pipelineRes.ok);
  check('Has total', typeof pipelineRes.json?.total === 'number');
  check('Has stages', Array.isArray(pipelineRes.json?.stages));

  // 1l. Onboard candidate
  if (candidateId) {
    const onboardRes = await authedApi('POST', `/api/hr/recruitment/onboard/${candidateId}`, {
      company_email: 'ahmed.test@dmconsultants.com',
      joining_date: '2026-07-01',
      employee_id: crypto.randomUUID ? undefined : 'EMP-TEST',
      auth: 'hr',
    });
    log('Onboard candidate', onboardRes);
    check('Status 200', onboardRes.status === 200);
    check('Status = Joined', onboardRes.json?.candidate?.status === 'Joined');
    check('Has company email', onboardRes.json?.candidate?.company_email === 'ahmed.test@dmconsultants.com');
    check('CRM ID generated', onboardRes.json?.candidate?.crm_id_generated_at);
  }

  // 1m. Validation: missing required fields
  const badCreateRes = await authedApi('POST', '/api/hr/recruitment/candidates', { auth: 'hr', full_name: '' });
  log('Rejects missing fields', badCreateRes);
  check('Status 400', badCreateRes.status === 400);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: Exit Flow — Resignation Path
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 2: EXIT FLOW — RESIGNATION');
  console.log('='.repeat(70));

  // 2a. Employee submits resignation
  const resignRes = await authedApi('POST', '/api/hr/exit/resign', {
    employee_id: '254',
    reason: 'Moving to a new opportunity in Abu Dhabi',
    requested_lwd: '2026-07-31',
    notes: 'Has 15 days of remaining annual leave',
    auth: 'employee',
  });
  log('Submit resignation', resignRes);
  check('Status 201', resignRes.status === 201);
  check('Has exit request', resignRes.json?.request?.exit_request_id);
  if (resignRes.json?.request?.exit_request_id) exitRequestId = resignRes.json.request.exit_request_id;
  check('Type = Resignation', resignRes.json?.request?.exit_type === 'Resignation');
  check('Status = Pending', resignRes.json?.request?.status === 'Pending');

  // 2b. Get exit request
  if (exitRequestId) {
    const getExitRes = await authedApi('GET', `/api/hr/exit/requests/${exitRequestId}?auth=hr`);
    log('Get exit request', getExitRes);
    check('Status 200', getExitRes.status === 200);
    check('Correct type', getExitRes.json?.request?.exit_type === 'Resignation');
  }

  // 2c. Approve resignation (DOS)
  if (exitRequestId) {
    const approveExitRes = await authedApi('PUT', `/api/hr/exit/${exitRequestId}/approve`, {
      approved_lwd: '2026-07-31',
      notes: 'Approved as requested',
      auth: 'dos',
    });
    log('Approve resignation', approveExitRes);
    check('Status 200', approveExitRes.status === 200);
    check('Status = Approved', approveExitRes.json?.request?.status === 'Approved');
    check('LWD set', approveExitRes.json?.request?.approved_lwd === '2026-07-31');
  }

  // 2d. List exit requests (filtered)
  const exitListRes = await authedApi('GET', '/api/hr/exit/requests?status=Approved&exit_type=Resignation&auth=hr');
  check('Filter exit list', exitListRes.ok);
  check('All filtered matches', exitListRes.json?.requests?.every(r => r.status === 'Approved' && r.exit_type === 'Resignation'));

  // 2e. Complete exit with interview → triggers FNF notification
  if (exitRequestId) {
    const completeRes = await authedApi('POST', `/api/hr/exit/interview/254`, {
      exit_request_id: exitRequestId,
      exit_interview_id: '00000000-0000-0000-0000-000000000001',
      auth: 'hr',
    });
    log('Complete exit + FNF', completeRes);
    check('Status 200', completeRes.status === 200);
    check('Status = Completed', completeRes.json?.request?.status === 'Completed');
    check('FNF sent', completeRes.json?.request?.fnf_email_status === 'Sent');
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: Exit Flow — Termination Path
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 3: EXIT FLOW — TERMINATION');
  console.log('='.repeat(70));

  // 3a. BM submits termination
  let termRequestId = '';
  const termRes = await authedApi('POST', '/api/hr/exit/terminate/255', {
    reason: 'Performance issues after multiple PIPs',
    notes: 'Final written warning issued on 15 June',
    auth: 'manager',
  });
  log('Submit termination', termRes);
  check('Status 201', termRes.status === 201);
  check('Type = Termination', termRes.json?.request?.exit_type === 'Termination');
  if (termRes.json?.request?.exit_request_id) termRequestId = termRes.json.request.exit_request_id;

  // 3b. Reject termination
  if (termRequestId) {
    const rejectTermRes = await authedApi('PUT', `/api/hr/exit/${termRequestId}/reject`, {
      notes: 'Need additional documentation',
      auth: 'dos',
    });
    log('Reject termination', rejectTermRes);
    check('Status 200', rejectTermRes.status === 200);
    check('Status = Rejected', rejectTermRes.json?.request?.status === 'Rejected');
  }

  // 3c. Get FNF summary
  const fnfRes = await authedApi('GET', '/api/hr/exit/fnf/254?auth=hr');
  log('FNF summary', fnfRes);
  check('FNF OK', fnfRes.ok);
  check('Has employee info', fnfRes.json?.fnf?.employee?.name);
  check('Has exit request', fnfRes.json?.fnf?.exitRequest);

  // 3d. 404 for non-existent
  const notFoundRes = await authedApi('GET', '/api/hr/exit/fnf/99999?auth=hr');
  check('FNF 404 for non-existent', notFoundRes.status === 404);

  // 3e. Auth enforcement: no auth = 403
  const noAuthRes = await api('GET', '/api/hr/recruitment/candidates');
  check('Auth required (403)', noAuthRes.status === 403);

  // ═══════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(70));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('═'.repeat(70));
  console.log(failed === 0 ? '\n✅  ALL TESTS PASSED' : `\n❌  ${failed} TEST(S) FAILED`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);




