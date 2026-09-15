// English-only "Agreement for Advisory Services" — Hyderabad Branch
// (Didactic Migration Consultants Pvt Ltd, trading as "DM Consultants" /
// "DMC Immigration").
//
// This is NOT a Gulf-template branch file. bilingualAgreementTemplate.ts's
// own header comment flags this explicitly: "Hyderabad's agreement is a
// wholly different English-only document under Indian law — see
// indiaAgreementTemplate.ts." This is that file.
//
// Structural differences from every Gulf branch file (Abu Dhabi, Dubai,
// Kuwait, Qatar):
//   - Single-language (English only) — no bilingual two-column layout, no
//     Arabic text, no RTL styling.
//   - 23 numbered clauses (not 15) with a completely different clause set:
//     Indian Contract Act 1872 / Consumer Protection Act 2019 governing law,
//     Arbitration and Conciliation Act 1996 arbitration seated in Hyderabad,
//     Digital Personal Data Protection Act 2023 data clause, GST throughout
//     instead of VAT, a much more detailed 17-point Refund Policy (Clause 14)
//     and a separate Refund Procedures clause (15), etc. None of these map
//     onto the Gulf template's 15-clause structure.
//   - "Service(s) Selected" is a checkbox list (Skilled Migration / Family &
//     Spouse Sponsorship / Study Abroad / Business & Investment / Resume
//     Marketing / Global Visit Visas / Other) rather than a single free-text
//     Service Program field.
//   - Client Details is a compact 3-line block (Name / Address / Phone-
//     Email), not the Gulf template's passport/ID/nationality/occupation
//     block.
//   - No Fee Summary box or Annexure A at all — fees/payment schedule are
//     said to live in a separate Service Order/Invoice, not in this
//     Agreement.
// The one point of continuity with the Gulf branches: Clause 21 (Duration
// and Renewal) carries the same USD 500 flat, non-refundable per-renewal-
// term Agreement Renewal Fee pattern (quoted in INR-equivalent here, plus
// applicable GST) seen in the Abu Dhabi/Dubai/Kuwait/Qatar Clause 7.5.

import { RENEWAL_FEE_USD_LABEL } from './agreementDefaults';

const esc = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface HyderabadAgreementValues {
  agreementNumber: string;
  agreementDate: string;
  gstin?: string;
  // Which checkboxes are ticked — any subset of SERVICE_OPTIONS below.
  servicesSelected?: string[];
  // Free-text value for the "Other" checkbox, if selected.
  otherService?: string;
  // Program Code / Service Term (see Program Term Schedule)
  programCode?: string;
  destinationCountries: string;
  clientName: string;
  clientAddress: string;
  clientPhoneEmail: string;
  totalAmount?: string;
  initialPayment?: string;
  secondPayment?: string;
}

export interface IndiaAgreementValues {
  agreementNumber: string;
  agreementDate: string;
  agreementExpiry?: string;
  gstin?: string;
  servicesSelected?: string[];
  otherService?: string;
  programCode?: string;
  serviceProgram?: string;
  destinationCountry: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  specialTerms?: string;
  totalAmount?: string;
  initialPayment?: string;
  secondPayment?: string;
}

// Fixed branch identity — taken verbatim from the signed PDF header/footer.
const COMPANY = {
  nameEn: 'Didactic Migration Consultants Pvt Ltd - Hyderabad Branch',
  tradingAs: 'Trading as "DM Consultants" / "DMC Immigration"',
  addressEn: '2nd Floor, UMA Plaza, Nagarjuna Circle Road, Beside Mahindra Showroom, Mothi Nagar, Nagarjuna Hills, Punjagutta, Hyderabad, Telangana 500082, India',
  phone: '+91 40 4006 1682',
  email: 'hyderabad@dm-consultant.in',
  renewalFeeUsd: RENEWAL_FEE_USD_LABEL,
};

// The checkbox options on the Agreement Details page, in the PDF's own order.
const SERVICE_OPTIONS = [
  'Skilled Migration',
  'Family/Spouse Sponsorship',
  'Study Abroad',
  'Business & Investment (RBI/CBI)',
  'Resume Marketing',
  'Global Visit Visas',
];

