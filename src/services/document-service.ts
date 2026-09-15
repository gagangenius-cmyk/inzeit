import crypto from 'crypto';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { put } from '@vercel/blob';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type DocumentType = 'payslip' | 'experience_letter' | 'relieving_letter' | 'client_form_template';
type DocumentInput = {
  type: DocumentType;
  title: string;
  fileName: string;
  lines: string[];
  ownerId?: number;
  expiresInDays?: number;
  // Pre-built PDF bytes bypass the plain-text makeSimplePdf fallback below -
  // used by generatePayslip's pdf-lib layout.
  pdfBuffer?: Buffer;
};
type PayslipLineItem = { label: string; amount: number };
type PayslipInput = {
  companyName: string;
  companyAddress: string;
  employeeName: string;
  employeeId: string;
  designation?: string;
  department?: string;
  payPeriod: string;
  currencyCode?: string;
  basicSalary: number;
  allowances: PayslipLineItem[];
  overtimeHours: number;
  overtimeAmount: number;
  deductions: PayslipLineItem[];
  grossSalary: number;
  netSalary: number;
  bankName?: string;
  maskedIban?: string;
  ytdEarnings: number;
  signatureName?: string;
  fileName?: string;
};
type StoredDocument = {
  provider: 'local' | 's3' | 'blob';
  storageKey: string;
  signedUrl: string;
  contentType: 'application/pdf';
  expiresAt: Date;
};

// Deliberately NOT under public/ - a plain Next.js static file has no auth at all, which
// made the "signed, expiring" link below decorative (see verifyStorageKeySignature). Local
// files are only served back out through the signature-checked route at
// src/app/api/generated-documents/[...path]/route.ts.
const storageRoot = path.join(process.cwd(), 'private-storage', 'generated-documents');
const publicBaseUrl = process.env.APP_URL || 'http://localhost:3000';
const signingSecret = process.env.DOCUMENT_SIGNING_SECRET || process.env.JWT_SECRET || 'local-document-secret';

