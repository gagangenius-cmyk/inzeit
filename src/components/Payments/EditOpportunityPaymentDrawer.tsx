'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2, ExternalLink, Upload, X } from 'lucide-react';
import { BANK_PAYMENT_OPTIONS, CARD_PAYMENT_OPTIONS } from '@/lib/paymentOptions';
import { uploadFileToBlob } from '@/lib/uploadToBlob';

// Lets Branch Manager/CEO correct a receipt after it's already been created —
// every field here is one the printed receipt actually reads (see
// buildReceiptHtml in src/lib/receiptTemplate.ts), so a save here is visible
// the next time that receipt is opened or reprinted. Payment Method and
// Service mirror the exact dropdowns the counselor filled in at creation
// time (opportunity-flow-wizard.tsx's Payment stage) rather than free text,
// so an edit can't drift into a value the rest of the app doesn't recognize.
export interface EditablePayment {
  id: number;
  paymentNumber: string;
  receiptNumber: string | null;
  paymentDate: Date | string | null;
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
  taxAmount: number;
  discountAmount: number;
  notes?: string | null;
  description?: string | null;
  remark?: string | null;
  adminFeeIncluded?: boolean;
  adminFeeAmount?: number;
  receiptUrl?: string | null;
  accountantStatus?: string | null;
}

export interface ServiceOption {
  value: string;
  label: string;
}

const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const verificationBadge = (status?: string | null) => {
  if (status === 'verified') return { label: 'Approved', className: 'bg-green-100 text-green-800' };
  if (status === 'rejected') return { label: 'Rejected', className: 'bg-red-100 text-red-800' };
  return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
};

