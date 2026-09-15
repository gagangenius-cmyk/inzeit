'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Printer, Edit2, Eye, Search, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { getBranchAgreementProfile } from '@/lib/branchAgreementProfiles';
import { renderAgreementForBranch } from '@/lib/renderAgreementForBranch';

interface AgreementData {
  agreementNo: string;
  date: string;
  serviceProgram: string;
  programCode: string;
  programValidity: string;
  destinationCountry: string;
  clientFullName: string;
  clientAddress: string;
  nationality: string;
  passportNo: string;
  idNumber: string;
  phone: string;
  email: string;
  occupation: string;
  totalRetainerFee: string;
  initialPayment: string;
  secondPayment: string;
  // Not editable — resolves the branch's real legal name/licence/currency/
  // governing law via branchAgreementProfiles.ts, and picks the Gulf vs
  // India template. Kept out of the edit form on purpose: a free-text
  // override here is exactly what let this page drift out of sync with the
  // signed branch PDFs before.
  branchAbbrv: string;
  clientId: string;
  gstin: string;
}

const empty: AgreementData = {
  agreementNo: '', date: '', serviceProgram: '', destinationCountry: '',
  programCode: '', programValidity: '',
  clientFullName: '', clientAddress: '', nationality: '', passportNo: '', idNumber: '',
  phone: '', email: '', occupation: '',
  totalRetainerFee: '', initialPayment: '', secondPayment: '',
  branchAbbrv: '', clientId: '', gstin: '',
};

type LookupState = 'idle' | 'loading' | 'found' | 'notfound' | 'error';

