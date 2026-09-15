import { NextRequest, NextResponse } from 'next/server';
import { sequelize } from '@/lib/sequelize';

// Standard uptime/readiness endpoint - deliberately public (no requireAuth):
// load balancers, container orchestrators, and external uptime monitors
// (UptimeRobot, Pingdom, a k8s liveness/readiness probe, etc.) hit this
// without credentials. Never returns anything sensitive (no stack traces,
// no connection strings) - just enough to say "the app is up" and "the
// database is reachable", each independently, so a monitor can tell a full
// outage apart from "the app booted but can't reach MySQL".
//
// Returns 200 when healthy, 503 when the database is unreachable - the
// status code itself is what most infrastructure actually checks, the JSON
// body is for humans looking at it directly.

export const dynamic = 'force-dynamic';

async function checkDatabase(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await sequelize.query('SELECT 1');
    return { connected: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verbose = searchParams.get('verbose') === 'true';

  const database = await checkDatabase();
  const healthy = database.connected;

  const body: Record<string, unknown> = {
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: { connected: database.connected, latencyMs: database.latencyMs },
  };

  if (!database.connected && verbose) {
    (body.database as Record<string, unknown>).error = database.error;
  }

  if (verbose) {
    body.realtime = {
      // Whether live push (Pusher) is configured - the app degrades
      // gracefully to polling either way, so this is informational, not a
      // health condition on its own.
      pusherConfigured: Boolean(
        process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER
      ),
    };
    body.nodeVersion = process.version;
  }

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}

// Some load balancers/uptime monitors send HEAD requests instead of GET.
export async function HEAD() {
  const database = await checkDatabase();
  return new NextResponse(null, { status: database.connected ? 200 : 503 });
}
