'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';

export default function ClientProtectedRoute({ children }: { children: React.ReactNode }) {
  const { client, isLoading } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!client && pathname !== '/clientportal/login') {
      router.replace('/clientportal/login');
      return;
    }
  }, [client, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!client && pathname !== '/clientportal/login') return null;

  return <>{children}</>;
}
