import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

// Every "this lead is now a Client" signal the app recognizes elsewhere
// (see the CLIENT_STATUS_SQL union in src/app/api/leads/route.ts) is a plain
// column value that several independent endpoints can set on their own —
// crm_forum_leads.status/opportunity_status and crm_opportunities.status —
// with no built-in link back to whether Accounts/Compliance ever signed off.
// The only real record of that sign-off is crm_opportunity_workflow_reviews
// (finance_status/compliance_status), written by the Payment Verification
// and Compliance Approvals pages. Call this before honoring a request to set
// any of those "client" values, so the gate is enforced server-side rather
// than only by disabling a button in the wizard's UI.
export const CLIENT_STATUS_VALUES = new Set(['retained', 'client', 'converted']);

export async function isFinanceAndComplianceApproved(opportunityId: number | null | undefined): Promise<boolean> {
  if (!opportunityId) return false;
  const [row] = await sequelize.query<{ finance_status: string; compliance_status: string }>(
    `SELECT finance_status, compliance_status FROM crm_opportunity_workflow_reviews WHERE opportunity_id = :opportunityId LIMIT 1`,
    { replacements: { opportunityId }, type: QueryTypes.SELECT },
  );
  return Boolean(row) && row.finance_status === 'approved' && row.compliance_status === 'approved';
}

export const APPROVAL_REQUIRED_ERROR =
  'This opportunity cannot be marked won/retained until Accounts has verified the payment and Compliance has approved the signed agreement.';
