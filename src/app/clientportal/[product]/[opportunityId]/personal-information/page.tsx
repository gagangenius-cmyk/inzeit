'use client';

import { useEffect, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';

interface Profile {
  fname: string;
  lname: string;
  email: string;
  phone: string;
  mobile: string;
  dob: string | null;
  passport_number: string | null;
  address: string | null;
  nationality: string | null;
}

interface ChangeRequest {
  request_id: string;
  field: string;
  old_value: string | null;
  new_value: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700">{label}</label>
    <div className="mt-1 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      <span>{value || '—'}</span>
      <Lock className="h-3.5 w-3.5 text-slate-400" />
    </div>
  </div>
);

export default function PersonalInformationPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<'email' | 'phone' | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    fetch('/api/clientportal/personal-info')
      .then((res) => res.json())
      .then((json) => {
        setProfile(json.profile || null);
        setChangeRequests(json.changeRequests || []);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const startEdit = (field: 'email' | 'phone', current: string) => {
    setEditingField(field);
    setDraftValue(current);
    setMessage(null);
  };

  const submitChange = async () => {
    if (!editingField || !draftValue.trim()) return;
    const res = await fetch('/api/clientportal/personal-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: editingField, value: draftValue.trim() }),
    });
    if (res.ok) {
      setMessage('Change submitted — your case manager will confirm it shortly.');
      setEditingField(null);
      load();
    } else {
      const json = await res.json();
      setMessage(json.error || 'Failed to submit change');
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }
  if (!profile) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Profile could not be loaded.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-900">Personal Information</h1>
        <p className="mt-1 text-sm text-slate-500">
          Most details are set by your case manager and are read-only. You can update your email address and phone
          number yourself — changes are sent to your case manager for confirmation.
        </p>

        {message && <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">{message}</div>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Full legal name" value={`${profile.fname} ${profile.lname}`} />
          <ReadOnlyField label="Date of birth" value={formatDate(profile.dob)} />
          <ReadOnlyField label="Passport number" value={profile.passport_number || ''} />
          <ReadOnlyField label="Nationality" value={profile.nationality || ''} />

          <div>
            <label className="block text-sm font-medium text-slate-700">Email address <span className="font-normal text-blue-600">(editable)</span></label>
            {editingField === 'email' ? (
              <div className="mt-1 flex gap-2">
                <input value={draftValue} onChange={(e) => setDraftValue(e.target.value)} type="email"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                <button onClick={submitChange} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700">Submit</button>
                <button onClick={() => setEditingField(null)} className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-600">Cancel</button>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-800">{profile.email}</span>
                <button onClick={() => startEdit('email', profile.email)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Phone number <span className="font-normal text-blue-600">(editable)</span></label>
            {editingField === 'phone' ? (
              <div className="mt-1 flex gap-2">
                <input value={draftValue} onChange={(e) => setDraftValue(e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" />
                <button onClick={submitChange} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700">Submit</button>
                <button onClick={() => setEditingField(null)} className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-600">Cancel</button>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-800">{profile.mobile || profile.phone}</span>
                <button onClick={() => startEdit('phone', profile.mobile || profile.phone)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <ReadOnlyField label="Current address" value={profile.address || ''} />
          </div>
        </div>
      </div>

      {changeRequests.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">Personal Information Timeline</h2>
          <p className="mt-1 text-xs text-slate-500">History of your profile — including every email or phone number update, most recent first.</p>
          <div className="mt-4 space-y-3">
            {changeRequests.map((request) => (
              <div key={request.request_id} className="border-l-2 border-slate-200 pl-3">
                <p className="text-sm font-medium text-slate-800">
                  {request.field === 'email' ? 'Email address' : 'Phone number'} change {request.status === 'pending' ? 'requested' : request.status}
                </p>
                <p className="text-xs text-slate-500">Changed from &quot;{request.old_value || '—'}&quot; to &quot;{request.new_value}&quot;</p>
                <p className="text-xs text-slate-400">{new Date(request.requested_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
