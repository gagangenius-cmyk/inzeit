'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductPortalShell from '@/components/clientportal/ProductPortalShell';

interface ProductRow {
  key: string;
  label: string;
  status: 'active' | 'not_started';
  opportunityId: number | null;
}

// Confirms the :product URL segment actually matches this opportunity's real product_type
// before rendering anything - a client can't view one product's case data under another
// product's URL/nav context just by editing the address bar.
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ product: string; opportunityId: string }>();
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok' | 'invalid'>('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/clientportal/products')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const products: ProductRow[] = json.products || [];
        const match = products.find((p) => p.status === 'active' && String(p.opportunityId) === params.opportunityId);
        if (!match) {
          setState('invalid');
        } else if (match.key !== params.product) {
          router.replace(`/clientportal/${match.key}/${params.opportunityId}`);
        } else {
          setState('ok');
        }
      })
      .catch(() => !cancelled && setState('invalid'));
    return () => { cancelled = true; };
  }, [params.product, params.opportunityId, router]);

  if (state === 'checking') {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  if (state === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Case not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This case doesn&apos;t exist or isn&apos;t verified for your account.
          </p>
        </div>
      </div>
    );
  }

  return <ProductPortalShell>{children}</ProductPortalShell>;
}
