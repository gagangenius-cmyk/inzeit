// Bilingual (EN/AR) "Agreement for Advisory Services" — Kuwait branch
// (Disha Management Consulting Company / DM Consultants Kuwait).
//
// Sibling file to abuDhabiAgreementTemplate.ts and dubaiAgreementTemplate.ts.
// Kept as a separate module for the same reason as those two: this branch's
// signed PDF is not byte-identical to the shared Gulf template body, AND it
// differs from the Abu Dhabi/Dubai pair in two further respects —
//   - Clause 14 here is plain COURT JURISDICTION ("GOVERNING LAW AND
//     JURISDICTION" — exclusive jurisdiction of the competent courts of
//     Kuwait), NOT DIAC arbitration like the Abu Dhabi/Dubai branches.
//   - The Agreement Details box has no "Agreement Expiry" field at all —
//     the Kuwait PDF omits it entirely (Abu Dhabi/Dubai both include it).
// Everything else (Clause 7.5 renewal-fee sub-clause, the Fee Summary's
// renewal-fee line, Annexure A's Program Term Schedule field, all other
// clause bodies) matches the Abu Dhabi/Dubai pattern, just with Kuwait's
// branch identity, "Civil ID No." label, and KWD currency substituted in.

import { RENEWAL_FEE_USD_LABEL, RENEWAL_FEE_USD_LABEL_AR } from './agreementDefaults';

const esc = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface KuwaitAgreementValues {
  agreementNumber: string;
  agreementDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  nationality: string;
  passportNumber: string;
  // Civil ID No.
  idNumber?: string;
  serviceProgram: string;
  // Program Code / Service Term (see Program Term Schedule)
  programCode?: string;
  // Program Term Schedule reference shown in Annexure A (6 / 12 / 18 months)
  programTermSchedule?: string;
  destinationCountry: string;
  // Plain formatted numbers (e.g. "12,500") — currency is shown via
  // currencyCode below, not repeated inside the value.
  totalAmount: string;
  initialPayment: string;
  secondPayment: string;
  // CRM/lead/opportunity identifier shown in Annexure A.
  clientId?: string;
  includedDeliverables?: string;
  expressExclusions?: string;
  specialTerms?: string;
  currencyCode?: string;
  // Branch identity — resolved by the caller (see renderAgreementForBranch.ts)
  // from branchAgreementProfiles.ts / crm_branch. Falls back to DEFAULTS
  // below if omitted.
  branchNameEn?: string;
  branchNameAr?: string;
  branchAddressEn?: string;
  branchAddressAr?: string;
  regulatoryLineEn?: string;
  regulatoryLineAr?: string;
  idLabelEn?: string;
  idLabelAr?: string;
}

// Fallback branch identity, used only if a caller omits the dynamic fields
// above — kept in sync with branchAgreementProfiles.ts's KUWAIT_PROFILE.
const DEFAULTS = {
  nameEn: 'Disha Management Consulting Company (DM Consultants Kuwait)',
  nameAr: 'شركة ديشا للاستشارات الإدارية (دي إم كونسلتنتس الكويت)',
  addressEn: 'Kuwait City, State of Kuwait',
  addressAr: 'مدينة الكويت، دولة الكويت',
  regulatoryEn: 'Commercial Licence No. 2019/36987 - State of Kuwait',
  regulatoryAr: 'الرخصة التجارية رقم 2019/36987 - دولة الكويت',
  idLabelEn: 'Civil ID No.',
  idLabelAr: 'رقم البطاقة المدنية',
  currencyCode: 'KWD',
  renewalFeeUsd: RENEWAL_FEE_USD_LABEL,
  renewalFeeUsdAr: RENEWAL_FEE_USD_LABEL_AR,
};

const resolveCompany = (v: KuwaitAgreementValues) => ({
  nameEn: v.branchNameEn || DEFAULTS.nameEn,
  nameAr: v.branchNameAr || DEFAULTS.nameAr,
  addressEn: v.branchAddressEn || DEFAULTS.addressEn,
  addressAr: v.branchAddressAr || DEFAULTS.addressAr,
  regulatoryEn: v.regulatoryLineEn || DEFAULTS.regulatoryEn,
  regulatoryAr: v.regulatoryLineAr || DEFAULTS.regulatoryAr,
  idLabelEn: v.idLabelEn || DEFAULTS.idLabelEn,
  idLabelAr: v.idLabelAr || DEFAULTS.idLabelAr,
  currencyCode: v.currencyCode || DEFAULTS.currencyCode,
  renewalFeeUsd: DEFAULTS.renewalFeeUsd,
  renewalFeeUsdAr: DEFAULTS.renewalFeeUsdAr,
});

