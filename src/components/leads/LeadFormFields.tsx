'use client';

// Shared, modern presentational primitives for the Add Lead and Edit Lead
// pages (src/app/admin/leads/create/page.tsx and src/app/admin/leads/[id]/edit/page.tsx).
// Both pages independently hand-rolled ~40 near-identical field blocks with
// flat gray-300-bordered inputs — this file is the single place that now
// owns their look, built on the app's existing --cmg-* brand tokens
// (globals.css) rather than a one-off palette, so it stays visually
// consistent with the rest of the CRM (login, dashboard shell) instead of
// introducing a third look. Purely visual — no field logic/behavior lives
// here, so both pages keep their own state, validation, and submit handling
// untouched.

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

export const inputClass =
  'w-full rounded-lg border border-[var(--cmg-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--cmg-ink)] placeholder:text-gray-400 cmg-focus transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

export function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--cmg-border)] bg-white shadow-[0_10px_30px_rgba(15,48,8,0.06)]">
      <div className="flex items-center gap-3 rounded-t-2xl border-b border-[var(--cmg-border)]/70 bg-[var(--dmc-green-softer)] px-6 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function Field({
  label,
  required,
  wide,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  wide?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={wide ? 'md:col-span-2 lg:col-span-full' : ''}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function TextField({
  name,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  icon: Icon,
  hint,
  wide,
}: {
  name: string;
  label: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  icon?: LucideIcon;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <Field label={label} required={required} hint={hint} wide={wide}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          className={`${inputClass} ${Icon ? 'pl-9' : ''}`}
        />
      </div>
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  value,
  onChange,
  rows = 3,
  wide = true,
  placeholder,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  wide?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label} wide={wide}>
      <textarea name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder} className={inputClass} />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  value,
  onChange,
  children,
  required,
  disabled,
  loading,
  hint,
}: {
  name?: string;
  label: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint}>
      <div className="relative">
        <SearchableSelect name={name} value={value} onChange={onChange} disabled={disabled} className={`${inputClass} ${disabled ? 'disabled:bg-gray-50' : ''}`}>
          {children}
        </SearchableSelect>
        {loading && <Loader2 className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />}
      </div>
    </Field>
  );
}

export function CheckboxField({
  name,
  label,
  checked,
  onChange,
  description,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}) {
  return (
    <label className="flex h-full cursor-pointer items-start gap-3 rounded-lg border border-[var(--cmg-border)] px-3.5 py-3 transition-colors hover:bg-[var(--dmc-green-softer)] has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
      />
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {description && <span className="block text-xs text-gray-500">{description}</span>}
      </span>
    </label>
  );
}

export function FormPageHeader({
  eyebrow,
  title,
  badge,
  onBack,
  backLabel = 'Back to Leads',
}: {
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        title={backLabel}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--cmg-border)] bg-white text-gray-500 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
          {badge}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {eyebrow || (
            <>
              <span className="text-red-500">*</span> = Required information
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function FormActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-6 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--cmg-border)] bg-white/95 px-6 py-4 shadow-[0_10px_40px_rgba(15,48,8,0.15)] backdrop-blur">
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  type = 'submit',
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--cmg-border)] bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
    >
      {children}
    </button>
  );
}
