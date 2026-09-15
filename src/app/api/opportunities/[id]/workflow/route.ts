import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';

const FINANCE_CHECKS = ['paymentReceived', 'paymentMethodMatches', 'transferReferenceVerified', 'pricingVerified', 'discountApproved', 'scheduleVerified', 'balanceVerified', 'invoiceVerified'];
const COMPLIANCE_CHECKS = ['officialIdsVerified', 'documentExpiryVerified', 'clientDetailsMatch', 'discussionNotesVerified', 'programMappingVerified', 'branchAndCounselorVerified', 'financeApproved', 'paymentAndReceiptVerified', 'signedAgreementUploaded', 'contactDetailsVerified', 'duplicateCheckCompleted'];

function actor(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return token ? verifyToken(token) : null;
}

function roleAllowed(role: unknown, gate: 'finance' | 'compliance') {
  const value = String(role || '').toLowerCase().replace(/\s+/g, '_');
  if (['admin', 'super_admin', 'director', 'director_of_sales'].includes(value)) return true;
  return gate === 'finance'
    ? ['accountant', 'finance', 'finance_manager', 'accounts'].includes(value)
    : ['compliance', 'compliance_officer', 'crm_compliance'].includes(value);
}

function missingChecks(checklist: Record<string, unknown>, checks: string[]) {
  return checks.filter((key) => checklist[key] !== true);
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!actor(request)) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
    const { id } = await context.params;
    const [rows] = await sequelize.query(
      `SELECT w.*, o.opportunityNumber, o.opportunityName, o.stage, o.status, o.branchId,
              l.fname, l.lname, l.email, l.mobile, l.phone, l.nationality
       FROM crm_opportunity_workflow_reviews w
       JOIN crm_opportunities o ON o.id = w.opportunity_id
       JOIN crm_forum_leads l ON l.id = w.lead_id
       WHERE w.opportunity_id = ?`, { replacements: [Number(id)] }
    );
    if (!(rows as unknown[]).length) return NextResponse.json({ error: 'Workflow record not found.' }, { status: 404 });
    const [notes] = await sequelize.query('SELECT * FROM crm_opportunity_handover_notes WHERE opportunity_id = ? ORDER BY created_at DESC', { replacements: [Number(id)] });
    const [documents] = await sequelize.query('SELECT * FROM crm_opportunity_documents WHERE opportunityId = ? ORDER BY uploadDate DESC', { replacements: [Number(id)] });
    const [payments] = await sequelize.query('SELECT * FROM crm_opportunity_payments WHERE opportunityId = ? ORDER BY paymentDate DESC', { replacements: [Number(id)] });
    const [audits] = await sequelize.query('SELECT * FROM crm_opportunity_workflow_audit_logs WHERE opportunity_id = ? ORDER BY created_at DESC', { replacements: [Number(id)] });
    return NextResponse.json({ success: true, data: { workflow: (rows as any[])[0], notes, documents, payments, audits } });
  } catch (error) {
    console.error('Workflow fetch failed:', error);
    return NextResponse.json({ error: 'Unable to load the opportunity workflow.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const transaction = await sequelize.transaction();
  try {
    const user = actor(request);
    if (!user) { await transaction.rollback(); return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 }); }
    const { id } = await context.params;
    const opportunityId = Number(id);
    const body = await request.json();
    const action = String(body.action || '');
    const [records] = await sequelize.query('SELECT * FROM crm_opportunity_workflow_reviews WHERE opportunity_id = ? FOR UPDATE', { replacements: [opportunityId], transaction });
    const workflow = (records as any[])[0];
    if (!workflow) { await transaction.rollback(); return NextResponse.json({ error: 'Workflow record not found.' }, { status: 404 }); }
    const now = new Date();
    const role = String((user as any).role || (user as any).roleName || '');
    const userId = Number((user as any).id || 0) || null;
    const checklist = body.checklist && typeof body.checklist === 'object' ? body.checklist : {};

    if (action === 'finance_approve' || action === 'finance_reject') {
      if (!roleAllowed(role, 'finance')) { await transaction.rollback(); return NextResponse.json({ error: 'Only Finance/Accounts can review this gate.' }, { status: 403 }); }
      if (action === 'finance_approve') {
        const missing = missingChecks(checklist, FINANCE_CHECKS.filter((check) => check !== 'transferReferenceVerified' || Boolean(JSON.parse(workflow.payment_data || '{}').bankReference)));
        if (missing.length) { await transaction.rollback(); return NextResponse.json({ error: 'Finance checklist is incomplete.', missing }, { status: 422 }); }
      } else if (!String(body.reason || '').trim()) { await transaction.rollback(); return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 422 }); }
      const approved = action === 'finance_approve';
      const status = approved ? 'finance_approved' : 'finance_review_failed';
      await sequelize.query('UPDATE crm_opportunity_workflow_reviews SET workflow_status=?, finance_status=?, finance_checklist=?, finance_reason=?, finance_reviewed_by=?, finance_reviewed_at=?, updated_at=? WHERE opportunity_id=?', { replacements: [status, approved ? 'approved' : 'rejected', JSON.stringify(checklist), body.reason || null, userId, now, now, opportunityId], transaction });
      await sequelize.query('UPDATE crm_opportunities SET stage=?, updatedAt=? WHERE id=?', { replacements: [status, now, opportunityId], transaction });
      await audit(opportunityId, action, workflow.workflow_status, status, userId, role, body.reason, transaction);
    } else if (action === 'compliance_approve' || action === 'compliance_reject') {
      if (!roleAllowed(role, 'compliance')) { await transaction.rollback(); return NextResponse.json({ error: 'Only a CRM Compliance Officer can review this gate.' }, { status: 403 }); }
      if (workflow.finance_status !== 'approved') { await transaction.rollback(); return NextResponse.json({ error: 'Finance approval is required before CRM Compliance review.' }, { status: 409 }); }
      if (action === 'compliance_approve') {
        const missing = missingChecks(checklist, COMPLIANCE_CHECKS);
        if (missing.length) { await transaction.rollback(); return NextResponse.json({ error: 'Compliance checklist is incomplete.', missing }, { status: 422 }); }
      } else if (!String(body.reason || '').trim()) { await transaction.rollback(); return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 422 }); }
      const approved = action === 'compliance_approve';
      const status = approved ? 'case_active' : 'compliance_review_failed';
      let formalClientId: string | null = null;
      if (approved) {
        formalClientId = workflow.formal_client_id || `CMG-${String(workflow.lead_id).padStart(6, '0')}-${String(opportunityId).padStart(6, '0')}`;
        await createClientIfMissing(workflow.lead_id, userId, transaction);
        await sequelize.query('UPDATE crm_client_upload_portals SET client_id=? WHERE opportunity_id=?', { replacements: [formalClientId, opportunityId], transaction });
      }
      await sequelize.query('UPDATE crm_opportunity_workflow_reviews SET workflow_status=?, compliance_status=?, compliance_checklist=?, compliance_reason=?, compliance_reviewed_by=?, compliance_reviewed_at=?, formal_client_id=?, case_activated_at=?, updated_at=? WHERE opportunity_id=?', { replacements: [status, approved ? 'approved' : 'rejected', JSON.stringify(checklist), body.reason || null, userId, now, formalClientId, approved ? now : null, now, opportunityId], transaction });
      await sequelize.query('UPDATE crm_opportunities SET stage=?, documentsVerified=?, updatedAt=? WHERE id=?', { replacements: [status, approved ? 1 : 0, now, opportunityId], transaction });
      await audit(opportunityId, action, workflow.workflow_status, status, userId, role, body.reason, transaction);
    } else { await transaction.rollback(); return NextResponse.json({ error: 'Unsupported workflow action.' }, { status: 400 }); }
    await transaction.commit();
    return NextResponse.json({ success: true, message: 'Workflow review saved.' });
  } catch (error) {
    await transaction.rollback(); console.error('Workflow review failed:', error);
    return NextResponse.json({ error: 'Unable to save the workflow review.' }, { status: 500 });
  }
}