// The 15 clauses, verbatim from the signed PDF, in its own order/numbering.
const clauses: Array<[string, string, string, string]> = [
  ['1. DEFINITIONS AND CONTRACT DOCUMENTS',
    '1.1 "Services" means only the advisory, administrative and documentation services selected in the CRM and described in Annexure A. 1.2 "Advisory Fee" means the Company\u2019s professional fee and excludes all government, authority, examination, translation, courier, medical, educational, legal and third-party charges unless expressly included. 1.3 CRM records, approved quotations, invoices, payment links, emails, recorded confirmations and Annexure A form part of this Agreement. 1.4 If documents conflict, this Agreement prevails, followed by Annexure A, the approved quotation and the CRM record. 1.5 Headings are for convenience and do not limit interpretation.',
    '1. التعريفات ومستندات التعاقد',
    '1.1 تعني "الخدمات" حصرًا الخدمات الاستشارية والإدارية وخدمات المستندات المختارة في نظام إدارة علاقات العملاء والمبينة في الملحق أ. 1.2 تعني "رسوم الخدمات الاستشارية" الأتعاب المهنية للشركة ولا تشمل رسوم الحكومات أو الجهات أو الاختبارات أو الترجمة أو البريد أو الفحوص الطبية أو المؤسسات التعليمية أو الخدمات القانونية أو الأطراف الثالثة ما لم يرد نص صريح بخلاف ذلك. 1.3 تعد سجلات نظام إدارة علاقات العملاء والعروض المعتمدة والفواتير وروابط الدفع ورسائل البريد والتأكيدات المسجلة والملحق أ جزءًا من هذه الاتفاقية. 1.4 عند التعارض تسود هذه الاتفاقية ثم الملحق أ ثم العرض المعتمد ثم سجل النظام. 1.5 وضعت العناوين للتيسير ولا تقيد التفسير.'],
  ['2. UNIFIED SCOPE OF ADVISORY SERVICES',
    '2.1 This is one unified agreement for every service program selected through the CRM. 2.2 The Company shall use reasonable professional efforts to provide the selected Services, which may include profile review, options guidance, document checklists, form preparation assistance, coordination, submission support where lawfully permitted, status follow-up and general administrative guidance. 2.3 Only items expressly selected in Annexure A are included. Any additional work, change of program, re-filing, appeal, review, legal representation or service arising after a change in facts or law requires a separate quotation and payment. 2.4 The Company may allocate work among its offices, affiliates, employees and vetted third-party professionals and may transfer the file between them for operational efficiency.',
    '2. النطاق الموحد للخدمات الاستشارية',
    '2.1 تمثل هذه الوثيقة اتفاقية موحدة لجميع برامج الخدمات المختارة من خلال نظام إدارة علاقات العملاء. 2.2 تبذل الشركة عناية مهنية معقولة لتقديم الخدمات المختارة، وقد تشمل مراجعة الملف والإرشاد بشأن الخيارات وقوائم المستندات والمساعدة في إعداد النماذج والتنسيق ودعم التقديم حيث يسمح القانون والمتابعة والإرشاد الإداري العام. 2.3 لا يشمل النطاق إلا البنود المحددة صراحة في الملحق أ. وأي عمل إضافي أو تغيير برنامج أو إعادة تقديم أو طعن أو مراجعة أو تمثيل قانوني أو خدمة تنشأ بسبب تغير الوقائع أو القانون يستلزم عرضًا ورسومًا منفصلة. 2.4 يجوز للشركة توزيع العمل بين فروعها وشركاتها التابعة وموظفيها والمهنيين الخارجيين المعتمدين ونقل الملف بينهم لتحقيق الكفاءة التشغيلية.'],
  ['3. NO GUARANTEE; AUTHORITY AND THIRD-PARTY RISK',
    '3.1 THE COMPANY DOES NOT GUARANTEE OR WARRANT ANY APPROVAL, VISA, PERMIT, NOMINATION, INVITATION, ADMISSION, JOB, BUSINESS RESULT, TIMELINE OR OTHER OUTCOME. 3.2 All decisions, processing times, quotas, interviews, requests and refusals are controlled exclusively by the relevant authority or third party. 3.3 The Company is not liable for changes in law, policy, eligibility, occupation lists, points, quotas, fees, exchange rates, processing times, closures, system failures or third-party conduct. 3.4 Estimates and opinions are based on information and rules available at the time and may change. 3.5 An adverse result, delay or change does not by itself establish breach, negligence or entitlement to refund.',
    '3. عدم ضمان النتائج ومخاطر الجهات والأطراف الثالثة',
    '3.1 لا تضمن الشركة ولا تكفل أي موافقة أو تأشيرة أو تصريح أو ترشيح أو دعوة أو قبول أو وظيفة أو نتيجة أعمال أو مدة أو أي نتيجة أخرى. 3.2 تخضع جميع القرارات ومدد المعالجة والحصص والمقابلات والطلبات والرفض حصرًا للجهة المختصة أو الطرف الثالث. 3.3 لا تتحمل الشركة مسؤولية تغير القوانين أو السياسات أو الأهلية أو قوائم المهن أو النقاط أو الحصص أو الرسوم أو أسعار الصرف أو مدد المعالجة أو الإغلاقات أو أعطال الأنظمة أو تصرفات الأطراف الثالثة. 3.4 تعتمد التقديرات والآراء على المعلومات والقواعد المتاحة وقت تقديمها وقد تتغير. 3.5 لا تشكل النتيجة السلبية أو التأخير أو التغيير بذاتها إخلالًا أو إهمالًا أو حقًا في الاسترداد.'],
  ['4. CLIENT WARRANTIES AND DUTIES',
    '4.1 The Client warrants that all information and documents are authentic, accurate, complete, current and not misleading. 4.2 The Client must promptly disclose refusals, criminal or civil matters, health issues, prior applications, immigration history, financial issues and any material change. 4.3 The Client is solely responsible for reviewing every form and submission before approval and for meeting deadlines, language tests, interviews, medicals, biometrics, funds and authority requirements. 4.4 The Client must not submit false or altered documents, conceal facts, contact an authority in a manner that conflicts with the Company\u2019s instructions, or take financial, employment or relocation decisions in reliance on an anticipated outcome. 4.5 Failure, delay, non-cooperation, abusive conduct or non-payment is a material breach permitting suspension or termination without refund, subject to mandatory law.',
    '4. إقرارات العميل والتزاماته',
    '4.1 يضمن العميل أن جميع المعلومات والمستندات أصلية وصحيحة وكاملة وحديثة وغير مضللة. 4.2 يجب على العميل الإفصاح فورًا عن حالات الرفض والمسائل الجنائية أو المدنية والحالة الصحية والطلبات السابقة والسجل الهجري والمسائل المالية وأي تغير جوهري. 4.3 يتحمل العميل وحده مسؤولية مراجعة كل نموذج ومستند قبل اعتماده والالتزام بالمواعيد واختبارات اللغة والمقابلات والفحوص والبصمات وإثبات الأموال ومتطلبات الجهات. 4.4 لا يجوز للعميل تقديم مستندات مزورة أو معدلة أو إخفاء الوقائع أو التواصل مع جهة بما يتعارض مع تعليمات الشركة أو اتخاذ قرارات مالية أو وظيفية أو انتقالية اعتمادًا على نتيجة متوقعة. 4.5 يشكل التأخر أو عدم التعاون أو السلوك المسيء أو عدم الدفع إخلالًا جوهريًا يجيز تعليق الخدمات أو إنهاءها دون استرداد، مع مراعاة الأحكام الآمرة في القانون.'],
  ['5. FEES, TAXES AND PAYMENT',
    '5.1 Fees are earned progressively as work is performed and resources are reserved. 5.2 The Client shall pay each instalment on time without set-off, deduction or withholding. 5.3 Government and third-party charges are separate, may change without notice and remain the Client\u2019s responsibility. 5.4 The Company may suspend work, withhold deliverables or refrain from submission until all amounts are cleared. 5.5 Bank, card, financing, currency-conversion and collection charges are payable by the Client. 5.6 Late or failed payments may result in administrative and recovery charges to the extent permitted by law.',
    '5. الرسوم والضرائب والدفع',
    '5.1 تستحق الرسوم تدريجيًا مع إنجاز العمل وتخصيص الموارد. 5.2 يلتزم العميل بسداد كل قسط في موعده دون مقاصة أو خصم أو حجز. 5.3 رسوم الحكومات والأطراف الثالثة منفصلة وقد تتغير دون إشعار وتظل مسؤولية العميل. 5.4 يجوز للشركة تعليق العمل أو حجب المخرجات أو الامتناع عن التقديم إلى حين سداد جميع المبالغ. 5.5 يتحمل العميل رسوم البنك والبطاقة والتمويل وتحويل العملات والتحصيل. 5.6 قد يترتب على التأخر أو فشل الدفع رسوم إدارية وتكاليف تحصيل بالقدر الذي يسمح به القانون.'],
  ['6. REFUND, CANCELLATION AND CHARGEBACK POLICY',
    '6.1 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ALL FEES ARE NON-REFUNDABLE ONCE PAID, EXCEPT ONLY FOR AN EXPRESS REFUND RIGHT STATED IN ANNEXURE A OR A NON-WAIVABLE RIGHT UNDER LAW. 6.2 In every case, registration, assessment, consultation, administration, CRM activation, document-review, research, strategy, drafting, translation coordination, third-party and work already performed are non-refundable. 6.3 If a discretionary refund is approved, the Company may deduct: (a) the value of completed work at prevailing rates; (b) committed staff and third-party costs; (c) taxes, bank and card charges; (d) government and authority fees; (e) discounts previously granted; and (f) reasonable administration and closure costs. 6.4 No refund is due for refusal, delay, policy change, ineligibility, expiry, client withdrawal, non-cooperation, misrepresentation, missed deadline, changed circumstances or termination for Client breach. 6.5 Refund requests must be written, supported and submitted within 14 days of the event relied upon. 6.6 The Client shall not initiate a chargeback for an amount legitimately due. An improper chargeback is a material breach, and the Company may suspend services, submit this Agreement and service records to the payment provider, and recover reasonable costs. 6.7 Nothing in this clause excludes mandatory statutory rights that cannot lawfully be waived.',
    '6. سياسة الاسترداد والإلغاء والاعتراض على الدفع',
    '6.1 إلى أقصى حد يسمح به القانون واجب التطبيق، تكون جميع الرسوم غير قابلة للاسترداد بعد سدادها، ولا يستثنى من ذلك إلا حق استرداد منصوص عليه صراحة في الملحق أ أو حق إلزامي لا يجوز التنازل عنه قانونًا. 6.2 وفي جميع الأحوال لا ترد رسوم التسجيل والتقييم والاستشارة والإدارة وتفعيل النظام ومراجعة المستندات والبحث والاستراتيجية والصياغة وتنسيق الترجمة وتكاليف الأطراف الثالثة وقيمة العمل المنجز. 6.3 عند الموافقة التقديرية على استرداد، يجوز للشركة خصم: (أ) قيمة العمل المنجز وفق الأسعار السائدة؛ (ب) تكاليف الموظفين والأطراف الثالثة الملتزم بها؛ (ج) الضرائب ورسوم البنك والبطاقة؛ (د) رسوم الحكومات والجهات؛ (هـ) الخصومات الممنوحة سابقًا؛ و(و) تكاليف الإدارة وإغلاق الملف المعقولة. 6.4 لا يستحق أي استرداد بسبب الرفض أو التأخير أو تغير السياسة أو عدم الأهلية أو انتهاء الصلاحية أو انسحاب العميل أو عدم التعاون أو التضليل أو فوات الموعد أو تغير الظروف أو الإنهاء بسبب إخلال العميل. 6.5 يجب تقديم طلب الاسترداد كتابة مع المستندات خلال 14 يومًا من الواقعة المستند إليها. 6.6 لا يجوز للعميل تقديم اعتراض على عملية دفع لمبلغ مستحق بصورة مشروعة. ويعد الاعتراض غير المشروع إخلالًا جوهريًا، ويجوز للشركة تعليق الخدمات وتقديم هذه الاتفاقية وسجلات الخدمة لمزود الدفع واسترداد التكاليف المعقولة. 6.7 لا يستبعد هذا البند أي حقوق قانونية إلزامية لا يجوز التنازل عنها.'],
  // Clause 7 carries the extra "7.5 Duration and Renewal" sub-clause and its
  // Agreement Renewal Fee, which is specific to this branch's signed PDF.
  ['7. TERMINATION, SUSPENSION, DURATION AND RENEWAL',
    '7.1 The Company may suspend or terminate immediately for non-payment, false information, suspected fraud, abusive conduct, conflict of interest, regulatory concern, impossible or unlawful instructions, prolonged inactivity or material breach. 7.2 The Client may terminate by written notice, but termination does not cancel accrued fees or create a refund right. 7.3 On termination, the Company may close the file, cease deadlines and communications, retain copies required by law, and release available client-owned originals after payment of all lawful outstanding amounts. 7.4 Re-opening a closed file is subject to availability, fresh assessment and additional fees. 7.5 DURATION AND RENEWAL. This Agreement is valid for the Service Term applicable to the Client\u2019s selected Program, as set out in the Company\u2019s Program Term Schedule and reflected in Annexure A. Where a Program is not listed in the then-current Program Term Schedule, the default term shall be 18 months from the Agreement Date. Where the Client requests renewal beyond that term, a fixed, non-refundable Agreement Renewal Fee of USD 500 (or its equivalent in KWD at the exchange rate prevailing on the renewal date) shall apply per renewal term — the same amount regardless of the Program\u2019s original Service Term — in addition to any Third-Party Costs, taxes, and other fees referred to in Clause 7.4. The Renewal Fee is payable before the file is reactivated and does not revive any right to a refund of Fees already paid, nor does it alter the Services originally selected in Annexure A unless a new Annexure A is issued.',
    '7. التعليق والإنهاء والمدة والتجديد',
    '7.1 يجوز للشركة تعليق الخدمات أو إنهاءها فورًا بسبب عدم الدفع أو المعلومات الكاذبة أو الاشتباه في الاحتيال أو السلوك المسيء أو تعارض المصالح أو المخاوف التنظيمية أو التعليمات المستحيلة أو غير القانونية أو انعدام النشاط لمدة طويلة أو الإخلال الجوهري. 7.2 يجوز للعميل الإنهاء بإشعار كتابي، إلا أن الإنهاء لا يلغي الرسوم المستحقة ولا ينشئ حقًا في الاسترداد. 7.3 عند الإنهاء يجوز للشركة إغلاق الملف ووقف المواعيد والمراسلات والاحتفاظ بالنسخ المطلوبة قانونًا وتسليم الأصول المملوكة للعميل والمتاحة بعد سداد المبالغ المستحقة قانونًا. 7.4 تخضع إعادة فتح الملف للتوافر والتقييم الجديد ورسوم إضافية. 7.5 المدة والتجديد. تسري هذه الاتفاقية للمدة المحددة لبرنامج العميل المختار، وفق جدول مدد البرامج المعتمد لدى الشركة والمبيّن في الملحق أ. وفي حال عدم إدراج البرنامج ضمن جدول مدد البرامج المعمول به، تكون المدة الافتراضية ثمانية عشر (18) شهرًا من تاريخ الاتفاقية. وفي حال طلب العميل التجديد بعد انتهاء هذه المدة، تُستحق رسوم تجديد ثابتة وغير قابلة للاسترداد قدرها 500 دولار أمريكي (أو ما يعادلها بالدينار الكويتي وفق سعر الصرف السائد بتاريخ التجديد) عن كل مدة تجديد — وهو المبلغ ذاته بصرف النظر عن مدة البرنامج الأصلية — إضافة إلى أي تكاليف أطراف ثالثة وضرائب ورسوم أخرى مشار إليها في البند 7.4. تُسدد رسوم التجديد قبل إعادة تفعيل الملف، ولا تنشئ أي حق في استرداد الرسوم المدفوعة سابقًا، ولا تُغيّر الخدمات المختارة أصلًا في الملحق أ ما لم يُصدر ملحق أ جديد.'],
  ['8. LIMITATION OF LIABILITY',
    '8.1 To the maximum extent permitted by law, the Company is not liable for indirect, consequential, special, exemplary or economic loss, including loss of profit, opportunity, employment, admission, travel, rent, business, reputation or anticipated savings. 8.2 The Company is not liable for acts or omissions of authorities, banks, couriers, translators, educational institutions, employers, agents or other third parties. 8.3 The Company\u2019s aggregate liability arising from the selected Services shall not exceed the professional Advisory Fees actually received by the Company for the specific affected service, less taxes, third-party charges and refunded amounts. 8.4 The limitations do not apply to liability that cannot lawfully be limited, including fraud or wilful misconduct where applicable. 8.5 No claim may be brought unless written notice with reasonable particulars is delivered within 30 days after the Client became aware, and in any event within the limitation period imposed by mandatory law.',
    '8. تحديد المسؤولية',
    '8.1 إلى أقصى حد يسمح به القانون، لا تتحمل الشركة مسؤولية الخسائر غير المباشرة أو التبعية أو الخاصة أو العقابية أو الاقتصادية، بما فيها خسارة الربح أو الفرصة أو الوظيفة أو القبول أو السفر أو الإيجار أو الأعمال أو السمعة أو الوفورات المتوقعة. 8.2 لا تتحمل الشركة مسؤولية أفعال أو امتناع الجهات أو البنوك أو شركات البريد أو المترجمين أو المؤسسات التعليمية أو أصحاب العمل أو الوكلاء أو الأطراف الثالثة. 8.3 لا تتجاوز المسؤولية الإجمالية للشركة الناشئة عن الخدمات المختارة قيمة رسوم الخدمات الاستشارية المهنية التي استلمتها فعليًا عن الخدمة المتأثرة تحديدًا، بعد خصم الضرائب ورسوم الأطراف الثالثة والمبالغ المستردة. 8.4 لا تسري القيود على المسؤولية التي لا يجوز قانونًا تقييدها، بما في ذلك الاحتيال أو سوء السلوك العمدي حيثما ينطبق. 8.5 لا تقبل أي مطالبة ما لم يوجه إشعار كتابي بتفاصيل معقولة خلال 30 يومًا من علم العميل، وفي جميع الأحوال خلال مدة التقادم الإلزامية قانونًا.'],
  ['9. CLIENT INDEMNITY',
    'The Client shall indemnify and hold harmless the Company, its owners, officers, employees, affiliates and representatives from third-party claims, penalties, losses and reasonable professional costs arising from the Client\u2019s false, incomplete or late information; forged or unlawful documents; breach of this Agreement; unauthorized conduct; infringement of third-party rights; or instructions that expose the Company to regulatory or legal action, except to the extent caused by the Company\u2019s fraud or wilful misconduct.',
    '9. تعويض العميل',
    'يلتزم العميل بتعويض الشركة ومالكيها ومسؤوليها وموظفيها وشركاتها التابعة وممثليها عن مطالبات الأطراف الثالثة والعقوبات والخسائر والتكاليف المهنية المعقولة الناشئة عن معلومات العميل الكاذبة أو الناقصة أو المتأخرة أو المستندات المزورة أو غير القانونية أو الإخلال بهذه الاتفاقية أو التصرف غير المصرح به أو انتهاك حقوق الغير أو التعليمات التي تعرض الشركة لإجراء تنظيمي أو قانوني، باستثناء القدر الناشئ عن احتيال الشركة أو سوء سلوكها العمدي.'],
  ['10. DATA, RECORDINGS AND COMMUNICATIONS',
    '10.1 The Client authorizes collection, verification, storage, processing and cross-border transfer of personal information reasonably required for the Services, compliance, quality control, fraud prevention and communication. 10.2 Information may be shared with affiliates, authorities, professional representatives, service providers and third parties involved in the selected program, subject to applicable law. 10.3 Calls, meetings and electronic communications may be recorded or retained for quality, evidence, training and compliance where lawful. 10.4 Email, CRM, portals, messaging applications and electronic signatures are valid communication and execution methods. 10.5 The Client must maintain current contact details and check communications regularly.',
    '10. البيانات والتسجيلات والمراسلات',
    '10.1 يفوض العميل الشركة بجمع المعلومات الشخصية والتحقق منها وتخزينها ومعالجتها ونقلها عبر الحدود بالقدر المعقول اللازم للخدمات والامتثال وضبط الجودة ومنع الاحتيال والتواصل. 10.2 يجوز مشاركة المعلومات مع الشركات التابعة والجهات والممثلين المهنيين ومقدمي الخدمات والأطراف الثالثة المشاركة في البرنامج المختار، مع مراعاة القانون واجب التطبيق. 10.3 يجوز تسجيل أو الاحتفاظ بالمكالمات والاجتماعات والمراسلات الإلكترونية لأغراض الجودة والإثبات والتدريب والامتثال حيث يسمح القانون. 10.4 تعد رسائل البريد ونظام إدارة علاقات العملاء والبوابات وتطبيقات المراسلة والتوقيع الإلكتروني وسائل صحيحة للتواصل والتنفيذ. 10.5 يجب على العميل تحديث بيانات الاتصال ومراجعة المراسلات بانتظام.'],
  ['11. INTELLECTUAL PROPERTY AND USE RESTRICTIONS',
    'The Company retains ownership of its templates, checklists, strategies, reports, methods, training materials, forms and internal know-how. The Client receives a limited personal licence to use final deliverables solely for the selected matter and shall not copy, publish, sell, reverse engineer or provide them to competitors or unrelated third parties, except to authorities or professional advisers for the selected matter.',
    '11. الملكية الفكرية وقيود الاستخدام',
    'تحتفظ الشركة بملكية قوالبها وقوائمها واستراتيجياتها وتقاريرها وأساليبها ومواد التدريب والنماذج والمعرفة الداخلية. ويمنح العميل ترخيصًا شخصيًا محدودًا لاستخدام المخرجات النهائية حصرًا للمعاملة المختارة، ولا يجوز نسخها أو نشرها أو بيعها أو تحليلها أو تقديمها للمنافسين أو لأطراف غير مرتبطة، باستثناء الجهات أو المستشارين المهنيين لأغراض المعاملة المختارة.'],
  ['12. FORCE MAJEURE',
    'The Company is not liable for delay or failure caused by events beyond reasonable control, including governmental action, policy change, war, civil disturbance, epidemic, natural disaster, labour disruption, cyberattack, telecommunications failure, platform outage, closure or third-party default. Deadlines and performance periods shall be extended reasonably, and the Company may adjust the delivery method or terminate impracticable Services without liability for unperformed external outcomes.',
    '12. القوة القاهرة',
    'لا تتحمل الشركة مسؤولية التأخير أو عدم التنفيذ الناشئ عن أحداث خارجة عن السيطرة المعقولة، ومنها إجراءات الحكومات وتغير السياسات والحرب والاضطرابات والأوبئة والكوارث وتعطل العمل والهجمات الإلكترونية وفشل الاتصالات وتعطل المنصات والإغلاق وإخفاق الأطراف الثالثة. وتمدد المدد بصورة معقولة، ويجوز للشركة تعديل طريقة التنفيذ أو إنهاء الخدمات المتعذر تنفيذها دون مسؤولية عن النتائج الخارجية غير المنجزة.'],
  ['13. COMPLAINTS AND DISPUTE PROCESS',
    '13.1 Before commencing proceedings, the Client must submit a detailed written complaint and allow the Company 30 days to investigate and propose a resolution. 13.2 The parties shall first attempt good-faith negotiation and, where mutually agreed, mediation. 13.3 Nothing prevents urgent interim relief or a complaint to a regulator where permitted. 13.4 The Client shall not publish knowingly false or misleading statements and the Company may protect its lawful rights and reputation.',
    '13. الشكاوى وتسوية المنازعات',
    '13.1 قبل بدء أي إجراء، يجب على العميل تقديم شكوى كتابية مفصلة ومنح الشركة 30 يومًا للتحقيق واقتراح الحل. 13.2 يحاول الطرفان أولاً التفاوض بحسن نية، وعند الاتفاق المتبادل، الوساطة. 13.3 لا يمنع ذلك طلب تدبير وقتي عاجل أو تقديم شكوى إلى جهة تنظيمية حيث يسمح القانون. 13.4 لا يجوز للعميل نشر بيانات يعلم أنها كاذبة أو مضللة، وللشركة حماية حقوقها وسمعتها المشروعة.'],
  // Clause 14 is plain court jurisdiction — this branch's PDF has no
  // arbitration clause, unlike the Abu Dhabi/Dubai branches.
  ['14. GOVERNING LAW AND JURISDICTION',
    'This Agreement is governed by the laws of the State of Kuwait. Subject to mandatory consumer or regulatory jurisdiction, the parties submit to the exclusive jurisdiction of the competent courts of Kuwait. The English and Arabic texts are intended to correspond; if an inconsistency cannot be reconciled, the language given priority by mandatory local law shall prevail, otherwise the English text shall be used for contractual interpretation.',
    '14. القانون واجب التطبيق والاختصاص',
    'تخضع هذه الاتفاقية لقوانين دولة الكويت. ومع مراعاة أي اختصاص إلزامي للمستهلك أو الجهات التنظيمية، ينعقد الاختصاص الحصري لمحاكم دولة الكويت المختصة. يقصد أن يتطابق النصان الإنجليزي والعربي؛ وإذا تعذر التوفيق بينهما، تسود اللغة التي يمنحها القانون المحلي الإلزامي الأولوية، وإلا فيستخدم النص الإنجليزي لتفسير العقد.'],
  ['15. GENERAL PROVISIONS',
    '15.1 This Agreement is the entire agreement and replaces prior discussions concerning the selected Services. 15.2 No oral amendment is effective; amendments may be made electronically in writing. 15.3 Invalid provisions shall be severed or narrowed to the minimum extent necessary, and the remainder remains effective. 15.4 Failure to enforce a right is not a waiver. 15.5 The Company may assign or subcontract operational obligations to an affiliate or qualified provider; the Client may not assign without written consent. 15.6 Clauses concerning fees, refunds, liability, indemnity, data, intellectual property, disputes and governing law survive termination. 15.7 The Client confirms understanding the commercial allocation of risk and voluntarily accepts these terms.',
    '15. أحكام عامة',
    '15.1 تمثل هذه الاتفاقية كامل الاتفاق وتحل محل المناقشات السابقة المتعلقة بالخدمات المختارة. 15.2 لا يكون أي تعديل شفهي نافذًا، ويجوز إجراء التعديلات كتابة بوسائل إلكترونية. 15.3 إذا بطل حكم يفصل أو يضيق بالحد الأدنى اللازم وتظل بقية الأحكام نافذة. 15.4 عدم إنفاذ حق لا يعد تنازلًا عنه. 15.5 يجوز للشركة إحالة أو إسناد الالتزامات التشغيلية إلى شركة تابعة أو مزود مؤهل، ولا يجوز للعميل الإحالة دون موافقة كتابية. 15.6 تظل أحكام الرسوم والاسترداد والمسؤولية والتعويض والبيانات والملكية الفكرية والمنازعات والقانون سارية بعد الإنهاء. 15.7 يقر العميل بفهم التوزيع التجاري للمخاطر وقبوله هذه الشروط طوعًا.'],
];

