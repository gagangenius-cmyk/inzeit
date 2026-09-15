'use client';

import { useEffect, useState } from 'react';
import { FileText, Upload, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HandbookDoc {
  document_id: string;
  title: string;
  category: string;
  file_url: string;
  version: number;
  uploaded_at: string;
}

export default function CompanyHandbookPage() {
  const { hasPermission } = useAuth();
  const canUpload = hasPermission('hr.create') || hasPermission('hr.update');
  const [documents, setDocuments] = useState<HandbookDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({ title: '', category: 'General' });
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/hr/handbook');
      const json = await res.json();
      if (res.ok) setDocuments(json.documents || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    if (!form.title.trim()) {
      setMessage('Enter a title first');
      return;
    }
    setIsUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.title.trim());
      formData.append('category', form.category.trim() || 'General');
      const res = await fetch('/api/admin/hr/handbook', { method: 'POST', body: formData });
      if (res.ok) {
        setForm({ title: '', category: 'General' });
        await load();
      } else {
        const json = await res.json();
        setMessage(json.error || 'Upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const grouped = documents.reduce<Record<string, HandbookDoc[]>>((acc, doc) => {
    (acc[doc.category] ||= []).push(doc);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Handbook</h1>
        <p className="mt-1 text-sm text-slate-500">Company policies and employee handbook documents.</p>
      </div>

      {canUpload && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Upload a document</h2>
          <p className="mt-1 text-xs text-slate-500">Uploading a new document for an existing category replaces it as the current version (older versions are kept in history).</p>
          {message && <p className="mt-2 text-xs text-red-600">{message}</p>}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title, e.g. Employee Handbook 2026"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
            <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Category, e.g. General"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            <Upload className="h-3.5 w-3.5" /> {isUploading ? 'Uploading…' : 'Choose File & Upload'}
            <input type="file" className="hidden" disabled={isUploading}
              onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleUpload(file); }} />
          </label>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-slate-500">No handbook documents have been uploaded yet.</p>
        ) : (
          Object.entries(grouped).map(([category, docs]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{category}</h3>
              <div className="mt-2 space-y-2">
                {docs.map((doc) => (
                  <a key={doc.document_id} href={doc.file_url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 hover:border-blue-300 hover:bg-blue-50">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <FileText className="h-4 w-4 text-slate-400" /> {doc.title}
                    </span>
                    <span className="text-xs text-slate-400">v{doc.version} · {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
