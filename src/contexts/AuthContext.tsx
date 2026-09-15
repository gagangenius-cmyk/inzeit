'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string | number;
  type?: string;
  roleName?: string;
  permissions: string[];
  branch?: string;
  avatar?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
  // Currency code (e.g. "AED", "QAR") for the logged-in user's own branch -
  // not a hardcoded symbol, since branches span multiple countries/currencies.
  currencyCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyCode, setCurrencyCode] = useState('AED');

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    const shouldRedirectForAuthFailure = (input: RequestInfo | URL) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

      const apiUrl = new URL(url, window.location.origin);
      const isSameOriginApi = apiUrl.origin === window.location.origin && apiUrl.pathname.startsWith('/api/');
      const isStaffAuthApi = !apiUrl.pathname.startsWith('/api/clientportal') && !apiUrl.pathname.startsWith('/api/client-portal-auth');
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname.startsWith('/clientportal');

      return isSameOriginApi && isStaffAuthApi && !isAuthPage;
    };

    const redirectToLogin = () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    };

    const authAwareFetch: typeof window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      if (response.status === 401 && shouldRedirectForAuthFailure(input)) {
        redirectToLogin();
      }
      return response;
    };

    window.fetch = authAwareFetch;

    return () => {
      if (window.fetch === authAwareFetch) {
        window.fetch = originalFetch;
      }
    };
  }, []);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/branch-currency', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.currencyCode) setCurrencyCode(data.currencyCode); })
      .catch((error) => console.error('Error fetching branch currency:', error));
  }, [user, token]);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const logout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API result
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return String(user.role) === role || user.type === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      hasPermission,
      hasRole,
      isLoading,
      currencyCode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