const textOrBlank = (value: unknown, fallback = '________________') => {
  const result = String(value ?? '').trim();
  return result || fallback;
};

const box = (
  englishTitle: string,
  english: string,
  arabicTitle: string,
  arabic: string,
  className = '',
) => `<section class="agreement-box ${className}">
  <div class="language english" lang="en">
    ${englishTitle ? `<h2>${esc(englishTitle)}</h2>` : ''}
    <p>${esc(english)}</p>
  </div>
  <div class="language arabic" dir="rtl" lang="ar">
    ${arabicTitle ? `<h2>${esc(arabicTitle)}</h2>` : ''}
    <p>${esc(arabic)}</p>
  </div>
</section>`;

const feeTitle = () => `<section class="agreement-box fee-title" aria-label="Fee summary">
  <div class="language english"><h2>FEE SUMMARY</h2></div>
  <div class="language arabic" dir="rtl" lang="ar"><h2>ملخص الرسوم</h2></div>
</section>`;

const bilingualHeader = (COMPANY: ReturnType<typeof resolveCompany>) => `<header class="agreement-header">
  <div class="header-column header-english">
    <div class="company-name">${esc(COMPANY.nameEn.toUpperCase())}</div>
    <div>${esc(COMPANY.regulatoryEn)}</div>
    <div>Address: ${esc(COMPANY.addressEn)}</div>
    <div class="agreement-name">AGREEMENT FOR ADVISORY SERVICES — UNIFIED TERMS (ALL SERVICE PROGRAMS)</div>
  </div>
  <div class="header-column header-arabic" dir="rtl" lang="ar">
    <div class="company-name">${esc(COMPANY.nameAr)}</div>
    <div>${esc(COMPANY.regulatoryAr)}</div>
    <div>العنوان: ${esc(COMPANY.addressAr)}</div>
    <div class="agreement-name">اتفاقية الخدمات الاستشارية — شروط موحدة لجميع برامج الخدمات</div>
  </div>
</header>`;

