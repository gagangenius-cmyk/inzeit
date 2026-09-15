'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Download, Printer, Eye, Edit2, X, User, RefreshCw, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── BRAND ─────────────────────────────────────────────────────────────────
const G  = '#14273F';   // deep navy (table headers, left cells)
const G2 = '#1F3B63';   // primary compass navy (subject lines, badges, highlights)
const GL = '#FBEAE0';   // light peach bg (alternating table rows)
const GD = '#0D1B2E';   // deepest navy (total row, darkest accents)
const TX = '#2D2D2D';
const GR = '#666666';
const RD = '#D9331E';

// ── BRANCH ────────────────────────────────────────────────────────────────
const BRANCH = {
  name:    'Global Navigator LLC FZ',
  address: '606, Latifa Towers, Trade Center 1, Sheikh Zayed Road, Dubai, UAE',
  phone:   '+971 55 947 6936',
  email:   'info@navigatorglobals.com',
  web:     'www.navigatorglobals.com',
};

// ── TEMPLATES ─────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'T-01', name: 'Promotion Letter',        confidential: false },
  { id: 'T-02', name: 'Offer Letter',            confidential: false },
  { id: 'T-03', name: 'Experience / NOC Letter', confidential: false },
  { id: 'T-04', name: 'Warning Letter',          confidential: true  },
  { id: 'T-05', name: 'Salary Certificate',      confidential: false },
  { id: 'T-06', name: 'Termination Letter',      confidential: true  },
  { id: 'T-07', name: 'Reference Letter',        confidential: false },
  { id: 'T-08', name: 'Internal Memo',           confidential: false },
];

// ── HELPERS ───────────────────────────────────────────────────────────────
function ordinal(ds: string): string {
  if (!ds) return '';
  const d = new Date(ds);
  if (isNaN(d.getTime())) return ds;
  const day = d.getDate();
  const sfx = [11,12,13].includes(day) ? 'th' : ['st','nd','rd'][((day%10)-1)] || 'th';
  return `${day}<sup>${sfx}</sup> ${d.toLocaleString('en-GB',{month:'long'})} ${d.getFullYear()}`;
}
function ordinalPlain(ds: string): string {
  if (!ds) return '';
  const d = new Date(ds);
  if (isNaN(d.getTime())) return ds;
  const day = d.getDate();
  const sfx = [11,12,13].includes(day) ? 'th' : ['st','nd','rd'][((day%10)-1)] || 'th';
  return `${day}${sfx} ${d.toLocaleString('en-GB',{month:'long'})} ${d.getFullYear()}`;
}
function aed(v: string | number, currency = 'AED'): string {
  const n = Number(v);
  if (!n) return '';
  return `${currency} ${n.toLocaleString()}`;
}

// ── LOGO SVG (starburst) ───────────────────────────────────────────────
const LOGO_SVG = `<svg width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
  <polygon points="27,2 31,10 39,7 38,16 47,18 43,26 50,32 43,36 46,45 37,45 34,53 27,48 20,53 17,45 8,45 11,36 4,32 11,26 7,18 16,16 15,7 23,10" fill="${G2}"/>
  <text x="27" y="30" text-anchor="middle" fill="white" font-family="Arial" font-weight="700" font-size="7">GN</text>
</svg>`;

// ── TABLE BUILDER ─────────────────────────────────────────────────────────
function buildTable(rows: {label:string;value:string;highlight?:boolean}[]): string {
  const filled = rows.filter(r => r.label && r.value);
  if (!filled.length) return '';
  return `
<table style="width:100%;border-collapse:collapse;margin:16px 0 14px;">
  ${filled.map((r, i) => {
    const bgLeft  = i % 2 === 0 ? GD : G;
    const bgRight = i % 2 === 0 ? GL : '#fff';
    const valColor = r.highlight ? G2 : TX;
    const valWeight = r.highlight ? '700' : '400';
    return `<tr>
      <td style="padding:8px 12px;width:38%;background:${bgLeft};color:#fff;font-weight:600;font-size:10pt;border:none;">${r.label}</td>
      <td style="padding:8px 12px;background:${bgRight};color:${valColor};font-weight:${valWeight};font-size:10pt;border:none;">${r.value}</td>
    </tr>`;
  }).join('')}
</table>`;
}

// ── LETTER HTML BUILDER ────────────────────────────────────────────────────
interface LetterData {
  refNo: string; date: string; toName: string; toTitle?: string; toLine2?: string;
  subject: string; subjectColor?: string;
  salutation: string; opening?: string; openingColor?: string;
  body: string;
  tableRows: {label:string;value:string;highlight?:boolean}[];
  closing: string;
  confidential?: boolean;
  acknowledgement?: string;
  templateId: string;
}

