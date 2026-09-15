'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { getPusherClient, chatChannelName, type ChatPushMessage } from '@/lib/pusherClient';

interface ChatMessage {
  id: number;
  text: string;
  file: string | null;
  fromClient: boolean;
  created: string;
}

interface ClientChatPanelProps {
  leadId: number;
  opportunityId: number;
}

// Two-way channel with the client's own portal chat
// (src/app/api/clientportal/[opportunityId]/conversation) - both sides read/write
// the same crm_client_conversations rows, so a message sent here appears in the
// client's portal immediately and vice versa. Real-time push is via Pusher
// (src/lib/pusherServer.ts / pusherClient.ts) when configured; this poll is
// the fallback/reconciliation path that keeps working either way.
const POLL_INTERVAL_MS = 6000;

export default function ClientChatPanel({ leadId, opportunityId }: ClientChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ leadId: String(leadId), opportunityId: String(opportunityId) });
      const res = await fetch(`/api/admin/operations/client-chat?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setMessages(json.messages || []);
    } catch (error) {
      console.error('Failed to load client chat:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [leadId, opportunityId]);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [load]);

  // Live push on top of the poll above — when configured, new messages
  // arrive here the instant the other side sends, instead of waiting for
  // the next poll tick.
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(chatChannelName(opportunityId));
    const handleNewMessage = (message: ChatPushMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    channel.bind('new-message', handleNewMessage);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      pusher.unsubscribe(chatChannelName(opportunityId));
    };
  }, [opportunityId]);

  useEffect(() => {
    if (messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/operations/client-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, opportunityId, text }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to send message');
      setDraft('');
      await load(true);
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Client Chat</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-800">Messages here go straight to the client&apos;s own portal chat, and their replies show up here — no separate sync step.</p>
      </div>

      <div className="flex h-96 flex-col rounded-lg border border-gray-200">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
              <MessageSquare size={28} className="mb-2 text-gray-300" />
              No messages yet. Say hello.
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.fromClient ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  message.fromClient
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                {message.file && (
                  <a href={message.file} target="_blank" rel="noreferrer" className={`mt-1 block text-xs underline ${message.fromClient ? 'text-blue-700' : 'text-blue-100'}`}>
                    View attachment
                  </a>
                )}
                <p className={`mt-1 text-[10px] ${message.fromClient ? 'text-gray-400' : 'text-blue-100'}`}>
                  {message.fromClient ? 'Client' : 'You'} · {new Date(message.created).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-gray-200 p-3">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Type a message to the client..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