const getAgreementDetails = (v: KuwaitAgreementValues) => {
  const paymentMilestonesEn = `Initial payment ${textOrBlank(v.initialPayment, '________')} upon signing; second payment ${textOrBlank(v.secondPayment, '________')} per Annexure A.`;
  const paymentMilestonesAr = `الدفعة الأولى ${textOrBlank(v.initialPayment, '________')} عند التوقيع؛ الدفعة الثانية ${textOrBlank(v.secondPayment, '________')} وفق الملحق أ.`;
  return {
    agreementNumber: textOrBlank(v.agreementNumber),
    agreementDate: textOrBlank(v.agreementDate),
    serviceProgram: textOrBlank(v.serviceProgram),
    programCode: textOrBlank(v.programCode),
    programTermSchedule: textOrBlank(v.programTermSchedule, '6 / 12 / 18 months'),
    destinationCountry: textOrBlank(v.destinationCountry),
    clientName: textOrBlank(v.clientName),
    clientEmail: textOrBlank(v.clientEmail),
    clientPhone: textOrBlank(v.clientPhone),
    nationality: textOrBlank(v.nationality),
    passportNumber: textOrBlank(v.passportNumber),
    idNumber: textOrBlank(v.idNumber),
    clientId: textOrBlank(v.clientId),
    totalAmount: textOrBlank(v.totalAmount),
    initialPayment: textOrBlank(v.initialPayment),
    secondPayment: textOrBlank(v.secondPayment),
    includedDeliverables: textOrBlank(v.includedDeliverables),
    expressExclusions: textOrBlank(v.expressExclusions),
    specialTerms: textOrBlank(v.specialTerms),
    currencyCode: v.currencyCode || DEFAULTS.currencyCode,
    paymentMilestonesEn,
    paymentMilestonesAr,
  };
};

