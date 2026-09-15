'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, RefreshCw, Copy, Check } from 'lucide-react';

type Stage = 'loading' | 'idle' | 'enrolling' | 'confirming' | 'backup-codes';

interface MfaStatus {
  enabled: boolean;
  pendingEnrollment: boolean;
}

export default function MfaSecurityPanel() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/auth/mfa/status');
      const json = await res.json();
      if (res.ok) {
        setStatus(json);
        setStage('idle');
      } else {
        setError(json.error || 'Failed to load two-factor status');
        setStage('idle');
      }
    } catch {
      setError('Failed to load two-factor status');
      setStage('idle');
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const startEnrollment = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/mfa/enroll', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start setup');
      setSecret(json.secret);
      setStage('enrolling');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start setup');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrollment = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/mfa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invalid code');
      setBackupCodes(json.backupCodes || []);
      setStage('backup-codes');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const finishEnrollment = () => {
    setBackupCodes([]);
    setSecret('');
    loadStatus();
  };

  const disableMfa = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to disable');
      setPassword('');
      setShowDisableForm(false);
      loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable two-factor authentication');
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the secret is still visible to copy by hand.
    }
  };

  if (stage === 'loading') {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center text-sm text-slate-500">
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading two-factor authentication settings…
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-900">Two-Factor Authentication</h2>
      <p className="mt-1 text-xs text-slate-500">
        Adds a second step to sign-in using an authenticator app (Google Authenticator, Authy, 1Password, etc).
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {stage === 'idle' && status && !status.enabled && (
        <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldOff className="h-4 w-4 text-slate-400" />
            Two-factor authentication is off
          </div>
          <button
            type="button"
            onClick={startEnrollment}
            disabled={busy}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Enable
          </button>
        </div>
      )}

      {stage === 'idle' && status && status.enabled && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Two-factor authentication is on
            </div>
            <button
              type="button"
              onClick={() => setShowDisableForm((v) => !v)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Disable
            </button>
          </div>

          {showDisableForm && (
            <div className="rounded-md border border-slate-200 p-4">
              <label className="block text-xs font-medium text-slate-600">Confirm your password to disable</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  placeholder="Current password"
                />
                <button
                  type="button"
                  onClick={disableMfa}
                  disabled={busy || !password}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Disable
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === 'enrolling' && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-600">1. Add this key to your authenticator app</p>
            <p className="mt-1 text-xs text-slate-400">Choose &quot;Enter a setup key manually&quot; and use the account name and key below.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded-md bg-slate-100 px-3 py-2 text-sm tracking-wider text-slate-800">{secret}</code>
              <button
                type="button"
                onClick={copySecret}
                className="rounded-md border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
                title="Copy key"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600">2. Enter the 6-digit code it generates</p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm tracking-widest"
                placeholder="123456"
              />
              <button
                type="button"
                onClick={confirmEnrollment}
                disabled={busy || code.length !== 6}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => { setStage('idle'); setSecret(''); setCode(''); setError(''); }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'backup-codes' && (
        <div className="mt-4 space-y-3">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Save these one-time backup codes somewhere safe. Each can be used once to sign in if you lose access to your authenticator app. They will not be shown again.
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-4 sm:grid-cols-4">
            {backupCodes.map((c) => (
              <code key={c} className="text-center text-sm font-mono text-slate-800">{c}</code>
            ))}
          </div>
          <button
            type="button"
            onClick={finishEnrollment}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            I&apos;ve saved these codes
          </button>
        </div>
      )}
    </div>
  );
}