function buildLetterHTML(d: LetterData): string {
  const dateStr = ordinal(d.date || new Date().toISOString().slice(0,10));
  const subColor = d.subjectColor || G2;

  const ackHtml = d.acknowledgement ? `
  <div style="margin-top:28px;">
    <div style="font-size:10pt;font-weight:700;margin-bottom:8px;">${d.acknowledgement}</div>
    <div style="margin-bottom:16px;font-size:10pt;">Signature: <span style="display:inline-block;width:160px;border-bottom:1px solid ${TX};"></span> &nbsp;&nbsp; Date: <span style="display:inline-block;width:100px;border-bottom:1px solid ${TX};"></span></div>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${d.templateId} – ${d.toName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;color:${TX};font-size:10pt;line-height:1.65;background:#fff;}
  @page{size:A4;margin:0;}
  @media print{.no-print{display:none!important;}}
  sup{font-size:7pt;vertical-align:super;}
</style>
</head>
<body>
<!-- TOP GREEN BAR -->
<div style="background:${G2};height:5pt;width:100%;"></div>

<!-- LETTERHEAD -->
<div style="padding:18px 68pt 0 68pt;position:relative;">
  <!-- Logo -->
  <div style="position:absolute;top:14px;right:68pt;">${LOGO_SVG}</div>
  <!-- Company title -->
  <div style="margin-right:70px;">
    <div style="font-size:14pt;font-weight:700;color:${G2};letter-spacing:0.02em;">GLOBAL NAVIGATOR LLC FZ</div>
    <div style="font-size:8.5pt;color:${GR};margin-top:2px;">Ph: ${BRANCH.phone} &nbsp;|&nbsp; ${BRANCH.email} &nbsp;|&nbsp; ${BRANCH.web}</div>
  </div>
  <!-- Green rule -->
  <div style="border-top:1.5pt solid ${G2};margin:7px 0 0;margin-right:70px;"></div>
  <!-- Ref -->
  <div style="font-size:8.5pt;color:${GR};margin-top:5px;">Ref: ${d.refNo}</div>
</div>

<!-- BODY -->
<div style="padding:22px 68pt 100px 68pt;">
  ${d.confidential ? `<div style="font-size:9pt;font-weight:700;color:${RD};letter-spacing:2px;margin-bottom:12px;">CONFIDENTIAL</div>` : ''}

  <!-- Date -->
  <div style="margin-bottom:18px;font-size:10pt;">Date: ${dateStr}</div>

  <!-- Addressee -->
  <div style="margin-bottom:16px;">
    <div style="font-size:10pt;color:${GR};">To,</div>
    <div style="font-size:10pt;font-weight:700;margin-top:2px;">${d.toName}</div>
    ${d.toTitle  ? `<div style="font-size:10pt;">${d.toTitle}</div>` : ''}
    ${d.toLine2  ? `<div style="font-size:10pt;">${d.toLine2}</div>` : ''}
  </div>

  <!-- Subject -->
  <div style="margin-bottom:14px;font-size:10pt;">
    <strong>Subject:</strong> <strong style="color:${subColor};">${d.subject}</strong>
  </div>

  <!-- Salutation -->
  <div style="margin-bottom:10px;font-size:10pt;font-weight:700;">${d.salutation}</div>

  <!-- Opening -->
  ${d.opening ? `<div style="margin-bottom:10px;font-size:10pt;font-weight:700;color:${d.openingColor||G2};">${d.opening}</div>` : ''}

  <!-- Body -->
  <div style="font-size:10pt;text-align:justify;white-space:pre-wrap;margin-bottom:4px;">${d.body}</div>

  <!-- Table -->
  ${buildTable(d.tableRows)}

  <!-- Closing paragraph (after table) -->
  ${d.templateId === 'T-01' ? `<div style="font-size:10pt;text-align:justify;margin-bottom:10px;">All other terms and conditions of your employment contract shall remain unchanged and continue to govern your engagement with Global Navigator LLC FZ.</div>
  <div style="font-size:10pt;text-align:justify;">We have every confidence in your abilities and look forward to your continued leadership and dedication in this new role. Please accept our warmest congratulations and best wishes for your continued success with Global Navigator LLC FZ.</div>` : ''}

  ${d.templateId === 'T-02' ? `<div style="font-size:10pt;text-align:justify;">This offer is conditional upon the successful completion of reference checks, submission of original educational and identification documents, and a satisfactory medical examination where required.</div>
  <div style="font-size:10pt;text-align:justify;margin-top:10px;">Kindly sign and return the duplicate copy of this letter as your acceptance of the offer within <strong>five (5) working days</strong> from the date hereof. Failure to do so may result in the withdrawal of this offer.</div>` : ''}

  ${d.templateId === 'T-03' ? `<div style="font-size:10pt;text-align:justify;margin-top:4px;"><strong>No Objection:</strong> Global Navigator LLC FZ has no objection to <strong>${d.toName}</strong> seeking employment elsewhere or for any visa/immigration purpose as required.</div>` : ''}

  ${d.templateId === 'T-05' ? `<div style="font-size:10pt;text-align:justify;margin-top:4px;">This certificate is issued at the request of the employee for <strong>[bank / visa / personal]</strong> purposes and should not be construed as a guarantee of continued employment.</div>` : ''}

  <!-- Ack block (Warning) -->
  ${ackHtml}

  <!-- Closing & Signature -->
  <div style="margin-top:28px;">
    <div style="font-size:10pt;">${d.closing}</div>
    <div style="font-size:10pt;font-weight:700;margin-top:4px;">For Global Navigator LLC FZ</div>
    <div style="font-size:9.5pt;color:${GR};">Dubai Branch</div>
    <div style="margin-top:44px;width:200px;border-bottom:1px solid ${TX};"></div>
    <div style="font-size:9.5pt;color:${GR};margin-top:3px;">Authorised Signatory</div>
    ${['T-03','T-05','T-06','T-07'].includes(d.templateId) ? `<div style="font-size:10pt;font-weight:700;">Global Navigator LLC FZ</div>` : ''}
  </div>
</div>

<!-- FOOTER (fixed at bottom) -->
<div style="position:fixed;bottom:0;left:0;right:0;padding:0 68pt 10px;">
  <div style="border-top:1.5pt solid ${G2};margin-bottom:5px;"></div>
  <div style="font-size:7.5pt;color:${GR};text-align:center;">${BRANCH.address}</div>
  <div style="font-size:7.5pt;color:${G2};text-align:center;margin-top:2px;">Ph: ${BRANCH.phone} &nbsp;|&nbsp; ${BRANCH.email} &nbsp;|&nbsp; ${BRANCH.web}</div>
</div>
</body>
</html>`;
}

// ── GENERATE LETTER DATA FROM FORM ────────────────────────────────────────
interface FormState {
  templateId: string; refSeq: string; date: string;
  empName: string; empTitle: string; empDesignation: string;
  empEmail: string;
  empDepartment: string; empBranch: string;
  passportNo: string; emiratesId: string; nationality: string;
  doj: string; dol: string; pronoun: string;
  // T-01 Promotion
  newDesignation: string; effectiveDate: string; newSalary: string;
  // T-02 Offer
  reportingTo: string; startDate: string; offerSalary: string; probation: string;
  // T-04 Warning
  incidentDate: string; natureOfIssue: string; prevWarning: string; warningDesc: string; labourArticle: string;
  // T-05 Salary cert
  basicSalary: string; housing: string; transport: string; totalSalary: string; certPurpose: string;
  // T-06 Termination
  terminationReason: string; noticePeriod: string; terminationClause: string;
  // T-07 Reference
  referenceBody: string;
  // T-08 Memo
  memoFrom: string; memoTo: string; memoBody: string;
  subject: string;
}

const defaultForm: FormState = {
  templateId: 'T-01', refSeq: '001', date: new Date().toISOString().slice(0,10),
  empName: '', empTitle: 'Mr. / Ms.', empDesignation: '', empEmail: '', empDepartment: '', empBranch: 'Dubai Branch',
  passportNo: '', emiratesId: '', nationality: '', doj: '', dol: '', pronoun: 'he/she',
  newDesignation: '', effectiveDate: '', newSalary: '',
  reportingTo: '', startDate: '', offerSalary: '', probation: '90 Days',
  incidentDate: '', natureOfIssue: '', prevWarning: 'None', warningDesc: '', labourArticle: '',
  basicSalary: '', housing: '', transport: '', totalSalary: '', certPurpose: 'bank / visa / personal',
  terminationReason: '', noticePeriod: '30 days', terminationClause: 'Federal Decree-Law No. 33 of 2021',
  referenceBody: '', memoFrom: '', memoTo: 'All Staff', memoBody: '', subject: '',
};

