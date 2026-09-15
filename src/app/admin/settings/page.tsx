'use client';

import { useEffect, useState } from 'react';
import { Bell, Lock, MessageCircle, RefreshCw, Save } from 'lucide-react';

interface Preferences {
  emailNotifications: boolean;
  leadAlerts: boolean;
  appointmentReminders: boolean;
  paymentAlerts: boolean;
  whatsappTemplate: string;
}

const defaultPreferences: Preferences = {
  emailNotifications: true,
  leadAlerts: true,
  appointmentReminders: true,
  paymentAlerts: true,
  whatsappTemplate: '',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'whatsapp' | 'security'>('notifications');
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (res.ok && json.preferences) setPreferences(json.preferences);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePreference = (key: keyof Preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      const json = await res.json();
      setMessage(res.ok
        ? { type: 'success', text: 'Notification preferences saved.' }
        : { type: 'error', text: json.error || 'Failed to save preferences' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ type: 'error', text: json.error || 'Failed to change password' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle },
    { id: 'security' as const, label: 'Security', icon: Lock },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your notification preferences and account security.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200">
          <nav className="flex gap-6 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              {message && (
                <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}
              {([
                ['emailNotifications', 'Email Notifications', 'Receive notifications via email'],
                ['leadAlerts', 'Lead Alerts', 'Get notified when new leads are assigned to you'],
                ['appointmentReminders', 'Appointment Reminders', 'Get reminded about your upcoming appointments'],
                ['paymentAlerts', 'Payment Alerts', 'Get notified about payments on your leads'],
              ] as const).map(([key, label, description]) => (
                <div key={key} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => togglePreference(key)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              {message && (
                <div className={`rounded-md border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-800">Default WhatsApp Message</p>
                <p className="text-xs text-slate-500">
                  Sent as the pre-filled message whenever you click the WhatsApp icon next to a lead&apos;s number.
                </p>
                <textarea
                  value={preferences.whatsappTemplate}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, whatsappTemplate: e.target.value }))}
                  rows={4}
                  placeholder="Hi, this is Inzeit Business Consultants reaching out regarding your enquiry..."
                  className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSavePreferences}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save Message'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
              {passwordMessage && (
                <div className={`rounded-md border px-4 py-3 text-sm ${passwordMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {passwordMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  {isChangingPassword ? 'Updating…' : 'Change Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