async function audit(opportunityId: number, action: string, previous: string, next: string, actorId: number | null, role: string, notes: unknown, transaction: any) {
  await sequelize.query('INSERT INTO crm_opportunity_workflow_audit_logs (opportunity_id, action, previous_status, new_status, actor_id, actor_role, notes) VALUES (?, ?, ?, ?, ?, ?, ?)', { replacements: [opportunityId, action, previous, next, actorId, role || null, String(notes || '') || null], transaction });
}

async function createClientIfMissing(leadId: number, userId: number | null, transaction: any) {
  const [existing] = await sequelize.query('SELECT id FROM crm_clients WHERE leadId=? LIMIT 1', { replacements: [leadId], transaction });
  if ((existing as any[]).length) return;
  const [leads] = await sequelize.query('SELECT * FROM crm_forum_leads WHERE id=?', { replacements: [leadId], transaction });
  const lead = (leads as any[])[0];
  if (!lead) throw new Error('Lead no longer exists.');
  const [ids] = await sequelize.query('SELECT COALESCE(MAX(id),0)+1 AS id FROM crm_clients', { transaction });
  const clientId = Number((ids as any[])[0].id);
  await sequelize.query('INSERT INTO crm_clients (id, leadId, first_name, last_name, email, image, dob, address, full_address, token, token_validity, verify, password, hash_password, status, accept, created, case_manager, backend_person, is_deleted, city, nationality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, 1, NOW(), ?, ?, 0, ?, ?)', { replacements: [clientId, leadId, lead.fname || '', lead.lname || '', lead.email || '', '', lead.dob || new Date('1970-01-01'), lead.address || '', lead.address || '', `CMG-${leadId}-${Date.now()}`, new Date(Date.now() + 90 * 86400000), '', '', lead.case_officer || lead.assignTo || userId || 0, lead.assignTo || userId || 0, lead.area || '', lead.nationality || ''], transaction });
}
