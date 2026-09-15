'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Eye, Download, Loader2 } from 'lucide-react';

interface Agreement {
  agreementTitle: string | null;
  agreementNumber: string;
  status: string;
  signedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  totalAmount: number | null;
  currency: string;
  documentUrl: string | null;
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function AgreementCopyPage() {
  const params = useParams<{ opportunityId: string }>();
  const [agreement, setAgreement] = useState<Agreement | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/clientportal/${params.opportunityId}/agreement`)
      .then((res) => res.json())
      .then((json) => setAgreement(json.agreement ?? null))
      .catch(() => setAgreement(null));
  }, [params.opportunityId]);

  if (agreement === undefined) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }

  if (!agreement) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">Service Agreement</h1>
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            This product&apos;s agreement has not been set up yet.
          </div>
        </div>
      </div>
    );
  }

  const isSigned = agreement.status === 'signed' || agreement.status === 'uploaded';
  const fileName = agreement.documentUrl ? decodeURIComponent(agreement.documentUrl.split('/').pop() || 'signed-agreement') : '';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900">Service Agreement</h1>
          {isSigned && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Signed</span>}
        </div>
        <p className="mt-1 text-sm text-slate-500">Your engagement agreement with Global Navigator for the active product.</p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Agreement title</span>
            <span className="text-sm font-medium text-slate-900">{agreement.agreementTitle || '—'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Reference no.</span>
            <span className="text-sm font-medium text-slate-900">{agreement.agreementNumber}</span>
          </div>
          {agreement.signedDate && (
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Signed on</span>
              <span className="text-sm font-medium text-slate-900">{formatDate(agreement.signedDate)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-sm text-slate-500">Contract validity</span>
            <span className="text-sm font-medium text-slate-900">{formatDate(agreement.startDate)} – {formatDate(agreement.endDate)}</span>
          </div>
          {agreement.totalAmount != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total amount</span>
              <span className="text-sm font-medium text-slate-900">{agreement.currency} {Number(agreement.totalAmount).toLocaleString()}</span>
            </div>
          )}
        </div>

        {agreement.documentUrl ? (
          <div className="mt-6 space-y-3">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Uploaded signed agreement</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">{fileName}</p>
              </div>
              <div className="flex gap-2">
                <a href={agreement.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  <Eye className="h-3.5 w-3.5" /> Open
                </a>
                <a href={agreement.documentUrl} download className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <iframe
                title="Uploaded signed agreement"
                src={agreement.documentUrl}
                className="h-[70vh] w-full"
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            The signed agreement file has not been uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
