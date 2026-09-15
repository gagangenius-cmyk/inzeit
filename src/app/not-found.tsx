import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold text-blue-600">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-600">The page may have moved or you may not have access to it.</p>
        <Link href="/" className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">Go to dashboard</Link>
      </section>
    </main>
  );
}
