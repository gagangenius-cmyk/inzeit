'use client';

import { useEffect } from 'react';
import { z } from 'zod';

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const ERROR_CLASS = 'dm-form-error-message';
const INVALID_CLASS = 'dm-form-invalid';

function fieldLabel(field: FieldElement): string {
  const ariaLabel = field.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const id = field.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent) return label.textContent.replace('*', '').trim();
  }

  const parentLabel = field.closest('label');
  if (parentLabel?.textContent) return parentLabel.textContent.replace('*', '').trim();

  const name = field.name || field.getAttribute('data-label') || 'This field';
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRequired(field: FieldElement): boolean {
  return field.required || field.getAttribute('data-required') === 'true';
}

function schemaForField(field: FieldElement) {
  const label = fieldLabel(field);
  const required = isRequired(field);

  if (field instanceof HTMLInputElement && field.type === 'file') {
    return z
      .custom<FileList>((value) => value instanceof FileList && (!required || value.length > 0), {
        message: `${label} is required.`,
      });
  }

  let schema = z.string();

  if (required) {
    schema = schema.trim().min(1, `${label} is required.`);
  } else {
    schema = schema.optional().or(z.literal('')) as unknown as z.ZodString;
  }

  const type = field instanceof HTMLInputElement ? field.type : '';
  if (type === 'email') {
    schema = schema.refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: `Enter a valid ${label.toLowerCase()}.`,
    });
  }

  if (type === 'url') {
    schema = schema.refine((value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, { message: `Enter a valid ${label.toLowerCase()}.` });
  }

  if (type === 'number' || field.getAttribute('inputmode') === 'numeric') {
    const min = field.getAttribute('min');
    const max = field.getAttribute('max');
    schema = schema.refine((value) => !value || Number.isFinite(Number(value)), {
      message: `${label} must be a number.`,
    });
    if (min !== null) {
      schema = schema.refine((value) => !value || Number(value) >= Number(min), {
        message: `${label} must be at least ${min}.`,
      });
    }
    if (max !== null) {
      schema = schema.refine((value) => !value || Number(value) <= Number(max), {
        message: `${label} must be at most ${max}.`,
      });
    }
  }

  const minLength = field.getAttribute('minlength');
  if (minLength !== null) {
    schema = schema.refine((value) => !value || value.length >= Number(minLength), {
      message: `${label} must be at least ${minLength} characters.`,
    });
  }

  const maxLength = field.getAttribute('maxlength');
  if (maxLength !== null && Number(maxLength) > -1) {
    schema = schema.refine((value) => !value || value.length <= Number(maxLength), {
      message: `${label} must be ${maxLength} characters or fewer.`,
    });
  }

  const pattern = field.getAttribute('pattern');
  if (pattern) {
    const regex = new RegExp(`^(?:${pattern})$`);
    schema = schema.refine((value) => !value || regex.test(value), {
      message: field.getAttribute('title') || `${label} is not in the expected format.`,
    });
  }

  return schema;
}

function fieldValue(field: FieldElement) {
  if (field instanceof HTMLInputElement && field.type === 'file') return field.files;
  if (field instanceof HTMLInputElement && field.type === 'checkbox') {
    return field.checked ? field.value || 'on' : '';
  }
  if (field instanceof HTMLInputElement && field.type === 'radio') {
    const checked = field.form?.querySelector<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(field.name)}"]:checked`);
    return checked?.value || '';
  }
  return field.value;
}

function clearErrors(form: HTMLFormElement) {
  form.querySelectorAll(`.${ERROR_CLASS}`).forEach((node) => node.remove());
  form.querySelectorAll(`.${INVALID_CLASS}`).forEach((node) => node.classList.remove(INVALID_CLASS));
}

function showError(field: FieldElement, message: string) {
  field.classList.add(INVALID_CLASS);
  field.setAttribute('aria-invalid', 'true');

  const container = field.closest('[data-field], label, .space-y-1, .space-y-2, .space-y-3, div') || field.parentElement;
  const error = document.createElement('p');
  error.className = `${ERROR_CLASS} mt-1 flex items-start gap-1.5 text-sm font-medium text-red-600`;
  error.textContent = message;
  (container || field).insertAdjacentElement('afterend', error);
}

function validateForm(form: HTMLFormElement): boolean {
  if (form.dataset.disableClientValidation === 'true') return true;

  clearErrors(form);

  const fields = Array.from(
    form.querySelectorAll<FieldElement>('input[name], select[name], textarea[name]')
  ).filter((field) => {
    if (field.disabled) return false;
    if (field instanceof HTMLInputElement && (field.type === 'button' || field.type === 'submit' || field.type === 'reset')) return false;
    return true;
  });

  const shape: Record<string, z.ZodTypeAny> = {};
  const values: Record<string, unknown> = {};
  const firstFieldByName = new Map<string, FieldElement>();

  for (const field of fields) {
    if (!field.name || firstFieldByName.has(field.name)) continue;
    firstFieldByName.set(field.name, field);
    shape[field.name] = schemaForField(field);
    values[field.name] = fieldValue(field);
  }

  const result = z.object(shape).safeParse(values);
  if (result.success) return true;

  const shown = new Set<string>();
  for (const issue of result.error.issues) {
    const name = String(issue.path[0] || '');
    if (!name || shown.has(name)) continue;
    const field = firstFieldByName.get(name);
    if (field) showError(field, issue.message);
    shown.add(name);
  }

  const firstInvalidName = String(result.error.issues[0]?.path[0] || '');
  const firstInvalid = firstFieldByName.get(firstInvalidName);
  firstInvalid?.focus({ preventScroll: true });
  firstInvalid?.scrollIntoView({ block: 'center', behavior: 'smooth' });

  window.toast?.error('Please fix the highlighted fields before submitting.');
  return false;
}

export function FormValidationProvider() {
  useEffect(() => {
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!validateForm(form)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const onInput = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      field.classList.remove(INVALID_CLASS);
      field.removeAttribute('aria-invalid');
      const nearby = field.parentElement?.nextElementSibling;
      if (nearby?.classList.contains(ERROR_CLASS)) nearby.remove();
    };

    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);

    return () => {
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onInput, true);
    };
  }, []);

  return null;
}

