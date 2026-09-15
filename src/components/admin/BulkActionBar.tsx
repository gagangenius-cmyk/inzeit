'use client';

import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';

interface BulkActionBarProps {
  selectedCount: number;
  busy?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onDelete: () => void;
  onClear: () => void;
  deleteConfirmMessage: string;
  entityLabel?: string;
}

export default function BulkActionBar({
  selectedCount,
  busy = false,
  onActivate,
  onDeactivate,
  onDelete,
  onClear,
  deleteConfirmMessage,
  entityLabel = 'item',
}: BulkActionBarProps) {
  const { user } = useAuth();
  // Delete is CEO-only across every CRM module (also enforced server-side).
  const canDelete = isCeo(user as any);

  if (selectedCount === 0) return null;

  const handleDelete = () => {
    if (confirm(deleteConfirmMessage)) onDelete();
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium whitespace-nowrap">
        {selectedCount} {entityLabel}{selectedCount === 1 ? '' : 's'} selected
      </span>
      {onActivate && (
        <button
          onClick={onActivate}
          disabled={busy}
          className="px-3 py-1.5 bg-green-600 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          Activate
        </button>
      )}
      {onDeactivate && (
        <button
          onClick={onDeactivate}
          disabled={busy}
          className="px-3 py-1.5 bg-amber-600 rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          Deactivate
        </button>
      )}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={busy}
          className="px-3 py-1.5 bg-red-600 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      )}
      <button
        onClick={onClear}
        disabled={busy}
        className="px-2 py-1.5 text-gray-300 hover:text-white text-sm disabled:opacity-50"
      >
        Clear
      </button>
    </div>
  );
}
