import { NextRequest, NextResponse } from 'next/server';
import { extname } from 'path';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { sequelize } from '@/lib/sequelize';

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

async function portal(token: string) {
  const [rows] = await sequelize.query('SELECT * FROM crm_client_upload_portals WHERE access_token=? AND status=\'active\' AND (expires_at IS NULL OR expires_at > NOW())', { replacements: [token] });
  return (rows as any[])[0] || null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const record = await portal(token);
    if (!record) return NextResponse.json({ error: 'This document-upload link is invalid or has expired.' }, { status: 404 });
    const [items] = await sequelize.query('SELECT id, item_name, required, status, file_url, uploaded_at, notes FROM crm_client_upload_checklist_items WHERE portal_id=? ORDER BY id', { replacements: [record.id] });
    return NextResponse.json({ success: true, data: { clientId: record.client_id, agreementNumber: record.agreement_number, expiresAt: record.expires_at, checklist: items } });
  } catch (error) { console.error('Client portal fetch failed:', error); return NextResponse.json({ error: 'Unable to load the upload portal.' }, { status: 500 }); }
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const record = await portal(token);
    if (!record) return NextResponse.json({ error: 'This document-upload link is invalid or has expired.' }, { status: 404 });
    const form = await request.formData();
    const itemId = Number(form.get('itemId'));
    const file = form.get('file');
    if (!itemId || !(file instanceof File)) return NextResponse.json({ error: 'Checklist item and file are required.' }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Use a PDF, JPEG, PNG, or WebP file up to 10 MB.' }, { status: 422 });
    const [items] = await sequelize.query('SELECT id FROM crm_client_upload_checklist_items WHERE id=? AND portal_id=?', { replacements: [itemId, record.id] });
    if (!(items as any[]).length) return NextResponse.json({ error: 'Checklist item not found.' }, { status: 404 });
    const extension = extname(file.name).toLowerCase() || '.bin';
    const filename = `${crypto.randomUUID()}${extension}`;
    // Serverless functions (Vercel) have a read-only filesystem, so client
    // uploads go to Vercel Blob rather than local disk — the returned
    // blob.url is a permanent, publicly-fetchable HTTPS URL.
    const blob = await put(`client-documents/${record.id}/${filename}`, file, {
      access: 'public',
    });
    await sequelize.query('UPDATE crm_client_upload_checklist_items SET status=\'uploaded\', file_url=?, uploaded_at=NOW(), notes=NULL WHERE id=?', { replacements: [blob.url, itemId] });
    return NextResponse.json({ success: true, fileUrl: blob.url });
  } catch (error) { console.error('Client portal upload failed:', error); return NextResponse.json({ error: 'Unable to save this document.' }, { status: 500 }); }
}
