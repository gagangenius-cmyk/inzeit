'use client';

import { useEffect, useState } from 'react';
import {
  FileText, Eye, Upload, Search, Trash2, User, RefreshCw, X
} from 'lucide-react';
import { uploadFileToBlob } from '@/lib/uploadToBlob';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useDebounce } from '@/hooks/useDebounce';

interface DocumentRow {
  id: number;
  source: 'additional' | 'operations' | 'opportunity';
  leadId: number | null;
  file: string | null;
  name: string;
  category: string | null;
  created: string;
  status: number | null;
  client: string;
  // Only ever set for source === 'opportunity' — documents uploaded by a
  // counselor during the Opportunity Flow wizard (id/passport/counsellor
  // sheet, proof of payment, signed agreement), linked to that opportunity's
  // latest agreement.
  agreementNumber: string | null;
}

const SOURCE_LABELS: Record<DocumentRow['source'], string> = {
  additional: 'Additional',
  operations: 'Operations',
  opportunity: 'Opportunity Flow',
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const { sorted: sortedDocuments, sortKey: documentSortKey, sortDirection: documentSortDirection, toggleSort: toggleDocumentSort } = useSortableData(
    documents,
    {
      document: (doc) => doc.name,
      client: (doc) => doc.client || doc.leadId,
      category: (doc) => doc.category || doc.source,
      agreementNumber: (doc) => doc.agreementNumber,
      uploaded: (doc) => doc.created,
    },
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ leadId: '', purpose: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);

  const load = async (search = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      const json = await res.json();
      setDocuments(json.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  useEffect(() => { load(debouncedSearchTerm); }, [debouncedSearchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleDelete = async (doc: DocumentRow) => {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    await fetch(`/api/documents?id=${doc.id}&source=${doc.source}`, { method: 'DELETE' });
    load(searchTerm);
  };

  const handleUpload = async () => {
    if (!uploadForm.leadId || !uploadForm.file) {
      window.toast.error('Lead ID and a file are required.');
      return;
    }
    setUploading(true);
    try {
      const safeName = uploadForm.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadFileToBlob(uploadForm.file, `documents/${uploadForm.leadId}/${Date.now()}_${safeName}`);

      const createRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: 'additional',
          leadId: Number(uploadForm.leadId),
          document: blob.url,
          purpose: uploadForm.purpose || 'Document',
        }),
      });
      if (!createRes.ok) throw new Error('Failed to save document record');

      setShowUpload(false);
      setUploadForm({ leadId: '', purpose: '', file: null });
      load(searchTerm);
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Client documents and files</p>
        </div>
        <button onClick={() => load(searchTerm)} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by client or purpose..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={() => setShowUpload(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg"><FileText className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg"><Upload className="w-6 h-6 text-green-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Uploaded Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => new Date(d.created).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg"><User className="w-6 h-6 text-yellow-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Clients</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(documents.map(d => d.client)).size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <SortButtonRow
          options={[
            ['document', 'Document'],
            ['client', 'Client'],
            ['category', 'Type'],
            ['agreementNumber', 'Agreement #'],
            ['uploaded', 'Uploaded'],
          ] as const}
          activeKey={documentSortKey}
          direction={documentSortDirection}
          onSort={toggleDocumentSort}
        />
        <RecordList
          loading={isLoading}
          isEmpty={!isLoading && documents.length === 0}
          emptyIcon={FileText}
          emptyTitle="No documents found"
        >
          {sortedDocuments.map((doc) => (
            <RecordCard
              key={`${doc.source}-${doc.id}`}
              avatar={<FileText className="h-4 w-4" />}
              avatarColorClass="from-gray-600 to-gray-400"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{doc.name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{SOURCE_LABELS[doc.source]}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">{(doc.category || doc.source).replace(/_/g, ' ')}</span>
                </>
              }
              stats={[
                { label: 'Client', value: doc.client || `Lead #${doc.leadId}` },
                { label: 'Agreement #', value: doc.agreementNumber || '—' },
                { label: 'Uploaded', value: doc.created ? new Date(doc.created).toLocaleString() : '—' },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: doc.file ? 'View' : 'No file', href: doc.file || undefined, target: '_blank', disabled: !doc.file },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(doc), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead ID</label>
                <input type="number" value={uploadForm.leadId} onChange={(e) => setUploadForm(f => ({ ...f, leadId: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose / Category</label>
                <input type="text" value={uploadForm.purpose} onChange={(e) => setUploadForm(f => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Passport Copy" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File</label>
                <input type="file" onChange={(e) => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                  className="mt-1 block w-full text-sm" />
              </div>
            </div>
            <div className="px-6 py-3 flex justify-end gap-3 border-t">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