// The 23 numbered clauses, verbatim from the signed PDF, each as
// [title, body]. A few (8, 10, 14) have extra structure (an intro line,
// or sub-clauses that themselves carry a heading) which is folded into the
// body text exactly as it appears in the PDF.
const clauses: Array<[string, string]> = [
  ['1. PREAMBLE',
    'DM Consultants is a licensed immigration and overseas-relocation advisory practice. This Agreement governs every service line offered by the Company\u2019s Hyderabad Branch - including but not limited to skilled migration, family and spouse sponsorship, study-abroad guidance, business and investment (residency/citizenship-by-investment) advisory, resume marketing and career-documentation services, and global visa-facilitation - so that a single Agreement, read together with the specific Service Order / Invoice issued for the Client\u2019s selected service(s), governs the entire relationship. Where the Client engages more than one service, each service is a separate, severable engagement under this same Agreement, and fees, timelines, and refund treatment are assessed independently per service. The Client confirms that, prior to availing any service, the Client has been given a reasonable opportunity to read, understand, and seek independent legal advice on this Agreement, and that by signing, initialling each page, or accepting electronically through the Company\u2019s CRM/client portal (which constitutes a valid electronic acceptance under the Information Technology Act, 2000), the Client agrees to be bound by all terms below.'],
  ['2. DEFINITIONS',
    '2.1 "Services" means the specific consultancy, advisory, documentation, filing, and facilitation services selected by the Client and set out in the applicable Service Order/Invoice, which forms part of this Agreement.\n2.2 "Authorities" means any government department, embassy, consulate, visa office, assessment body, educational institution, financial institution, or other third party with authority over any part of the Client\u2019s application.\n2.3 "Fees" means the professional/retainer fees payable to DM Consultants for Services rendered, exclusive of Third-Party Costs and applicable GST unless stated otherwise.\n2.4 "Third-Party Costs" means government filing fees, visa fees, assessment-body fees, test fees (IELTS/PTE/etc.), translation fees, courier charges, and any other amount payable to a party other than DM Consultants.\n2.5 "Outcome" means the grant, refusal, delay, or any other decision made by an Authority, which lies solely and exclusively within that Authority\u2019s discretion.'],
  ['3. NATURE OF ENGAGEMENT - SERVICES OF EFFORT, NOT OF GUARANTEED OUTCOME',
    '3.1 The Client expressly acknowledges and agrees that DM Consultants is engaged to provide professional advisory, documentation, and facilitation Services with due skill, care, and diligence. DM Consultants does NOT act as a guarantor of any Outcome - including grant of any visa, permanent residency, study offer, admission, skills assessment, business licence, employment offer, or investment approval - as every such Outcome rests solely with the relevant Authority.\n3.2 The Fees charged by DM Consultants are consideration for the professional time, expertise, documentation work, and administrative effort actually invested by DM Consultants, and are payable irrespective of the eventual Outcome of the Client\u2019s application. This distinction between "service of effort" and "guarantee of result" is the basis on which Fees, once services have commenced, are treated as earned and non-refundable except as expressly stated in Clause 14.\n3.3 Nothing in this Agreement or in any marketing material, brochure, website content, or verbal statement by any employee or agent of DM Consultants shall be construed as a promise, warranty, or guarantee of any Outcome. Any statistic (e.g. success rate, average processing time) is indicative only, based on historical data, and does not bind any Authority.'],
  ['4. RESPONSIBILITIES OF DM CONSULTANTS',
    '4.1 Perform the Services set out in the applicable Service Order with reasonable professional skill and diligence, in line with prevailing industry practice.\n4.2 Provide the Client with reasonable updates on file progress and respond to Client queries within a reasonable time frame.\n4.3 Prepare and submit documentation, liaise with Authorities, and advise on addressing deficiencies raised by an Authority, to the extent such matters fall within the scope of the selected Service.\n4.4 Where job-search assistance is part of a selected Service (e.g. Resume Marketing), DM Consultants will make reasonable efforts to circulate the Client\u2019s profile but does not, and shall not be deemed to, guarantee any interview, offer, or placement.\n4.5 DM Consultants and its agents do not guarantee approval of any visa, permit, admission, assessment, or investment application. In the event of an administrative/human error attributable to DM Consultants that causes an application to be rejected or returned by an Authority on that ground alone, DM Consultants shall, as its sole obligation, rectify and refile the application at its own professional cost; Third-Party Costs and Authority fees for the refiling remain payable by the Client at actuals.'],
  ['5. RESPONSIBILITIES OF THE CLIENT',
    '5.1 Provide all documents and information required for the Services accurately, completely, truthfully, and on time.\n5.2 Respond to requests for additional information within the specified time frame and promptly notify DM Consultants of any change in circumstances that may affect the application.\n5.3 Not contact any Authority, lawyer, agent, entity, or government organisation directly in relation to a matter under this Agreement without DM Consultants\u2019 prior written approval, during the currency of the engagement.\n5.4 Pay all Fees and Third-Party Costs as set out in the Service Order within the agreed timeframes. Non-payment shall entitle DM Consultants to suspend or terminate Services immediately without further notice.\n5.5 Acknowledge that any misinformation, incomplete disclosure, or delay on the Client\u2019s part may adversely impact the Outcome, and DM Consultants shall bear no liability whatsoever arising from such Client default.\n5.6 Maintain respectful, professional communication with all DM Consultants employees. Misconduct, abusive language, or threatening behaviour shall be treated as a material breach entitling DM Consultants to terminate this Agreement immediately without refund and, where warranted, to pursue legal remedies.'],
  ['6. FEES AND PAYMENT TERMS',
    '6.1 Fees, Third-Party Costs, and the payment schedule applicable to each Service selected are set out in the Service Order/Invoice issued to the Client, which is incorporated into and forms part of this Agreement.\n6.2 All Fees are exclusive of applicable GST, which will be charged additionally as per prevailing rates and reflected in the tax invoice.\n6.3 Time is of the essence for payment. Non-payment of any instalment within the stipulated period, without DM Consultants\u2019 prior written consent, shall suspend the Agreement; continued non-payment beyond ten (10) calendar days from the due date shall automatically terminate this Agreement without further notice, and Clause 14 (Refund Policy) shall apply.\n6.4 Payments may be made by cheque, credit/debit card, bank transfer, UPI, or, where permitted, cash against an official company receipt bearing the company stamp. Bank transfers must be made only to the official account nominated in writing by DM Consultants\u2019 Hyderabad Branch.\n6.5 Third-Party Costs (government fees, test fees, assessment-body fees, translation, courier, etc.) are not included in the professional Fee and remain the Client\u2019s responsibility; where DM Consultants pays such costs on the Client\u2019s behalf as a facilitation, the Client shall reimburse DM Consultants at actuals and any refund of such pass-through costs must be pursued by the Client directly with the concerned Authority - see Clause 12.'],
  ['7. CONFIDENTIALITY AND DATA PROTECTION',
    '7.1 Both parties shall keep confidential all non-public information exchanged for the purpose of this Agreement and disclose it only with prior written consent or as required by law.\n7.2 The Client agrees that their personal data may be shared by DM Consultants with third parties reasonably necessary for processing the application - including education-credential assessment bodies, IELTS/PTE and other test bodies, Notaries, government bodies, banks, and independent recruiters - and may be used by DM Consultants for related marketing/branding purposes unless the Client opts out in writing.\n7.3 DM Consultants shall process the Client\u2019s personal data in accordance with the Digital Personal Data Protection Act, 2023 and other applicable Indian data-protection law, and shall implement reasonable security practices as required under the Information Technology Act, 2000 and rules made thereunder.'],
  ['8. TERMINATION',
    '8.1 Either party may terminate this Agreement with fifteen (15) days\u2019 prior written notice via email. DM Consultants may terminate immediately, without notice, if the Client breaches any material term of this Agreement (including Clauses 5.3, 5.6, or 6.3).\n8.2 Upon termination, DM Consultants will cease all Services. The Client remains liable for all Fees earned up to the date of termination and any unpaid Third-Party Costs already incurred on the Client\u2019s behalf.\n8.3 Termination does not entitle the Client to a refund except strictly as set out in Clause 14.'],
  ['9. FORCE MAJEURE',
    '9.1 Neither party is liable for failing to fulfil its obligations where such failure arises from causes beyond its reasonable control, including acts of God, natural disaster, fire, epidemic/pandemic, war, embargo, government restriction or change in law/policy, strikes, or supplier default ("Force Majeure Event"). No refund is applicable in the event of a Force Majeure Event, including where the Force Majeure Event affects the Client personally (including death), save that obligations shall resume once the Force Majeure Event ends, or either party may terminate if it continues beyond ninety (90) days.'],
  ['10. GOVERNING LAW AND DISPUTE RESOLUTION',
    '10.1 This Agreement is governed by, and shall be construed in accordance with, the laws of India, including the Indian Contract Act, 1872 and, where applicable, the Consumer Protection Act, 2019.\n10.2 The courts at Hyderabad, Telangana shall have exclusive jurisdiction over all matters arising from or in connection with this Agreement, subject to Clause 10.3.\n10.3 Any dispute shall first be referred to good-faith discussions for thirty (30) days from written notice. If unresolved, the dispute shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, before a sole arbitrator mutually appointed by the parties, seated at Hyderabad, with proceedings conducted in English. The arbitral award shall be final and binding, subject to the parties\u2019 rights under Sections 34 and 36 of the Act.\n10.4 Nothing in this Clause 10 restricts the Client\u2019s statutory right, if any, to approach the appropriate Consumer Disputes Redressal Commission having jurisdiction over Hyderabad in respect of a genuine deficiency in service, as this right cannot be excluded by contract under Indian law.\n10.5 Neither party shall make any statement disparaging the other in public, on any forum, or on social media, and both undertake to keep any arbitral award, order, or judgment confidential save as required to enforce it.'],
  ['11. ENTIRE AGREEMENT',
    '11.1 This Agreement, together with the applicable Service Order/Invoice, the Company\u2019s website Terms & Conditions, Privacy Policy, and Refund Policy as updated from time to time and referenced on the Company\u2019s website, constitutes the entire agreement between the parties and supersedes all prior discussions. No amendment is effective unless in writing and signed (including by valid electronic signature/acceptance) by both parties.'],
  ['12. CLIENT OBLIGATIONS - DOCUMENTATION, ASSESSMENT & LANGUAGE TESTS',
    '12.1 The Client shall supply all documents required by the relevant Authority, accurate, current, and truthful, and is solely responsible for reviewing the accuracy of any form or document before signing or submitting it. The Client shall not sign any form or document from any Authority until DM Consultants has reviewed it.\n12.2 All documentation must be in English or accompanied by a certified translation from a qualified, independent translator (not the Client or a relative of the Client).\n12.3 Where a skills/credential assessment is part of the Service, the Client shall submit complete supporting documents within fifteen (15) days of signing this Agreement, and confirms that their educational credentials are recognised by the relevant government/body. DM Consultants is not responsible for an incorrect assessment, delay, or adverse outcome caused by undisclosed non-recognition of an institution, fraudulent credentials, or the assessment body\u2019s own process, as such assessment is conducted by an independent third party.\n12.4 Where a language test (IELTS/PTE/OET/or equivalent) is required, the Client is solely responsible for achieving and submitting the required score within the timeframe applicable to the selected program. DM Consultants shall not be responsible in any manner if an application cannot be submitted, or is refused, because the Client\u2019s scores fall short of the requirement.\n12.5 The Client confirms that neither they nor any dependant has any undisclosed severe communicable medical condition, criminal record, or security concern that may affect the application, and that all medical, criminal, and security checks mandated by the relevant Authority must be independently and successfully passed by the Client. DM Consultants is not liable for any refusal arising from such checks.\n12.6 The Client and dependants may be required to attend interviews, which may be outside their country of residence, and agree to do so without signing any document during such process without first consulting DM Consultants.\n12.7 The Client must independently maintain and evidence sufficient, legally sourced, verifiable settlement/sponsorship funds as mandated by the relevant Authority. DM Consultants does not assist with travel arrangements or fund transfers, and is not responsible for rejection arising from insufficient or unverifiable funds.\n12.8 The Client agrees to communicate with DM Consultants primarily by email and in English, must promptly notify DM Consultants of any direct communication received from any Authority, and must not respond to any such communication until instructed by DM Consultants.\n12.9 The Client shall not instruct any bank to dishonour a payment made to DM Consultants. Any returned payment or bounced cheque will incur additional charges as per DM Consultants\u2019 prevailing policy, in addition to the underlying amount owed.'],
  ['13. EXCLUSIONS AND GENERAL LIMITATIONS',
    '13.1 DM Consultants shall not directly or indirectly assist the Client in: (a) applying for or obtaining a passport of any kind; (b) procuring educational or experience certificates; or (c) any other document/evidence that must originate from the Client or a third party.\n13.2 DM Consultants shall not be responsible for loss of documents in transit; this is the responsibility of the courier company. DM Consultants recommends registered post or a reputable international courier and that the Client notify DM Consultants before dispatching any documentation.\n13.3 All documents submitted by the Client for onward transmission are believed in good faith to be genuine; DM Consultants shall not be responsible for any adverse outcome arising from documents that are later found not to be genuine, where DM Consultants had no actual knowledge of the defect.\n13.4 DM Consultants and its agents do not guarantee any Outcome, and do not charge any fee for "providing employment" to a Client; any resume-marketing or job-search assistance is limited to profile circulation and advisory support only.\n13.5 The terms of this Agreement apply equally to all dependants/family members included within the same application.\n13.6 Where DM Consultants is asked to act on a matter outside the scope of the originally selected Service, or because of a material change in the Client\u2019s circumstances, or because of material facts not disclosed at the outset, the Client shall pay an additional fee as appropriate to the revised scope before further work continues.\n13.7 Where DM Consultants\u2019 role in a matter is that of a referral to an associated/partner licensed agent (including MARA-registered agents for Australian matters or equivalent regulated professionals for other destinations), DM Consultants reserves the right to update or change such referral arrangement; any such change will be made having regard to the Client\u2019s interest.\n13.8 In case of re-filing of any application after its original validity has lapsed, the Client shall pay additional Fees as per DM Consultants\u2019 policy then in force.'],
  ['14. REFUND POLICY',
    'This Refund Policy is part of this Agreement and applies uniformly to every Service selected by the Client under this Agreement, across all destination countries and program types. The Client acknowledges having read this Clause 14 carefully before making any payment.\n\n14.1 General Principle. As set out in Clause 3, Fees are earned in consideration of the professional time and effort invested by DM Consultants, and not against any Outcome. Once DM Consultants has commenced Services on the Client\u2019s file - which occurs on completion of the initial consultation and issuance of the document checklist - the Fee paid to that point is treated as earned for work already performed and is non-refundable, save strictly as set out in Clause 14.3 below.\n\n14.2 Circumstances in Which No Refund Will Be Issued. Without limiting Clause 14.1, and in addition to it, the Client acknowledges and agrees that no refund of Fees will be issued in any of the following circumstances, which apply across all Services offered under this Agreement: (a) Change in immigration, visa, study, investment, or other applicable law or policy occurring after signing, whether prospective or retrospective. (b) Refusal, rejection, delay, or withdrawal of any visa, permit, admission, nomination, assessment, licence, or investment approval by an Authority. (c) Diplomatic, political, or bilateral relationship issues between India (or the Client\u2019s country of residence) and the destination country. (d) Client withdrawal, or instruction to stop processing, at any stage after Services have commenced - refund, if any, is limited strictly to the value of clearly identifiable, wholly unutilised Fee for work not yet begun, as reasonably determined by DM Consultants. (e) The Client providing inconsistent, incomplete, contradictory, or false information at any stage. (f) Closure of an immigration/study/investment program, or the program reaching maximum intake capacity, after Services have commenced. (g) Failure by the Client to provide required documents within the time frame specified. (h) Failure by the Client to attend an interview, complete a medical examination, sit or pass a required test, or otherwise complete any step of the process. (i) Rejection on grounds of medical condition, criminal record, national-security concern, prior visa history, or financial ineligibility of the Client or a dependant. (j) The Client communicating directly with any Authority, employer, or third party without DM Consultants\u2019 prior written consent, where this results in a negative impact on the application. (k) Discovery that the Client provided false, misleading, or fraudulent documents or information, or engaged in misrepresentation. (l) Completion of the initial consultation and issuance of the document checklist - at which point the initial/retainer Fee is non-refundable. (m) The Client signing this Agreement and subsequently deciding, for any reason, not to proceed. (n) The Client\u2019s file remaining dormant for a continuous period of 90 days or more. (o) Non-materialisation of any job offer, interview, placement, or employer response in connection with resume-marketing/job-search assistance. (p) Refusal or delay of any visit/tourist/business visitor visa application for any reason attributable to the Authority, the Client\u2019s travel/financial history, or documentation. (q) Failure to complete any procedure, step, or requirement stipulated by DM Consultants or the relevant Authority within the applicable time frame.\n\n14.3 Narrow Exception - Total Non-Commencement by DM Consultants. Notwithstanding Clauses 14.1 and 14.2, if DM Consultants has not commenced any Service at all (i.e., no consultation has been completed and no document checklist has been issued) within sixty (60) days of receipt of the initial payment, and the delay is not attributable to the Client or to any Force Majeure Event, the Client may request a refund of the professional Fee paid, less a 10% administrative charge and any Third-Party Costs already incurred. This is the sole and exclusive circumstance in which a refund of professional Fees is available under this Agreement.'],
  ['15. REFUND PROCEDURES AND CONDITIONS (WHERE A REFUND IS DUE UNDER CLAUSE 14.3)',
    '15.1 Any refund due will be processed only after completion of internal formalities, including management approval, and after deduction of GST (if applicable), payment-gateway/card-processing charges at actuals (or 2.5%, whichever is applied on the original transaction), and any administrative fee stated in Clause 14.3.\n15.2 The estimated turnaround time for processing an approved refund is 45 working days from the date of the signed refund declaration.\n15.3 Refunds will be issued only by cheque or bank transfer in the Client\u2019s own name, to the account/address provided by the Client. No refund will be issued to any third party, nominee, or any individual other than the Client named in this Agreement.\n15.4 Fees paid by DM Consultants to third-party agents, assessment bodies, or government authorities on the Client\u2019s behalf are non-refundable by DM Consultants under any circumstance; the Client must seek any such refund directly from the concerned third party/Authority.\n15.5 GST/VAT or equivalent tax paid by the Client is non-refundable, being remitted to the Government of India in accordance with law, and cannot be refunded by DM Consultants.'],
  ['16. LIMITATION OF LIABILITY',
    '16.1 DM Consultants shall not be liable for: (a) any delay, loss, or rejection caused by incorrect, incomplete, or late information/documents provided by the Client; (b) changes in law, policy, or procedure affecting the Outcome; or (c) any indirect, incidental, special, or consequential loss (including loss of income, opportunity, or reputational loss) arising from the Services, whether in contract, tort, or otherwise.\n16.2 Where DM Consultants is found liable notwithstanding this Agreement, DM Consultants\u2019 aggregate liability to the Client, for any and all claims arising under or in connection with this Agreement, shall not exceed the professional Fees actually paid by the Client for the specific Service giving rise to the claim.\n16.3 The Client acknowledges that the final decision on any application lies solely with the relevant Authority, and DM Consultants cannot and does not influence that decision.'],
  ['17. INDEMNITY',
    '17.1 The Client shall indemnify and hold DM Consultants, its directors, employees, and agents harmless from and against any claim, loss, penalty, or proceeding (including reasonable legal costs) arising out of or in connection with any false, misleading, incomplete, or fraudulent information or document provided by the Client, or the Client\u2019s breach of this Agreement.'],
  ['18. RETENTION AND RETURN OF DOCUMENTS',
    '18.1 DM Consultants will retain the Client\u2019s original documents until conclusion of the Services. The Client must collect original documents within 21 days of notification from DM Consultants. DM Consultants shall not be liable for loss or destruction of documents if the Client fails to collect them within this period.'],
  ['19. NOTICES',
    '19.1 Any notice under this Agreement must be in writing and delivered by email to the address stated in this Agreement (or as updated in writing), and is deemed received on the day of transmission if sent before 6:00 p.m. IST on a business day, and otherwise on the next business day.'],
  ['20. SEVERABILITY AND WAIVER',
    '20.1 If any provision of this Agreement is held invalid or unenforceable by a court or arbitral tribunal of competent jurisdiction, the remaining provisions shall continue in full force and effect, and the invalid provision shall be replaced by a valid provision that most closely reflects the original commercial intent.\n20.2 No failure or delay by either party in exercising any right under this Agreement operates as a waiver of that right.'],
  ['21. DURATION AND RENEWAL',
    '21.1 This Agreement is valid for the Service Term applicable to the Client\u2019s selected Program, as set out in the Company\u2019s Program Term Schedule and reflected in the Service Order/Annexure (or, if not stated, 18 months) from the date of signing. It may be renewed upon mutual written consent, subject to a fixed, non-refundable Agreement Renewal Fee of USD 500 (or its INR equivalent at the exchange rate prevailing on the date of renewal, plus applicable GST) per renewal term, regardless of the Program\u2019s original Service Term.'],
  ['22. ACKNOWLEDGMENT AND EXECUTION',
    '22.1 By signing below (including by electronic signature or acceptance through DM Consultants\u2019 CRM/client portal), the Client acknowledges having read and understood this Agreement in full, including the Refund Policy at Clause 14 and the Agreement Renewal Fee at Clause 21.1, and agrees to be bound by it.'],
  ['23. SIGNATURES',
    'IN WITNESS WHEREOF, the parties hereto have executed this Agreement on the day and year first written above.'],
];

