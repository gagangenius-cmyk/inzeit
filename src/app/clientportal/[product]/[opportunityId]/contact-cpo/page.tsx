'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';

interface ContactCpo {
  cpoAssigned: boolean;
  cpoName: string | null;
  cpoEmail: string | null;
  cpoMobile: string | null;
  caseManagerName: string | null;
  caseManagerEmail: string | null;
  caseManagerMobile: string | null;
}

export default function ContactCpoPage() {
  const params = useParams<{ product: string; opportunityId: string }>();
  const [contact, setContact] = useState<ContactCpo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/clientportal/${params.opportunityId}/contact-cpo`)
      .then((res) => res.json())
      .then((json) => setContact(json))
      .finally(() => setIsLoading(false));
  }, [params.opportunityId]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }
  if (!contact) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Could not be loaded.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900">Case Processing Officer (CPO)</h1>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${contact.cpoAssigned ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {contact.cpoAssigned ? 'Assigned' : 'Not Yet Assigned'}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Once your application is filed with the visa office, a Case Processing Officer / office is assigned to
          handle your file. Their details will appear here as soon as your case manager receives them.
        </p>

        {contact.cpoAssigned ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-sm text-slate-500">Name</span><span className="text-sm font-medium text-slate-900">{contact.cpoName}</span></div>
            {contact.cpoEmail && <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-sm text-slate-500">Email</span><span className="text-sm font-medium text-slate-900">{contact.cpoEmail}</span></div>}
            {contact.cpoMobile && <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Phone</span><span className="text-sm font-medium text-slate-900">{contact.cpoMobile}</span></div>}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            A CPO is normally assigned only after your application is filed — your case manager will update this page
            the moment the processing office assigns one.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Contact about your case</h2>
        <p className="mt-1 text-xs text-slate-500">
          Processing officers are not directly contactable by clients. For any questions about your file or
          processing status, message your Global Navigator case manager — they liaise with the processing office on your behalf.
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-sm text-slate-500">Case manager</span><span className="text-sm font-medium text-slate-900">{contact.caseManagerName || 'Not yet assigned'}</span></div>
          {contact.caseManagerEmail && <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-sm text-slate-500">Email</span><span className="text-sm font-medium text-slate-900">{contact.caseManagerEmail}</span></div>}
          {contact.caseManagerMobile && <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Phone</span><span className="text-sm font-medium text-slate-900">{contact.caseManagerMobile}</span></div>}
        </div>
        <Link
          href={`/clientportal/${params.product}/${params.opportunityId}/conversation`}
          className="mt-4 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Message Case Manager
        </Link>
      </div>
    </div>
  );
}
