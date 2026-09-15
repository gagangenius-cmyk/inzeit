import { NextRequest, NextResponse } from 'next/server'
import { Op, QueryTypes } from 'sequelize'
import { CrmAdditionalDocuments, CrmOpsDocuments, CrmcOpportunityDocuments } from '@/models'
import { sequelize } from '@/lib/sequelize'
import { verifyToken } from '@/lib/auth'
import { isCeo, isBranchManagerOrCeo } from '@/lib/roleChecks'
import { requireAuth, isAuthError } from '@/lib/apiAuth'

async function assertLeadBranchWritable(auth: { branch?: string | number | null }, leadId: unknown): Promise<string | null> {
  const id = Number(leadId)
  if (!id) return null
  const [row] = await sequelize.query<{ branch: number | null }>(
    'SELECT branch FROM crm_forum_leads WHERE id = :leadId LIMIT 1',
    { replacements: { leadId: id }, type: QueryTypes.SELECT },
  )
  if (row && row.branch !== null && Number(row.branch) !== Number(auth.branch || 0)) {
    return 'You can only upload a document for a lead in your own branch'
  }
  return null
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['documents.view'])
  if (isAuthError(auth)) return auth
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const search = searchParams.get('search')?.trim() || ''

    const leadFilter = leadId ? 'AND d.leadId = :leadId' : ''
    const searchFilter = search ? "AND (d.purpose LIKE :search OR l.fname LIKE :search OR l.lname LIKE :search)" : ''
    // The opportunity-documents branch has no leadId/purpose column of its own
    // (leadId comes via a join on crm_opportunities, and the closest text
    // field is category/documentName) — same filter intent, different columns.
    const oppLeadFilter = leadId ? 'AND o.leadId = :leadId' : ''
    const oppSearchFilter = search ? "AND (d.category LIKE :search OR d.documentName LIKE :search OR l.fname LIKE :search OR l.lname LIKE :search)" : ''
    const replacements: Record<string, unknown> = { leadId: leadId ? Number(leadId) : null, search: `%${search}%` }

    // This legacy schema has three different column collations across the
    // tables unioned below (crm_additional_documents: utf8mb4_unicode_ci;
    // crm_ops_documents/crm_forum_leads: latin1_swedish_ci;
    // crm_opportunity_documents/crm_opportunity_agreements: utf8mb4_0900_ai_ci)
    // — MySQL can silently coerce a two-way mix but throws "Illegal mix of
    // collations" once a third, different one joins the UNION. Every text
    // column below is explicitly normalized to one collation to sidestep that.
    const C = "COLLATE utf8mb4_unicode_ci";
    const rows = await sequelize.query<any>(`
      SELECT
        d.id, 'additional' AS source, d.leadId, CONVERT(d.document USING utf8mb4) ${C} AS file,
        CONVERT(COALESCE(d.purpose, 'Document') USING utf8mb4) ${C} AS name, CONVERT(d.purpose USING utf8mb4) ${C} AS category,
        d.created, NULL AS status, CAST(NULL AS CHAR) ${C} AS agreementNumber,
        CONVERT(COALESCE(NULLIF(TRIM(CONCAT(COALESCE(l.fname,''), ' ', COALESCE(l.lname,''))), ''), l.email, l.phone) USING utf8mb4) ${C} AS client
      FROM crm_additional_documents d
      LEFT JOIN crm_forum_leads l ON l.id = d.leadId
      WHERE 1=1 ${leadFilter} ${searchFilter}

      UNION ALL

      SELECT
        d.id, 'operations' AS source, d.leadId, CONVERT(d.file USING utf8mb4) ${C} AS file,
        CONVERT(COALESCE(d.name, d.doc_type, 'Document') USING utf8mb4) ${C} AS name, CONVERT(d.doc_type USING utf8mb4) ${C} AS category,
        d.created, d.status, CAST(NULL AS CHAR) ${C} AS agreementNumber,
        CONVERT(COALESCE(NULLIF(TRIM(CONCAT(COALESCE(l.fname,''), ' ', COALESCE(l.lname,''))), ''), l.email, l.phone) USING utf8mb4) ${C} AS client
      FROM crm_ops_documents d
      LEFT JOIN crm_forum_leads l ON l.id = d.leadId
      WHERE 1=1 ${leadFilter} ${searchFilter}

      UNION ALL

      SELECT
        d.id, 'opportunity' AS source, o.leadId, CONVERT(d.filePath USING utf8mb4) ${C} AS file,
        CONVERT(COALESCE(d.documentName, d.category, 'Document') USING utf8mb4) ${C} AS name, CONVERT(COALESCE(d.category, d.documentType) USING utf8mb4) ${C} AS category,
        d.uploadDate AS created, NULL AS status, CONVERT(a.agreementNumber USING utf8mb4) ${C} AS agreementNumber,
        CONVERT(COALESCE(NULLIF(TRIM(CONCAT(COALESCE(l.fname,''), ' ', COALESCE(l.lname,''))), ''), l.email, l.phone) USING utf8mb4) ${C} AS client
      FROM crm_opportunity_documents d
      LEFT JOIN crm_opportunities o ON o.id = d.opportunityId
      LEFT JOIN crm_forum_leads l ON l.id = o.leadId
      LEFT JOIN (
        SELECT da1.opportunityId, da1.agreementNumber
        FROM crm_opportunity_agreements da1
        INNER JOIN (
          SELECT opportunityId, MAX(id) AS maxId FROM crm_opportunity_agreements GROUP BY opportunityId
        ) da2 ON da2.opportunityId = da1.opportunityId AND da2.maxId = da1.id
      ) a ON a.opportunityId = d.opportunityId
      WHERE 1=1 ${oppLeadFilter} ${oppSearchFilter}

      ORDER BY created DESC
      LIMIT 200
    `, { replacements, type: QueryTypes.SELECT })

    return NextResponse.json({
      documents: rows,
      total: rows.length
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const currentUser = token ? verifyToken(token) : null
    if (!currentUser || !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the CEO can delete records' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    const source = searchParams.get('source')

    if (!id || !source) {
      return NextResponse.json({ error: 'id and source are required' }, { status: 400 })
    }

    if (source === 'additional') {
      await CrmAdditionalDocuments.destroy({ where: { id } })
    } else if (source === 'operations') {
      await CrmOpsDocuments.destroy({ where: { id } })
    } else if (source === 'opportunity') {
      await CrmcOpportunityDocuments.destroy({ where: { id } })
    } else {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['documents.create'])
  if (isAuthError(auth)) return auth
  try {
    const data = await request.json()
    const { documentType, ...documentData } = data

    let document;

    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const scopeError = await assertLeadBranchWritable(auth, documentData.leadId)
      if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 })
    }

    if (documentType === 'additional') {
      const recentDuplicate = await CrmAdditionalDocuments.findOne({
        where: {
          leadId: documentData.leadId,
          document: documentData.document,
          created: { [Op.gte]: new Date(Date.now() - 60_000) },
        },
      });
      if (recentDuplicate) {
        return NextResponse.json({ error: 'This document was already uploaded a moment ago.' }, { status: 409 });
      }
      document = await CrmAdditionalDocuments.create({
        ...documentData,
        remarks: documentData.remarks || documentData.purpose || 'Uploaded via Documents page',
        created: new Date(),
        created_by: 1 // Should be current user ID
      })
    } else if (documentType === 'operations') {
      const recentDuplicate = await CrmOpsDocuments.findOne({
        where: {
          leadId: documentData.leadId,
          file: documentData.file,
          created: { [Op.gte]: new Date(Date.now() - 60_000) },
        },
      });
      if (recentDuplicate) {
        return NextResponse.json({ error: 'This document was already uploaded a moment ago.' }, { status: 409 });
      }
      document = await CrmOpsDocuments.create({
        ...documentData,
        created: new Date(),
        created_by: 1, // Should be current user ID
        status: documentData.status || 0
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
