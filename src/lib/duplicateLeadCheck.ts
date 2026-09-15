import { QueryTypes } from 'sequelize';
import { sequelize } from './sequelize';
import { logLeadRemark } from './leadRemarks';

// Levenshtein edit distance (no external dependency needed for names this
// short) - used to catch typo'd spellings SOUNDEX's phonetic matching can
// miss (SOUNDEX groups by *sound*, e.g. "Smith"/"Smyth", not by keystroke
// distance, e.g. "Mohammed"/"Mohamed"/"Muhammad").
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prevDiag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j];
      prev[j] = a[i - 1] === b[j - 1]
        ? prevDiag
        : 1 + Math.min(prevDiag, prev[j], prev[j - 1]);
      prevDiag = temp;
    }
  }
  return prev[b.length];
}

// Similarity ratio in [0, 1] - 1 means identical, tolerant of short strings
// where a couple of edits would otherwise look like a huge relative distance.
function nameSimilarity(a: string, b: string): number {
  const normA = a.trim().toLowerCase();
  const normB = b.trim().toLowerCase();
  if (!normA || !normB) return 0;
  const maxLen = Math.max(normA.length, normB.length);
  return 1 - levenshtein(normA, normB) / maxLen;
}

export function normalizePhone(phone: string | null | undefined): string {
  return String(phone || '').replace(/\D/g, '');
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateCount: number;
}

export interface ExistingLeadMatch {
  id: number;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  status: string | null;
  branch: number | null;
  ownerName: string | null;
  ownerId: number | null;
}

// Flags a new lead as a duplicate when its phone or email matches an existing
// lead already in crm_forum_leads. duplicateCount = number of prior matches at
// creation time (the new lead itself isn't counted since it hasn't been
// inserted yet).
export async function checkForDuplicate({
  phone,
  email,
}: {
  phone?: string | null;
  email?: string | null;
}): Promise<DuplicateCheckResult> {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedPhone && !normalizedEmail) {
    return { isDuplicate: false, duplicateCount: 0 };
  }

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (normalizedPhone) {
    conditions.push(
      `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(phone,''), '+', ''), '-', ''), ' ', ''), '(', ''), ')', ''), '.', '') = :normalizedPhone`
    );
    replacements.normalizedPhone = normalizedPhone;
  }
  if (normalizedEmail) {
    conditions.push('LOWER(COALESCE(email,\'\')) = :normalizedEmail');
    replacements.normalizedEmail = normalizedEmail;
  }

  const [row] = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM crm_forum_leads WHERE ${conditions.join(' OR ')}`,
    { replacements, type: QueryTypes.SELECT }
  );

  const duplicateCount = Number(row?.total || 0);
  return { isDuplicate: duplicateCount > 0, duplicateCount };
}

// Same match as checkForDuplicate, but returns the existing lead's own
// details (and current owner) so the caller can point the requester at who
// to ask for a transfer, instead of just a yes/no flag.
export async function findExistingLead({
  phone,
  email,
}: {
  phone?: string | null;
  email?: string | null;
}): Promise<ExistingLeadMatch | null> {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedPhone && !normalizedEmail) return null;

  const conditions: string[] = [];
  const replacements: Record<string, unknown> = {};

  if (normalizedPhone) {
    conditions.push(
      `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(l.phone,''), '+', ''), '-', ''), ' ', ''), '(', ''), ')', ''), '.', '') = :normalizedPhone`
    );
    replacements.normalizedPhone = normalizedPhone;
  }
  if (normalizedEmail) {
    conditions.push('LOWER(COALESCE(l.email,\'\')) = :normalizedEmail');
    replacements.normalizedEmail = normalizedEmail;
  }

  const [row] = await sequelize.query<ExistingLeadMatch>(
    `SELECT l.id, l.fname, l.lname, l.email, l.phone, l.mobile, l.status, l.branch, e.name AS ownerName, l.assignTo AS ownerId
     FROM crm_forum_leads l
     LEFT JOIN crm_employee e ON e.id = l.assignTo
     WHERE ${conditions.join(' OR ')}
     ORDER BY l.id DESC
     LIMIT 1`,
    { replacements, type: QueryTypes.SELECT }
  );

  return row || null;
}

// Logs a remark on the existing lead noting that someone else tried to add it
// again, so its owner/managers can see the re-enquiry in the lead's activity
// history. Called from both the live check-as-you-type endpoint and the
// submit-time 409 block, so it de-dupes: skipped if the same actor already
// logged this exact lead within the last 10 minutes (debounced typing can
// otherwise trigger the lookup repeatedly for the same person).
export async function recordDuplicateLeadAttempt({
  existingLead,
  actorId,
  actorRole,
}: {
  existingLead: ExistingLeadMatch;
  actorId: number;
  actorRole?: string | null;
}): Promise<void> {
  try {
    const [recent] = await sequelize.query<{ id: number }>(
      `SELECT id FROM crm_remarks
       WHERE lead_id = :leadId AND actor_id = :actorId AND action = 'duplicate_detected'
         AND created_at > (NOW() - INTERVAL 10 MINUTE)
       LIMIT 1`,
      { replacements: { leadId: existingLead.id, actorId }, type: QueryTypes.SELECT }
    );
    if (recent) return;

    const [actorRow] = await sequelize.query<{ name: string }>(
      'SELECT name FROM crm_employee WHERE id = :id LIMIT 1',
      { replacements: { id: actorId }, type: QueryTypes.SELECT }
    );
    const actorLabel = `${actorRow?.name || `Employee #${actorId}`}${actorRole ? ` (${actorRole})` : ''}`;
    const ownerLabel = existingLead.ownerName
      ? `, currently owned by ${existingLead.ownerName}.`
      : ', and is currently unassigned.';

    await logLeadRemark({
      leadId: existingLead.id,
      action: 'duplicate_detected',
      remark: `A lead with this email or phone already exists (Lead #${existingLead.id})${ownerLabel} ${actorLabel} attempted to add this lead again.`,
      actorId,
      actorRole: actorRole ?? null,
    });
  } catch (error) {
    console.error('Failed to log duplicate-lead remark:', error);
  }
}

