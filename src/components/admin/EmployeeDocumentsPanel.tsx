'use client';

import { useEffect, useState } from 'react';
import { Upload, Trash2, FileText, RefreshCw } from 'lucide-react';

interface EmployeeDocument {
  document_id: string;
  document_type: string;
  document_url: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

export default function EmployeeDocumentsPanel({ employeeId }: { employeeId: number | string }) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/hr/employees/${employeeId}/documents`);
      const json = await res.json();
      if (res.ok) setDocuments(json.documents || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [employeeId]);

  const handleUpload = async (file: File) => {
    if (!documentType.trim()) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType.trim());
      const res = await fetch(`/api/admin/hr/employees/${employeeId}/documents`, { method: 'POST', body: formData });
      if (res.ok) {
        setDocumentType('');
        await load();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    await fetch(`/api/admin/hr/employees/${employeeId}/documents/${documentId}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-700">Documents</h4>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          placeholder="Document type (e.g. Emirates ID)"
          className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
        />
        <label className={`inline-flex cursor-pointer items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 ${!documentType.trim() ? 'pointer-events-none opacity-50' : ''}`}>
          <Upload className="h-3.5 w-3.5" />
          {isUploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            className="hidden"
            disabled={isUploading || !documentType.trim()}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleUpload(file);
            }}
          />
        </label>
      </div>

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
        ) : documents.length === 0 ? (
          <p className="text-xs text-gray-400">No documents uploaded yet.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.document_id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-xs">
              <a href={doc.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                <FileText className="h-3.5 w-3.5" /> {doc.document_type}
                {doc.expiry_date && <span className="text-gray-400">(expires {new Date(doc.expiry_date).toLocaleDateString()})</span>}
              </a>
              <button onClick={() => handleDelete(doc.document_id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
