// Single entry point for "render the Agreement for Advisory Services HTML
// for this branch" — every screen that generates/previews an agreement
// (agreement-generation route, sample-agreement route, the standalone
// opportunity agreement page, the Opportunity Flow wizard, and the
// Agreements page) should call this instead of importing the Gulf/India
// renderers directly, so branch → template-variant selection lives in
// exactly one place.
import { getBranchAgreementProfile } from './branchAgreementProfiles';
import { renderAbuDhabiAgreement } from './AbuDhabiBilingualAgreementTemplate';
import { renderGulfAgreement } from './bilingualAgreementTemplate';
import { renderDubaiAgreement } from './DubaiBilingualAgreementTemplate';
import { renderIndiaAgreement } from './indiaAgreementTemplate';
import { renderKuwaitAgreement } from './KuwaitBilingualAgreementTemplate';
import { renderQatarAgreement } from './QatarBilingualAgreementTemplate';

export interface AgreementLeadData {
  agreementNumber: string;
  agreementDate: string;
  agreementExpiry?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  nationality?: string;
  passportNumber?: string;
  idNumber?: string;
  // Hyderabad only — the India renderer's GSTIN line on Agreement Details.
  gstin?: string;
  serviceProgram: string;
  programCode?: string;
  programTermSchedule?: string;
  destinationCountry: string;
  // Plain formatted numbers (no currency prefix) — the renderer adds the
  // correct currency code/label for the resolved branch.
  totalAmount: string;
  initialPayment: string;
  secondPayment: string;
  clientId?: string;
  includedDeliverables?: string;
  expressExclusions?: string;
  specialTerms?: string;
  agreementRenewalFee?: string;
}

export function renderAgreementForBranch(branchAbbrv: string | null | undefined, data: AgreementLeadData): string {
  const profile = getBranchAgreementProfile(branchAbbrv);
  const key = String(branchAbbrv || '').trim().toLowerCase();

  if (profile.templateVariant === 'india') {
    return renderIndiaAgreement({
      agreementNumber: data.agreementNumber,
      agreementDate: data.agreementDate,
      agreementExpiry: data.agreementExpiry,
      gstin: data.gstin,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      clientAddress: data.clientAddress,
      serviceProgram: data.serviceProgram,
      programCode: data.programCode,
      destinationCountry: data.destinationCountry,
      totalAmount: data.totalAmount,
      initialPayment: data.initialPayment,
      secondPayment: data.secondPayment,
      specialTerms: data.specialTerms,
    });
  }

  const gulfData = {
    agreementNumber: data.agreementNumber,
    agreementDate: data.agreementDate,
    agreementExpiry: data.agreementExpiry,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    clientPhone: data.clientPhone,
    nationality: data.nationality || '',
    passportNumber: data.passportNumber || '',
    idNumber: data.idNumber || '',
    serviceProgram: data.serviceProgram,
    programCode: data.programCode,
    programTermSchedule: data.programTermSchedule,
    destinationCountry: data.destinationCountry,
    totalAmount: data.totalAmount,
    initialPayment: data.initialPayment,
    secondPayment: data.secondPayment,
    clientId: data.clientId || '',
    includedDeliverables: data.includedDeliverables,
    expressExclusions: data.expressExclusions,
    specialTerms: data.specialTerms,
    agreementRenewalFee: data.agreementRenewalFee,
    currencyCode: profile.currencyCode,
    branchNameEn: profile.legalNameEn,
    branchNameAr: profile.legalNameAr,
    regulatoryLineEn: profile.regulatoryLineEn,
    regulatoryLineAr: profile.regulatoryLineAr,
    idLabelEn: profile.idLabelEn,
    idLabelAr: profile.idLabelAr,
  };

  if (key === 'auh') {
    return renderAbuDhabiAgreement({
      ...gulfData,
      branchAddressEn: profile.addressEn,
      branchAddressAr: profile.addressAr,
    });
  }

  if (key === 'dxb szr') {
    return renderDubaiAgreement({
      ...gulfData,
      branchAddressEn: profile.addressEn,
      branchAddressAr: profile.addressAr,
    });
  }

  if (key === 'kwd') {
    return renderKuwaitAgreement({
      ...gulfData,
      branchAddressEn: profile.addressEn,
      branchAddressAr: profile.addressAr,
    });
  }

  if (key === 'doh old airport rd') {
    // Qatar's header has a single address slot (no separate contact-line
    // slot like the generic renderGulfAgreement) — concatenate the phone/
    // email contact line onto the address, matching the signed PDF layout.
    return renderQatarAgreement({
      ...gulfData,
      branchAddressEn: profile.contactLineEn ? `${profile.addressEn}. ${profile.contactLineEn}` : profile.addressEn,
      branchAddressAr: profile.contactLineAr ? `${profile.addressAr}. ${profile.contactLineAr}` : profile.addressAr,
    });
  }

  return renderGulfAgreement({
    ...gulfData,
    branchAddressEn: profile.addressEn,
    branchAddressAr: profile.addressAr,
    taxLineEn: profile.taxLineEn,
    taxLineAr: profile.taxLineAr,
    governingLawEn: profile.governingLawEn,
    governingLawAr: profile.governingLawAr,
    contactLineEn: profile.contactLineEn,
    contactLineAr: profile.contactLineAr,
  });
}
