// Authoritative per-branch legal content for the "Agreement for Advisory
// Services" contract, taken verbatim from the 5 signed branch PDFs. This
// replaces the old approach of guessing company name/VAT/licence from
// regex-matching the branch's name+address text (fragile — see the comment
// in branchTax.ts about "Disha"/"Didactic" colliding across real branches).
// Keyed by crm_branch.abbrv, the same stable branch key branchCurrency.ts
// already relies on. crm_branch.name/address hold short operational labels
// (e.g. "Dubai SZR"), not the registered legal entity name/address that must
// appear on the contract, so those live here instead.

export type AgreementTemplateVariant = 'gulf' | 'india';

export interface BranchAgreementProfile {
  legalNameEn: string;
  legalNameAr: string;
  addressEn: string;
  addressAr: string;
  regulatoryLineEn: string;
  regulatoryLineAr: string;
  // The second client-identification field's label — this is the one field
  // that differs by jurisdiction (Emirates ID / Civil ID / Passport-QID).
  idLabelEn: string;
  idLabelAr: string;
  currencyCode: string;
  taxLineEn: string;
  taxLineAr: string;
  // Full body of Clause 14 (Governing Law and Jurisdiction) — everything
  // else in the unified Gulf agreement is identical across branches.
  governingLawEn: string;
  governingLawAr: string;
  // Only Qatar's signed PDF prints a "Phone: ... | Email: ..." line in the
  // header — Dubai/Abu Dhabi/Kuwait's headers have no such line at all, so
  // this is optional and omitted (not blank-filled) for every other branch.
  contactLineEn?: string;
  contactLineAr?: string;
  templateVariant: AgreementTemplateVariant;
}

const DUBAI_PROFILE: BranchAgreementProfile = {
  // Trading name updated to Inzeit Business Consultants - same premises as
  // before, address updated to the new office. NOTE: regulatoryLineEn/Ar
  // intentionally left as the last known licence text (No. 766222 under the
  // previous registered name) since no new trade licence number/document was
  // provided for this rebrand - update it once the reissued licence is in
  // hand, since a contract citing a licence number under the old company
  // name is a real legal-accuracy problem, not just a display issue.
  legalNameEn: 'Inzeit Business Consultants',
  legalNameAr: 'إنزايت للاستشارات التجارية',
  addressEn: '1701 Al Shafar Tower 1, Barsha Heights, Dubai, UAE',
  addressAr: '1701، برج الشافر 1، مركز برشا، دبي، الإمارات العربية المتحدة',
  regulatoryLineEn: 'Professional Licence No. 766222 - Dubai Department of Economy and Tourism (DET)',
  regulatoryLineAr: 'الرخصة المهنية رقم 766222 - دائرة الاقتصاد والسياحة في دبي',
  contactLineEn: 'Phone: +971 58 161 7799 | Email: info@inzeitconsultants.com',
  contactLineAr: 'الهاتف: +971 58 161 7799 | البريد الإلكتروني: info@inzeitconsultants.com',
  idLabelEn: 'Emirates ID No.',
  idLabelAr: 'رقم الهوية الإماراتية',
  currencyCode: 'AED',
  taxLineEn: 'VAT and any other tax shall be charged where legally applicable under UAE law.',
  taxLineAr: 'تضاف ضريبة القيمة المضافة وأي ضريبة أخرى حيثما تكون واجبة التطبيق قانونًا بموجب قوانين دولة الإمارات.',
  governingLawEn: 'This Agreement is governed by the laws of the Emirate of Dubai and the applicable federal laws of the United Arab Emirates. Subject to mandatory consumer or regulatory jurisdiction, the parties submit to the exclusive jurisdiction of the competent courts of Dubai, UAE. The English and Arabic texts are intended to correspond; if an inconsistency cannot be reconciled, the language given priority by mandatory local law shall prevail, otherwise the English text shall be used for contractual interpretation.',
  governingLawAr: 'تخضع هذه الاتفاقية لـ قوانين إمارة دبي والقوانين الاتحادية واجبة التطبيق في دولة الإمارات العربية المتحدة. ومع مراعاة أي اختصاص إلزامي للمستهلك أو الجهات التنظيمية، ينعقد الاختصاص الحصري لـ محاكم دبي المختصة، الإمارات العربية المتحدة. يقصد أن يتطابق النصان الإنجليزي والعربي؛ وإذا تعذر التوفيق بينهما، تسود اللغة التي يمنحها القانون المحلي الإلزامي الأولوية، وإلا فيستخدم النص الإنجليزي لتفسير العقد.',
  templateVariant: 'gulf',
};

