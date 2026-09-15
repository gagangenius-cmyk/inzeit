'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2 } from 'lucide-react';
import { uploadFileToBlob } from '@/lib/uploadToBlob';

// Add-new form for crm_3party_payment, ported from the legacy PHP screen
// (lead_extra_payment.php) — same field set, same "Particular" list, same
// conditional Payment Option / Card Payment Option behavior. Tax is computed
// server-side (see POST /api/admin/payments) from the lead's region, never
// trusted from this form.

const PARTICULARS = [
  'Re-Launching Application',
  'Poland Re-Launching Application',
  'Government Fees',
  'IELTS',
  'IELTS_TRAINING',
  'PTE',
  'PTE_TRAINING',
  'Appointment',
  'IELTS_WORK',
  'Upgrade_Dual_Package',
  'Addition of family member',
  'Upgrade to New country application - Visit Visa',
  'RCBI Lawyer Fees',
  'aaip pnp canada',
  'Sale of additional product',
  'Additional amount for change of country',
] as const;

const PARTICULAR_LABELS: Record<string, string> = {
  IELTS: 'IELTS Exam',
  IELTS_TRAINING: 'IELTS Training',
  PTE: 'PTE Exam Booking',
  PTE_TRAINING: 'PTE Training',
  Appointment: 'Third Party Appointments',
  IELTS_WORK: 'IELTS (WorkBook)',
  Upgrade_Dual_Package: 'Upgrade to dual Package',
  'aaip pnp canada': 'AAIP PNP Canada',
};

const PAY_METHODS = ['Cash', 'Debit/Credit Card', 'Cheque', 'DD', 'Net Banking'];

const BANK_OPTIONS = [
  'SZR Bank', 'AUH Bank', 'SHJ Bank', 'CAD SZR Bank', 'USD SZR Bank',
  'Oman Bank', 'Qatar Bank', 'Kuwait Bank', 'Saudi Bank', 'India Bank', 'Interac Scotia Bank',
];

// Legacy form showed a different card-option set for India-region branches
// (Razr/Payu, no Paypal) vs everywhere else (Paypal, no Razr/Payu).
const CARD_OPTIONS_INDIA = ['POS Machine', 'TAP Link - GCC', 'Razr', 'Payu'];
const CARD_OPTIONS_DEFAULT = ['Paypal', 'POS Machine', 'TAP Link - GCC'];

interface CurrencyOption {
  id: number;
  country: string;
  currency_code: string;
}

interface LeadLookup {
  id: number;
  name: string;
  region: string | null;
}

const emptyForm = {
  leadId: '',
  particular: PARTICULARS[0] as string,
  amount: '',
  payMethod: 'Cash',
  payoption: '',
  paycardoption: '',
  currency_id: '',
  remarks: '',
};

export function AddThirdPartyPaymentDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [lead, setLead] = useState<LeadLookup | null>(null);
  const [leadLookupState, setLeadLookupState] = useState<'idle' | 'loading' | 'notfound'>('idle');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setFile(null);
    setLead(null);
    setLeadLookupState('idle');
    setError('');
    fetch('/api/currencies')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCurrencies(Array.isArray(data) ? data : []))
      .catch(() => setCurrencies([]));
  }, [open]);

  // Confirms the lead exists (and shows the client's name + region) as the
  // id is typed, debounced — the legacy form skipped this because it was
  // always opened from an already-selected lead's own page; this one is
  // opened from the standalone Payments list, so the id is free-typed.
  useEffect(() => {
    const id = Number(form.leadId);
    if (!id) {
      setLead(null);
      setLeadLookupState('idle');
      return;
    }
    setLeadLookupState('loading');
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) {
          setLead(null);
          setLeadLookupState('notfound');
          return;
        }
        const data = await res.json();
        setLead({
          id,
          name: `${data.fname || ''} ${data.lname || ''}`.trim() || `Lead #${id}`,
          region: data.dmRegion?.name || null,
        });
        setLeadLookupState('idle');
      } catch {
        setLead(null);
        setLeadLookupState('notfound');
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [form.leadId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isIndiaLead = String(lead?.region || '').trim().toLowerCase() === 'india';
  const cardOptions = isIndiaLead ? CARD_OPTIONS_INDIA : CARD_OPTIONS_DEFAULT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const leadId = Number(form.leadId);
    const amount = Number(form.amount);
    if (!leadId || leadLookupState === 'notfound') { setError('Enter a valid lead ID.'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter a valid amount.'); return; }
    if (!file) { setError('Attach the receipt/proof document.'); return; }
    if (form.payMethod === 'Net Banking' || form.payMethod === 'Cheque') {
      if (!form.payoption) { setError('Select a payment option.'); return; }
    }
    if (form.payMethod === 'Debit/Credit Card') {
      if (!form.paycardoption) { setError('Select a card payment option.'); return; }
    }

    setSaving(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadFileToBlob(file, `third-party-receipts/${leadId}/${Date.now()}_${safeName}`);

      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'thirdparty',
          leadId,
          particular: form.particular,
          amount,
          payMethod: form.payMethod,
          payoption: form.payMethod === 'Net Banking' || form.payMethod === 'Cheque' ? form.payoption : '',
          paycardoption: form.payMethod === 'Debit/Credit Card' ? form.paycardoption : '',
          currency_id: form.currency_id || null,
          remarks: form.remarks,
          counselor_receipt: blob.url,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to create third-party payment');
      }

      window.toast.success('Third-party payment recorded');
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create third-party payment');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <Drawer open={open} onClose={onClose} title="Add Third-Party Payment" description="Record a payment made to an external provider (exam body, RCBI, appointments, etc.) on behalf of a lead.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead ID *</label>
          <input type="number" name="leadId" value={form.leadId} onChange={handleChange} required className={inputClass} placeholder="e.g. 2823" />
          {leadLookupState === 'loading' && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><Loader2 className="h-3 w-3 animate-spin" /> Looking up lead…</p>
          )}
          {leadLookupState === 'notfound' && (
            <p className="mt-1 text-xs text-red-600">No lead found with that ID.</p>
          )}
          {lead && (
            <p className="mt-1 text-xs text-green-700">{lead.name}{lead.region ? ` — ${lead.region}` : ''}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Particular *</label>
          <SearchableSelect name="particular" value={form.particular} onChange={handleChange} className={inputClass}>
            {PARTICULARS.map((p) => (
              <option key={p} value={p}>{PARTICULAR_LABELS[p] || p}</option>
            ))}
          </SearchableSelect>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange} required min="0.01" step="0.01" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Receipt / Proof Document *</label>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Mode *</label>
          <SearchableSelect name="payMethod" value={form.payMethod} onChange={handleChange} className={inputClass}>
            {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </SearchableSelect>
        </div>

        {(form.payMethod === 'Net Banking' || form.payMethod === 'Cheque') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Option *</label>
            <SearchableSelect name="payoption" value={form.payoption} onChange={handleChange} className={inputClass}>
              <option value="">Select</option>
              {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </SearchableSelect>
          </div>
        )}

        {form.payMethod === 'Debit/Credit Card' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Payment Option *</label>
            <SearchableSelect name="paycardoption" value={form.paycardoption} onChange={handleChange} className={inputClass}>
              <option value="">Select</option>
              {cardOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </SearchableSelect>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
          <SearchableSelect name="currency_id" value={form.currency_id} onChange={handleChange} className={inputClass}>
            <option value="">Select</option>
            {currencies.map((c) => <option key={c.id} value={c.id}>{c.currency_code} — {c.country}</option>)}
          </SearchableSelect>
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
            {saving ? 'Saving…' : 'Save Payment'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