const escapePdfText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const makeSimplePdf = (title: string, lines: string[]) => {
  const textRows = [title, '', ...lines].map((line, index) => {
    const y = 760 - (index * 18);
    const size = index === 0 ? 16 : 10;
    return `BT /F1 ${size} Tf 50 ${y} Td (${escapePdfText(line)}) Tj ET`;
  }).join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${textRows.length} >> stream\n${textRows}\nendstream endobj`,
  ];

  const body = objects.join('\n');
  return Buffer.from(`%PDF-1.4\n${body}\ntrailer << /Root 1 0 R >>\n%%EOF`, 'utf8');
};

const signStorageKey = (storageKey: string, expiresAt: Date) => (
  crypto
    .createHmac('sha256', signingSecret)
    .update(`${storageKey}:${expiresAt.getTime()}`)
    .digest('hex')
);

const money = (currencyCode: string, amount: number) => `${currencyCode} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// A real, bank-slip-style payslip layout (letterhead, employee details, earnings/deductions
// table, net-pay summary) built with pdf-lib - replaces the plain-text makeSimplePdf output
// that every other document type here still uses.
async function buildPayslipPdf(input: PayslipInput): Promise<Buffer> {
  const currencyCode = input.currencyCode || 'AED';
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { width } = page.getSize();
  const margin = 48;
  const contentWidth = width - margin * 2;
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.12, 0.16, 0.22);
  const gray = rgb(0.42, 0.45, 0.5);
  const line = rgb(0.85, 0.87, 0.9);
  const accent = rgb(0.11, 0.42, 0.07);

  let y = 841.89 - margin;

  page.drawRectangle({ x: 0, y: y - 46, width, height: 78, color: accent });
  page.drawText(input.companyName, { x: margin, y: y - 8, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText(input.companyAddress, { x: margin, y: y - 26, size: 8.5, font, color: rgb(0.9, 0.96, 0.9) });
  const payslipLabel = 'PAYSLIP';
  page.drawText(payslipLabel, { x: width - margin - bold.widthOfTextAtSize(payslipLabel, 14), y: y - 8, size: 14, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`Pay Period: ${input.payPeriod}`, { x: width - margin - font.widthOfTextAtSize(`Pay Period: ${input.payPeriod}`, 9), y: y - 26, size: 9, font, color: rgb(0.9, 0.96, 0.9) });
  y -= 46 + 34;

  const detailPair = (labelL: string, valueL: string, labelR: string, valueR: string) => {
    page.drawText(labelL, { x: margin, y, size: 8, font, color: gray });
    page.drawText(valueL, { x: margin, y: y - 12, size: 10, font: bold, color: dark });
    page.drawText(labelR, { x: margin + contentWidth / 2, y, size: 8, font, color: gray });
    page.drawText(valueR, { x: margin + contentWidth / 2, y: y - 12, size: 10, font: bold, color: dark });
    y -= 32;
  };
  detailPair('EMPLOYEE NAME', input.employeeName, 'EMPLOYEE ID', input.employeeId);
  detailPair('DESIGNATION', input.designation || 'Not set', 'DEPARTMENT', input.department || 'Not set');

  y -= 6;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: line });
  y -= 22;

  const tableRow = (label: string, value: string, opts?: { header?: boolean; sub?: string }) => {
    if (opts?.header) {
      page.drawText(label, { x: margin, y, size: 9, font: bold, color: rgb(1, 1, 1) });
      page.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 16, color: accent });
      page.drawText(label, { x: margin + 4, y, size: 9, font: bold, color: rgb(1, 1, 1) });
      y -= 22;
      return;
    }
    page.drawText(label, { x: margin + 4, y, size: 9.5, font, color: dark });
    if (opts?.sub) page.drawText(opts.sub, { x: margin + 4 + font.widthOfTextAtSize(label, 9.5) + 6, y, size: 8, font, color: gray });
    const valueWidth = bold.widthOfTextAtSize(value, 9.5);
    page.drawText(value, { x: width - margin - 4 - valueWidth, y, size: 9.5, font: bold, color: dark });
    y -= 17;
  };

  tableRow('EARNINGS', '', { header: true });
  tableRow('Basic Salary', money(currencyCode, input.basicSalary));
  for (const item of input.allowances) tableRow(item.label, money(currencyCode, item.amount));
  if (input.overtimeAmount) tableRow('Overtime', money(currencyCode, input.overtimeAmount), { sub: `(${input.overtimeHours} hrs)` });
  page.drawLine({ start: { x: margin, y: y + 8 }, end: { x: width - margin, y: y + 8 }, thickness: 0.5, color: line });
  y -= 14;

  tableRow('DEDUCTIONS', '', { header: true });
  if (input.deductions.length === 0) {
    page.drawText('No deductions this period', { x: margin + 4, y, size: 9, font, color: gray });
    y -= 17;
  } else {
    for (const item of input.deductions) tableRow(item.label, `- ${money(currencyCode, item.amount)}`);
  }
  page.drawLine({ start: { x: margin, y: y + 8 }, end: { x: width - margin, y: y + 8 }, thickness: 0.5, color: line });
  y -= 24;

  page.drawRectangle({ x: margin, y: y - 44, width: contentWidth, height: 58, color: rgb(0.95, 0.97, 0.95), borderColor: line, borderWidth: 1 });
  page.drawText('GROSS SALARY', { x: margin + 12, y: y - 6, size: 8, font, color: gray });
  page.drawText(money(currencyCode, input.grossSalary), { x: margin + 12, y: y - 20, size: 12, font: bold, color: dark });
  page.drawText('NET SALARY', { x: margin + contentWidth / 2 + 12, y: y - 6, size: 8, font, color: gray });
  page.drawText(money(currencyCode, input.netSalary), { x: margin + contentWidth / 2 + 12, y: y - 20, size: 14, font: bold, color: accent });
  y -= 44 + 30;

  detailPair('BANK NAME', input.bankName || 'Not set', 'IBAN', input.maskedIban || 'Not set');
  detailPair('YTD EARNINGS', money(currencyCode, input.ytdEarnings), 'GENERATED ON', new Date().toLocaleDateString('en-GB'));

  y -= 36;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 180, y }, thickness: 0.75, color: gray });
  page.drawText(input.signatureName || 'HR / Finance', { x: margin, y: y - 12, size: 9, font, color: dark });
  page.drawText('Authorised Signature', { x: margin, y: y - 24, size: 7.5, font, color: gray });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

