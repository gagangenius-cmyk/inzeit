import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Used by the Add/Edit Lead forms to auto-fill the Age field from Date of
// Birth. Returns '' for an empty/invalid/future date rather than throwing,
// since it runs on every keystroke of a partially-typed date input.
export function calculateAgeFromDob(dob: string): string {
  if (!dob) return '';
  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return '';
  const today = new Date();
  if (birthDate > today) return '';

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return String(Math.max(age, 0));
}
