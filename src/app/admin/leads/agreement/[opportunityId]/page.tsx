'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Printer, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { renderAgreementForBranch } from '@/lib/renderAgreementForBranch';

// A standalone, shareable page for an opportunity's agreement — pulled out
// of the Opportunity Flow wizard's inline print popup so the agreement has
// its own URL instead of only existing as an ephemeral about:blank window
// generated from state already loaded in the wizard. Branch identity
// (name/address/licence) comes entirely from the client's own crm_branch
// record via the agreements lookup API, not a fixed Dubai default.
export default function AgreementPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const opportunityId = params?.opportunityId as string;

  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (authLoading || !opportunityId) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/agreements/lookup?opportunityId=${opportunityId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (!res.ok || !json.found) {
          throw new Error(json.error || 'No agreement found for this opportunity yet.');
        }
        const d = json.data;
        setHtml(renderAgreementForBranch(d.branchAbbrv, {
          agreementNumber: d.agreementNo,
          agreementDate: d.date ? new Date(d.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          agreementExpiry: d.endDate ? new Date(d.endDate).toLocaleDateString('en-GB') : '',
          clientName: d.clientFullName,
          clientEmail: d.email || '',
          clientPhone: d.phone || '',
          clientAddress: d.clientAddress || '',
          gstin: d.branchLicenseNumber || '',
          nationality: d.nationality || '',
          passportNumber: d.passportNo || '',
          idNumber: d.emiratesId || '',
          serviceProgram: d.serviceProgram || '',
          programCode: d.programCode || d.agreementType || '',
          programTermSchedule: d.programValidity || (d.startDate && d.endDate ? `${String(d.startDate).split('T')[0]} to ${String(d.endDate).split('T')[0]}` : ''),
          destinationCountry: d.destinationCountry || '',
          totalAmount: String(d.totalRetainerFee || '0'),
          initialPayment: String(d.initialPayment || '0'),
          secondPayment: String(d.secondPayment || '0'),
          clientId: String(d.leadId || d.opportunityId || ''),
          includedDeliverables: d.agreementTitle || d.title || '',
          expressExclusions: '',
          specialTerms: d.termsAndConditions || d.terms || '',
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agreement');
      } finally {
        setLoading(false);
      }
    })();
  }, [opportunityId, token, authLoading]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <div className="min-h-[60vh] bg-neutral-200">
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-300 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Client Service Agreement</h1>
            <p className="text-xs text-gray-500">Opportunity #{opportunityId}</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          disabled={!html}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-700 disabled:opacity-50"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      <div className="p-4">
        {(loading || authLoading) ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading agreement…
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto mt-12 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Agreement"
            srcDoc={html}
            className="w-full bg-white shadow border-0 mx-auto block"
            style={{ height: 'calc(100vh - 110px)', maxWidth: 900 }}
          />
        )}
      </div>
    </div>
  );
}
