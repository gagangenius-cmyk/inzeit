import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import { apiError } from '@/lib/apiError';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['operations.view']);
  if (isAuthError(auth)) return auth;
  try {
    const batches = await sequelize.query<any>(`
      SELECT b.id, b.batch_name, NULL AS created, 0 AS vendor_id, 1 AS status,
        COUNT(c.id) AS totalCases,
        SUM(CASE WHEN COALESCE(c.verify, 0) <> 0 THEN 1 ELSE 0 END) AS verifiedCases,
        SUM(CASE WHEN COALESCE(c.payment_status, 0) <> 0 THEN 1 ELSE 0 END) AS paidCases
      FROM crm_batch b
      LEFT JOIN crm_forum_leads_contracts c ON c.batch_id = b.id
      GROUP BY b.id, b.batch_name
      ORDER BY b.id DESC`, { type: QueryTypes.SELECT });
    const cases = await sequelize.query<any>(`
      SELECT c.id, c.batch_id AS batchId, c.leadId,
        l.fname, l.lname, l.country_interest, l.nationality,
        c.contract, c.verify, c.payment_status
      FROM crm_forum_leads_contracts c
      LEFT JOIN crm_forum_leads l ON l.id = c.leadId
      WHERE COALESCE(c.batch_id, 0) <> 0
      ORDER BY c.id DESC`, { type: QueryTypes.SELECT });

    return NextResponse.json({
      success: true,
      batches: batches.map((batch) => {
        return {
          id: batch.id, batchName: batch.batch_name, createdDate: batch.created, vendorId: batch.vendor_id,
          vendorName: `Vendor ${batch.vendor_id}`, totalCases: Number(batch.totalCases || 0), stage1Verified: Number(batch.verifiedCases || 0),
          stage2Verified: 0, stage3Verified: 0, accountVerified: Number(batch.paidCases || 0),
          opsVerified: Number(batch.verifiedCases || 0), rejectedCases: 0, status: batch.status === 0 ? 'hold' : 'active',
        };
      }),
      cases: cases.map((item) => ({
        id: item.id, batchId: item.batchId, leadId: item.leadId,
        clientName: [item.fname, item.lname].filter(Boolean).join(' ') || `Lead ${item.leadId}`,
        country: String(item.country_interest || ''), agreementNumber: item.contract || '', nationality: item.nationality || '', passportNumber: '',
        stage1Complete: Boolean(item.verify), stage2Complete: false, stage3Complete: false,
        accountVerified: Boolean(item.payment_status), opsVerified: Boolean(item.verify), rejected: false,
      })),
    });
  } catch (error: unknown) {
    return apiError(error, 'Unable to load Europe batches');
  }
}
