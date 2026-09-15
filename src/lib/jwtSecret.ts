// Shared JWT signing-secret resolver for auth.ts (staff sessions) and
// clientAuth.ts (client-portal sessions) — previously each hardcoded its own
// `process.env.JWT_SECRET || 'fallback-secret'`, a known literal that lets
// anyone who can read the source forge a valid token for any user/role.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not set. Refusing to start in production with an insecure fallback — ' +
      'set JWT_SECRET in .env.production (see .env.example).'
    );
  }

  console.warn('[auth] JWT_SECRET is not set — using an insecure development-only fallback. Set JWT_SECRET in .env.local.');
  return 'dev-only-insecure-fallback-secret';
}
