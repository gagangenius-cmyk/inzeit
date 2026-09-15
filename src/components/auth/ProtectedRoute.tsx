'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading, hasPermission, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(fallbackPath);
        return;
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/admin');
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        router.push('/admin');
        return;
      }
    }
  }, [user, isLoading, requiredPermission, requiredRole, hasPermission, hasRole, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
