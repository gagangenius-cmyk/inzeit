import { QueryTypes } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

export type ResolvedBranch = {
  id: number;
  region: number;
};

async function findBranchByInput(branchInput: string): Promise<ResolvedBranch | null> {
  const numericBranchId = Number.parseInt(branchInput, 10);

  if (Number.isFinite(numericBranchId) && numericBranchId > 0 && String(numericBranchId) === branchInput.trim()) {
    const rows = await sequelize.query<ResolvedBranch>(
      'SELECT id, region FROM crm_branch WHERE id = :branchId AND status = 1 LIMIT 1',
      {
        replacements: { branchId: numericBranchId },
        type: QueryTypes.SELECT,
      }
    );

    if (rows[0]) return rows[0];
  }

  const exactRows = await sequelize.query<ResolvedBranch>(
    `SELECT id, region
     FROM crm_branch
     WHERE status = 1 AND (LOWER(name) = LOWER(:branchName) OR LOWER(abbrv) = LOWER(:branchName))
     LIMIT 1`,
    {
      replacements: { branchName: branchInput },
      type: QueryTypes.SELECT,
    }
  );

  if (exactRows[0]) return exactRows[0];

  // Callers (live chat, web-to-leads) send the plain city/country the visitor
  // picked (e.g. "Kuwait", "Abu Dhabi"), not the branch's legal entity name —
  // none of the real branch names/abbreviations contain that city/country
  // text, so matching only against name/abbrv silently fails for every real
  // branch and previously fell through to the caller's hardcoded default.
  // `branch` holds the country (disambiguates Kuwait/Qatar/India, which each
  // have exactly one branch) and `address` holds the city (disambiguates
  // Dubai vs Abu Dhabi, which share the same country value).
  const geoRows = await sequelize.query<ResolvedBranch>(
    `SELECT id, region
     FROM crm_branch
     WHERE status = 1
       AND (
         LOWER(branch) = LOWER(:branchName)
         OR LOWER(address) LIKE LOWER(CONCAT('%', :branchName, '%'))
       )
     ORDER BY (LOWER(address) LIKE LOWER(CONCAT('%', :branchName, '%'))) DESC
     LIMIT 1`,
    {
      replacements: { branchName: branchInput },
      type: QueryTypes.SELECT,
    }
  );

  if (geoRows[0]) return geoRows[0];

  const partialRows = await sequelize.query<ResolvedBranch>(
    `SELECT id, region
     FROM crm_branch
     WHERE status = 1 AND LOWER(branch) LIKE LOWER(CONCAT('%', :branchName, '%'))
     LIMIT 1`,
    {
      replacements: { branchName: branchInput },
      type: QueryTypes.SELECT,
    }
  );

  return partialRows[0] || null;
}

// Tries `value` first, then each fallback in order (e.g. the visitor's resident
// country before a hardcoded default) — callers use this to prefer a weaker but
// present signal (ResidentCountry) over guessing, when Branch itself is missing
// or doesn't match a known branch.
export async function resolveBranchReference(value: unknown, ...fallbacks: string[]): Promise<ResolvedBranch | null> {
  const candidates = [String(value ?? '').trim(), ...fallbacks.map((f) => String(f ?? '').trim())];
  const tried = new Set<string>();

  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (!candidate || tried.has(key)) continue;
    tried.add(key);
    const branch = await findBranchByInput(candidate);
    if (branch) return branch;
  }

  return null;
}
