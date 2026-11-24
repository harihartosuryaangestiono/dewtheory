/**
 * Translates Supabase authentication errors to clean, friendly Bahasa Indonesia.
 * Security requirement: NEVER differentiate between "email not found" and "wrong password".
 */
export function translateAuthError(error: any): string {
  if (!error) return 'Terjadi kesalahan sistem. Silakan coba lagi.';

  const message = (typeof error === 'string' ? error : error.message || '').toLowerCase();
  const code = (error.code || error.error_code || '').toLowerCase();

  // Network or connection failure
  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  ) {
    return 'Tidak bisa terhubung ke server. Periksa koneksi internet.';
  }

  // Rate limiting / too many attempts
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('over_request_rate_limit') ||
    code.includes('over_request_rate_limit') ||
    code.includes('over_email_send_rate_limit')
  ) {
    return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
  }

  // Email unconfirmed
  if (
    message.includes('email not confirmed') ||
    message.includes('not confirmed') ||
    code.includes('email_not_confirmed')
  ) {
    return 'Email belum dikonfirmasi. Hubungi admin.';
  }

  // Invalid login credentials / user not found / wrong password
  // (Always uniformly mapped to: Email atau kata sandi salah.)
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid grant') ||
    message.includes('user not found') ||
    message.includes('invalid password') ||
    message.includes('wrong password') ||
    message.includes('credential') ||
    code.includes('invalid_grant') ||
    code.includes('invalid_credentials')
  ) {
    return 'Email atau kata sandi salah.';
  }

  return 'Email atau kata sandi salah.';
}

/**
 * Validates and sanitizes redirect paths to strictly allow internal paths only.
 * Rejects external URLs, protocol-relative URLs (//), backslashes, and javascript: URIs.
 */
export function getSafeRedirectUrl(redirectParam: string | null): string {
  if (!redirectParam) return '/';
  const trimmed = redirectParam.trim();

  // Must start with '/' but not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '/';
  }

  // Disallow control characters
  if (/[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) {
    return '/';
  }

  // Disallow URL scheme attempts (e.g. javascript:, https:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return '/';
  }

  return trimmed;
}
