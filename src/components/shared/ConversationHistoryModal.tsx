'use client';

import { useEffect, useState } from 'react';
import { X, MessageSquare, User, RefreshCw } from 'lucide-react';

interface HandoverNote {
  id: number;
  lead_id: number;
  opportunity_id: number | null;
  counselor_id: number | null;
  conversation_summary: string;
  client_commitments: string | null;
  next_action: string | null;
  created_at: string;
  counselorName: string | null;
}

interface ConversationHistoryModalProps {
  leadId: number | null;
  clientName?: string;
  onClose: () => void;
}

export default function ConversationHistoryModal({ leadId, clientName, onClose }: ConversationHistoryModalProps) {
  const [notes, setNotes] = useState<HandoverNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!leadId) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/opportunity-handover-notes?leadId=${leadId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load conversation history');
        setNotes(json.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation history');
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId]);

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Conversation History{clientName ? ` — ${clientName}` : ''}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : notes.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No conversation summaries recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      {note.counselorName || 'Unknown counselor'}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{note.conversation_summary}</p>
                  {note.client_commitments && (
                    <p className="mt-2 text-xs text-gray-600"><span className="font-medium">Client commitments:</span> {note.client_commitments}</p>
                  )}
                  {note.next_action && (
                    <p className="mt-1 text-xs text-gray-600"><span className="font-medium">Next action:</span> {note.next_action}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
