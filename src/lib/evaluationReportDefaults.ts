// Fixed pricing for the Hyderabad-only "Generate Evaluation Report" wizard
// (see src/app/admin/leads/evaluation-report-wizard.tsx). This is a flat,
// single-product fee — unlike the real Opportunity Flow's Quotation stage,
// it isn't looked up per service/country/branch from crm_fee, and the
// discount is a plain clamp with no approval-tier workflow (the real
// discount-approval system in src/lib/discountApproval.ts would trip on a
// discount this large relative to the fee, which isn't wanted here).
export const EVALUATION_REPORT_FEE_INR = 1500;
export const EVALUATION_REPORT_MAX_DISCOUNT_INR = 500;
export const EVALUATION_REPORT_MIN_NET_PAYABLE_INR = EVALUATION_REPORT_FEE_INR - EVALUATION_REPORT_MAX_DISCOUNT_INR;

export function calculateEvaluationReportTotal(discount: number) {
  const safeDiscount = Math.min(Math.max(0, discount || 0), EVALUATION_REPORT_MAX_DISCOUNT_INR);
  return {
    fee: EVALUATION_REPORT_FEE_INR,
    discount: safeDiscount,
    netPayable: EVALUATION_REPORT_FEE_INR - safeDiscount,
  };
}
