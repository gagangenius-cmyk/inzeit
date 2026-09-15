import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { apiError, invalidRequest } from '@/lib/apiError';

// Backs the shared "Case Milestones" tab (CaseMilestonesPanel.tsx) that
// OperationsWizardShell.tsx injects into all 20 program-specific case
// wizards. One generic, type-dispatched endpoint instead of 6 near-identical
// CRUD route files - see docs/CASE_MILESTONES.md for why these 6 tables
// exist and what gap each closes.

export type MilestoneType = 'eligibility' | 'reference' | 'rfe' | 'interview' | 'decision' | 'closure';

const TYPE_TABLE: Record<MilestoneType, string> = {
  eligibility: 'crm_case_eligibility_assessments',
  reference: 'crm_case_references',
  rfe: 'crm_case_rfe_requests',
  interview: 'crm_case_interviews',
  decision: 'crm_case_decisions',
  closure: 'crm_case_closures',
};

// Whitelisted, client-settable columns per type. Audit columns
// (assessedBy/createdBy/closedBy) are deliberately excluded here and always
// set server-side from the authenticated user - see TYPE_AUDIT_FIELD.
const TYPE_FIELDS: Record<MilestoneType, string[]> = {
  eligibility: ['module', 'leadId', 'opportunityId', 'assessmentDate', 'criteria', 'score', 'outcome', 'notes'],
  reference: ['module', 'leadId', 'opportunityId', 'referenceType', 'referenceNumber', 'issuedDate', 'notes'],
  rfe: ['module', 'leadId', 'opportunityId', 'requestedBy', 'requestDate', 'description', 'documentsRequired', 'responseDueDate', 'responseSubmittedDate', 'status'],
  interview: ['module', 'leadId', 'opportunityId', 'interviewType', 'scheduledAt', 'location', 'mode', 'status', 'outcome', 'outcomeNotes'],
  decision: ['module', 'leadId', 'opportunityId', 'decision', 'decisionDate', 'decisionNotes', 'issuedDocumentType', 'issuedDocumentNumber', 'issueDate', 'expiryDate'],
  closure: ['module', 'leadId', 'opportunityId', 'closureReason', 'closureDate', 'notes'],
};

const TYPE_AUDIT_FIELD: Record<MilestoneType, string> = {
  eligibility: 'assessedBy',
  reference: 'createdBy',
  rfe: 'createdBy',
  interview: 'createdBy',
  decision: 'createdBy',
  closure: 'closedBy',
};

const JSON_FIELDS = new Set(['criteria']);

function isMilestoneType(value: unknown): value is MilestoneType {
  return typeof value === 'string' && value in TYPE_TABLE;
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const leadId = Number.parseInt(searchParams.get('leadId') || '', 10);
    if (!leadId) return invalidRequest('A valid leadId is required');

    const [eligibilityAssessments, references, rfeRequests, interviews, decisions, closures] = await Promise.all(
      (Object.keys(TYPE_TABLE) as MilestoneType[]).map((type) =>
        sequelize.query(
          `SELECT * FROM ${TYPE_TABLE[type]} WHERE leadId = :leadId ORDER BY id DESC`,
          { replacements: { leadId }, type: QueryTypes.SELECT }
        )
      )
    );

    return NextResponse.json({
      success: true,
      data: { eligibilityAssessments, references, rfeRequests, interviews, decisions, closures },
    });
  } catch (error) {
    return apiError(error, 'Failed to load case milestones');
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const type = body.type;
    if (!isMilestoneType(type)) {
      return invalidRequest(`type must be one of: ${Object.keys(TYPE_TABLE).join(', ')}`);
    }
    if (!body.module || !body.leadId) {
      return invalidRequest('module and leadId are required');
    }

    const fields = TYPE_FIELDS[type];
    const auditField = TYPE_AUDIT_FIELD[type];
    const columns = [...fields, auditField];
    const replacements: Record<string, unknown> = { [auditField]: auth.id };

    for (const field of fields) {
      const value = body[field];
      replacements[field] = value === undefined || value === '' ? null : JSON_FIELDS.has(field) ? JSON.stringify(value) : value;
    }

    const placeholders = columns.map((column) => `:${column}`).join(', ');
    const [insertId] = await sequelize.query(
      `INSERT INTO ${TYPE_TABLE[type]} (${columns.join(', ')}) VALUES (${placeholders})`,
      { replacements, type: QueryTypes.INSERT }
    );

    const [created] = await sequelize.query(
      `SELECT * FROM ${TYPE_TABLE[type]} WHERE id = :id`,
      { replacements: { id: insertId }, type: QueryTypes.SELECT }
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return apiError(error, 'Failed to create case milestone entry');
  }
}
