import { NextRequest, NextResponse } from 'next/server';
import { Op, QueryTypes } from 'sequelize';
import { CrmcOpportunityDocuments } from '@/models';
import { put } from '@vercel/blob';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { isBranchManagerOrCeo, isCeo } from '@/lib/roleChecks';
import { sequelize } from '@/lib/sequelize';

async function assertOpportunityBranchWritable(auth: { branch?: string | number | null }, opportunityId: unknown): Promise<string | null> {
  const id = Number(opportunityId);
  if (!id) return null;
  const [row] = await sequelize.query<{ branch: number | null }>(
    `SELECT COALESCE(l.branch, o.branchId) AS branch
     FROM crm_opportunities o
     LEFT JOIN crm_forum_leads l ON l.id = o.leadId
     WHERE o.id = :opportunityId`,
    { replacements: { opportunityId: id }, type: QueryTypes.SELECT },
  );
  if (row && row.branch !== null && Number(row.branch) !== Number(auth.branch || 0)) {
    return 'You can only upload a document for an opportunity in your own branch';
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['documents.view']);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const opportunityId = searchParams.get('opportunityId');
    const status = searchParams.get('status');
    // Only meaningful (and only applied) when opportunityId is absent — a
    // single opportunity's own documents are naturally few, so that path
    // keeps returning every matching row as a plain array unchanged.
    // Unscoped (admin-wide browse) gets real server-side pagination instead
    // of the entire table.
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10));

    let whereClause: any = {};

    if (opportunityId) {
      whereClause.opportunityId = opportunityId;
    }

    if (status) {
      whereClause.status = status;
    }

    const include = [
      {
        association: 'dmcOpportunity',
        attributes: ['id', 'opportunityName', 'estimatedValue', 'currency']
      },
      {
        association: 'uploadedEmployee',
        attributes: ['id', 'name']
      },
      {
        association: 'verifiedEmployee',
        attributes: ['id', 'name']
      }
    ];

    if (opportunityId) {
      const documents = await CrmcOpportunityDocuments.findAll({
        where: whereClause,
        include,
        order: [['uploadDate', 'DESC']],
      });
      return NextResponse.json(documents);
    }

    const { rows, count } = await CrmcOpportunityDocuments.findAndCountAll({
      where: whereClause,
      include,
      order: [['uploadDate', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['documents.create']);
    if (isAuthError(auth)) return auth;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const opportunityId = Number(formData.get('opportunityId'));
      const category = String(formData.get('category') || 'other');
      const uploadedBy = Number(formData.get('uploadedBy') || 1);

      if (!file || !opportunityId) {
        return NextResponse.json(
          { error: 'file and opportunityId are required' },
          { status: 400 }
        );
      }

      if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
        const scopeError = await assertOpportunityBranchWritable(auth, opportunityId);
        if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
      }

      // Duplicate-submission guard: block re-uploading the same category for
      // this opportunity within the last minute, before spending time on the
      // blob upload itself.
      const recentUpload = await CrmcOpportunityDocuments.findOne({
        where: {
          opportunityId,
          category,
          uploadDate: { [Op.gte]: new Date(Date.now() - 60_000) },
        },
      });
      if (recentUpload) {
        return NextResponse.json({ error: 'This document was already uploaded a moment ago.' }, { status: 409 });
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}_${safeName}`;

      // Serverless functions (Vercel) have a read-only filesystem, so documents
      // are stored in Vercel Blob rather than written to local disk. The returned
      // `blob.url` is a permanent, publicly-fetchable HTTPS URL — that's what
      // gets saved as filePath instead of a local /uploads/... path.
      const blob = await put(`opportunity-documents/${opportunityId}/${fileName}`, file, {
        access: 'public',
        addRandomSuffix: true,
      });

      const document = await CrmcOpportunityDocuments.create({
        opportunityId,
        documentType: category,
        documentName: String(formData.get('documentName') || file.name),
        fileName,
        filePath: blob.url,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        category,
        status: 'uploaded',
        uploadDate: new Date(),
        required: formData.get('required') === 'true',
        notes: String(formData.get('notes') || ''),
        uploadedBy,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json(document, { status: 201 });
    }

    const body = await request.json();

    if (isBranchManagerOrCeo(auth) && !isCeo(auth)) {
      const scopeError = await assertOpportunityBranchWritable(auth, body.opportunityId);
      if (scopeError) return NextResponse.json({ error: scopeError }, { status: 403 });
    }

    const documentData = {
      ...body,
      uploadDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const document = await CrmcOpportunityDocuments.create(documentData);

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
