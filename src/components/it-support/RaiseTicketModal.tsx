'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ITSupportCategoryOptions, ITSupportPriorityOptions } from './statusStyles';

interface Branch {
  id: number;
  name: string;
}

export default function RaiseTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { token } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<typeof ITSupportCategoryOptions[number]>('Laptop / Desktop Hardware');
  const [priority, setPriority] = useState<typeof ITSupportPriorityOptions[number]>('Medium');
  const [branchId, setBranchId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/lookup', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.branches) setBranches(data.branches); })
      .catch(() => {});
  }, [token]);

  const isProcurement = category === 'New Procurement';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (isProcurement && !estimatedCost) { setError('Estimated cost is required for New Procurement tickets'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/it-support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          priority,
          branch_id: branchId ? Number(branchId) : null,
          estimated_cost_aed: isProcurement ? Number(estimatedCost) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to raise ticket');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Raise a ticket</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Laptop screen flickering, sometimes goes black"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {ITSupportCategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {ITSupportPriorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">My branch (default)</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>

          {isProcurement && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estimated cost (AED)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">Procurement requests above the configured threshold also require Director approval.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60">
              {submitting ? 'Raising…' : 'Raise ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