const textOrBlank = (value: unknown, fallback = '________________') => {
  const result = String(value ?? '').trim();
  return result || fallback;
};

const box = (title: string, body: string, className = '') => `<section class="agreement-box ${className}">
  ${title ? `<h2>${esc(title)}</h2>` : ''}
  <p>${esc(body)}</p>
</section>`;

const checkbox = (label: string, checked: boolean) => `<span class="checkbox">[${checked ? 'X' : ' '}] ${esc(label)}</span>`;

const getAgreementDetails = (v: HyderabadAgreementValues) => {
  const selected = new Set((v.servicesSelected || []).map((s) => s.trim()));
  return {
    agreementNumber: textOrBlank(v.agreementNumber),
    agreementDate: textOrBlank(v.agreementDate),
    gstin: textOrBlank(v.gstin),
    programCode: textOrBlank(v.programCode),
    destinationCountries: textOrBlank(v.destinationCountries),
    clientName: textOrBlank(v.clientName),
    clientAddress: textOrBlank(v.clientAddress),
    clientPhoneEmail: textOrBlank(v.clientPhoneEmail),
    otherService: textOrBlank(v.otherService, ''),
    selectedServices: selected,
    totalAmount: textOrBlank(v.totalAmount, ''),
    initialPayment: textOrBlank(v.initialPayment, ''),
    secondPayment: textOrBlank(v.secondPayment, ''),
  };
};

