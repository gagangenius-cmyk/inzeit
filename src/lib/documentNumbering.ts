// Shared AG/RC document numbering: {PREFIX}/{BRANCH}/{PRODUCT}/{DDMMYYYY}/{SEQ}
// e.g. AG/QTR/CAN/15072026/001 for an agreement, RC/QTR/CAN/15072026/001 for a receipt.
// The sequence is the row's own DB auto-increment id, zero-padded to 3 digits —
// genuinely unique and never needs its own counter table.

// Keyed by crm_branch.abbrv — the same stable branch key
// branchAgreementProfiles.ts uses to select agreement content (legal name,
// address, licence, governing law). Numbering used to derive its branch code
// independently via regex against branchName/branchAddress text, which could
// silently disagree with the abbrv-based content lookup for the same branch
// (e.g. an agreement's legal content correctly resolving to Abu Dhabi while
// its AG/.../ number still showed DXB) - keeping one shared source of truth
// here prevents that split.
const BRANCH_CODES_BY_ABBRV: Record<string, string> = {
  'dxb szr': 'DXB',
  auh: 'AUH',
  kwd: 'KWD',
  'doh old airport rd': 'QTR',
  hyd: 'IND',
};

const BRANCH_CODES: Array<{ code: string; test: (geo: string) => boolean }> = [
  { code: 'DXB', test: (geo) => /dubai/.test(geo) && !/abu\s*dhabi/.test(geo) },
  { code: 'AUH', test: (geo) => /abu\s*dhabi/.test(geo) },
  { code: 'QTR', test: (geo) => /qatar|doha/.test(geo) },
  { code: 'KWD', test: (geo) => /kuwait/.test(geo) },
  { code: 'IND', test: (geo) => /india|hyderabad/.test(geo) },
];

// Falls back to the first 3 letters of the branch name (e.g. an unlisted
// branch called "Muscat" becomes "MUS") rather than guessing at one of the
// five known codes above. branchAbbrv (when it matches a known branch) always
// wins over the name/address regex guess, since it's the authoritative key.
export function getBranchCode(
  branchName: string | null | undefined,
  branchAddress: string | null | undefined = '',
  branchAbbrv: string | null | undefined = '',
): string {
  const abbrvKey = String(branchAbbrv || '').trim().toLowerCase();
  if (abbrvKey && BRANCH_CODES_BY_ABBRV[abbrvKey]) return BRANCH_CODES_BY_ABBRV[abbrvKey];

  const geo = `${branchName || ''} ${branchAddress || ''}`.toLowerCase();
  const known = BRANCH_CODES.find(({ test }) => test(geo));
  if (known) return known.code;

  const letters = String(branchName || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (letters.slice(0, 3) || 'GEN').padEnd(3, 'X');
}

// First 3 letters of the product/service/program name, e.g. "Canada Skilled
// Migration" -> "CAN". Falls back to "GEN" (generic) when no name is given.
export function getProductCode(productName: string | null | undefined): string {
  const letters = String(productName || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (letters.slice(0, 3) || 'GEN').padEnd(3, 'X');
}

function formatDateDdMmYyyy(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

// `sequenceId` should be the row's own auto-increment id (assigned after
// insert) so every number is guaranteed unique without a separate counter.
export function formatDocumentNumber(params: {
  prefix: 'AG' | 'RC';
  branchName: string | null | undefined;
  branchAddress?: string | null | undefined;
  branchAbbrv?: string | null | undefined;
  product: string | null | undefined;
  date?: Date;
  sequenceId: number;
}): string {
  const branchCode = getBranchCode(params.branchName, params.branchAddress, params.branchAbbrv);
  const productCode = getProductCode(params.product);
  const dateStr = formatDateDdMmYyyy(params.date || new Date());
  const seq = String(params.sequenceId).padStart(3, '0');
  return `${params.prefix}/${branchCode}/${productCode}/${dateStr}/${seq}`;
}

function formatYyyyMm(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}${mm}`;
}

// Payment-receipt/tax-invoice numbering: RCP-{BRANCH}-{YYYYMM}-{SEQ}, e.g.
// RCP-AUH-202605-031. A distinct shape from formatDocumentNumber's AG/RC
// format above (no product code, YYYYMM instead of DDMMYYYY, `-` separator)
// to match the company's tax-invoice numbering convention. `sequenceId`
// follows the same convention as formatDocumentNumber — the row's own
// auto-increment id — so it stays unique without a counter table.
export function formatReceiptNumber(params: {
  branchName: string | null | undefined;
  branchAddress?: string | null | undefined;
  branchAbbrv?: string | null | undefined;
  date?: Date;
  sequenceId: number;
}): string {
  const branchCode = getBranchCode(params.branchName, params.branchAddress, params.branchAbbrv);
  const yyyymm = formatYyyyMm(params.date || new Date());
  const seq = String(params.sequenceId).padStart(3, '0');
  return `RCP-${branchCode}-${yyyymm}-${seq}`;
}
