'use client';

import { useEffect } from 'react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application rendering error:', error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">We could not load this screen. Your saved data has not been changed.</p>
        {error.digest && <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>}
        <button onClick={reset} className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Try again
        </button>
      </section>
    </main>
  );
}
