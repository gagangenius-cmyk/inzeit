import { QueryTypes } from 'sequelize';
import { sequelize } from './sequelize';

// Thin wrapper over Resend's REST API via plain `fetch` - no email library
// exists anywhere else in this project, and a single POST doesn't warrant
// adding one. RESEND_API_KEY / RESEND_FROM_EMAIL are demo placeholders in
// .env until real credentials are supplied; until then this throws a
// descriptive error per-send that callers are expected to catch and log
// rather than let crash a batch job.
//
// Every send attempt (success or failure) is also persisted to
// crm_email_delivery_log - previously nothing tracked outbound email status
// at all, so a silently-failing send (bad address, Resend outage, API key
// expired) had no record anywhere except whatever the caller's own
// console.error happened to catch. See src/app/api/admin/email-delivery-log
// for the admin-facing "failed sends" view built on top of this.

let deliveryLogTableReady: Promise<void> | null = null;

const ensureDeliveryLogTable = async () => {
  if (!deliveryLogTableReady) {
    deliveryLogTableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS crm_email_delivery_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        status VARCHAR(20) NOT NULL,
        provider_message_id VARCHAR(255) NULL,
        error TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_delivery_status (status),
        INDEX idx_email_delivery_recipient (recipient),
        INDEX idx_email_delivery_created (created_at)
      )
    `).then(() => undefined).catch((error) => {
      deliveryLogTableReady = null;
      throw error;
    });
  }
  await deliveryLogTableReady;
};

// Fire-and-forget, matching every other audit/log hook in this codebase - a
// failure to record delivery status must never mask the original send
// result (success or failure) from the caller.
async function recordDelivery(recipient: string, subject: string, status: 'sent' | 'failed', extra: { providerMessageId?: string | null; error?: string | null }) {
  try {
    await ensureDeliveryLogTable();
    await sequelize.query(
      `INSERT INTO crm_email_delivery_log (recipient, subject, status, provider_message_id, error)
       VALUES (:recipient, :subject, :status, :providerMessageId, :error)`,
      {
        replacements: {
          recipient,
          subject,
          status,
          providerMessageId: extra.providerMessageId ?? null,
          error: extra.error ?? null,
        },
      }
    );
  } catch (error) {
    console.error('Failed to record email delivery log entry:', error);
  }
}

export async function sendEmail({ to, subject, html, attachments }: {
  to: string;
  subject: string;
  html: string;
  // Resend expects base64-encoded content per attachment - no encoding/mime handling here.
  attachments?: { filename: string; content: string }[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    const error = 'RESEND_API_KEY / RESEND_FROM_EMAIL are not configured';
    void recordDelivery(to, subject, 'failed', { error });
    throw new Error(error);
  }

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, ...(attachments?.length ? { attachments } : {}) }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error calling Resend';
    void recordDelivery(to, subject, 'failed', { error: message });
    throw error;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const message = `Resend API error: ${res.status} ${body}`;
    void recordDelivery(to, subject, 'failed', { error: message });
    throw new Error(message);
  }

  const json = await res.json();
  void recordDelivery(to, subject, 'sent', { providerMessageId: json?.id ?? null });
  return json;
}

export interface EmailDeliveryLogEntry {
  id: number;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  providerMessageId: string | null;
  error: string | null;
  createdAt: string;
}

// Backs the admin-facing delivery-log view - see
// src/app/api/admin/email-delivery-log/route.ts.
export async function listEmailDeliveryLog({
  status,
  limit = 100,
}: { status?: 'sent' | 'failed'; limit?: number } = {}): Promise<EmailDeliveryLogEntry[]> {
  await ensureDeliveryLogTable();
  const conditions: string[] = [];
  const replacements: Record<string, unknown> = { limit };
  if (status) {
    conditions.push('status = :status');
    replacements.status = status;
  }
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await sequelize.query<{
    id: number; recipient: string; subject: string; status: 'sent' | 'failed';
    provider_message_id: string | null; error: string | null; created_at: string;
  }>(
    `SELECT * FROM crm_email_delivery_log ${whereSql} ORDER BY created_at DESC LIMIT :limit`,
    { replacements, type: QueryTypes.SELECT }
  );
  return rows.map((r) => ({
    id: r.id,
    recipient: r.recipient,
    subject: r.subject,
    status: r.status,
    providerMessageId: r.provider_message_id,
    error: r.error,
    createdAt: r.created_at,
  }));
}