export function renderKuwaitAgreement(v: KuwaitAgreementValues): string {
  const d = getAgreementDetails(v);
  const COMPANY = resolveCompany(v);

  const clauseHtml = clauses.map(([englishTitle, english, arabicTitle, arabic]) =>
    box(englishTitle, english, arabicTitle, arabic, 'clause')).join('');

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
      --english-bg: #ffffff;
      --arabic-bg: #ffffff;
      --heading-en: #111111;
      --heading-ar: #111111;
      --accent-en: #111111;
      --accent-ar: #111111;
      --important: #111111;
      --page-width: 8.5in;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.35px;
      line-height: 1.35;
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
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1.5px solid var(--border);
      border-radius: 0;
      overflow: hidden;
      margin: 0 0 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .header-column {
      min-width: 0;
      padding: 10px 12px;
    }

    .header-english {
      background: #ffffff;
      border-right: 1.5px solid var(--border);
      text-align: left;
    }

    .header-arabic {
      background: #ffffff;
      text-align: right;
      font-family: Tahoma, Arial, sans-serif;
      font-size: 10.7px;
      line-height: 1.5;
    }

    .header-column > div {
      margin: 0 0 3px;
    }

    .company-name {
      font-weight: 700;
      font-size: 12px;
    }

    .agreement-name {
      margin-top: 6px !important;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: .3px;
    }

    .contact-line {
      white-space: pre-line;
    }

    /* ── generic bilingual boxes ── */
    .agreement-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1.5px solid var(--border);
      border-radius: 0;
      overflow: hidden;
      margin: 0 0 8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .language {
      min-width: 0;
      padding: 9px 11px;
    }

    .language.english {
      background: var(--english-bg);
      border-right: 1.5px solid var(--border);
      text-align: left;
    }

    .language.arabic {
      background: var(--arabic-bg);
      text-align: right;
      font-family: Tahoma, Arial, sans-serif;
      font-size: 10.6px;
      line-height: 1.55;
    }

    .language h2 {
      margin: 0 0 5px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .3px;
    }

    .language.english h2 { color: var(--heading-en); }
    .language.arabic h2 { color: var(--heading-ar); }

    .fee-title .language {
      padding: 7px 11px;
    }

    .fee-title .language h2 {
      margin: 0;
    }

    .fee-content {
      margin-bottom: 12px;
    }

    .fee-content .english p,
    .fee-content .arabic p {
      font-size: 10.9px;
      line-height: 1.4;
    }

    .fee-content .important,
    .fee-content .renewal-fee {
      font-weight: 700;
    }

    .fee-content .important { color: var(--important); }
    .fee-content .renewal-fee { color: var(--accent-en); }
    .fee-content .arabic .renewal-fee { color: var(--accent-ar); }

    .fee-summary-group {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .clause {
      margin-bottom: 8px;
    }

    .annexure-title-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-top: 12px;
      border: 1.5px solid var(--border);
      border-radius: 0;
      overflow: hidden;
    }

    .annexure-title {
      padding: 8px 11px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .4px;
      color: #111111;
    }

    .annexure-title-pair > div:first-child {
      background: #e5e7eb;
      border-right: 1.5px solid var(--border);
    }

    .annexure-title-pair > div:last-child {
      background: #e5e7eb;
      text-align: right;
      font-family: Tahoma, Arial, sans-serif;
      text-transform: none;
      letter-spacing: 0;
    }

    .signature .language {
      min-height: 130px;
    }

    .signature p {
      line-height: 1.7;
    }

    .language p {
      margin: 0;
      white-space: pre-line;
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
      .agreement-header,
      .agreement-box,
      .annexure-title-pair {
        grid-template-columns: 1fr;
      }
      .header-english,
      .english,
      .annexure-title-pair > div:first-child {
        border-right: 0;
        border-bottom: 1.5px solid var(--border);
      }
      .contact-line { white-space: normal; }
      .print-footer { white-space: normal; }
    }
  </style>
</head>
<body>
  <main class="document">
    ${bilingualHeader(COMPANY)}

    ${box(
      'AGREEMENT DETAILS',
      `Agreement No.: ${d.agreementNumber}
Date: ${d.agreementDate}
Service Program / CRM Selection: ${d.serviceProgram}
Program Code / Service Term (see Program Term Schedule): ${d.programCode}
Destination Country: ${d.destinationCountry}
The Client's details, program, scope, fees and milestones may be populated dynamically from the Company's CRM and incorporated into Annexure A.`,
      'تفاصيل الاتفاقية',
      `رقم الاتفاقية: ${d.agreementNumber}
التاريخ: ${d.agreementDate}
برنامج الخدمة / اختيار النظام: ${d.serviceProgram}
رمز البرنامج / مدة الخدمة (وفق جدول مدد البرامج): ${d.programCode}
دولة المقصد: ${d.destinationCountry}
يجوز إدخال بيانات العميل والبرنامج والنطاق والرسوم ومراحل الدفع بصورة ديناميكية من نظام إدارة علاقات العملاء وإدراجها في الملحق أ.`,
    )}

    ${box(
      'SERVICE PROVIDER',
      [
        `${COMPANY.nameEn}`,
        COMPANY.regulatoryEn,
        `Address: ${COMPANY.addressEn}`,
        '',
        'CLIENT DETAILS',
        `Full Name: ${d.clientName}`,
        `Nationality: ${d.nationality}`,
        `Passport No.: ${d.passportNumber}`,
        `${COMPANY.idLabelEn}: ${d.idNumber}`,
        `Phone: ${d.clientPhone}`,
        `Email: ${d.clientEmail}`,
      ].join('\n'),
      'مقدم الخدمة',
      [
        `${COMPANY.nameAr}`,
        COMPANY.regulatoryAr,
        `العنوان: ${COMPANY.addressAr}`,
        '',
        'بيانات العميل',
        `الاسم الكامل: ${d.clientName}`,
        `الجنسية: ${d.nationality}`,
        `رقم جواز السفر: ${d.passportNumber}`,
        `${COMPANY.idLabelAr}: ${d.idNumber}`,
        `الهاتف: ${d.clientPhone}`,
        `البريد الإلكتروني: ${d.clientEmail}`,
      ].join('\n'),
      'service-client',
    )}

    <div class="fee-summary-group">
    ${feeTitle()}

    <section class="agreement-box fee-content">
      <div class="language english">
        <p>Total Advisory Fee (${esc(d.currencyCode)}): ${esc(d.totalAmount)}
Initial Payment (${esc(d.currencyCode)}): ${esc(d.initialPayment)}
Subsequent Payment(s): ${esc(d.secondPayment)}
Government / Authority / Third-Party Fees: NOT INCLUDED unless Annexure A states otherwise.</p>
        <p class="important">IMPORTANT — NON-REFUNDABLE: Fees are non-refundable except only as expressly provided in Clause 6 and subject to mandatory applicable law.</p>
        <p class="renewal-fee">AGREEMENT RENEWAL FEE: A flat, non-refundable fee of ${COMPANY.renewalFeeUsd} (or its ${esc(d.currencyCode)} equivalent) applies per renewal term, regardless of the Program's Service Term — see Clause 7.5.</p>
      </div>
      <div class="language arabic" dir="rtl" lang="ar">
        <p>إجمالي رسوم الخدمات الاستشارية (${esc(d.currencyCode)}): ${esc(d.totalAmount)}
الدفعة الأولى (${esc(d.currencyCode)}): ${esc(d.initialPayment)}
الدفعات اللاحقة: ${esc(d.secondPayment)}
رسوم الحكومة / الجهات / الأطراف الثالثة: غير مشمولة ما لم ينص الملحق أ على خلاف ذلك.</p>
        <p class="important">هام — غير قابل للاسترداد: الرسوم غير قابلة للاسترداد إلا وفق ما يرد صراحة في البند 6 ومع مراعاة الأحكام القانونية الإلزامية.</p>
        <p class="renewal-fee">رسوم تجديد الاتفاقية: تُستحق رسوم ثابتة وغير قابلة للاسترداد قدرها ${COMPANY.renewalFeeUsdAr} (أو ما يعادلها بالدينار الكويتي) عن كل مدة تجديد، بصرف النظر عن مدة البرنامج — انظر البند 7.5.</p>
      </div>
    </section>
    </div>

    ${box(
      'PREAMBLE',
      `This Agreement is entered into between the Company identified above and the Client. The Company provides advisory, administrative, documentation, education, global mobility, immigration-process support, business, career and related services for multiple programs and destination countries. The Company does not control any government, embassy, consulate, regulator, employer, educational institution, assessment body or other third party. The Client confirms having had a full opportunity to read this Agreement, ask questions and obtain independent legal advice before signing.`,
      'تمهيد',
      `أُبرمت هذه الاتفاقية بين الشركة المبينة أعلاه والعميل. تقدم الشركة خدمات استشارية وإدارية وخدمات مستندات وتعليم وتنقل عالمي ودعم إجراءات الهجرة والأعمال والمسار المهني والخدمات ذات الصلة لبرامج ودول مقصد متعددة. ولا تسيطر الشركة على أي حكومة أو سفارة أو قنصلية أو جهة تنظيمية أو صاحب عمل أو مؤسسة تعليمية أو هيئة تقييم أو أي طرف ثالث. ويقر العميل بأنه أتيحت له فرصة كاملة لقراءة هذه الاتفاقية وطرح الأسئلة والحصول على مشورة قانونية مستقلة قبل التوقيع.`,
    )}

    ${clauseHtml}

    <div class="annexure-title-pair">
      <div class="annexure-title">ANNEXURE A </div>
      <div class="annexure-title" dir="rtl" lang="ar">الملحق أ — الاختيار الديناميكي للخدمة</div>
    </div>

    ${box(
      '',
      `CRM Client ID: ${d.clientId}
Selected Service / Program (Program Code): ${d.programCode}
Program Term Schedule reference (6 / 12 / 18 months): ${d.programTermSchedule}
Destination: ${d.destinationCountry}
Included Deliverables: ${d.includedDeliverables}
Express Exclusions: ${d.expressExclusions}
Total Advisory Fee (${d.currencyCode}): ${d.totalAmount}
Payment Milestones: ${d.paymentMilestonesEn}
Agreement Renewal Fee: ${COMPANY.renewalFeeUsd} flat (or ${d.currencyCode} equivalent) per renewal term
Special terms, if any: ${d.specialTerms}
Client initials: ________`,
      '',
      `رقم العميل في النظام: ${d.clientId}
الخدمة / البرنامج المختار (رمز البرنامج): ${d.programCode}
مرجع جدول مدد البرامج (6 / 12 / 18 شهرًا): ${d.programTermSchedule}
دولة المقصد: ${d.destinationCountry}
المخرجات المشمولة: ${d.includedDeliverables}
الاستثناءات الصريحة: ${d.expressExclusions}
إجمالي رسوم الخدمات الاستشارية (${d.currencyCode}): ${d.totalAmount}
مراحل الدفع: ${d.paymentMilestonesAr}
رسوم تجديد الاتفاقية: 500 دولار أمريكي ثابتة (أو ما يعادلها بـ${d.currencyCode}) عن كل مدة تجديد
الشروط الخاصة، إن وجدت: ${d.specialTerms}
أحرف العميل: ________`,
    )}

    ${box(
      'EXECUTION AND ACKNOWLEDGMENT',
      `The Client confirms that the Client has read and understood every page, has received or had access to a copy, accepts electronic execution, understands that no outcome is guaranteed, and accepts the refund and liability provisions.

Client
Name: ${d.clientName}
Signature: ________________________________
Date: ________________________________`,
      'التوقيع والإقرار',
      `يقر العميل بأنه قرأ وفهم كل صفحة، واستلم نسخة أو أتيحت له، ويقبل التوقيع الإلكتروني، ويفهم عدم ضمان أي نتيجة، ويقبل أحكام الاسترداد وتحديد المسؤولية.

العميل
الاسم: ${d.clientName}
التوقيع: ________________________________
التاريخ: ________________________________`,
      'signature',
    )}

    <footer class="print-footer">
      ${COMPANY.nameEn} - ${COMPANY.addressEn} - Client Signature Required on Every Page - Page <span class="page-number"></span>
    </footer>
  </main>
</body>
</html>`;
}