function buildLetterData(f: FormState, currency = 'AED'): LetterData {
  const year = new Date().getFullYear();
  const refNo = `GN/DB/HR/${year}/${f.refSeq.padStart(3,'0')}`;
  const he   = f.pronoun === 'she' ? 'she' : f.pronoun === 'they' ? 'they' : 'he';
  const him  = f.pronoun === 'she' ? 'her' : f.pronoun === 'they' ? 'them' : 'him';
  const his  = f.pronoun === 'she' ? 'her' : f.pronoun === 'they' ? 'their' : 'his';

  switch (f.templateId) {
    case 'T-01': return {
      refNo, date: f.date, templateId: 'T-01',
      toName: `${f.empTitle} ${f.empName}`.trim(), toLine2: f.empBranch,
      subject: `Promotion to ${f.newDesignation || '[New Designation]'} – ${f.empBranch}`,
      salutation: `Dear ${f.empTitle} ${f.empName},`,
      opening: 'Congratulations!', openingColor: G2,
      body: `We are delighted to inform you that, in recognition of your outstanding performance, commitment, and valuable contributions to the growth of Global Navigator LLC FZ, you have been promoted to the position of <strong>${f.newDesignation || '[New Designation]'}</strong>.`,
      tableRows: [
        { label: 'Effective Date',    value: ordinalPlain(f.effectiveDate) || '[Date]' },
        { label: 'New Designation',   value: f.newDesignation || '[Designation]' },
        { label: 'Monthly Salary',    value: aed(f.newSalary, currency) || '[Amount]', highlight: true },
      ],
      closing: 'Yours sincerely,',
    };

    case 'T-02': return {
      refNo, date: f.date, templateId: 'T-02',
      toName: `Mr. / Ms. ${f.empName || '[Full Name]'}`.trim(),
      toTitle: f.empDesignation || '[Designation]',
      subject: `Letter of Offer – ${f.empDesignation || '[Designation]'}, Global Navigator LLC FZ`,
      salutation: `Dear ${f.empName || '[Name]'},`,
      body: `We are pleased to extend this offer of employment to you for the position of <strong>${f.empDesignation || '[Designation]'}</strong> at Global Navigator LLC FZ, Dubai Branch, subject to the terms and conditions set forth below.`,
      tableRows: [
        { label: 'Position',         value: f.empDesignation || '[Designation]' },
        { label: 'Department',       value: f.empDepartment  || '[Department]'  },
        { label: 'Reporting To',     value: f.reportingTo    || '[Reporting Manager]' },
        { label: 'Start Date',       value: ordinalPlain(f.startDate) || '[Date]' },
        { label: 'Monthly Salary',   value: aed(f.offerSalary, currency) || '[Amount]', highlight: true },
        { label: 'Probation Period', value: f.probation || '90 Days', highlight: true },
      ],
      closing: 'Yours sincerely,',
    };

    case 'T-03': {
      // Passport No. is optional - omit the clause entirely rather than
      // leaving a "[Passport No.]" placeholder in a real, generated letter.
      const passportClause = f.passportNo?.trim() ? `, holder of Passport No. <strong>${f.passportNo}</strong>,` : ',';
      // With an end date, this reads as a combined Relieving cum Experience
      // Letter (confirms service period, that the employee has been formally
      // relieved of duties, and dues settled). Without one (still employed),
      // it reads as a plain Experience Letter - "relieved" wouldn't be true yet.
      const isRelieved = Boolean(f.dol?.trim());
      const verb = f.pronoun === 'they' ? 'have' : 'has';
      const heCap = he.charAt(0).toUpperCase() + he.slice(1);
      return {
        refNo, date: f.date, templateId: 'T-03',
        toName: 'To Whom It May Concern',
        subject: isRelieved ? 'Relieving cum Experience Certificate' : 'Experience Certificate',
        subjectColor: G2,
        salutation: 'To Whom It May Concern,',
        body: isRelieved
          ? `This is to certify that <strong>${f.empName || '[Full Name]'}</strong>${passportClause} was employed with Global Navigator LLC FZ, Dubai Branch, as a <strong>${f.empDesignation || '[Designation]'}</strong> from <strong>${ordinalPlain(f.doj) || '[Start Date]'}</strong> to <strong>${ordinalPlain(f.dol)}</strong>.\n\nThis is further to certify that ${heCap} has been duly relieved of ${his} duties and responsibilities with effect from <strong>${ordinalPlain(f.dol)}</strong>, and all dues payable to ${him} by the Company as on the date of relieving have been settled in full. ${heCap} has no dues outstanding against the Company as of the date of this letter.\n\nDuring the tenure of employment, ${he} ${verb} demonstrated professionalism, dedication, and a high standard of performance. We wish ${him} every success in ${his} future endeavours.`
          : `This is to certify that <strong>${f.empName || '[Full Name]'}</strong>${passportClause} has been employed with Global Navigator LLC FZ, Dubai Branch, as a <strong>${f.empDesignation || '[Designation]'}</strong> since <strong>${ordinalPlain(f.doj) || '[Start Date]'}</strong> and continues to be in active service with the Company.\n\nDuring the tenure of employment, ${he} ${verb} demonstrated professionalism, dedication, and a high standard of performance. We wish ${him} every success in ${his} future endeavours.`,
        tableRows: [
          { label: 'Employee Name',     value: f.empName        || '[Full Name]'  },
          { label: 'Designation',       value: f.empDesignation || '[Designation]'},
          { label: 'Department',        value: f.empDepartment  || '[Department]' },
          { label: 'Period of Service', value: `${ordinalPlain(f.doj)||'[Start]'} – ${ordinalPlain(f.dol)||'Present'}` },
          { label: 'Monthly Salary',    value: aed(f.basicSalary, currency) || '[Amount]', highlight: true },
        ],
        closing: 'Yours faithfully,',
      };
    }

    case 'T-04': return {
      refNo, date: f.date, templateId: 'T-04',
      toName: f.empName || '[Full Name]', toTitle: f.empDesignation, toLine2: 'Dubai Branch',
      subject: `Written Warning – ${f.natureOfIssue || '[Nature of Misconduct / Performance Issue]'}`,
      subjectColor: RD,
      salutation: `Dear ${f.empName || '[Name]'},`,
      opening: 'WRITTEN WARNING', openingColor: RD,
      body: `This letter constitutes a formal written warning in accordance with the Company's disciplinary policy and the UAE Labour Law. This warning is issued in relation to the following matter:`,
      tableRows: [
        { label: 'Incident Date',     value: ordinalPlain(f.incidentDate) || '[Date of Incident]' },
        { label: 'Nature of Issue',   value: f.natureOfIssue || '[Brief description of misconduct / underperformance]' },
        { label: 'Previous Warning',  value: f.prevWarning || 'None', highlight: true },
      ],
      confidential: true,
      acknowledgement: `Employee Acknowledgement:\nI, ${f.empName || '[Full Name]'}, acknowledge receipt of this Warning Letter dated ${ordinalPlain(f.date)}.`,
      closing: 'Yours sincerely,',
    };

    case 'T-05': return {
      refNo, date: f.date, templateId: 'T-05',
      toName: 'To Whom It May Concern',
      subject: 'Salary Certificate',
      subjectColor: G2,
      salutation: 'To Whom It May Concern,',
      body: `This is to certify that <strong>${f.empName || '[Full Name]'}</strong>, holder of Passport No. <strong>${f.passportNo || '[Passport No.]'}</strong> / Emirates ID No. <strong>${f.emiratesId || '[EID No.]'}</strong>, is currently employed with Global Navigator LLC FZ as a <strong>${f.empDesignation || '[Designation]'}</strong> and has been in our employment since <strong>${ordinalPlain(f.doj) || '[Start Date]'}</strong>.`,
      tableRows: [
        { label: 'Employee Name',        value: f.empName        || '[Full Name]'   },
        { label: 'Designation',          value: f.empDesignation || '[Designation]' },
        { label: 'Date of Joining',      value: ordinalPlain(f.doj) || '[Start Date]' },
        { label: 'Basic Salary',         value: aed(f.basicSalary, currency) || '[Amount]'    },
        { label: 'Housing Allowance',    value: aed(f.housing, currency)    || '[Amount]'     },
        { label: 'Transport Allowance',  value: aed(f.transport, currency)  || '[Amount]'     },
        { label: 'Total Monthly Salary', value: aed(f.totalSalary||f.basicSalary, currency) || '[Total Amount]', highlight: true },
      ],
      closing: 'Yours faithfully,',
    };

    case 'T-06': return {
      refNo, date: f.date, templateId: 'T-06',
      toName: f.empName || '[Full Name]', toTitle: f.empDesignation, toLine2: 'Dubai Branch',
      subject: 'Termination of Employment',
      subjectColor: RD,
      salutation: `Dear ${f.empName || '[Name]'},`,
      body: `We regret to inform you that your employment with Global Navigator LLC FZ is terminated effective <strong>${ordinalPlain(f.dol) || '[Last Working Day]'}</strong>, in accordance with <strong>${f.terminationClause || 'Federal Decree-Law No. 33 of 2021'}</strong>.\n\nThe reasons for this decision are as follows: ${f.terminationReason || '[State grounds for termination]'}.\n\nYou are entitled to receive your end-of-service gratuity, any accrued but unused annual leave, and any other dues as per your employment contract and applicable law. Please return all company property, access cards, and equipment by your last working day.`,
      tableRows: [
        { label: 'Employee Name',   value: f.empName        || '[Full Name]'    },
        { label: 'Designation',     value: f.empDesignation || '[Designation]'  },
        { label: 'Department',      value: f.empDepartment  || '[Department]'   },
        { label: 'Date of Joining', value: ordinalPlain(f.doj) || '[Date]'      },
        { label: 'Last Working Day',value: ordinalPlain(f.dol) || '[Date]'      },
        { label: 'Notice Period',   value: f.noticePeriod || '30 days'          },
      ],
      confidential: true,
      acknowledgement: `Employee Acknowledgement:\nI, ${f.empName || '[Full Name]'}, acknowledge receipt of this Termination Letter dated ${ordinalPlain(f.date)}.`,
      closing: 'Yours sincerely,',
    };

    case 'T-07': return {
      refNo, date: f.date, templateId: 'T-07',
      toName: 'To Whom It May Concern',
      subject: `Reference Letter – ${f.empName || '[Employee Name]'}`,
      subjectColor: G2,
      salutation: 'To Whom It May Concern,',
      body: `It is our pleasure to provide this reference letter for <strong>${f.empName || '[Full Name]'}</strong>, who served as <strong>${f.empDesignation || '[Designation]'}</strong> in the <strong>${f.empDepartment || '[Department]'}</strong> Department at Global Navigator LLC FZ from <strong>${ordinalPlain(f.doj)||'[Start Date]'}</strong> to <strong>${ordinalPlain(f.dol)||'[End Date]'}</strong>.\n\nDuring ${his} tenure, ${f.empName || '[Name]'} consistently demonstrated professionalism, reliability, and a strong work ethic. ${f.referenceBody || 'We found [him/her] to be a dedicated and valuable team member.'}\n\nWe are confident that ${f.empName || '[Name]'} would be a valuable asset to any organisation and recommend ${him} without reservation.`,
      tableRows: [
        { label: 'Employee Name', value: f.empName        || '[Full Name]'    },
        { label: 'Designation',   value: f.empDesignation || '[Designation]'  },
        { label: 'Department',    value: f.empDepartment  || '[Department]'   },
        { label: 'Period',        value: `${ordinalPlain(f.doj)||'[Start]'} – ${ordinalPlain(f.dol)||'[End]'}` },
      ],
      closing: 'Yours faithfully,',
    };

    case 'T-08': return {
      refNo, date: f.date, templateId: 'T-08',
      toName: f.memoTo || 'All Staff',
      subject: f.subject || 'Internal Memo',
      salutation: 'Dear Team,',
      body: f.memoBody || '[Memo content]',
      tableRows: [
        { label: 'From',    value: f.memoFrom || '[Issuing Manager]' },
        { label: 'To',      value: f.memoTo   || 'All Staff'         },
        { label: 'Date',    value: ordinalPlain(f.date)               },
        { label: 'Subject', value: f.subject  || '[Subject]'          },
      ],
      closing: 'Regards,',
    };

    default: return { refNo, date: f.date, templateId: f.templateId, toName: '', subject: '', salutation: '', body: '', tableRows: [], closing: '' };
  }
}

