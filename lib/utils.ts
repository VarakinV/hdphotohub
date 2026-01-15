import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a phone number to (XXX) XXX-XXXX format.
 * Handles both numeric and string inputs.
 * If already formatted or not a valid 10-digit number, returns as-is (stringified).
 */
export function formatPhoneNumber(phone: string | number | null | undefined): string {
  if (phone == null) return '';
  const str = String(phone).trim();
  // If already has formatting characters, return as-is
  if (/[().\-\s]/.test(str)) return str;
  // Extract only digits
  const digits = str.replace(/\D/g, '');
  // Format 10-digit numbers (North American)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // Format 11-digit numbers starting with 1 (North American with country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Return original string if can't format
  return str;
}