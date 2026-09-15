// Minimal in-memory sliding-window rate limiter — appropriate for this app's
// single-process deployment (no Redis/cluster config anywhere in the repo).
// Used to throttle login attempts, which previously had no protection at all.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const attemptsByKey = new Map<string, number[]>();

function pruneOld(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((t) => now - t < windowMs);
}

export function checkRateLimit(
  key: string,
  options?: { windowMs?: number; maxAttempts?: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const maxAttempts = options?.maxAttempts ?? MAX_ATTEMPTS;
  const now = Date.now();
  const timestamps = pruneOld(attemptsByKey.get(key) || [], windowMs, now);
  if (timestamps.length >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.ceil((windowMs - (now - timestamps[0])) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedAttempt(key: string, options?: { windowMs?: number }): void {
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const now = Date.now();
  const timestamps = pruneOld(attemptsByKey.get(key) || [], windowMs, now);
  timestamps.push(now);
  attemptsByKey.set(key, timestamps);
}

export function clearRateLimit(key: string): void {
  attemptsByKey.delete(key);
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

// Keep the map from growing unbounded under sustained scanning/abuse. Uses a
// generously long window regardless of each caller's own windowMs — this
// sweep only exists for memory hygiene, not to enforce any limit itself.
const SWEEP_WINDOW_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of attemptsByKey) {
    if (pruneOld(timestamps, SWEEP_WINDOW_MS, now).length === 0) attemptsByKey.delete(key);
  }
}, 10 * 60 * 1000).unref?.();
