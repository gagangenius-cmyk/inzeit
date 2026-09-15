'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Printer, AlertCircle, Globe2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import { renderAgreementForBranch } from '@/lib/renderAgreementForBranch';

interface LookupItem {
  id: number;
  name: string;
  validity?: string | null;
}

interface FeeRow {
  upfront: number | string;
  prof_fee: number | string;
  firstMonth: number | string;
  secondMonth: number | string;
  thirdMonth: number | string;
  firstStage: number | string;
  secondStage: number | string;
  thirdStage: number | string;
  forthStage: number | string;
  fifthStage: number | string;
  currencyCode: string | null;
}

interface BranchInfo {
  name: string;
  address: string;
  nameAr: string;
  licenseNumber: string | null;
  abbrv: string | null;
}

// Wraps the real agreement HTML with a repeating "SAMPLE" overlay so this
// preview can never be mistaken for a signable document. `position: fixed`
// repeats per printed page here the same way the template's own
// `.print-footer` already does (see bilingualAgreementTemplate.ts), so the
// watermark survives "Print / Save PDF" across every page, not just the first.
function withSampleWatermark(html: string): string {
  const style = `<style>
    .sample-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 130px;
      font-weight: 800;
      letter-spacing: 10px;
      color: rgba(220, 38, 38, .16);
      text-transform: uppercase;
      pointer-events: none;
      user-select: none;
      z-index: 9999;
      white-space: nowrap;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>`;
  return html
    .replace('</head>', `${style}</head>`)
    .replace('<body>', '<body>\n  <div class="sample-watermark">SAMPLE</div>');
}

export default function SampleAgreement() {
  const { token, isLoading: authLoading } = useAuth();

  const [countries, setCountries] = useState<LookupItem[]>([]);
  // Unfiltered program catalogue, shown as-is only while "Any country" is
  // selected. Once a country is picked, `programs` below is replaced with
  // that country's scoped list (see the countryId effect) so the dropdown
  // never shows programs that don't belong to the selected country.
  const [allPrograms, setAllPrograms] = useState<LookupItem[]>([]);
  const [programs, setPrograms] = useState<LookupItem[]>([]);
  const [countryId, setCountryId] = useState('');
  const [programId, setProgramId] = useState('');
  const [branchCurrencyCode, setBranchCurrencyCode] = useState<string | null>(null);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [html, setHtml] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoadingOptions(true);
      try {
        const res = await fetch('/api/sample-agreement', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load countries/programs');
        setCountries(json.countries || []);
        setAllPrograms(json.programs || []);
        setPrograms(json.programs || []);
        setBranchCurrencyCode(json.branchCurrencyCode || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load countries/programs');
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [authLoading, token]);

  // Re-scope the Program dropdown to whichever country is selected, the same
  // way the (working) opportunity wizard does via /api/country-programs.
  // Clearing programId here prevents a stale out-of-country selection from
  // lingering once the list changes underneath it.
  useEffect(() => {
    if (authLoading || loadingOptions) return;
    setProgramId('');
    if (!countryId) {
      setPrograms(allPrograms);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingPrograms(true);
      try {
        const res = await fetch(`/api/country-programs?countryId=${countryId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (!cancelled) setPrograms(res.ok ? json : []);
      } catch {
        if (!cancelled) setPrograms([]);
      } finally {
        if (!cancelled) setLoadingPrograms(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryId, authLoading, loadingOptions]);

  const handleGenerate = async () => {
    if (!programId) { setError('Please select a program'); return; }

    setGenerating(true);
    setError('');
    setHtml('');
    try {
      const params = new URLSearchParams({ programId });
      if (countryId) params.set('countryId', countryId);

      const res = await fetch(`/api/sample-agreement?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate sample agreement');

      const fee: FeeRow | null = json.fee;
      const branch: BranchInfo | null = json.branch;
      if (json.branchCurrencyCode) setBranchCurrencyCode(json.branchCurrencyCode);

      const upfrontTotal = Number(fee?.upfront || 0);
      const monthlyTotal = Number(fee?.firstMonth || 0) + Number(fee?.secondMonth || 0) + Number(fee?.thirdMonth || 0);
      const stageTotal = Number(fee?.firstStage || 0) + Number(fee?.secondStage || 0) + Number(fee?.thirdStage || 0)
        + Number(fee?.forthStage || 0) + Number(fee?.fifthStage || 0);
      const profFee = Number(fee?.prof_fee || 0);

      const totalAmount = profFee || Math.max(upfrontTotal, monthlyTotal, stageTotal);
      const initialPayment = upfrontTotal || Number(fee?.firstMonth || 0) || Number(fee?.firstStage || 0);
      const secondPayment = Number(fee?.secondMonth || 0) || Number(fee?.secondStage || 0);

      const money = (amount: number) => (amount > 0 ? amount.toLocaleString() : '');

      const countryName = countries.find(c => String(c.id) === countryId)?.name || '';
      const program = programs.find(p => String(p.id) === programId);
      const programName = program?.name || '';

      const rendered = renderAgreementForBranch(branch?.abbrv, {
        agreementNumber: `SAMPLE-${programId}${countryId ? `-${countryId}` : ''}`,
        agreementDate: new Date().toLocaleDateString('en-GB'),
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
        nationality: '',
        passportNumber: '',
        idNumber: '',
        serviceProgram: programName,
        programCode: programId,
        programTermSchedule: program?.validity || '',
        destinationCountry: countryName,
        totalAmount: money(totalAmount),
        initialPayment: money(initialPayment),
        secondPayment: money(secondPayment),
      });

      setHtml(withSampleWatermark(rendered));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sample agreement');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-neutral-700" /> Sample Agreement
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Pick a country and program to preview a watermarked, non-binding copy of the client service agreement — including its clauses and fee schedule.
        </p>
      </div>

      <div className="bg-white border border-neutral-300 p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56">
          <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
          <SearchableSelect
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
            disabled={loadingOptions}
            className="w-full text-sm border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <option value="">Any country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </SearchableSelect>
        </div>

        <div className="min-w-56">
          <label className="block text-xs font-medium text-gray-600 mb-1">Program *</label>
          <SearchableSelect
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            disabled={loadingOptions || loadingPrograms}
            className="w-full text-sm border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <option value="">{loadingPrograms ? 'Loading programs…' : 'Select a program'}</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SearchableSelect>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || loadingOptions || !programId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded text-sm font-medium hover:bg-neutral-700 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe2 className="w-4 h-4" />}
          Generate Sample Agreement
        </button>

        {html && (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {html && (
        <iframe
          ref={iframeRef}
          title="Sample Agreement"
          srcDoc={html}
          className="w-full bg-white shadow border-0 mx-auto block"
          style={{ height: 'calc(100vh - 260px)', maxWidth: 900 }}
        />
      )}
    </div>
  );
}
