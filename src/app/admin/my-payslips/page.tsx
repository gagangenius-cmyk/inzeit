'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';

interface Payslip {
  payslip_id: string;
  pay_period: string;
  gross_salary: number;
  net_salary: number;
  currency_code: string;
  signed_url: string;
  signed_url_expires_at: string;
  generated_at: string;
}

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    fetch('/api/admin/hr/payslips')
      .then((res) => res.json())
      .then((json) => setPayslips(json.payslips || []))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Payslips</h1>
        <p className="mt-1 text-sm text-slate-500">View and download your own salary slips. Download links expire 7 days after generation.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>
        ) : payslips.length === 0 ? (
          <p className="text-sm text-slate-500">No payslips have been generated for you yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {payslips.map((p) => {
              const expired = new Date(p.signed_url_expires_at).getTime() < (nowMs ?? Infinity);
              return (
                <div key={p.payslip_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.pay_period}</p>
                    <p className="text-xs text-slate-500">
                      Net: {p.currency_code} {Number(p.net_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })} · Gross: {p.currency_code} {Number(p.gross_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {expired ? (
                    <span className="text-xs text-slate-400">Link expired — ask HR to regenerate</span>
                  ) : (
                    <a href={p.signed_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