export function EditOpportunityPaymentDrawer({
  open,
  payment,
  serviceOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  payment: EditablePayment | null;
  serviceOptions: ServiceOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [newProofFile, setNewProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !payment) return;
    setError('');
    setNewProofFile(null);
    setForm({
      paymentDate: toDateInputValue(payment.paymentDate),
      clientName: payment.clientName || '',
      clientEmail: payment.clientEmail || '',
      clientPhone: payment.clientPhone || '',
      serviceName: payment.serviceName || '',
      paymentMethod: payment.paymentMethod || '',
      transactionId: payment.transactionId || '',
      currency: payment.currency || '',
      totalAmount: String(payment.totalAmount ?? ''),
      paidAmount: String(payment.paidAmount ?? ''),
      taxAmount: String(payment.taxAmount ?? ''),
      discountAmount: String(payment.discountAmount ?? ''),
      notes: payment.notes || '',
      description: payment.description || '',
      remark: payment.remark || '',
      adminFeeIncluded: Boolean(payment.adminFeeIncluded),
      adminFeeAmount: String(payment.adminFeeAmount ?? ''),
    });
  }, [open, payment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    setError('');

    const totalAmount = Number(form.totalAmount);
    const paidAmount = Number(form.paidAmount);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) { setError('Enter a valid total amount.'); return; }
    if (!Number.isFinite(paidAmount) || paidAmount < 0) { setError('Enter a valid paid amount.'); return; }

    setSaving(true);
    try {
      // Upload the replacement first — only once it's safely in blob storage
      // does the save request go out, so a failed upload never leaves the
      // receipt half-updated or the old proof deleted for nothing.
      let newReceiptUrl: string | undefined;
      if (newProofFile) {
        setUploading(true);
        try {
          const safeName = newProofFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const blob = await uploadFileToBlob(newProofFile, `opportunity-payment-receipts/${payment.id}/${Date.now()}_${safeName}`);
          newReceiptUrl = blob.url;
        } finally {
          setUploading(false);
        }
      }

      const res = await fetch(`/api/opportunity-payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentDate: form.paymentDate || null,
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          serviceName: form.serviceName,
          // consultantName is deliberately omitted — read-only, the API
          // always keeps the counselor recorded at creation time.
          paymentMethod: form.paymentMethod,
          transactionId: form.transactionId,
          currency: form.currency,
          totalAmount,
          paidAmount,
          remainingBalance: Math.max(totalAmount - paidAmount, 0),
          taxAmount: Number(form.taxAmount) || 0,
          discountAmount: Number(form.discountAmount) || 0,
          notes: form.notes,
          description: form.description,
          remark: form.remark || null,
          adminFeeIncluded: Boolean(form.adminFeeIncluded),
          adminFeeAmount: Number(form.adminFeeAmount) || 0,
          ...(newReceiptUrl ? { receiptUrl: newReceiptUrl } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update payment');
      }

      window.toast.success('Receipt updated');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const readOnlyClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
  // Program/service catalog is a free-text column on the payment row (not a
  // strict FK), so this dropdown is keyed and submitted by name/label —
  // matching exactly how it's already stored and how it's printed on the
  // receipt — rather than the numeric crm_service id some callers of this
  // options list use for filtering.
  const uniqueServiceLabels = Array.from(new Set(serviceOptions.map((o) => o.label).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const badge = verificationBadge(payment?.accountantStatus);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Edit Receipt ${payment?.receiptNumber || payment?.paymentNumber || ''}`}
      description="Changes here are reflected the next time this receipt is opened or printed."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${badge.className}`}>
              Accounts: {badge.label}
            </span>
            {payment?.receiptUrl ? (
              <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                <ExternalLink className="h-3.5 w-3.5" /> View Current Proof of Payment
              </a>
            ) : (
              <span className="text-xs text-gray-500">No proof of payment on file</span>
            )}
          </div>

          {newProofFile ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Upload className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-800 truncate flex-1">{newProofFile.name}</span>
              <button type="button" onClick={() => setNewProofFile(null)} className="text-red-500 hover:text-red-700 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {payment?.receiptUrl ? 'Replace proof of payment…' : 'Upload proof of payment…'}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => setNewProofFile(e.target.files?.[0] || null)}
              />
            </label>
          )}
          {newProofFile && payment?.receiptUrl && (
            <p className="text-xs text-gray-500">Saving will delete the old proof of payment and replace it with this file.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Payment Date</label>
            <input type="date" name="paymentDate" value={String(form.paymentDate || '')} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Payment Method</label>
            <SearchableSelect name="paymentMethod" value={String(form.paymentMethod || '')} onChange={handleChange} className={inputClass}>
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
        </div>

        <div>
          <label className={labelClass}>Client Name</label>
          <input type="text" name="clientName" value={String(form.clientName || '')} onChange={handleChange} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client Email</label>
            <input type="email" name="clientEmail" value={String(form.clientEmail || '')} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Client Phone</label>
            <input type="text" name="clientPhone" value={String(form.clientPhone || '')} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Service / Program</label>
            <SearchableSelect name="serviceName" value={String(form.serviceName || '')} onChange={handleChange} className={inputClass}>
              <option value="">Select a program</option>
              {!uniqueServiceLabels.includes(String(form.serviceName || '')) && form.serviceName && (
                <option value={String(form.serviceName)}>{String(form.serviceName)}</option>
              )}
              {uniqueServiceLabels.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </SearchableSelect>
          </div>
          <div>
            <label className={labelClass}>Consultant Name</label>
            <input type="text" value={payment?.consultantName || ''} readOnly disabled className={readOnlyClass} title="Counselor is set at creation time and can't be edited here" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Transaction ID</label>
            <input type="text" name="transactionId" value={String(form.transactionId || '')} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <input type="text" name="currency" value={String(form.currency || '')} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Total Amount *</label>
            <input type="number" name="totalAmount" value={String(form.totalAmount || '')} onChange={handleChange} required min="0.01" step="0.01" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Paid Amount *</label>
            <input type="number" name="paidAmount" value={String(form.paidAmount || '')} onChange={handleChange} required min="0" step="0.01" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tax Amount</label>
            <input type="number" name="taxAmount" value={String(form.taxAmount || '')} onChange={handleChange} min="0" step="0.01" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Discount Amount</label>
            <input type="number" name="discountAmount" value={String(form.discountAmount || '')} onChange={handleChange} min="0" step="0.01" className={inputClass} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" name="adminFeeIncluded" checked={Boolean(form.adminFeeIncluded)} onChange={handleChange} className="rounded border-gray-300" />
            Admin Fee Included
          </label>
          {Boolean(form.adminFeeIncluded) && (
            <input type="number" name="adminFeeAmount" value={String(form.adminFeeAmount || '')} onChange={handleChange} min="0" step="0.01" className={`${inputClass} w-32`} placeholder="Fee amount" />
          )}
        </div>

        <div>
          <label className={labelClass}>Remark (shown on receipt)</label>
          <textarea name="remark" value={String(form.remark || '')} onChange={handleChange} rows={2} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea name="notes" value={String(form.notes || '')} onChange={handleChange} rows={2} className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? 'Uploading proof…' : saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