// The counterpart check for signStorageKey - used by the serving route so the "signed,
// expiring" link is actually enforced instead of just appended to the URL for show.
export const verifyStorageKeySignature = (storageKey: string, expiresAtMs: number, signature: string): boolean => {
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return false;
  const expected = signStorageKey(storageKey, new Date(expiresAtMs));
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature || '');
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

export const resolveGeneratedDocumentPath = (storageKey: string) => path.join(storageRoot, storageKey);

export class DocumentService {
  static async generateAndStorePdf(input: DocumentInput): Promise<StoredDocument> {
    // Local disk only works when this process both writes and later serves the
    // file - fine for a single long-running server, but the generated link is
    // also hardcoded to APP_URL/localhost, so anyone off-box gets a dead link.
    // Default to Blob (already configured for uploads elsewhere in the app)
    // whenever a token is present, since that produces a URL that's actually
    // reachable regardless of how/where this is hosted.
    const explicitProvider = (process.env.DOCUMENT_STORAGE_PROVIDER || '').toLowerCase();
    const provider = explicitProvider || (process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local');
    const fileName = input.fileName.endsWith('.pdf') ? input.fileName : `${input.fileName}.pdf`;
    const storageKey = `${input.type}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const pdf = input.pdfBuffer || makeSimplePdf(input.title, input.lines);

    const expiresAt = new Date(Date.now() + (input.expiresInDays || 7) * 24 * 60 * 60 * 1000);

    if (provider === 's3') return this.storeS3(storageKey, pdf, expiresAt);
    if (provider === 'blob') return this.storeBlob(storageKey, pdf, expiresAt);
    return this.storeLocal(storageKey, pdf, expiresAt);
  }

  static async generatePayslip(input: PayslipInput) {
    const pdfBuffer = await buildPayslipPdf(input);
    return this.generateAndStorePdf({
      type: 'payslip',
      title: `${input.companyName} - Payslip`,
      fileName: input.fileName || `payslip-${input.employeeId}-${input.payPeriod}`,
      lines: [],
      pdfBuffer,
      expiresInDays: 7,
    });
  }

  static generateLetter(input: {
    type: 'experience_letter' | 'relieving_letter';
    employeeName: string;
    body: string;
    fileName?: string;
    title?: string;
    lines?: string[];
  }) {
    return this.generateAndStorePdf({
      type: input.type,
      title: input.title || (input.type === 'experience_letter' ? 'Experience Letter' : 'Relieving Letter'),
      fileName: input.fileName || `${input.type}-${input.employeeName}`,
      lines: input.lines || input.body.split('\n'),
      expiresInDays: 7,
    });
  }

  private static async storeLocal(storageKey: string, pdf: Buffer, expiresAt: Date): Promise<StoredDocument> {
    const fullPath = path.join(storageRoot, storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, pdf);

    const signature = signStorageKey(storageKey, expiresAt);
    const signedUrl = `${publicBaseUrl}/api/generated-documents/${storageKey}?expires=${expiresAt.getTime()}&signature=${signature}`;

    return {
      provider: 'local',
      storageKey,
      signedUrl,
      contentType: 'application/pdf',
      expiresAt,
    };
  }

  private static async storeS3(storageKey: string, _pdf: Buffer, _expiresAt: Date): Promise<StoredDocument> {
    void _pdf;
    void _expiresAt;
    throw new Error(`S3 storage is selected for ${storageKey}, but an S3 SDK adapter has not been configured.`);
  }

  private static async storeBlob(storageKey: string, pdf: Buffer, expiresAt: Date): Promise<StoredDocument> {
    const blob = await put(`generated-documents/${storageKey}`, pdf, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return {
      provider: 'blob',
      storageKey,
      signedUrl: blob.url,
      contentType: 'application/pdf',
      expiresAt,
    };
  }
}
