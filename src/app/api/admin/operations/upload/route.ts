import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { apiError, invalidRequest } from '@/lib/apiError';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request, ['operations.view', 'operations.manage']);
    if (isAuthError(auth)) return auth;

    const formData = await request.formData();
    const file = formData.get('file');
    const operationsModule = String(formData.get('module') || '').replace(/[^a-z0-9-]/gi, '');
    const leadId = String(formData.get('leadId') || '').replace(/\D/g, '');

    if (!(file instanceof File) || !operationsModule || !leadId) {
      return invalidRequest('A file, module, and leadId are required');
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Files must be 20 MB or smaller' }, { status: 413 });
    }

    const extension = path.extname(file.name).replace(/[^.a-z0-9]/gi, '').slice(0, 12);
    const fileName = `${randomUUID()}${extension}`;

    // Serverless functions (Vercel) have a read-only filesystem, so files are
    // stored in Vercel Blob rather than written to local disk.
    const blob = await put(`operations/${operationsModule}/${leadId}/${fileName}`, file, {
      access: 'public',
    });

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: blob.url,
      },
    });
  } catch (error: unknown) {
    return apiError(error, 'Unable to upload file');
  }
}
