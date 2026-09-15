// Lightweight, dependency-free error reporting - no centralized error
// tracking existed anywhere in this project; every failure path across all
// ~261 API routes was a bare console.error with no aggregation, alerting,
// or trend visibility. Deliberately NOT the full @sentry/nextjs SDK: that
// package wraps next.config.js and adds sentry.client/server/edge.config.ts
// files that change the build pipeline in ways that can't be verified
// without a real Sentry account/DSN to test against, on a Turbopack-based
// Next.js 16 project. Instead this talks to Sentry's plain HTTP "Store API"
// directly (stable, documented, unchanged for years) - same
// "works with zero config, upgrades itself the moment real credentials
// exist" contract already established by src/lib/pusherServer.ts.
//
// Set SENTRY_DSN (the DSN string from your Sentry project settings, e.g.
// https://<publicKey>@<org>.ingest.sentry.io/<projectId>) to turn this on.
// Every call site keeps calling console.error too - this is additive.

interface ParsedDsn {
  host: string;
  projectId: string;
  publicKey: string;
}

function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, '');
    if (!publicKey || !projectId || !url.host) return null;
    return { host: url.host, projectId, publicKey };
  } catch {
    return null;
  }
}

let cachedDsn: ParsedDsn | null | undefined;

function getDsn(): ParsedDsn | null {
  if (cachedDsn !== undefined) return cachedDsn;
  const raw = process.env.SENTRY_DSN;
  cachedDsn = raw ? parseDsn(raw) : null;
  return cachedDsn;
}

export const isErrorTrackingConfigured = (): boolean => getDsn() !== null;

export interface CaptureErrorContext {
  // Route path or a short label identifying where this was caught, e.g.
  // '/api/admin/invoices-payments'.
  route?: string;
  userId?: number | string | null;
  extra?: Record<string, unknown>;
}

// Fire-and-forget, same contract as pushNotification/logDataAccess - a
// tracking-service outage must never affect the request that hit the
// original error, which has already been (or is about to be) handled by
// its own catch block and a normal error response sent to the caller.
export function captureError(error: unknown, context: CaptureErrorContext = {}): void {
  const dsn = getDsn();
  if (!dsn) return; // No-op when SENTRY_DSN isn't set - callers keep their own console.error.

  void (async () => {
    try {
      const message = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Error';
      const eventId = crypto.randomUUID().replace(/-/g, '');

      const payload: Record<string, unknown> = {
        event_id: eventId,
        timestamp: new Date().toISOString(),
        platform: 'node',
        level: 'error',
        logger: 'navigator-next',
        message: { formatted: message },
        exception: {
          values: [{ type: errorName, value: message }],
        },
        tags: context.route ? { route: context.route } : undefined,
        user: context.userId !== undefined && context.userId !== null ? { id: String(context.userId) } : undefined,
        extra: context.extra,
      };

      await fetch(`https://${dsn.host}/api/${dsn.projectId}/store/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=navigator-next-custom/1.0, sentry_key=${dsn.publicKey}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (sendError) {
      console.error('Failed to forward error to Sentry:', sendError);
    }
  })();
}
