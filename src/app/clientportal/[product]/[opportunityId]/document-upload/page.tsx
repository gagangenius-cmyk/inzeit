'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RefreshCw, Upload } from 'lucide-react';

interface DocumentRow {
  document_id: string;
  opportunity_id: number;
  checklist_key: string;
  document_label: string;
  mandatory: boolean | number;
  accepted_formats: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  review_note: string | null;
  uploaded_at: string | null;
}

const statusClass = (status: string) => {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Rejected') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'Resubmit Requested') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Submitted') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const inputAccept = (accepted: string | null) => {
  if (!accepted) return undefined;
  const formats = accepted.toUpperCase();
  const values: string[] = [];
  if (formats.includes('PDF')) values.push('application/pdf');
  if (formats.includes('JPG') || formats.includes('JPEG')) values.push('image/jpeg');
  if (formats.includes('PNG')) values.push('image/png');
  if (formats.includes('DOC')) values.push('.doc,.docx');
  return values.length ? values.join(',') : undefined;
};

export default function DocumentUploadPage() {
  const params = useParams<{ opportunityId: string }>();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clientportal/checklist');
      const json = await res.json();
      if (res.ok) {
        const all: DocumentRow[] = json.documents || [];
        setDocuments(all.filter((doc) => String(doc.opportunity_id) === params.opportunityId));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [params.opportunityId]);

  const handleUpload = async (doc: DocumentRow, file: File) => {
    setUploadingKey(doc.checklist_key);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('opportunityId', String(doc.opportunity_id));
      formData.append('checklistKey', doc.checklist_key);

      const res = await fetch('/api/clientportal/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `${doc.document_label} uploaded.` });
        await load();
      } else {
        setMessage({ type: 'error', text: json.error || 'Upload failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Upload failed' });
    } finally {
      setUploadingKey(null);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading checklist…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Upload</h1>
        <p className="mt-1 text-sm text-slate-500">Upload the documents required for this product. Each file is reviewed by the office.</p>
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No document checklist yet for this product — check back once your case manager sets it up.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.document_id} className="flex flex-col gap-3 rounded-md border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{doc.document_label}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${doc.mandatory ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {doc.mandatory ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  {doc.accepted_formats && <p className="mt-1 text-xs text-slate-500">Accepted: {doc.accepted_formats}</p>}
                  {doc.file_name && <p className="text-xs text-slate-500">{doc.file_name}</p>}
                  {doc.review_note && <p className="mt-1 text-xs text-slate-500">Note: {doc.review_note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(doc.status)}`}>{doc.status}</span>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingKey === doc.checklist_key ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      className="hidden"
                      accept={inputAccept(doc.accepted_formats)}
                      disabled={uploadingKey === doc.checklist_key}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) handleUpload(doc, file);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
