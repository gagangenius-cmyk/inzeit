'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Mail, Phone, RefreshCw, Camera, Briefcase, Building2, CalendarDays, UserCog, IdCard, HeartPulse } from 'lucide-react';
import { uploadFileToBlob } from '@/lib/uploadToBlob';
import InlineEditField from './InlineEditField';
import MfaSecurityPanel from './MfaSecurityPanel';

interface Profile {
  id: number;
  name: string;
  email: string | null;
  cemail: string | null;
  mobile: string | null;
  cmobile: string | null;
  address: string | null;
  paddress: string | null;
  photo: string | null;
  nationality: string | null;
  EID: string | null;
  doj: string | null;
  gender: string | null;
  work_location: string | null;
  em_local_name: string | null;
  em_local_number: string | null;
  em_home_name: string | null;
  em_home_number: string | null;
  roleName: string | null;
  branchName: string | null;
  regionName: string | null;
  departmentName: string | null;
  managerName: string | null;
  managerRoleName: string | null;
}

const emptyProfile: Profile = {
  id: 0, name: '', email: '', cemail: '', mobile: '', cmobile: '', address: '', paddress: '',
  photo: '', nationality: '', EID: '', doj: '', gender: '', work_location: '',
  em_local_name: '', em_local_number: '', em_home_name: '', em_home_number: '',
  roleName: '', branchName: '', regionName: '', departmentName: '', managerName: '', managerRoleName: '',
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';

const overviewField = (icon: React.ReactNode, label: string, value: string) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-slate-400">{icon}</div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value || '—'}</p>
    </div>
  </div>
);

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      if (res.ok && json.profile) {
        setProfile(json.profile);
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to load profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Each field saves itself independently (API accepts partial updates), so an
  // edit to one field never risks clobbering another field's in-flight edit.
  const saveField = async (field: keyof Profile, value: string) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update profile');
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploadingPhoto(true);
    setMessage(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadFileToBlob(file, `avatars/${profile.id}/${Date.now()}_${safeName}`);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: blob.url }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile photo updated.' });
        load();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to update profile photo' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload profile photo' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading profile…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your CRM account details.</p>
      </div>

      {message && (
        <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="group relative h-16 w-16 shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-lg font-semibold text-blue-600">
              {profile.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                initials(profile.name)
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
              title="Change photo"
            >
              {isUploadingPhoto ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg, image/png, image/webp, image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
            <p className="text-sm text-slate-500">{profile.roleName || 'Employee'} · {profile.branchName || 'No branch'}</p>
          </div>
        </div>
      </div>

      {/* Profile Overview: employment + contact details at a glance */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Profile Overview</h2>
        <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Employment Details</p>
            {overviewField(<IdCard className="h-4 w-4" />, 'Employee ID', profile.EID || '—')}
            {overviewField(<Building2 className="h-4 w-4" />, 'Branch', profile.branchName || '—')}
            {overviewField(<Briefcase className="h-4 w-4" />, 'Designation', profile.roleName || '—')}
            {overviewField(<Building2 className="h-4 w-4" />, 'Department', profile.departmentName || '—')}
            {overviewField(<CalendarDays className="h-4 w-4" />, 'Date Joined', formatDate(profile.doj))}
            {overviewField(<UserCog className="h-4 w-4" />, 'Reporting Manager', profile.managerName ? `${profile.managerName}${profile.managerRoleName ? ` (${profile.managerRoleName})` : ''}` : 'Not set')}
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact Details</p>
            {overviewField(<Mail className="h-4 w-4" />, 'Email', profile.email || profile.cemail || '—')}
            {overviewField(<Phone className="h-4 w-4" />, 'Phone', profile.mobile || profile.cmobile || '—')}
            {overviewField(<User className="h-4 w-4" />, 'Nationality', profile.nationality || '—')}
            {overviewField(
              <HeartPulse className="h-4 w-4" />,
              'Emergency Contact',
              profile.em_local_name || profile.em_local_number
                ? `${profile.em_local_name || 'Unnamed'} — ${profile.em_local_number || '—'}`
                : profile.em_home_name || profile.em_home_number
                  ? `${profile.em_home_name || 'Unnamed'} — ${profile.em_home_number || '—'}`
                  : 'Not on file'
            )}
          </div>
        </div>
        <p className="mt-5 text-xs text-slate-400">If any of the employment details above are incorrect, let HR know so your record can be updated.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Edit Details</h2>
        <p className="mt-1 text-xs text-slate-500">Hover a field and click the pencil to edit it — each field saves on its own.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InlineEditField
            label="Full Name"
            value={profile.name || ''}
            onSave={(value) => saveField('name', value)}
          />
          <InlineEditField
            label="Mobile"
            value={profile.mobile || ''}
            icon={<Phone className="h-4 w-4" />}
            onSave={(value) => saveField('mobile', value)}
          />
          <InlineEditField
            label="Nationality"
            value={profile.nationality || ''}
            onSave={(value) => saveField('nationality', value)}
          />
          <InlineEditField
            label="Address"
            value={profile.address || ''}
            onSave={(value) => saveField('address', value)}
          />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">Emergency Contact</h3>
          <p className="mt-1 text-xs text-slate-500">Shown on your Profile Overview above and visible to HR.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InlineEditField
              label="Contact Name"
              value={profile.em_local_name || ''}
              onSave={(value) => saveField('em_local_name', value)}
            />
            <InlineEditField
              label="Contact Number"
              value={profile.em_local_number || ''}
              onSave={(value) => saveField('em_local_number', value)}
            />
          </div>
        </div>
      </div>

      <MfaSecurityPanel />
    </div>
  );
}