// ── EMPLOYEE SEARCH ────────────────────────────────────────────────────────
interface EmployeeResult {
  id: number; name: string; email: string; mobile: string;
  ppNo: string; EID: string; doj: string; dol: string; nationality: string;
  gender: string; role?: { name: string }; branch?: number;
  crm_role?: { name: string }; CrmRole?: { name: string };
}

function useEmployeeSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/employees?search=${encodeURIComponent(q)}&limit=10&status=1`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setResults(data.employees || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return { query, setQuery, results, loading };
}

// ── FIELD HELPER ──────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = 'w-full px-2.5 py-1.5 border border-green-200 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500';
const selectCls = inputCls;

// ── MAIN MODULE ────────────────────────────────────────────────────────────
export default function DMCLettersModule() {
  const { currencyCode } = useAuth();
  const [form, setForm]           = useState<FormState>(defaultForm);
  const [mode, setMode]           = useState<'form' | 'preview'>('form');
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing]   = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [history, setHistory]     = useState<{id:number;templateId:string;name:string;date:string;refNo:string}[]>([]);

  useEffect(() => {
    fetch('/api/admin/hr/letter-log')
      .then((res) => res.json())
      .then((json) => {
        setHistory((json.history || []).map((row: any) => ({
          id: row.id,
          templateId: row.template_id,
          name: row.employee_name,
          date: row.letter_date || row.created_at,
          refNo: row.ref_number,
        })));
      })
      .catch(() => setHistory([]));
  }, []);
  const previewRef                = useRef<HTMLDivElement>(null);
  const emp                       = useEmployeeSearch();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const fillFromEmployee = (e: EmployeeResult) => {
    const designation = (e.crm_role as any)?.name || (e.CrmRole as any)?.name || (e.role as any)?.name || '';
    const gender = (e.gender || '').toLowerCase();
    const pronoun = gender === 'female' ? 'she' : gender === 'male' ? 'he' : 'they';
    const title = gender === 'female' ? 'Ms.' : 'Mr.';
    setForm(p => ({
      ...p,
      empName:       e.name        || '',
      empTitle:      title,
      empDesignation:designation,
      empEmail:      e.email       || '',
      passportNo:    e.ppNo        || '',
      emiratesId:    e.EID         || '',
      nationality:   e.nationality || '',
      doj: e.doj ? new Date(e.doj).toISOString().slice(0,10) : '',
      dol: e.dol ? e.dol.slice(0,10) : '',
      pronoun,
    }));
    emp.setQuery(e.name);
    emp.setQuery(''); // clear dropdown
  };

  const letterData = buildLetterData(form, currencyCode);

  const printLetter = () => {
    const html = buildLetterHTML(letterData);
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
    addToHistory();
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;
      const el = previewRef.current;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * W) / canvas.width;
      let left = imgH;
      let pos  = 0;
      pdf.addImage(imgData, 'JPEG', 0, pos, W, imgH);
      left -= H;
      while (left > 0) { pos -= H; pdf.addPage(); pdf.addImage(imgData, 'JPEG', 0, pos, W, imgH); left -= H; }
      const filename = `GN_${form.templateId}_${(form.empName || 'Letter').replace(/\s+/g,'_')}_${form.date}.pdf`;
      pdf.save(filename);
      addToHistory();
    } catch (e) {
      window.toast.error('PDF generation failed. Use Print instead.');
    } finally { setGenerating(false); }
  };

  const emailToEmployee = async () => {
    const to = (emailRecipient || form.empEmail || '').trim();
    if (!to) { window.toast.error('Enter a recipient email address first.'); return; }
    if (!previewRef.current) return;
    setEmailing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF       = (await import('jspdf')).default;
      const el = previewRef.current;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * W) / canvas.width;
      let left = imgH;
      let pos  = 0;
      pdf.addImage(imgData, 'JPEG', 0, pos, W, imgH);
      left -= H;
      while (left > 0) { pos -= H; pdf.addPage(); pdf.addImage(imgData, 'JPEG', 0, pos, W, imgH); left -= H; }
      const filename = `GN_${form.templateId}_${(form.empName || 'Letter').replace(/\s+/g,'_')}_${form.date}.pdf`;
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      const res = await fetch('/api/admin/hr/letters/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject: `${currentTemplate?.name || 'Letter'} - ${form.empName || ''}`.trim(),
          fileName: filename,
          pdfBase64,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Send failed');
      window.toast.success(`Emailed to ${to}`);
      addToHistory();
    } catch (e) {
      window.toast.error(e instanceof Error ? e.message : 'Failed to email letter');
    } finally { setEmailing(false); }
  };

  const addToHistory = () => {
    const refNo = `GN/DB/HR/${new Date().getFullYear()}/${form.refSeq.padStart(3,'0')}`;
    setHistory(p => [{ id: Date.now(), templateId: form.templateId, name: form.empName || '—', date: form.date, refNo }, ...p.slice(0,49)]);
    fetch('/api/admin/hr/letter-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: form.templateId,
        templateName: currentTemplate?.name || '',
        employeeName: form.empName || '—',
        refNumber: refNo,
        letterDate: form.date || null,
      }),
    }).catch(() => {});
  };

  const currentTemplate = TEMPLATES.find(t => t.id === form.templateId)!;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print styles */}
      <style>{`@media print { body * { visibility: hidden !important; } #letter-print-target, #letter-print-target * { visibility: visible !important; } #letter-print-target { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>

      {/* ── HEADER ── */}
      <div style={{ background: G2 }} className="px-6 py-3 flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-base">GLOBAL NAVIGATOR LLC FZ</div>
          <div className="text-green-100 text-xs">HR Letters & Correspondence Module</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode(mode === 'form' ? 'preview' : 'form')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg">
            {mode === 'form' ? <Eye className="w-3.5 h-3.5"/> : <Edit2 className="w-3.5 h-3.5"/>}
            {mode === 'form' ? 'Preview' : 'Edit'}
          </button>
          <button onClick={printLetter}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg">
            <Printer className="w-3.5 h-3.5"/> Print
          </button>
          <button onClick={downloadPDF} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-800 text-xs font-semibold rounded-lg hover:bg-green-50 disabled:opacity-60">
            <Download className="w-3.5 h-3.5"/>
            {generating ? 'Generating…' : 'Download PDF'}
          </button>
          <input
            type="email"
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
            placeholder={form.empEmail || 'employee@email.com'}
            className="w-44 rounded-lg border-0 bg-white/90 px-2 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
          />
          <button onClick={emailToEmployee} disabled={emailing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-800 text-xs font-semibold rounded-lg hover:bg-green-50 disabled:opacity-60">
            <Mail className="w-3.5 h-3.5"/>
            {emailing ? 'Sending…' : 'Email to Employee'}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-52px)]">

        {/* ── SIDEBAR ── */}
        <div className="w-52 bg-white border-r border-green-100 flex-shrink-0 overflow-y-auto">
          <div className="p-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Letter Type</div>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { set('templateId', t.id); setMode('form'); }}
                className={`w-full text-left px-2.5 py-2 rounded-lg mb-1 text-xs transition-colors ${
                  form.templateId === t.id
                    ? 'text-white font-bold'
                    : 'text-gray-700 hover:bg-green-50'
                }`}
                style={form.templateId === t.id ? { background: G } : {}}>
                <span className="opacity-60 mr-1">{t.id}</span>
                {t.name}
                {t.confidential && <span className="ml-1 px-1 text-[9px] font-bold rounded" style={{ background: RD, color: '#fff' }}>CONF</span>}
              </button>
            ))}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="p-3 border-t border-green-100 mt-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent</div>
              {history.slice(0,5).map(h => (
                <div key={h.id} className="text-[10px] text-gray-500 mb-1.5">
                  <div className="font-medium text-gray-700">{h.templateId} · {h.name}</div>
                  <div>{h.refNo}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── MAIN ── */}
        <div className="flex-1 overflow-y-auto">
          <div className={`grid gap-4 p-4 h-full ${mode === 'form' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>

            {/* ── FORM PANEL ── */}
            {mode === 'form' && (
              <div className="space-y-3">

                {/* Template badge */}
                <div className="rounded-lg px-4 py-2.5 flex items-center justify-between" style={{ background: G }}>
                  <div>
                    <span className="text-white font-bold text-sm">{currentTemplate.id} — {currentTemplate.name}</span>
                    {currentTemplate.confidential && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: RD, color: '#fff' }}>CONFIDENTIAL</span>}
                  </div>
                </div>

                {/* Employee Search */}
                <div className="bg-white rounded-lg border border-green-100 p-3">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">Employee Lookup (auto-fill)</div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                    <input type="text" placeholder="Search employee by name or email…"
                      value={emp.query}
                      onChange={e => emp.setQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-green-200 rounded text-sm focus:ring-1 focus:ring-green-500"/>
                    {emp.loading && <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin"/>}
                  </div>
                  {emp.results.length > 0 && (
                    <div className="border border-green-100 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-sm">
                      {emp.results.map(e => (
                        <button key={e.id} onClick={() => fillFromEmployee(e)}
                          className="w-full text-left px-3 py-2 hover:bg-green-50 border-b border-green-50 last:border-0">
                          <div className="text-sm font-medium text-gray-800">{e.name}</div>
                          <div className="text-xs text-gray-500">{(e.crm_role as any)?.name || (e.CrmRole as any)?.name || ''} · {e.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reference & Date */}
                <div className="bg-white rounded-lg border border-green-100 p-3">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">Reference & Date</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ref Sequence No.">
                      <input type="text" value={form.refSeq} onChange={e => set('refSeq', e.target.value)} className={inputCls} placeholder="001"/>
                    </Field>
                    <Field label="Date">
                      <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls}/>
                    </Field>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500">
                    Ref: GN/DB/HR/{new Date().getFullYear()}/{form.refSeq.padStart(3,'0')}
                  </div>
                </div>

                {/* Addressee */}
                <div className="bg-white rounded-lg border border-green-100 p-3">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">Employee Details</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Title">
                      <SearchableSelect value={form.empTitle} onChange={e => set('empTitle', e.target.value)} className={selectCls}>
                        <option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option>
                      </SearchableSelect>
                    </Field>
                    <Field label="Full Name">
                      <input type="text" value={form.empName} onChange={e => set('empName', e.target.value)} className={inputCls} placeholder="Employee full name"/>
                    </Field>
                    <Field label="Current Designation">
                      <input type="text" value={form.empDesignation} onChange={e => set('empDesignation', e.target.value)} className={inputCls}/>
                    </Field>
                    <Field label="Department">
                      <input type="text" value={form.empDepartment} onChange={e => set('empDepartment', e.target.value)} className={inputCls}/>
                    </Field>
                    <Field label="Pronoun">
                      <SearchableSelect value={form.pronoun} onChange={e => set('pronoun', e.target.value)} className={selectCls}>
                        <option value="he">he / him / his</option>
                        <option value="she">she / her / her</option>
                        <option value="they">they / them / their</option>
                      </SearchableSelect>
                    </Field>
                    <Field label="Branch">
                      <input type="text" value={form.empBranch} onChange={e => set('empBranch', e.target.value)} className={inputCls}/>
                    </Field>
                  </div>
                </div>

                {/* ── TEMPLATE-SPECIFIC FIELDS ── */}
                <div className="bg-white rounded-lg border border-green-100 p-3">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-2">Letter Details</div>

                  {/* T-01: Promotion */}
                  {form.templateId === 'T-01' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="New Designation"><input type="text" value={form.newDesignation} onChange={e=>set('newDesignation',e.target.value)} className={inputCls}/></Field>
                      <Field label="Effective Date"><input type="date" value={form.effectiveDate} onChange={e=>set('effectiveDate',e.target.value)} className={inputCls}/></Field>
                      <Field label="Monthly Salary (AED)"><input type="number" value={form.newSalary} onChange={e=>set('newSalary',e.target.value)} className={inputCls} placeholder="e.g. 11500"/></Field>
                    </div>
                  )}

                  {/* T-02: Offer */}
                  {form.templateId === 'T-02' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Reporting To"><input type="text" value={form.reportingTo} onChange={e=>set('reportingTo',e.target.value)} className={inputCls}/></Field>
                      <Field label="Start Date"><input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className={inputCls}/></Field>
                      <Field label="Monthly Salary (AED)"><input type="number" value={form.offerSalary} onChange={e=>set('offerSalary',e.target.value)} className={inputCls}/></Field>
                      <Field label="Probation Period"><input type="text" value={form.probation} onChange={e=>set('probation',e.target.value)} className={inputCls}/></Field>
                    </div>
                  )}

                  {/* T-03: Exp/NOC */}
                  {form.templateId === 'T-03' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Passport No. (optional)"><input type="text" value={form.passportNo} onChange={e=>set('passportNo',e.target.value)} className={inputCls}/></Field>
                      <Field label="Date of Joining"><input type="date" value={form.doj} onChange={e=>set('doj',e.target.value)} className={inputCls}/></Field>
                      <Field label="End Date (blank = Present)"><input type="date" value={form.dol} onChange={e=>set('dol',e.target.value)} className={inputCls}/></Field>
                      <Field label="Monthly Salary (AED)"><input type="number" value={form.basicSalary} onChange={e=>set('basicSalary',e.target.value)} className={inputCls}/></Field>
                    </div>
                  )}

                  {/* T-04: Warning */}
                  {form.templateId === 'T-04' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Incident Date"><input type="date" value={form.incidentDate} onChange={e=>set('incidentDate',e.target.value)} className={inputCls}/></Field>
                      <Field label="Previous Warning">
                        <SearchableSelect value={form.prevWarning} onChange={e=>set('prevWarning',e.target.value)} className={selectCls}>
                          <option>None</option><option>Verbal Warning</option><option>First Written Warning</option><option>Second Written Warning</option>
                        </SearchableSelect>
                      </Field>
                      <div className="col-span-2">
                        <Field label="Nature of Issue / Misconduct">
                          <textarea rows={2} value={form.natureOfIssue} onChange={e=>set('natureOfIssue',e.target.value)} className={inputCls + ' resize-none'} placeholder="Describe the conduct or performance issue…"/>
                        </Field>
                      </div>
                      <div className="col-span-2">
                        <Field label="UAE Labour Law Article (if applicable)">
                          <input type="text" value={form.labourArticle} onChange={e=>set('labourArticle',e.target.value)} className={inputCls} placeholder="e.g. Article 44"/>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* T-05: Salary Cert */}
                  {form.templateId === 'T-05' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Passport No."><input type="text" value={form.passportNo} onChange={e=>set('passportNo',e.target.value)} className={inputCls}/></Field>
                      <Field label="Emirates ID No."><input type="text" value={form.emiratesId} onChange={e=>set('emiratesId',e.target.value)} className={inputCls}/></Field>
                      <Field label="Date of Joining"><input type="date" value={form.doj} onChange={e=>set('doj',e.target.value)} className={inputCls}/></Field>
                      <Field label="Basic Salary (AED)"><input type="number" value={form.basicSalary} onChange={e=>set('basicSalary',e.target.value)} className={inputCls}/></Field>
                      <Field label="Housing Allowance (AED)"><input type="number" value={form.housing} onChange={e=>set('housing',e.target.value)} className={inputCls}/></Field>
                      <Field label="Transport Allowance (AED)"><input type="number" value={form.transport} onChange={e=>set('transport',e.target.value)} className={inputCls}/></Field>
                      <Field label="Total Monthly Salary (AED)"><input type="number" value={form.totalSalary} onChange={e=>set('totalSalary',e.target.value)} className={inputCls}/></Field>
                      <Field label="Purpose"><input type="text" value={form.certPurpose} onChange={e=>set('certPurpose',e.target.value)} className={inputCls} placeholder="bank / visa / personal"/></Field>
                    </div>
                  )}

                  {/* T-06: Termination */}
                  {form.templateId === 'T-06' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Date of Joining"><input type="date" value={form.doj} onChange={e=>set('doj',e.target.value)} className={inputCls}/></Field>
                      <Field label="Last Working Day"><input type="date" value={form.dol} onChange={e=>set('dol',e.target.value)} className={inputCls}/></Field>
                      <Field label="Notice Period"><input type="text" value={form.noticePeriod} onChange={e=>set('noticePeriod',e.target.value)} className={inputCls}/></Field>
                      <Field label="Law Clause"><input type="text" value={form.terminationClause} onChange={e=>set('terminationClause',e.target.value)} className={inputCls}/></Field>
                      <div className="col-span-2">
                        <Field label="Termination Reason">
                          <textarea rows={3} value={form.terminationReason} onChange={e=>set('terminationReason',e.target.value)} className={inputCls+' resize-none'}/>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* T-07: Reference */}
                  {form.templateId === 'T-07' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Date of Joining"><input type="date" value={form.doj} onChange={e=>set('doj',e.target.value)} className={inputCls}/></Field>
                      <Field label="Last Working Day"><input type="date" value={form.dol} onChange={e=>set('dol',e.target.value)} className={inputCls}/></Field>
                      <div className="col-span-2">
                        <Field label="Reference Comments">
                          <textarea rows={3} value={form.referenceBody} onChange={e=>set('referenceBody',e.target.value)} className={inputCls+' resize-none'} placeholder="Specific achievements, qualities…"/>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* T-08: Memo */}
                  {form.templateId === 'T-08' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="From (Manager Name)"><input type="text" value={form.memoFrom} onChange={e=>set('memoFrom',e.target.value)} className={inputCls}/></Field>
                      <Field label="To"><input type="text" value={form.memoTo} onChange={e=>set('memoTo',e.target.value)} className={inputCls}/></Field>
                      <Field label="Subject"><input type="text" value={form.subject} onChange={e=>set('subject',e.target.value)} className={inputCls}/></Field>
                      <div className="col-span-2">
                        <Field label="Memo Content">
                          <textarea rows={5} value={form.memoBody} onChange={e=>set('memoBody',e.target.value)} className={inputCls+' resize-none'}/>
                        </Field>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => setMode('preview')}
                  className="w-full py-2.5 text-white text-sm font-semibold rounded-lg hover:opacity-90"
                  style={{ background: G }}>
                  <Eye className="w-4 h-4 inline mr-1.5"/>Preview Letter
                </button>
              </div>
            )}

            {/* ── PREVIEW PANEL (A4 scaled) ── */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[794px] bg-white shadow-xl rounded-lg overflow-hidden">
                <div id="letter-print-target" ref={previewRef}>
                  <LetterPreview data={letterData}/>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── LETTER PREVIEW COMPONENT (mirrors the HTML output, rendered in DOM) ────
function LetterPreview({ data }: { data: LetterData }) {
  const branch = BRANCH;
  const subColor = data.subjectColor || G2;

  const TableRows = () => {
    const filled = data.tableRows.filter(r => r.label && r.value);
    if (!filled.length) return null;
    return (
      <table style={{ width:'100%', borderCollapse:'collapse', margin:'14px 0' }}>
        <tbody>
          {filled.map((r,i) => (
            <tr key={i}>
              <td style={{ padding:'8px 12px', width:'38%', background: i%2===0 ? GD : G, color:'#fff', fontWeight:600, fontSize:'10pt' }}>{r.label}</td>
              <td style={{ padding:'8px 12px', background: i%2===0 ? GL : '#fff', color: r.highlight?G2:TX, fontWeight: r.highlight?700:400, fontSize:'10pt' }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const dateStr = data.date ? (() => {
    const d = new Date(data.date);
    const day = d.getDate();
    const sfx = [11,12,13].includes(day)?'th':['st','nd','rd'][((day%10)-1)]||'th';
    return `${day}${sfx} ${d.toLocaleString('en-GB',{month:'long'})} ${d.getFullYear()}`;
  })() : '';

  return (
    <div style={{ fontFamily:'Arial,Helvetica,sans-serif', color:TX, fontSize:'10pt', lineHeight:1.65, background:'#fff', minHeight:'1122px', position:'relative' }}>
      {/* Top bar */}
      <div style={{ background:G2, height:5, width:'100%' }}/>

      {/* Header */}
      <div style={{ padding:'16px 68pt 0', position:'relative' }}>
        {/* Logo */}
        <div style={{ position:'absolute', top:12, right:'68pt', width:52, height:52, background:G2, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
          <span style={{ color:'#fff', fontSize:11, fontWeight:700, lineHeight:1.1, textAlign:'center' }}>GN</span>
        </div>
        <div style={{ marginRight:70 }}>
          <div style={{ fontSize:'13.5pt', fontWeight:700, color:G2 }}>GLOBAL NAVIGATOR LLC FZ</div>
          <div style={{ fontSize:'8pt', color:GR, marginTop:2 }}>Ph: {branch.phone} &nbsp;|&nbsp; {branch.email} &nbsp;|&nbsp; {branch.web}</div>
        </div>
        <div style={{ borderTop:`1.5pt solid ${G2}`, marginTop:7, marginRight:70 }}/>
        <div style={{ fontSize:'8pt', color:GR, marginTop:4 }}>Ref: {data.refNo}</div>
      </div>

      {/* Body */}
      <div style={{ padding:'20px 68pt 110px' }}>
        {data.confidential && <div style={{ fontSize:'9pt', fontWeight:700, color:RD, letterSpacing:2, marginBottom:12 }}>CONFIDENTIAL</div>}

        <div style={{ marginBottom:16 }}>Date: {dateStr}</div>

        <div style={{ marginBottom:14 }}>
          <div style={{ color:GR }}>To,</div>
          <div style={{ fontWeight:700, marginTop:2 }}>{data.toName}</div>
          {data.toTitle  && <div>{data.toTitle}</div>}
          {data.toLine2  && <div>{data.toLine2}</div>}
        </div>

        <div style={{ marginBottom:14 }}>
          <strong>Subject:</strong> <strong style={{ color:subColor }}>{data.subject}</strong>
        </div>

        <div style={{ fontWeight:700, marginBottom:10 }}>{data.salutation}</div>

        {data.opening && <div style={{ fontWeight:700, color:data.openingColor||G2, marginBottom:10 }}>{data.opening}</div>}

        <div style={{ textAlign:'justify', whiteSpace:'pre-wrap', marginBottom:4 }} dangerouslySetInnerHTML={{ __html: data.body }}/>

        <TableRows/>

        {/* Post-table paragraphs */}
        {data.templateId === 'T-01' && <>
          <div style={{ textAlign:'justify', marginBottom:10 }}>All other terms and conditions of your employment contract shall remain unchanged and continue to govern your engagement with Global Navigator LLC FZ.</div>
          <div style={{ textAlign:'justify' }}>We have every confidence in your abilities and look forward to your continued leadership and dedication in this new role. Please accept our warmest congratulations and best wishes for your continued success with Global Navigator LLC FZ.</div>
        </>}
        {data.templateId === 'T-02' && <>
          <div style={{ textAlign:'justify', marginBottom:10 }}>This offer is conditional upon the successful completion of reference checks, submission of original educational and identification documents, and a satisfactory medical examination where required.</div>
          <div style={{ textAlign:'justify' }}>Kindly sign and return the duplicate copy of this letter as your acceptance of the offer within <strong>five (5) working days</strong> from the date hereof. Failure to do so may result in the withdrawal of this offer.</div>
        </>}
        {data.templateId === 'T-03' && <div style={{ textAlign:'justify', marginTop:4 }}><strong>No Objection:</strong> Global Navigator LLC FZ has no objection to <strong>{data.toName}</strong> seeking employment elsewhere or for any visa/immigration purpose as required.</div>}
        {data.templateId === 'T-05' && <div style={{ textAlign:'justify', marginTop:4 }}>This certificate is issued at the request of the employee for <strong>[bank / visa / personal]</strong> purposes and should not be construed as a guarantee of continued employment.</div>}

        {/* Acknowledgement */}
        {data.acknowledgement && (
          <div style={{ marginTop:28 }}>
            <div style={{ fontWeight:700, marginBottom:8, whiteSpace:'pre-line' }}>{data.acknowledgement}</div>
            <div style={{ marginBottom:16 }}>
              Signature: <span style={{ display:'inline-block', width:160, borderBottom:`1px solid ${TX}` }}/> &nbsp;&nbsp; Date: <span style={{ display:'inline-block', width:100, borderBottom:`1px solid ${TX}` }}/>
            </div>
          </div>
        )}

        {/* Signature block */}
        <div style={{ marginTop:28 }}>
          <div>{data.closing}</div>
          <div style={{ fontWeight:700, marginTop:4 }}>For Global Navigator LLC FZ</div>
          <div style={{ color:GR, fontSize:'9.5pt' }}>Dubai Branch</div>
          <div style={{ marginTop:44, width:200, borderBottom:`1px solid ${TX}` }}/>
          <div style={{ color:GR, fontSize:'9.5pt', marginTop:3 }}>Authorised Signatory</div>
          {['T-03','T-05','T-06','T-07'].includes(data.templateId) && <div style={{ fontWeight:700 }}>Global Navigator LLC FZ</div>}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 68pt 10px' }}>
        <div style={{ borderTop:`1.5pt solid ${G2}`, marginBottom:5 }}/>
        <div style={{ fontSize:'7.5pt', color:GR, textAlign:'center' }}>{branch.address}</div>
        <div style={{ fontSize:'7.5pt', color:G2, textAlign:'center', marginTop:2 }}>Ph: {branch.phone} &nbsp;|&nbsp; {branch.email} &nbsp;|&nbsp; {branch.web}</div>
      </div>
    </div>
  );
}
