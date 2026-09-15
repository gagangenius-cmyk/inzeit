'use client';

import { ReactNode } from 'react';
import { ClientAuthProvider } from '@/contexts/ClientAuthContext';
import ClientProtectedRoute from '@/components/clientportal/ClientProtectedRoute';

// Deliberately no sidebar shell here - login/change-password/the root redirector render
// full-page, and every per-product route under /clientportal/[product]/[opportunityId]
// brings its own ProductPortalShell (see that segment's layout.tsx) so the product switcher
// only appears once a case is actually selected.
export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <ClientAuthProvider>
      <ClientProtectedRoute>{children}</ClientProtectedRoute>
    </ClientAuthProvider>
  );
}
