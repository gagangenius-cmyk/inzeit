'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Printer, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getLeadBranchDetails, buildReceiptHtml } from '@/lib/receiptTemplate';

interface PaymentRecord {
  id: number;
  opportunityId: number;
  paymentNumber: string;
  receiptNumber: string | null;
  paymentDate: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceName: string | null;
  consultantName: string | null;
  paymentMethod: string;
  transactionId: string | null;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  agreementNumber: string | null;
  branchName: string | null;
  branchAddress: string | null;
  branchEmail: string | null;
  branchPhone: string | null;
  branchLicenseNumber: string | null;
  branchVatGstPercent: number | string | null;
  accountantStatus: string | null;
  remark: string | null;
  adminFeeIncluded?: boolean;
  adminFeeAmount?: number;
}

// A standalone, shareable page for a single opportunity's payment receipts —
// pulled out of the Opportunity Flow wizard's inline print popup so a
// receipt has its own URL instead of only existing as an ephemeral
// about:blank window generated from state already loaded in the wizard.
export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const opportunityId = params?.opportunityId as string;

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (authLoading || !opportunityId) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/opportunity-payments?opportunityId=${opportunityId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load receipts');
        const list: PaymentRecord[] = Array.isArray(data) ? data : [];
        setPayments(list);
        setSelectedId(list[0]?.id ?? null);
        if (list.length === 0) setError('No payments found for this opportunity yet.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load receipts');
      } finally {
        setLoading(false);
      }
    })();
  }, [opportunityId, token, authLoading]);

  const selected = payments.find((p) => p.id === selectedId) || null;

  const html = useMemo(() => {
    if (!selected) return '';
    const branchDetails = getLeadBranchDetails({
      dmBranch: {
        name: selected.branchName,
        address: selected.branchAddress,
        email: selected.branchEmail,
        mobile: selected.branchPhone,
        licenseNumber: selected.branchLicenseNumber,
        vatGstPercent: selected.branchVatGstPercent,
      },
    });
    return buildReceiptHtml({
      receiptNumber: selected.receiptNumber,
      paymentNumber: selected.paymentNumber,
      paymentDate: selected.paymentDate,
      clientName: selected.clientName,
      email: selected.clientEmail,
      phone: selected.clientPhone,
      agreementNumber: selected.agreementNumber,
      opportunityId: selected.opportunityId,
      serviceName: selected.serviceName,
      consultantName: selected.consultantName,
      companyName: branchDetails.companyName,
      branchName: branchDetails.branchName,
      branchAddress: branchDetails.branchAddress,
      branchEmail: branchDetails.branchEmail,
      branchPhone: branchDetails.branchPhone,
      licenseNumber: branchDetails.licenseNumber,
      vatGstPercent: branchDetails.vatGstPercent,
      paymentMethod: selected.paymentMethod,
      transactionId: selected.transactionId,
      currency: selected.currency,
      totalAmount: selected.totalAmount,
      paidAmount: selected.paidAmount,
      remainingBalance: selected.remainingBalance,
      remark: selected.remark,
      adminFeeIncluded: selected.adminFeeIncluded,
      adminFeeAmount: selected.adminFeeAmount,
    });
  }, [selected]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <div className="min-h-[60vh] bg-gray-100">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Payment Receipt</h1>
            <p className="text-xs text-gray-500">Opportunity #{opportunityId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {payments.length > 1 && (
            <select
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {payments.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.receiptNumber || p.paymentNumber} — {new Date(p.paymentDate).toLocaleDateString('en-GB')}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handlePrint}
            disabled={!selected}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      <div className="p-4">
        {(loading || authLoading) ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading receipt…
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto mt-12 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Receipt"
            srcDoc={html}
            className="w-full bg-white shadow rounded-lg border-0 mx-auto block"
            style={{ height: 'calc(100vh - 110px)', maxWidth: 900 }}
          />
        )}
      </div>
    </div>
  );
}
