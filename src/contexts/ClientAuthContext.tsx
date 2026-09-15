'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ClientUser {
  leadId: number;
  email: string;
  name: string;
  mustChangePassword: boolean;
}

interface ClientAuthContextType {
  client: ClientUser | null;
  isLoading: boolean;
  login: (client: ClientUser) => void;
  logout: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

// Deliberately separate from src/contexts/AuthContext.tsx (staff) - own
// localStorage key, own logout endpoint, no notion of permissions/roles. A
// client and an employee can be signed in simultaneously in the same browser
// since the auth cookies ('client-auth-token' vs 'auth-token') don't collide.
export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('client_portal_user');
    if (stored) {
      try {
        setClient(JSON.parse(stored));
      } catch {
        localStorage.removeItem('client_portal_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (clientUser: ClientUser) => {
    setClient(clientUser);
    localStorage.setItem('client_portal_user', JSON.stringify(clientUser));
  };

  const logout = async () => {
    try {
      await fetch('/api/client-portal-auth/logout', { method: 'POST' });
    } finally {
      setClient(null);
      localStorage.removeItem('client_portal_user');
    }
  };

  return (
    <ClientAuthContext.Provider value={{ client, isLoading, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) throw new Error('useClientAuth must be used within a ClientAuthProvider');
  return context;
}
