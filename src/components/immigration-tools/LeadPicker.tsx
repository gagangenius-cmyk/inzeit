'use client';

import { useEffect, useState } from 'react';
import { Search, X, Link as LinkIcon } from 'lucide-react';
import { useImmigrationTools } from './ImmigrationToolsContext';

interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string | null;
  type: string;
}

export default function LeadPicker() {
  const { selectedLead, setSelectedLead } = useImmigrationTools();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = await res.json();
        setResults((data.results || []).filter((r: SearchResult) => r.type === 'Lead'));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  if (selectedLead) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[var(--cmg-border)] bg-white px-3 py-2 text-sm">
        <LinkIcon className="h-4 w-4 text-[var(--cmg-blue)]" />
        <span className="text-[var(--cmg-muted)]">Linked to lead:</span>
        <span className="font-semibold text-[var(--cmg-ink)]">{selectedLead.label}</span>
        <button
          type="button"
          onClick={() => setSelectedLead(null)}
          className="ml-auto text-[var(--cmg-muted)] hover:text-[var(--cmg-red)]"
          title="Unlink lead"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cmg-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          placeholder="Link this session to a lead (optional) — search by name, email or phone…"
          className="w-full rounded-md border border-[var(--cmg-border)] bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-[var(--cmg-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--cmg-blue)]"
        />
      </div>
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-[var(--cmg-border)] bg-white shadow-lg">
          {loading && <div className="px-4 py-3 text-sm text-[var(--cmg-muted)]">Searching…</div>}
          {!loading && results.length === 0 && <div className="px-4 py-3 text-sm text-[var(--cmg-muted)]">No leads found</div>}
          {!loading && results.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSelectedLead({ id: Number(lead.id), label: lead.title || `Lead #${lead.id}` });
                setQuery('');
                setResults([]);
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--cmg-blue-soft)]"
            >
              <span className="font-medium text-[var(--cmg-ink)]">{lead.title || `Lead #${lead.id}`}</span>
              {lead.subtitle && <span className="ml-2 text-xs text-[var(--cmg-muted)]">{lead.subtitle}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
