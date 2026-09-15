'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Fatal application error:', error);
    fetch('/api/client-error-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message, digest: error.digest, stack: error.stack, url: window.location.href }),
    }).catch(() => { /* best-effort - a failed error report must never itself throw */ });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Arial, sans-serif', background: '#f8fafc' }}>
          <section style={{ maxWidth: 480, padding: 28, textAlign: 'center', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px #0002' }}>
            <h1>We couldn’t load Global Navigator CRM</h1>
            <p>Please try again. If this continues, share the reference below with support.</p>
            {error.digest && <p style={{ color: '#64748b', fontSize: 12 }}>Reference: {error.digest}</p>}
            <button onClick={reset} style={{ marginTop: 16, padding: '10px 16px', color: '#fff', border: 0, borderRadius: 6, background: '#2563eb', cursor: 'pointer' }}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
