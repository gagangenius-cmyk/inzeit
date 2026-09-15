'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard, User, FileText, ListChecks, BarChart3, FileStack,
  Paperclip, MessageSquare, Landmark, LogOut,
} from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { getClientPortalProduct } from '@/lib/clientPortalProducts';

interface ProductRow {
  key: string;
  label: string;
  icon: string;
  status: 'active' | 'not_started';
  opportunityId: number | null;
  caseStatus: string | null;
}

export default function ProductPortalShell({ children }: { children: React.ReactNode }) {
  const { client, logout } = useClientAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ product: string; opportunityId: string }>();
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    fetch('/api/clientportal/products')
      .then((res) => res.json())
      .then((json) => setProducts(json.products || []))
      .catch(() => setProducts([]));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/clientportal/login');
  };

  const product = params?.product;
  const opportunityId = params?.opportunityId;
  const base = product && opportunityId ? `/clientportal/${product}/${opportunityId}` : null;
  const productDef = getClientPortalProduct(product);

  const myCaseNav = base ? [
    { name: 'Overview', href: base, icon: LayoutDashboard },
    { name: 'Personal Information', href: `${base}/personal-information`, icon: User },
    { name: 'Agreement Copy', href: `${base}/agreement-copy`, icon: FileText },
    { name: 'Process Checklist', href: `${base}/process-checklist`, icon: ListChecks },
    ...(productDef?.hasEligibilityScores ? [{ name: 'Eligibility & Scores', href: `${base}/eligibility-scores`, icon: BarChart3 }] : []),
    { name: 'Forms & Templates', href: `${base}/forms-templates`, icon: FileStack },
    { name: 'Document Upload', href: `${base}/document-upload`, icon: Paperclip },
    { name: 'Conversation', href: `${base}/conversation`, icon: MessageSquare },
    { name: 'Contact CPO', href: `${base}/contact-cpo`, icon: Landmark },
  ] : [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
          <span className="text-lg font-bold text-slate-900">Global Navigator Client Portal</span>
        </div>

        <div className="p-3">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">My Case</p>
          <nav className="space-y-1">
            {myCaseNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-3">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Products (Workflow Modules)</p>
          <nav className="space-y-1">
            {products.map((row) => {
              const isCurrent = row.key === product;
              const clickable = row.status === 'active' && row.opportunityId;
              return (
                <button
                  key={row.key}
                  disabled={!clickable}
                  onClick={() => clickable && router.push(`/clientportal/${row.key}/${row.opportunityId}`)}
                  className={`flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm ${
                    isCurrent ? 'bg-slate-800 text-white' : clickable ? 'text-slate-600 hover:bg-slate-100' : 'cursor-not-allowed text-slate-300'
                  }`}
                >
                  <span className="font-medium">{row.icon} {row.label}</span>
                  <span className={`text-[11px] ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>
                    {row.status === 'active' ? (row.caseStatus || 'Active') : 'Not started'}
                  </span>
                </button>
              );
            })}
          </nav>
          <p className="mt-2 px-3 text-[11px] text-slate-400">+ Add product — Configured by Global Navigator team</p>
        </div>

        <div className="mt-auto border-t border-slate-200 p-3">
          <div className="mb-2 px-3 text-xs text-slate-500">{client?.name}</div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
      <div className="ml-64 flex-1 p-6">{children}</div>
    </div>
  );
}
