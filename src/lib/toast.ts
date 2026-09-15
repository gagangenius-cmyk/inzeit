export type ToastVariant = 'info' | 'success' | 'error' | 'warning';

export type ToastInput = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

export const TOAST_EVENT = 'dm:toast';

export type ToastApi = {
  (input: string | ToastInput, variant?: ToastVariant): void;
  info(message: string, options?: Omit<ToastInput, 'message' | 'variant'>): void;
  success(message: string, options?: Omit<ToastInput, 'message' | 'variant'>): void;
  error(message: string, options?: Omit<ToastInput, 'message' | 'variant'>): void;
  warning(message: string, options?: Omit<ToastInput, 'message' | 'variant'>): void;
};

declare global {
  interface Window {
    toast: ToastApi;
  }
}

export const toast: ToastApi = (input: string | ToastInput, variant: ToastVariant = 'info') => {
  if (typeof window === 'undefined') return;

  const detail: ToastInput =
    typeof input === 'string'
      ? { message: input, variant }
      : { ...input, variant: input.variant || variant };

  window.dispatchEvent(new CustomEvent<ToastInput>(TOAST_EVENT, { detail }));
};

toast.info = (message: string, options: Omit<ToastInput, 'message' | 'variant'> = {}) =>
  toast({ ...options, message, variant: 'info' });

toast.success = (message: string, options: Omit<ToastInput, 'message' | 'variant'> = {}) =>
  toast({ ...options, message, variant: 'success' });

toast.error = (message: string, options: Omit<ToastInput, 'message' | 'variant'> = {}) =>
  toast({ ...options, message, variant: 'error' });

toast.warning = (message: string, options: Omit<ToastInput, 'message' | 'variant'> = {}) =>
  toast({ ...options, message, variant: 'warning' });