export default function AgreementGenerator() {
  const [agreementInput, setAgreementInput] = useState('');
  const [lookupState, setLookupState]       = useState<LookupState>('idle');
  const [lookupMsg, setLookupMsg]           = useState('');
  const [data, setData]                     = useState<AgreementData>(empty);
  const [mode, setMode]                     = useState<'form' | 'preview'>('preview');
  const [html, setHtml]                     = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAgreement = useCallback(async (num: string) => {
    const trimmed = num.trim();
    if (!trimmed) { setLookupState('idle'); setLookupMsg(''); return; }

    setLookupState('loading');
    setLookupMsg('');
    try {
      const res = await fetch(`/api/admin/agreements/lookup?agreementNumber=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (!res.ok || !json.found) {
        setLookupState('notfound');
        setLookupMsg(json.error || 'Agreement not found. Check the number and try again.');
        return;
      }
      setData({
        agreementNo: json.data.agreementNo || '',
        date: json.data.date || '',
        serviceProgram: json.data.serviceProgram || '',
        programCode: json.data.programCode || '',
        programValidity: json.data.programValidity || '',
        destinationCountry: json.data.destinationCountry || '',
        clientFullName: json.data.clientFullName || '',
        clientAddress: json.data.clientAddress || '',
        nationality: json.data.nationality || '',
        passportNo: json.data.passportNo || '',
        idNumber: json.data.emiratesId || '',
        phone: json.data.phone || '',
        email: json.data.email || '',
        occupation: json.data.occupation || '',
        totalRetainerFee: json.data.totalRetainerFee || '',
        initialPayment: json.data.initialPayment || '',
        secondPayment: json.data.secondPayment || '',
        branchAbbrv: json.data.branchAbbrv || '',
        clientId: String(json.data.leadId || json.data.opportunityId || ''),
        gstin: json.data.branchLicenseNumber || '',
      });
      setLookupState('found');
      setLookupMsg(`Loaded: ${json.data.clientFullName}`);
      setMode('preview');
    } catch {
      setLookupState('error');
      setLookupMsg('Network error. Please try again.');
    }
  }, []);

  // Debounce auto-lookup as counsellor types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!agreementInput.trim()) { setLookupState('idle'); setLookupMsg(''); return; }
    debounceRef.current = setTimeout(() => fetchAgreement(agreementInput), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [agreementInput, fetchAgreement]);

  // Re-render the shared HTML whenever the loaded/edited data changes — this
  // is the same renderer every other agreement screen uses (see
  // renderAgreementForBranch.ts), so this page can no longer drift out of
  // sync with the signed branch PDFs.
  useEffect(() => {
    if (lookupState !== 'found') { setHtml(''); return; }
    setHtml(renderAgreementForBranch(data.branchAbbrv, {
      agreementNumber: data.agreementNo,
      agreementDate: data.date,
      clientName: data.clientFullName,
      clientEmail: data.email,
      clientPhone: data.phone,
      clientAddress: data.clientAddress,
      gstin: data.gstin,
      nationality: data.nationality,
      passportNumber: data.passportNo,
      idNumber: data.idNumber,
      serviceProgram: data.serviceProgram,
      programCode: data.programCode,
      programTermSchedule: data.programValidity,
      destinationCountry: data.destinationCountry,
      totalAmount: data.totalRetainerFee,
      initialPayment: data.initialPayment,
      secondPayment: data.secondPayment,
      clientId: data.clientId,
    }));
  }, [data, lookupState]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const set = (field: keyof AgreementData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData(prev => ({ ...prev, [field]: e.target.value }));

  const Field = ({ label, field, type = 'text' }: { label: string; field: keyof AgreementData; type?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>
      <input type={type} value={data[field]} onChange={set(field)}
        className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:ring-1 focus:ring-neutral-500"
        placeholder={label} />
    </div>
  );

  const isReady = lookupState === 'found';
  const profile = getBranchAgreementProfile(data.branchAbbrv);
  const idLabel = profile.idLabelEn || 'ID No.';

  return (
    <div className="space-y-4">
      {/* ── AGREEMENT NUMBER LOOKUP ── */}
      <div className="bg-white border border-neutral-300 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-neutral-300 bg-neutral-100">
            <FileText className="h-6 w-6 text-neutral-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Agreement Number Lookup</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter the agreement number from the opportunity flow to automatically load all client and fee details.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={agreementInput}
                  onChange={e => setAgreementInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchAgreement(agreementInput)}
                  placeholder="e.g. AGR-1720000000000"
                  className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                />
              </div>
              <button
                onClick={() => fetchAgreement(agreementInput)}
                disabled={lookupState === 'loading' || !agreementInput.trim()}
                className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {lookupState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Lookup
              </button>
              {isReady && (
                <button onClick={() => { setAgreementInput(''); setData(empty); setLookupState('idle'); setLookupMsg(''); setMode('preview'); }}
                  className="inline-flex items-center gap-1 rounded border border-neutral-300 px-3 py-2 text-sm text-gray-600 hover:bg-neutral-50">
                  <X className="h-4 w-4" /> Clear
                </button>
              )}
            </div>

            {/* Lookup status */}
            {lookupState === 'loading' && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Looking up agreement…
              </div>
            )}
            {lookupState === 'found' && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" /> {lookupMsg}
              </div>
            )}
            {(lookupState === 'notfound' || lookupState === 'error') && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {lookupMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR (only shown when agreement is loaded) ── */}
      {isReady && (
        <div className="bg-white border border-neutral-300 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Agreement for Advisory Services</h3>
            <p className="text-xs text-gray-500">{profile.legalNameEn} · {data.agreementNo}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setMode(mode === 'form' ? 'preview' : 'form')}
              className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded text-sm hover:bg-neutral-50">
              {mode === 'form' ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {mode === 'form' ? 'Preview' : 'Edit Details'}
            </button>
            <button onClick={handlePrint} disabled={!html}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-700 disabled:opacity-60">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>
      )}

      {isReady && (
        <div className={`grid gap-4 ${mode === 'form' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
          {/* ── EDIT FORM (optional corrections) ── */}
          {mode === 'form' && (
            <div className="bg-white border border-neutral-300 shadow-sm p-5 space-y-5">
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Details are auto-filled from the system. Edit only if something needs correction.
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b pb-1">Agreement Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Agreement No." field="agreementNo" />
                  <Field label="Date" field="date" type="date" />
                  <Field label="Service Program" field="serviceProgram" />
                  <Field label="Destination Country" field="destinationCountry" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b pb-1">Client Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full Name" field="clientFullName" />
                  <Field label="Nationality" field="nationality" />
                  <Field label="Passport No." field="passportNo" />
                  <Field label={idLabel} field="idNumber" />
                  <Field label="Phone" field="phone" type="tel" />
                  <Field label="Email" field="email" type="email" />
                  <div className="col-span-2"><Field label="Address" field="clientAddress" /></div>
                  <div className="col-span-2"><Field label="Occupation" field="occupation" /></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b pb-1">Fee Summary ({profile.currencyCode})</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Total Advisory Fee (${profile.currencyCode})`} field="totalRetainerFee" />
                  <Field label={`Initial Payment (${profile.currencyCode})`} field="initialPayment" />
                  <Field label={`Second Payment (${profile.currencyCode})`} field="secondPayment" />
                </div>
              </div>

              <button onClick={() => setMode('preview')}
                className="w-full py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-700">
                <Eye className="w-4 h-4 inline mr-2" />Preview Agreement
              </button>
            </div>
          )}

          {/* ── PREVIEW ── */}
          <div className="bg-white border border-neutral-300 shadow-sm p-4">
            <iframe
              ref={iframeRef}
              title="Agreement"
              srcDoc={html}
              className="w-full bg-white shadow border-0 mx-auto block"
              style={{ height: 'calc(100vh - 320px)', minHeight: 500 }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isReady && lookupState !== 'loading' && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Enter an agreement number above to load the client agreement</p>
          <p className="text-xs text-gray-400 mt-1">Agreement numbers are generated automatically in the opportunity flow after payment verification</p>
        </div>
      )}
    </div>
  );
}
