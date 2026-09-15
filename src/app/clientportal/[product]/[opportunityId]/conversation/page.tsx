'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';
import { getPusherClient, chatChannelName, type ChatPushMessage } from '@/lib/pusherClient';

interface Message {
  id: number;
  text: string;
  file: string | null;
  fromClient: boolean;
  created: string;
}

// Poll interval mirrors the staff-side ClientChatPanel — kept as a fallback/
// reconciliation path underneath the Pusher push subscribed to below.
const POLL_INTERVAL_MS = 6000;

export default function ConversationPage() {
  const params = useParams<{ opportunityId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await fetch(`/api/clientportal/${params.opportunityId}/conversation`);
    const json = await res.json();
    if (res.ok) setMessages(json.messages || []);
  };

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));

    const interval = window.setInterval(load, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.opportunityId]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher || !params.opportunityId) return;

    const opportunityId = Number(params.opportunityId);
    const channel = pusher.subscribe(chatChannelName(opportunityId));
    const handleNewMessage = (message: ChatPushMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    channel.bind('new-message', handleNewMessage);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      pusher.unsubscribe(chatChannelName(opportunityId));
    };
  }, [params.opportunityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/clientportal/${params.opportunityId}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft.trim() }),
      });
      if (res.ok) {
        setDraft('');
        await load();
      }
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-4xl flex-col rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-6">
        <h1 className="text-lg font-semibold text-slate-900">Conversation with your case manager</h1>
        <p className="mt-1 text-sm text-slate-500">Message your case manager about this case.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {messages.length === 0 && <p className="text-sm text-slate-400">No messages yet — say hello.</p>}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.fromClient ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${message.fromClient ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <p>{message.text}</p>
              <p className={`mt-1 text-[10px] ${message.fromClient ? 'text-blue-100' : 'text-slate-400'}`}>
                {message.fromClient ? 'You' : 'Case manager'} · {new Date(message.created).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 p-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <button
          onClick={send}
          disabled={isSending || !draft.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </div>
    </div>
  );
}
