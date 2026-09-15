import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { apiError, invalidRequest } from '@/lib/apiError';
import type { MilestoneType } from '../route';

const TYPE_TABLE: Record<MilestoneType, string> = {
  eligibility: 'crm_case_eligibility_assessments',
  reference: 'crm_case_references',
  rfe: 'crm_case_rfe_requests',
  interview: 'crm_case_interviews',
  decision: 'crm_case_decisions',
  closure: 'crm_case_closures',
};

const TYPE_FIELDS: Record<MilestoneType, string[]> = {
  eligibility: ['assessmentDate', 'criteria', 'score', 'outcome', 'notes'],
  reference: ['referenceType', 'referenceNumber', 'issuedDate', 'notes'],
  rfe: ['requestedBy', 'requestDate', 'description', 'documentsRequired', 'responseDueDate', 'responseSubmittedDate', 'status'],
  interview: ['interviewType', 'scheduledAt', 'location', 'mode', 'status', 'outcome', 'outcomeNotes'],
  decision: ['decision', 'decisionDate', 'decisionNotes', 'issuedDocumentType', 'issuedDocumentNumber', 'issueDate', 'expiryDate'],
  closure: ['closureReason', 'closureDate', 'notes'],
};

const JSON_FIELDS = new Set(['criteria']);

function isMilestoneType(value: unknown): value is MilestoneType {
  return typeof value === 'string' && value in TYPE_TABLE;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['operations.view', 'operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    if (!isMilestoneType(type)) return invalidRequest(`type query param must be one of: ${Object.keys(TYPE_TABLE).join(', ')}`);

    const body = await request.json();
    const fields = TYPE_FIELDS[type].filter((field) => field in body);
    if (!fields.length) return invalidRequest('No updatable fields provided');

    const replacements: Record<string, unknown> = { id };
    for (const field of fields) {
      const value = body[field];
      replacements[field] = value === '' ? null : JSON_FIELDS.has(field) ? JSON.stringify(value) : value;
    }

    const setClause = fields.map((field) => `${field} = :${field}`).join(', ');
    await sequelize.query(`UPDATE ${TYPE_TABLE[type]} SET ${setClause} WHERE id = :id`, { replacements });

    const [updated] = await sequelize.query(`SELECT * FROM ${TYPE_TABLE[type]} WHERE id = :id`, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    if (!updated) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return apiError(error, 'Failed to update case milestone entry');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request, ['operations.manage']);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    if (!isMilestoneType(type)) return invalidRequest(`type query param must be one of: ${Object.keys(TYPE_TABLE).join(', ')}`);

    const [existing] = await sequelize.query(`SELECT id FROM ${TYPE_TABLE[type]} WHERE id = :id`, {
      replacements: { id },
      type: QueryTypes.SELECT,
    });
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    await sequelize.query(`DELETE FROM ${TYPE_TABLE[type]} WHERE id = :id`, { replacements: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error, 'Failed to delete case milestone entry');
  }
}
