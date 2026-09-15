'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uploadFileToBlob } from '@/lib/uploadToBlob';
import { BANK_PAYMENT_OPTIONS, CARD_PAYMENT_OPTIONS } from '@/lib/paymentOptions';
import { ArrowLeft, DollarSign, CheckCircle, Upload, AlertCircle, RefreshCw } from 'lucide-react';

interface LeadInfo {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  payTotal: number;
  paidYet: number;
  payBalance: number;
  service_interest_label?: string;
  branch?: number | null;
  dmBranch?: { id: number } | null;
}

function AddPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');
  const opportunityId = searchParams.get('opportunityId');

  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [currencyCode, setCurrencyCode] = useState('AED');

  const [form, setForm] = useState({
    paymentStructure: 'full' as 'full' | 'installment',
    paidAmount: 0,
    paymentMethod: 'cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    remark: '',
    proofOfPayment: null as File | null,
  });

  useEffect(() => {
    if (!leadId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leads/${leadId}`);
        if (!res.ok) throw new Error('Failed to load lead');
        const data = await res.json();
        setLead(data);
        setForm((prev) => ({ ...prev, paidAmount: Number(data.payBalance || 0) }));
        const branchId = data.branch || data.dmBranch?.id;
        if (branchId) {
          const curRes = await fetch(`/api/branch-currency?branchId=${branchId}`);
          if (curRes.ok) {
            const curJson = await curRes.json();
            if (curJson.currencyCode) setCurrencyCode(curJson.currencyCode);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lead');
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId]);

  if (!leadId || !opportunityId) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> Missing leadId or opportunityId. Go back to Balance Payments and click Make Payment again.
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!lead) return;
    if (!form.paidAmount || form.paidAmount <= 0) {
      setError('Enter a valid amount to pay.');
      return;
    }
    if (!(form.proofOfPayment instanceof File)) {
      setError('Upload proof of payment before recording the payment.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let proofOfPaymentUrl: string | null = null;
      if (form.proofOfPayment instanceof File) {
        const safeName = form.proofOfPayment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const blob = await uploadFileToBlob(form.proofOfPayment, `opportunity-payments/${opportunityId}/proof/${Date.now()}_${safeName}`);
        proofOfPaymentUrl = blob.url;
      }

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: Number(leadId),
          opportunityId: Number(opportunityId),
          // Distinct from the wizard's initial 'P1' deposit tag — a balance
          // payment is always a new installment, not a re-edit of the first
          // receipt, so it must never collide with the P1 edit-lock check.
          paymentTag: `BAL${Date.now()}`,
          paymentData: {
            paymentStructure: form.paymentStructure,
            paymentMethod: form.paymentMethod,
            transactionId: form.transactionId,
            paymentDate: form.paymentDate,
            paidAmount: form.paidAmount,
            totalAmount: lead.payTotal,
            amount: form.paidAmount,
            dueDate: form.dueDate || undefined,
            remark: form.remark || undefined,
            proofOfPaymentUrl,
          },
          receiptData: {
            description: `Balance payment for ${lead.fname} ${lead.lname}`,
            receiptType: 'payment',
            taxAmount: 0,
            discountAmount: 0,
            notes: '',
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record payment');
      setReceipt(json.data?.receipt || json.data || json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-600" />
          <h2 className="text-xl font-bold text-green-900">Payment Recorded</h2>
          <p className="mt-1 text-sm text-green-700">
            Receipt <span className="font-semibold">{receipt.receiptNumber || receipt.paymentNumber}</span> has been created
            and submitted to Accounts for verification.
          </p>
          <p className="mt-1 text-xs text-green-600">
            It will show as "Pending" in Payments (Lead Management) until an accountant verifies it in Payment Verification.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => router.push('/admin/balance-payments')}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back to Balance Payments
            </button>
            <button
              onClick={() => router.push('/admin/payments')}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              View in Payments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.push('/admin/balance-payments')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Balance Payments
      </button>

      <div className="mb-6 flex items-center gap-2">
        <DollarSign className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Add Payment</h1>
      </div>

      {lead && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="font-semibold text-blue-900">{lead.fname} {lead.lname}</div>
          <div className="text-sm text-blue-700">{lead.email} · {lead.phone}</div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div><span className="text-blue-600">Total</span><div className="font-semibold text-blue-900">{currencyCode} {Number(lead.payTotal || 0).toLocaleString()}</div></div>
            <div><span className="text-blue-600">Paid</span><div className="font-semibold text-green-700">{currencyCode} {Number(lead.paidYet || 0).toLocaleString()}</div></div>
            <div><span className="text-blue-600">Balance</span><div className="font-semibold text-red-600">{currencyCode} {Number(lead.payBalance || 0).toLocaleString()}</div></div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Payment</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
            <SearchableSelect
              value={form.paymentStructure}
              onChange={(e) => setForm({ ...form, paymentStructure: e.target.value as 'full' | 'installment' })}
              className="w-full p-3 border rounded-lg"
            >
              <option value="full">Full Payment</option>
              <option value="installment">Installment</option>
            </SearchableSelect>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Pay</label>
            <input
              type="number"
              value={form.paidAmount}
              onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <SearchableSelect
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full p-3 border rounded-lg"
            >
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <optgroup label="Bank">
                {BANK_PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
              <optgroup label="Card / POS">
                {CARD_PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            </SearchableSelect>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
            <input
              type="text"
              value={form.transactionId}
              onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
              className="w-full p-3 border rounded-lg"
              placeholder="Enter transaction reference"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Details</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Balance Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proof of Payment <span className="text-red-500">*</span>
            </label>
            {form.proofOfPayment instanceof File ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-sm text-green-800 truncate flex-1">{form.proofOfPayment.name}</span>
                <button type="button" onClick={() => setForm({ ...form, proofOfPayment: null })} className="text-red-500 hover:text-red-700 text-xs shrink-0">Remove</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Choose file</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setForm({ ...form, proofOfPayment: e.target.files?.[0] || null })}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
        <textarea
          value={form.remark}
          onChange={(e) => setForm({ ...form, remark: e.target.value })}
          rows={3}
          className="w-full p-3 border rounded-lg"
          placeholder="Notes about this payment or the remaining balance..."
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving || !(form.proofOfPayment instanceof File)}
          title={!(form.proofOfPayment instanceof File) ? 'Upload proof of payment before recording the payment.' : undefined}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {saving ? 'Recording Payment…' : 'Record Payment & Send for Approval'}
        </button>
      </div>
    </div>
  );
}

export default function AddPaymentPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
      <AddPaymentContent />
    </Suspense>
  );
}
