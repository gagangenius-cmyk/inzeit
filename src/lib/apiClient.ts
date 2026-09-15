import { ApiRequestError } from '@/components/providers/QueryProvider';

export async function apiClient<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  const payload = await response.json().catch(() => null) as { error?: string; detail?: string } | null;
  if (!response.ok) throw new ApiRequestError(payload?.error || payload?.detail || 'Request failed', response.status);
  return payload as T;
}
