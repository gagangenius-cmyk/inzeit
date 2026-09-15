'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
