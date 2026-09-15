'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/contexts/ClientAuthContext';

export default function ClientChangePasswordPage() {
  const { client, login } = useClientAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/client-portal-auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const json = await res.json();
      if (res.ok) {
        if (client) login({ ...client, mustChangePassword: false });
        router.push('/clientportal');
      } else {
        setError(json.error || 'Failed to change password');
      }
    } catch {
      setError('Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        {client?.mustChangePassword && (
          <p className="mt-1 text-sm text-amber-600">You must set a new password before continuing.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save Password'}
        </button>
      </form>
      </div>
    </div>
  );
}
