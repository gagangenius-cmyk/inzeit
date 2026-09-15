'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const operationsQueryKeys = {
  branchTargets: (params: string) => ['branch-targets', params] as const,
  europeBatches: () => ['europe-batches'] as const,
  stages: (module: string, leadId: number, opportunityId: number | null) => ['operation-stages', module, leadId, opportunityId] as const,
};

export function useBranchTargets(params: URLSearchParams) {
  const query = params.toString();
  return useQuery({
    queryKey: operationsQueryKeys.branchTargets(query),
    queryFn: () => apiClient<{ success: boolean; data: unknown[] }>(`/api/admin/branch-targets?${query}`),
  });
}

export function useEuropeBatches() {
  return useQuery({
    queryKey: operationsQueryKeys.europeBatches(),
    queryFn: () => apiClient<{ success: boolean; batches: unknown[]; cases: unknown[] }>('/api/admin/europe-batches'),
  });
}

export function useOperationStages(module: string, leadId: number, opportunityId: number | null) {
  return useQuery({
    queryKey: operationsQueryKeys.stages(module, leadId, opportunityId),
    enabled: Boolean(module && leadId),
    queryFn: () => {
      const params = new URLSearchParams({ leadId: String(leadId) });
      if (opportunityId) params.set('opportunityId', String(opportunityId));
      return apiClient<{ success: boolean; data: Record<string, Record<string, unknown>> }>(`/api/admin/operations/${module}/save?${params}`);
    },
  });
}

export function useSaveOperationStage(module: string, leadId: number, opportunityId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stage, data }: { stage: string; data: unknown }) => apiClient<{ success: boolean }>(`/api/admin/operations/${module}/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, opportunityId, stage, data }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: operationsQueryKeys.stages(module, leadId, opportunityId) }),
  });
}
