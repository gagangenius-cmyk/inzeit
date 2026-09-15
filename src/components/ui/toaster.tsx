'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { toast, TOAST_EVENT, type ToastInput, type ToastVariant } from '@/lib/toast';

type ToastItem = Required<Pick<ToastInput, 'message' | 'variant' | 'durationMs'>> & {
  id: number;
  title?: string;
};

const DEFAULT_DURATION_MS = 4500;

const variantClasses: Record<ToastVariant, string> = {
  info: 'border-slate-200 bg-white text-slate-900',
  success: 'border-green-200 bg-green-50 text-green-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
};

const iconClasses: Record<ToastVariant, string> = {
  info: 'text-slate-500',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
};

function inferVariant(message: string): ToastVariant {
  const text = message.toLowerCase();
  if (/\b(success|saved|created|updated|deleted|completed|approved|submitted|uploaded)\b/.test(text)) {
    return 'success';
  }
  if (/\b(error|failed|missing|required|invalid|blocked|rejected|denied|cannot|unable)\b/.test(text)) {
    return 'error';
  }
  if (/\b(warning|please|confirm|allow|wait)\b/.test(text)) {
    return 'warning';
  }
  return 'info';
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const className = `mt-0.5 h-5 w-5 shrink-0 ${iconClasses[variant]}`;
  if (variant === 'success') return <CheckCircle2 className={className} />;
  if (variant === 'error') return <XCircle className={className} />;
  if (variant === 'warning') return <AlertCircle className={className} />;
  return <Info className={className} />;
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useMemo(
    () => (id: number) => setItems((current) => current.filter((item) => item.id !== id)),
    []
  );

  useEffect(() => {
    const pushToast = (input: ToastInput) => {
      const message = String(input.message ?? '').trim();
      if (!message) return;

      const item: ToastItem = {
        id: ++idRef.current,
        title: input.title,
        message,
        variant: input.variant || inferVariant(message),
        durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
      };

      setItems((current) => [item, ...current].slice(0, 5));
      if (item.durationMs > 0) {
        window.setTimeout(() => remove(item.id), item.durationMs);
      }
    };

    const onToast = (event: Event) => {
      pushToast((event as CustomEvent<ToastInput>).detail);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    window.toast = toast;

    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
    };
  }, [remove]);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[10000] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          aria-live="polite"
          className={`flex gap-3 rounded-lg border p-4 shadow-lg shadow-slate-900/10 ${variantClasses[item.variant]}`}
        >
          <ToastIcon variant={item.variant} />
          <div className="min-w-0 flex-1">
            {item.title && <div className="text-sm font-semibold">{item.title}</div>}
            <div className="whitespace-pre-line break-words text-sm leading-5">{item.message}</div>
          </div>
          <button
            type="button"
            onClick={() => remove(item.id)}
            className="rounded-md p-1 text-slate-500 transition hover:bg-black/5 hover:text-slate-900"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
