'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, FileText, Clock } from 'lucide-react';

interface ClientDocument {
  document_id: string;
  checklist_key: string;
  document_label: string;
  mandatory: boolean;
  accepted_formats: string | null;
  file_url: string | null;
  file_name: string | null;
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Resubmit Requested';
  review_note: string | null;
  uploaded_at: string | null;
  reviewed_at: string | null;
}

interface ClientDocumentsPanelProps {
  leadId: number;
  opportunityId: number;
}

const statusClass = (status: string) => {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Rejected') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'Resubmit Requested') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Submitted') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-gray-50 text-gray-600 border-gray-200';
};

// Reviewing here updates the exact same crm_client_documents row the client's
// portal document-upload page already reads status/review_note from - so
// this is the only place a "validate" action needs to happen for the client
// to see the outcome on their side; no separate sync step exists or is needed.
export default function ClientDocumentsPanel({ leadId, opportunityId }: ClientDocumentsPanelProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ leadId: String(leadId), opportunityId: String(opportunityId) });
      const res = await fetch(`/api/admin/operations/client-documents?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setDocuments(json.data || []);
    } catch (error) {
      console.error('Failed to load client documents:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, opportunityId]);

  useEffect(() => { load(); }, [load]);

  const review = async (documentId: string, status: 'Approved' | 'Rejected' | 'Resubmit Requested') => {
    setSavingId(documentId);
    try {
      const res = await fetch('/api/admin/operations/client-documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, status, reviewNote: noteDrafts[documentId] || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update document');
      window.toast.success(`Document marked as ${status}.`);
      await load();
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to update document');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Client-Uploaded Documents</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-800">Documents the client has uploaded via their client portal checklist. Approving, rejecting, or requesting a resubmit here updates their portal immediately.</p>
      </div>

      {documents.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No client-portal document checklist has been set up for this case yet.
        </div>
      )}

      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.document_id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  {doc.document_label}
                  {doc.mandatory && <span className="text-xs text-red-600">*</span>}
                </p>
                {doc.file_url ? (
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-blue-700 hover:text-blue-900">
                    View uploaded file{doc.file_name ? `: ${doc.file_name}` : ''}
                  </a>
                ) : (
                  <p className="mt-1 text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Not uploaded yet</p>
                )}
                {doc.review_note && <p className="mt-1 text-xs text-gray-500">Note: {doc.review_note}</p>}
                {doc.reviewed_at && <p className="mt-0.5 text-[11px] text-gray-400">Reviewed {new Date(doc.reviewed_at).toLocaleString()}</p>}
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(doc.status)}`}>{doc.status}</span>
            </div>

            {doc.file_url && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={noteDrafts[doc.document_id] || ''}
                  onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [doc.document_id]: event.target.value }))}
                  placeholder="Optional note to the client..."
                  className="flex-1 min-w-40 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => review(doc.document_id, 'Approved')}
                  disabled={savingId === doc.document_id}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => review(doc.document_id, 'Resubmit Requested')}
                  disabled={savingId === doc.document_id}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <RotateCcw size={14} /> Request Resubmit
                </button>
                <button
                  onClick={() => review(doc.document_id, 'Rejected')}
                  disabled={savingId === doc.document_id}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
