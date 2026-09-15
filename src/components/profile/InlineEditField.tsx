'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

interface InlineEditFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  icon?: React.ReactNode;
  onSave: (value: string) => Promise<void>;
}

export default function InlineEditField({ label, value, placeholder, icon, onSave }: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const startEdit = () => {
    setDraft(value);
    setError(null);
    setIsEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setIsEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === (value || '').trim()) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setIsEditing(false);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <div className="mt-1 flex items-center gap-2">
          <div className="relative flex-1">
            {icon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
            <input
              type="text"
              autoFocus
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') cancel();
              }}
              disabled={isSaving}
              className={`block w-full rounded-md border border-slate-300 py-2 ${icon ? 'pl-9' : 'px-3'} pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={isSaving}
            title="Save"
            className="shrink-0 rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={isSaving}
            title="Cancel"
            className="shrink-0 rounded-md border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="group mt-1 flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2 hover:border-slate-200 hover:bg-slate-50">
        <div className="flex min-w-0 items-center gap-2">
          {icon && <div className="text-slate-400">{icon}</div>}
          <span className={`truncate text-sm ${value ? 'text-slate-900' : 'text-slate-400'}`}>{value || placeholder || 'Not set'}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {justSaved && <span className="text-xs font-medium text-emerald-600">Saved</span>}
          <button
            type="button"
            onClick={startEdit}
            className="rounded p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-600"
            title={`Edit ${label}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
