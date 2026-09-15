'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export interface SelectedLead {
  id: number;
  label: string;
}

export interface SavedToolResult {
  id: number;
  leadId: number | null;
  employeeId: number;
  employeeName: string | null;
  country: 'canada' | 'australia';
  tool: string;
  headlineScore: string | null;
  input: unknown;
  result: unknown;
  createdAt: string;
}

export interface SaveResultInput {
  country: 'canada' | 'australia';
  tool: string;
  headlineScore: string;
  input: unknown;
  result: unknown;
}

interface ImmigrationToolsContextValue {
  selectedLead: SelectedLead | null;
  setSelectedLead: (lead: SelectedLead | null) => void;
  saveResult: (payload: SaveResultInput) => Promise<void>;
  history: SavedToolResult[];
  historyLoading: boolean;
  refreshHistory: () => void;
}

const ImmigrationToolsContext = createContext<ImmigrationToolsContextValue | undefined>(undefined);

export function ImmigrationToolsProvider({ children }: { children: ReactNode }) {
  const [selectedLead, setSelectedLeadState] = useState<SelectedLead | null>(null);
  const [history, setHistory] = useState<SavedToolResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refreshHistory = useCallback(() => {
    if (!selectedLead) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    fetch(`/api/immigration-tools/results?leadId=${selectedLead.id}`)
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data) => setHistory(data.results || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [selectedLead]);

  const setSelectedLead = useCallback((lead: SelectedLead | null) => {
    setSelectedLeadState(lead);
  }, []);

  const saveResult = useCallback(async (payload: SaveResultInput) => {
    const res = await fetch('/api/immigration-tools/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, leadId: selectedLead?.id ?? null }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save result');
    refreshHistory();
  }, [selectedLead, refreshHistory]);

  // Fetch history whenever the selected lead changes.
  useEffect(() => { refreshHistory(); }, [refreshHistory]);

  const value = useMemo(
    () => ({ selectedLead, setSelectedLead, saveResult, history, historyLoading, refreshHistory }),
    [selectedLead, setSelectedLead, saveResult, history, historyLoading, refreshHistory]
  );

  return <ImmigrationToolsContext.Provider value={value}>{children}</ImmigrationToolsContext.Provider>;
}

export function useImmigrationTools() {
  const context = useContext(ImmigrationToolsContext);
  if (!context) throw new Error('useImmigrationTools must be used within an ImmigrationToolsProvider');
  return context;
}
