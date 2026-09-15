import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { verifyToken } from '@/lib/auth';
import { deliverToCrm, nextRetryAt } from '@/lib/meta/crm-delivery';

let dbReady = false;
async function ensureDB() {
  if (!dbReady) { await connectDB(); dbReady = true; }
}

export async function POST(request: NextRequest) {
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDB();

  // Optional: retry a specific delivery id
  const body = await request.json().catch(() => ({})) as { deliveryId?: number };

  let due: Array<{ id: number; request_payload: string; retry_count: number }>;

  if (body.deliveryId) {
    due = await sequelize.query<{ id: number; request_payload: string; retry_count: number }>(
      `SELECT id, request_payload, retry_count
       FROM crm_meta_lead_deliveries
       WHERE id = :id AND status IN ('failed','retry_scheduled')`,
      { replacements: { id: body.deliveryId }, type: QueryTypes.SELECT }
    );
  } else {
    due = await sequelize.query<{ id: number; request_payload: string; retry_count: number }>(
      `SELECT id, request_payload, retry_count
       FROM crm_meta_lead_deliveries
       WHERE status IN ('failed','retry_scheduled')
       ORDER BY updated_at ASC LIMIT 50`,
      { type: QueryTypes.SELECT }
    );
  }

  let retried = 0;
  let succeeded = 0;

  for (const delivery of due) {
    retried++;
    const payload = JSON.parse(delivery.request_payload);
    const result = await deliverToCrm(payload);
    const newRetryCount = delivery.retry_count + 1;

    if (result.success) {
      await sequelize.query(
        `UPDATE crm_meta_lead_deliveries
         SET status = 'delivered', response_status = :status, response_body = :body,
             delivered_at = NOW(), updated_at = NOW()
         WHERE id = :id`,
        { replacements: { status: result.status, body: result.body, id: delivery.id }, type: QueryTypes.UPDATE }
      );
      succeeded++;
    } else {
      const retryAt = nextRetryAt(newRetryCount);
      await sequelize.query(
        `UPDATE crm_meta_lead_deliveries
         SET status = :status, response_status = :respStatus, response_body = :body,
             last_error = :error, retry_count = :retryCount, next_retry_at = :retryAt, updated_at = NOW()
         WHERE id = :id`,
        {
          replacements: {
            status: retryAt ? 'retry_scheduled' : 'failed',
            respStatus: result.status,
            body: result.body,
            error: result.error,
            retryCount: newRetryCount,
            retryAt,
            id: delivery.id,
          },
          type: QueryTypes.UPDATE,
        }
      );
    }
  }

  return NextResponse.json({ retried, succeeded, failed: retried - succeeded });
}