const ABU_DHABI_PROFILE: BranchAgreementProfile = {
  legalNameEn: 'Didactic Management Consultants - L.L.C - S.P.C',
  legalNameAr: 'ديدكتيك للاستشارات الإدارية ذ.م.م - ش.ش.و',
  addressEn: '1802, Salam HQ Building, Al Salam Street, Abu Dhabi, UAE',
  addressAr: '1802، مبنى سلام HQ، شارع السلام، أبوظبي، الإمارات العربية المتحدة',
  regulatoryLineEn: 'Commercial Licence No. CN-2539189 - Abu Dhabi Department of Economic Development; licensed activities: Visa Services and Administrative Consultancy & Studies',
  regulatoryLineAr: 'الرخصة التجارية رقم CN-2539189 - دائرة التنمية الاقتصادية أبوظبي؛ الأنشطة المرخصة: خدمات استخراج التأشيرات والاستشارات والدراسات الإدارية',
  idLabelEn: 'Emirates ID No.',
  idLabelAr: 'رقم الهوية الإماراتية',
  currencyCode: 'AED',
  taxLineEn: 'VAT and any other tax shall be charged where legally applicable under UAE law.',
  taxLineAr: 'تضاف ضريبة القيمة المضافة وأي ضريبة أخرى حيثما تكون واجبة التطبيق قانونًا بموجب قوانين دولة الإمارات.',
  governingLawEn: 'This Agreement is governed by the laws of the Emirate of Abu Dhabi and the applicable federal laws of the United Arab Emirates. Subject to mandatory consumer or regulatory jurisdiction, the parties submit to the exclusive jurisdiction of the competent courts of Abu Dhabi, UAE. The English and Arabic texts are intended to correspond; if an inconsistency cannot be reconciled, the language given priority by mandatory local law shall prevail, otherwise the English text shall be used for contractual interpretation.',
  governingLawAr: 'تخضع هذه الاتفاقية لـ قوانين إمارة أبوظبي والقوانين الاتحادية واجبة التطبيق في دولة الإمارات العربية المتحدة. ومع مراعاة أي اختصاص إلزامي للمستهلك أو الجهات التنظيمية، ينعقد الاختصاص الحصري لـ محاكم أبوظبي المختصة، الإمارات العربية المتحدة. يقصد أن يتطابق النصان الإنجليزي والعربي؛ وإذا تعذر التوفيق بينهما، تسود اللغة التي يمنحها القانون المحلي الإلزامي الأولوية، وإلا فيستخدم النص الإنجليزي لتفسير العقد.',
  templateVariant: 'gulf',
};

const KUWAIT_PROFILE: BranchAgreementProfile = {
  legalNameEn: 'Disha Management Consulting Company (DM Consultants Kuwait)',
  legalNameAr: 'شركة ديشا للاستشارات الإدارية (دي إم كونسلتنتس الكويت)',
  addressEn: 'Kuwait City, State of Kuwait',
  addressAr: 'مدينة الكويت، دولة الكويت',
  regulatoryLineEn: 'Commercial Licence No. 2019/36987 - State of Kuwait',
  regulatoryLineAr: 'الرخصة التجارية رقم 2019/36987 - دولة الكويت',
  idLabelEn: 'Civil ID No.',
  idLabelAr: 'رقم البطاقة المدنية',
  currencyCode: 'KWD',
  taxLineEn: 'No VAT is presently stated in this Agreement. Any tax, duty or levy that becomes legally applicable shall be charged in addition.',
  taxLineAr: 'لا تتضمن هذه الاتفاقية ضريبة قيمة مضافة حاليًا. وتضاف أي ضريبة أو رسم أو عبء يصبح واجب التطبيق قانونًا.',
  governingLawEn: 'This Agreement is governed by the laws of the State of Kuwait. Subject to mandatory consumer or regulatory jurisdiction, the parties submit to the exclusive jurisdiction of the competent courts of Kuwait. The English and Arabic texts are intended to correspond; if an inconsistency cannot be reconciled, the language given priority by mandatory local law shall prevail, otherwise the English text shall be used for contractual interpretation.',
  governingLawAr: 'تخضع هذه الاتفاقية لـ قوانين دولة الكويت. ومع مراعاة أي اختصاص إلزامي للمستهلك أو الجهات التنظيمية، ينعقد الاختصاص الحصري لـ محاكم دولة الكويت المختصة. يقصد أن يتطابق النصان الإنجليزي والعربي؛ وإذا تعذر التوفيق بينهما، تسود اللغة التي يمنحها القانون المحلي الإلزامي الأولوية، وإلا فيستخدم النص الإنجليزي لتفسير العقد.',
  templateVariant: 'gulf',
};

