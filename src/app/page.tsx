'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    router.replace(user ? '/admin' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen cmg-page-shell flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cmg-blue)] mx-auto mb-4"></div>
        <p className="text-[var(--cmg-muted)]">Loading Inzeit CRM...</p>
      </div>
    </div>
  );
}