export interface FuzzyDuplicateMatch {
  id: number;
  fname: string | null;
  lname: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  nationality: string | null;
  status: string | null;
  ownerName: string | null;
  ownerId: number | null;
  similarity: number; // 0-1, name-similarity score that qualified this match
  matchReason: string;
}

const NAME_SIMILARITY_THRESHOLD = 0.72;

// checkForDuplicate/findExistingLead above are exact-match only (normalized
// phone or lowercased email) - real-world re-entries are often the same
// person with a typo'd email, a second phone number, or their name spelled
// slightly differently ("Mohammed" vs "Mohamed" vs "Muhammad"), which are
// invisible to an exact match. This is a SEPARATE, non-blocking check: it
// never prevents lead creation (unlike the 409 exact-duplicate block) - it
// only surfaces a "you might want to check this" warning for a human to act
// on, since fuzzy matching has real false-positive risk that an automatic
// hard block does not tolerate well.
//
// Strategy: MySQL SOUNDEX() narrows the candidate set cheaply (phonetic
// first-name match against the whole table), then JS-side Levenshtein
// similarity scores full name closeness on that much smaller set, and DOB/
// nationality corroboration (when available) both boosts confidence and is
// surfaced in matchReason so a reviewer knows *why* it was flagged.
export async function checkForFuzzyDuplicate({
  fname,
  lname,
  dob,
  nationality,
  excludeLeadId,
}: {
  fname?: string | null;
  lname?: string | null;
  dob?: string | null;
  nationality?: string | null;
  excludeLeadId?: number | null;
}): Promise<FuzzyDuplicateMatch[]> {
  const normalizedFname = String(fname || '').trim();
  const normalizedLname = String(lname || '').trim();
  if (!normalizedFname && !normalizedLname) return [];

  const conditions: string[] = ['SOUNDEX(l.fname) = SOUNDEX(:fname)'];
  const replacements: Record<string, unknown> = { fname: normalizedFname };
  if (excludeLeadId) {
    conditions.push('l.id != :excludeLeadId');
    replacements.excludeLeadId = excludeLeadId;
  }

  const candidates = await sequelize.query<{
    id: number; fname: string | null; lname: string | null; email: string | null;
    phone: string | null; dob: string | null; nationality: string | null; status: string | null;
    ownerName: string | null; ownerId: number | null;
  }>(
    `SELECT l.id, l.fname, l.lname, l.email, l.phone, l.dob, l.nationality, l.status,
            e.name AS ownerName, l.assignTo AS ownerId
     FROM crm_forum_leads l
     LEFT JOIN crm_employee e ON e.id = l.assignTo
     WHERE ${conditions.join(' AND ')}
     LIMIT 200`,
    { replacements, type: QueryTypes.SELECT }
  );

  const normalizedDob = dob ? String(dob).slice(0, 10) : null;
  const normalizedNationality = String(nationality || '').trim().toLowerCase();

  const matches: FuzzyDuplicateMatch[] = [];
  for (const candidate of candidates) {
    const fullNameA = `${normalizedFname} ${normalizedLname}`.trim();
    const fullNameB = `${candidate.fname || ''} ${candidate.lname || ''}`.trim();
    const similarity = nameSimilarity(fullNameA, fullNameB);
    if (similarity < NAME_SIMILARITY_THRESHOLD) continue;

    const reasons: string[] = [`name ${Math.round(similarity * 100)}% similar`];
    if (normalizedDob && candidate.dob && String(candidate.dob).slice(0, 10) === normalizedDob) {
      reasons.push('same date of birth');
    }
    if (normalizedNationality && String(candidate.nationality || '').trim().toLowerCase() === normalizedNationality) {
      reasons.push('same nationality');
    }

    matches.push({
      id: candidate.id,
      fname: candidate.fname,
      lname: candidate.lname,
      email: candidate.email,
      phone: candidate.phone,
      dob: candidate.dob,
      nationality: candidate.nationality,
      status: candidate.status,
      ownerName: candidate.ownerName,
      ownerId: candidate.ownerId,
      similarity,
      matchReason: reasons.join(', '),
    });
  }

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}
