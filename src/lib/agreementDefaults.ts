// Shared defaults for agreement templates, so a company-wide policy figure
// isn't hand-copied into every branch template file (bilingualAgreementTemplate.ts,
// the 4 Gulf branch-specific templates, indiaAgreementTemplate.ts). Every
// renderer still accepts an explicit override (agreementRenewalFee /
// renewalFeeUsd) for the rare case a specific agreement needs a different fee -
// this is only the fallback used when none is supplied.
export const RENEWAL_FEE_USD = 500;
export const RENEWAL_FEE_USD_LABEL = `USD ${RENEWAL_FEE_USD}`;
export const RENEWAL_FEE_USD_LABEL_AR = `${RENEWAL_FEE_USD} دولار أمريكي`;