const QATAR_PROFILE: BranchAgreementProfile = {
  legalNameEn: 'Disha Management Consultants LLC',
  legalNameAr: 'شركة ديشا للاستشارات الإدارية ذ.م.م',
  addressEn: 'Abdul Jaleel Business Center, Office 301, 3rd Floor, Office Block, Airport Street, next to Ford Showroom, Doha, Qatar',
  addressAr: 'مركز عبد الجليل للأعمال، مكتب 301، الطابق الثالث، مبنى المكاتب، شارع المطار، بجوار معرض فورد، الدوحة، قطر',
  regulatoryLineEn: 'Commercial Registration No. 133895 - State of Qatar',
  regulatoryLineAr: 'السجل التجاري رقم 133895 - دولة قطر',
  contactLineEn: 'Phone: +974 4436 7929 | Email: info@dm-consultant.qa',
  contactLineAr: 'الهاتف: +974 4436 7929 | البريد الإلكتروني: info@dm-consultant.qa',
  idLabelEn: 'Passport/QID No.',
  idLabelAr: 'رقم جواز السفر/البطاقة القطرية',
  currencyCode: 'QAR',
  taxLineEn: 'Any tax, duty or levy legally applicable in Qatar shall be charged in addition.',
  taxLineAr: 'تضاف أي ضريبة أو رسم أو عبء قانوني واجب التطبيق في دولة قطر.',
  governingLawEn: 'This Agreement is governed by the laws of the State of Qatar. Subject to mandatory consumer or regulatory jurisdiction, the parties submit to the exclusive jurisdiction of the competent courts of Doha, Qatar. The English and Arabic texts are intended to correspond; if an inconsistency cannot be reconciled, the language given priority by mandatory local law shall prevail, otherwise the English text shall be used for contractual interpretation.',
  governingLawAr: 'تخضع هذه الاتفاقية لـ قوانين دولة قطر. ومع مراعاة أي اختصاص إلزامي للمستهلك أو الجهات التنظيمية، ينعقد الاختصاص الحصري لـ محاكم الدوحة المختصة، دولة قطر. يقصد أن يتطابق النصان الإنجليزي والعربي؛ وإذا تعذر التوفيق بينهما، تسود اللغة التي يمنحها القانون المحلي الإلزامي الأولوية، وإلا فيستخدم النص الإنجليزي لتفسير العقد.',
  templateVariant: 'gulf',
};

// Hyderabad's real agreement is an entirely different English-only document
// under Indian law (see indiaAgreementTemplate.ts) — most of these fields
// aren't used by that renderer, but are filled in consistently so any caller
// resolving a profile generically (e.g. for display) still gets sensible
// values rather than falling through to Dubai's.
const HYDERABAD_PROFILE: BranchAgreementProfile = {
  legalNameEn: 'Didactic Migration Consultants Pvt Ltd',
  legalNameAr: 'ديدكتيك مايجريشن كونسلتنتس برايفت ليمتد',
  addressEn: '2nd Floor, UMA Plaza, Nagarjuna Circle Road, Beside Mahindra Showroom, Mothi Nagar, Nagarjuna Hills, Punjagutta, Hyderabad, Telangana 500082, India',
  addressAr: '',
  regulatoryLineEn: 'GSTIN: 36AAGCD8611D2ZU',
  regulatoryLineAr: '',
  idLabelEn: '',
  idLabelAr: '',
  currencyCode: 'INR',
  taxLineEn: 'All Fees are exclusive of applicable GST, charged additionally as per prevailing rates.',
  taxLineAr: '',
  governingLawEn: 'This Agreement is governed by the laws of India, including the Indian Contract Act, 1872 and, where applicable, the Consumer Protection Act, 2019. The courts at Hyderabad, Telangana have exclusive jurisdiction, subject to the Client\'s statutory right to approach the appropriate Consumer Disputes Redressal Commission.',
  governingLawAr: '',
  templateVariant: 'india',
};

// Normalized crm_branch.abbrv -> profile. abbrv values come from
// scripts/seed-branches.js and are the same stable key branchCurrency.ts
// already keys off.
const PROFILES_BY_ABBRV: Record<string, BranchAgreementProfile> = {
  'dxb szr': DUBAI_PROFILE,
  auh: ABU_DHABI_PROFILE,
  kwd: KUWAIT_PROFILE,
  'doh old airport rd': QATAR_PROFILE,
  hyd: HYDERABAD_PROFILE,
};

// Unrecognized/future branches fall back to the Dubai profile — the same
// safe default the old regex-based logic used when it couldn't identify a
// branch, so nothing breaks for a 6th branch added before this list is
// updated with its real legal details.
export function getBranchAgreementProfile(abbrv: string | null | undefined): BranchAgreementProfile {
  const key = String(abbrv || '').trim().toLowerCase();
  return PROFILES_BY_ABBRV[key] || DUBAI_PROFILE;
}
