import { PhoneStatus } from '@/types';

export interface PhoneParseResult {
  raw: string;
  e164: string;
  status: PhoneStatus;
  formatted: string;
}

export function normalizePhoneNumber(input: any): PhoneParseResult {
  if (input === null || input === undefined) {
    return { raw: '', e164: '', status: 'missing', formatted: 'Tidak ada nomor' };
  }

  let str = String(input).trim();
  const raw = str;

  if (!str || str === '0' || str === '0.0' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
    return { raw, e164: '', status: 'missing', formatted: 'Tidak ada nomor' };
  }

  // Remove scientific notation if any, e.g. 8.9654e+10 or trailing decimal .0
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }

  // Remove all non-digits
  let digits = str.replace(/\D/g, '');

  if (!digits || digits === '0') {
    return { raw, e164: '', status: 'missing', formatted: 'Tidak ada nomor' };
  }

  // Handle leading cases:
  // e.g. '0812...' -> replace leading '0' with '62'
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    // e.g. '812...' -> prepend '62'
    digits = '62' + digits;
  } else if (digits.startsWith('62')) {
    // already starts with 62
  } else {
    // international format or unknown prefix
  }

  // Validation: Indonesian mobile numbers: usually 628... and total length between 11 and 15 digits
  const isValid = digits.startsWith('628') && digits.length >= 11 && digits.length <= 15;

  if (!isValid) {
    return {
      raw,
      e164: digits,
      status: digits.length > 5 ? 'invalid' : 'missing',
      formatted: digits ? `Format tidak valid (${digits})` : 'Tidak ada nomor',
    };
  }

  // Formatted display: e.g. +62 812-3456-7890
  const formatted = `+${digits.slice(0, 2)} ${digits.slice(2, 5)}-${digits.slice(5, 9)}-${digits.slice(9)}`;

  return {
    raw,
    e164: digits,
    status: 'valid',
    formatted,
  };
}
