import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/apiAuth';
import { sendEmail } from '@/lib/mailer';

// Emails an already-generated letter PDF (base64, produced client-side by DMCLettersModule's
// existing jsPDF/html2canvas pipeline - see downloadPDF/emailToEmployee) as an attachment,
// rather than re-rendering the letter server-side.
export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['hr.create', 'hr.update']);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json() as { to?: string; subject?: string; fileName?: string; pdfBase64?: string };
    if (!body.to || !body.pdfBase64 || !body.fileName) {
      return NextResponse.json({ error: 'to, fileName, and pdfBase64 are required' }, { status: 400 });
    }

    await sendEmail({
      to: body.to,
      subject: body.subject || 'A letter from DM Consultants HR',
      html: `<p>Please find your requested letter attached.</p>`,
      attachments: [{ filename: body.fileName, content: body.pdfBase64 }],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Failed to send HR letter email:', error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
