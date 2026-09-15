'use client';

import { useRef, useState } from 'react';
import { Upload, Download, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ImportRowError {
  row: number;
  error: string;
}

interface ImportRowWarning {
  row: number;
  warning: string;
}

interface ImportRowSkipped {
  row: number;
  reason: string;
}

interface ImportResult {
  message: string;
  created: number;
  failed: number;
  duplicates?: number;
  errors: ImportRowError[];
  warnings: ImportRowWarning[];
  skipped?: ImportRowSkipped[];
}

export default function BulkLeadUploadPage() {
  const { token, hasPermission } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!hasPermission('leads.bulk_upload')) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ShieldAlert className="w-10 h-10 text-red-500 mb-3" />
        <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="text-gray-600 mt-1">You don't have permission to bulk-upload leads. Ask your CEO to grant "Leads Bulk Upload" in Roles &amp; Permissions.</p>
      </div>
    );
  }

  const handleDownloadSample = () => {
    window.location.href = '/api/leads/bulk-upload';
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!['.xlsx', '.xls'].includes(ext)) {
      window.toast.warning('Please select a valid Excel file (.xlsx, .xls)');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.toast.warning('File size must be less than 5MB');
      event.target.value = '';
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        try {
          const response = await fetch('/api/leads/bulk-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ fileData: base64 }),
          });
          const data = await response.json();
          if (response.ok) {
            setResult(data);
            window.toast.info(data.message);
          } else {
            window.toast.error(data?.error || 'Error importing leads');
          }
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error importing leads:', error);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Lead Upload</h1>
        <p className="text-gray-600 mt-2">CEO-only. Upload an Excel file to create multiple leads at once.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Columns</h2>
          <p className="text-sm text-gray-600">
            fname, lname, email, mobile, education, profession, counselor, market_source,
            campaign, campaign_group, remarks, campaign_name, regdate
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <strong>counselor</strong> is matched by name against employees and sets the lead&apos;s assigned counselor.{' '}
            <strong>market_source</strong> is matched by name against Market Sources.{' '}
            <strong>campaign_name</strong> is matched by name against Campaigns.
            Unmatched values are left blank on the lead and reported as warnings below rather than blocking the row.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Sample Excel
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading…' : 'Upload Excel'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex gap-6 text-sm">
            <div><span className="font-semibold text-green-700">{result.created}</span> created</div>
            <div><span className="font-semibold text-blue-700">{result.duplicates ?? result.skipped?.length ?? 0}</span> duplicates skipped</div>
            <div><span className="font-semibold text-red-700">{result.failed}</span> failed</div>
            <div><span className="font-semibold text-amber-700">{result.warnings.length}</span> warnings</div>
          </div>

          {result.skipped && result.skipped.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-700 mb-2">Duplicates skipped (not imported)</h3>
              <div className="max-h-64 overflow-y-auto border border-blue-100 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-blue-700">Row</th>
                      <th className="px-3 py-2 text-left font-medium text-blue-700">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100">
                    {result.skipped.map((s, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{s.row}</td>
                        <td className="px-3 py-2">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">Failed rows</h3>
              <div className="max-h-64 overflow-y-auto border border-red-100 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-red-700">Row</th>
                      <th className="px-3 py-2 text-left font-medium text-red-700">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{e.row}</td>
                        <td className="px-3 py-2">{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-700 mb-2">Warnings</h3>
              <div className="max-h-64 overflow-y-auto border border-amber-100 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-amber-700">Row</th>
                      <th className="px-3 py-2 text-left font-medium text-amber-700">Warning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {result.warnings.map((w, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{w.row}</td>
                        <td className="px-3 py-2">{w.warning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
