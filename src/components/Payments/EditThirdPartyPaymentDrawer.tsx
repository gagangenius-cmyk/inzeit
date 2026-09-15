'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2 } from 'lucide-react';

const PAY_METHODS = ['Cash', 'Debit/Credit Card', 'Cheque', 'DD', 'Net Banking'];

export interface EditableThirdPartyPayment {
  id: number;
  leadId: number;
  amount: number;
  Tax: number;
  payMethod: string | null;
  trans_or_ref_number: string;
  remarks: string;
}

export function EditThirdPartyPaymentDrawer({
  open,
  payment,
  onClose,
  onSaved,
}: {
  open: boolean;
  payment: EditableThirdPartyPayment | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ amount: '', Tax: '', payMethod: 'Cash', trans_or_ref_number: '', remarks: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !payment) return;
    setError('');
    setForm({
      amount: String(payment.amount ?? ''),
      Tax: String(payment.Tax ?? ''),
      payMethod: payment.payMethod || 'Cash',
      trans_or_ref_number: payment.trans_or_ref_number || '',
      remarks: payment.remarks || '',
    });
  }, [open, payment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    setError('');

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter a valid amount.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payment.id,
          type: 'thirdparty',
          amount,
          Tax: Number(form.Tax) || 0,
          payMethod: form.payMethod,
          trans_or_ref_number: form.trans_or_ref_number,
          remarks: form.remarks,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to update payment');
      }

      window.toast.success('Payment updated');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <Drawer open={open} onClose={onClose} title={`Edit Payment — Lead #${payment?.leadId ?? ''}`} description="Update this third-party payment's details.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange} required min="0.01" step="0.01" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax</label>
          <input type="number" name="Tax" value={form.Tax} onChange={handleChange} min="0" step="0.01" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Mode</label>
          <SearchableSelect name="payMethod" value={form.payMethod} onChange={handleChange} className={inputClass}>
            {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </SearchableSelect>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction / Reference Number</label>
          <input type="text" name="trans_or_ref_number" value={form.trans_or_ref_number} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
          <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