export function renderHyderabadAgreement(v: HyderabadAgreementValues): string {
  const d = getAgreementDetails(v);

  const serviceCheckboxesHtml = SERVICE_OPTIONS
    .map((option) => checkbox(option, d.selectedServices.has(option)))
    .join(' &nbsp; ');
  const otherCheckboxHtml = `${checkbox('Other:', d.selectedServices.has('Other'))} ${esc(d.otherService)}`;

  const clauseHtml = clauses.map(([title, body]) => box(title, body, 'clause')).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Agreement for Advisory Services ${esc(d.agreementNumber)}</title>
  <style>
    @page {
      size: Letter;
      margin: 9mm 6mm 13mm;
    }

    :root {
      --ink: #111111;
      --border: #4b5563;
      --panel-bg: #ffffff;
      --heading: #111827;
      --important: #b91c1c;
      --page-width: 8.5in;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .document {
      width: 100%;
      max-width: var(--page-width);
      margin: 0 auto;
      padding: 0;
    }

    /* ── header ── */
    .agreement-header {
      background: #ffffff;
      color: #111111;
      border: 1.5px solid var(--border);
      border-radius: 0;
      padding: 12px 14px;
      margin: 0 0 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .company-name {
      font-weight: 700;
      font-size: 13px;
    }

    .trading-as,
    .company-address,
    .company-contact {
      font-size: 9.5px;
      color: #4b5563;
      margin-top: 2px;
    }

    .agreement-name {
      margin-top: 8px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 14px;
      letter-spacing: .3px;
    }

    /* ── generic single-column boxes ── */
    .agreement-box {
      border: 1.5px solid var(--border);
      border-radius: 0;
      overflow: hidden;
      margin: 0 0 8px;
      break-inside: avoid;
      page-break-inside: avoid;
      background: var(--panel-bg);
      padding: 9px 12px;
    }

    .agreement-box h2 {
      margin: 0 0 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .3px;
      color: var(--heading);
      border-bottom: 1.5px solid var(--border);
      padding-bottom: 4px;
    }

    .agreement-box p {
      margin: 0;
      white-space: pre-line;
    }

    .checkbox {
      display: inline-block;
      margin-right: 4px;
    }

    .clause {
      margin-bottom: 8px;
    }

    .signature-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .signature-box .agreement-box {
      margin-bottom: 0;
    }

    .print-footer {
      position: fixed;
      left: 6mm;
      right: 6mm;
      bottom: 4mm;
      display: flex;
      justify-content: center;
      color: #444;
      font-size: 8.4px;
      line-height: 1;
      text-align: center;
      white-space: nowrap;
    }

    .page-number::after {
      content: counter(page);
    }

    @media screen {
      body {
        background: #eef0f3;
        padding: 14px 0;
      }

      .document {
        background: #fff;
        min-height: 11in;
        padding: 9mm 6mm 13mm;
        box-shadow: 0 2px 12px rgba(0, 0, 0, .1);
      }

      .print-footer {
        position: static;
        margin-top: 11px;
      }
    }

    @media print {
      .document { padding: 0; }
      .print-footer { position: fixed; }
    }

    @media (max-width: 700px) {
      html, body { font-size: 11px; }
      .document { width: 100%; }
      .signature-box { grid-template-columns: 1fr; }
      .print-footer { white-space: normal; }
    }
  </style>
</head>
<body>
  <main class="document">
    <header class="agreement-header">
      <div class="company-name">${esc(COMPANY.nameEn)}</div>
      <div class="trading-as">${esc(COMPANY.tradingAs)}</div>
      <div class="company-address">${esc(COMPANY.addressEn)}</div>
      <div class="company-contact">Phone: ${esc(COMPANY.phone)} | Email: ${esc(COMPANY.email)}</div>
      <div class="agreement-name">AGREEMENT FOR ADVISORY SERVICES</div>
    </header>

    <section class="agreement-box">
      <h2>AGREEMENT DETAILS</h2>
      <p>Agreement No. ${esc(d.agreementNumber)}
Date ${esc(d.agreementDate)}
GSTIN ${esc(d.gstin)}</p>
      <p>Service(s) Selected: ${serviceCheckboxesHtml} &nbsp; ${otherCheckboxHtml}</p>
      <p>Program Code / Service Term (see Program Term Schedule) ${esc(d.programCode)}
Destination Country/ies ${esc(d.destinationCountries)}</p>
    </section>

    ${box(
      'CLIENT DETAILS',
      `Client Name ${d.clientName}
Client Address ${d.clientAddress}
Phone / Email ${d.clientPhoneEmail}`,
    )}

    ${(d.totalAmount || d.initialPayment || d.secondPayment) ? box(
      'SERVICE FEE / VALUE',
      `Total Advisory Fee (INR) ${d.totalAmount || '________________'}
Initial Payment (INR) ${d.initialPayment || '________________'}
Balance Payment (INR) ${d.secondPayment || '________________'}
(Fees are exclusive of applicable GST; see Service Order/Invoice for the full payment schedule.)`,
    ) : ''}

    ${box(
      'PARTIES AND ENGAGEMENT',
      `This Agreement for Services ("Agreement") is entered into between Didactic Migration Consultants Pvt Ltd, operating its Hyderabad Branch (hereinafter "DM CONSULTANTS", "DMC", or "the Company", which expression shall include its management, employees, franchisees, and authorised representatives at the Hyderabad office), and the Client named above (hereinafter "Client"), an individual (or, where applicable, the individual and all dependants/family members included in the same application).

All fees, refund rights, exclusions, liability limitations, and statutory rights are governed by the clauses below and the applicable Service Order / Invoice.`,
    )}

    ${clauseHtml}

    <div class="signature-box">
      ${box(
        'FOR AND ON BEHALF OF THE CLIENT',
        `Signature ________________________________
Name ${d.clientName}
Date ________________________________
Place ________________________________`,
      )}
    </div>

    ${box(
      'AUTHORIZED SIGNATORY',
      `On behalf of Management
Date: ________________________________

System-generated agreement - no physical signature is required.`,
    )}

    <footer class="print-footer">
      ${COMPANY.nameEn} - Client Signature Required on Every Page - Page <span class="page-number"></span>
    </footer>
  </main>
</body>
</html>`;
}

export function renderIndiaAgreement(v: IndiaAgreementValues): string {
  const requested = (v.servicesSelected?.length ? v.servicesSelected : (v.serviceProgram ? [v.serviceProgram] : []))
    .map((s) => s.trim())
    .filter(Boolean);
  // The checkbox list only recognizes the 6 fixed SERVICE_OPTIONS strings
  // verbatim. The real crm_service catalog is much larger and free-text, so a
  // service name that doesn't match one of the 6 exactly (the common case)
  // used to leave every checkbox unticked and the actual service name
  // nowhere on the page. Route any unmatched name(s) onto the "Other"
  // checkbox instead, so the selected service is always visible somewhere.
  const matched = requested.filter((s) => (SERVICE_OPTIONS as string[]).includes(s));
  const unmatched = requested.filter((s) => !(SERVICE_OPTIONS as string[]).includes(s));
  const servicesSelected = matched.length ? matched : (unmatched.length ? ['Other'] : []);
  const otherService = unmatched.length
    ? [v.otherService, ...unmatched].filter(Boolean).join(', ')
    : (v.otherService || v.specialTerms);

  return renderHyderabadAgreement({
    agreementNumber: v.agreementNumber,
    agreementDate: v.agreementDate,
    gstin: v.gstin,
    servicesSelected,
    otherService,
    programCode: v.programCode || v.serviceProgram,
    destinationCountries: v.destinationCountry,
    clientName: v.clientName,
    clientAddress: v.clientAddress,
    clientPhoneEmail: [v.clientPhone, v.clientEmail].filter(Boolean).join(' / '),
    totalAmount: v.totalAmount,
    initialPayment: v.initialPayment,
    secondPayment: v.secondPayment,
  });
}
