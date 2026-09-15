'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductRow {
  key: string;
  label: string;
  icon: string;
  status: 'active' | 'not_started';
  opportunityId: number | null;
  caseStatus: string | null;
}

export default function ClientPortalRootPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[] | null>(null);

  useEffect(() => {
    fetch('/api/clientportal/products')
      .then((res) => res.json())
      .then((json) => setProducts(json.products || []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!products) return;
    const active = products.filter((p) => p.status === 'active' && p.opportunityId);
    if (active.length === 1) {
      router.replace(`/clientportal/${active[0].key}/${active[0].opportunityId}`);
    }
  }, [products, router]);

  if (products === null) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  const active = products.filter((p) => p.status === 'active' && p.opportunityId);

  if (active.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">No active product yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your case isn&apos;t linked to an active product yet — please contact your counselor.
          </p>
        </div>
      </div>
    );
  }

  if (active.length === 1) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-3">
        <h1 className="text-lg font-semibold text-slate-900">Choose a product</h1>
        {active.map((p) => (
          <button
            key={p.key}
            onClick={() => router.push(`/clientportal/${p.key}/${p.opportunityId}`)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-sm font-medium text-slate-900">{p.icon} {p.label}</span>
            <span className="text-xs text-slate-500">{p.caseStatus || 'Active'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
