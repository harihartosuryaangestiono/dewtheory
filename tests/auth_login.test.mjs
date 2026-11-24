import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translateAuthError, getSafeRedirectUrl } from '../src/lib/utils/auth-errors.ts';

test('Auth Layout Isolation: /login route group is completely separated from Sidebar & Topbar', () => {
  const authLayoutCode = readFileSync('src/app/(auth)/layout.tsx', 'utf8');
  const loginPageCode = readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
  const rootLayoutCode = readFileSync('src/app/layout.tsx', 'utf8');
  const appLayoutCode = readFileSync('src/app/(app)/layout.tsx', 'utf8');

  // 1. Root layout should NOT mount AppShell or AffiliateProvider
  assert.ok(!rootLayoutCode.includes('AppShell'), 'Root layout must not render AppShell');
  assert.ok(!rootLayoutCode.includes('AffiliateProvider'), 'Root layout must not mount AffiliateProvider');

  // 2. Auth layout must NOT include AppShell, Sidebar, or Header
  assert.ok(!authLayoutCode.includes('AppShell'), 'Auth layout must not contain AppShell');
  assert.ok(!authLayoutCode.includes('Sidebar'), 'Auth layout must not contain Sidebar');
  assert.ok(!authLayoutCode.includes('Header'), 'Auth layout must not contain Header');
  assert.ok(!authLayoutCode.includes('AffiliateProvider'), 'Auth layout must not fetch app store data');

  // 3. Login page contains 1 dedicated button for Akun Dinda, and no Akun Surya button
  assert.ok(loginPageCode.includes('Akun Dinda'), 'Login page must contain 1 button for Akun Dinda');
  assert.ok(!loginPageCode.includes('Akun Surya'), 'Login page must not contain Akun Surya button');
  assert.ok(!loginPageCode.includes('dailyOutreachCount'), 'Login page must not display daily counter');
  assert.ok(!loginPageCode.includes('dailyTarget'), 'Login page must not display target WA');

  // 4. AppShell & AffiliateProvider only live inside (app)/layout.tsx
  assert.ok(appLayoutCode.includes('AppShell'), 'App layout must contain AppShell');
  assert.ok(appLayoutCode.includes('AffiliateProvider'), 'App layout must contain AffiliateProvider');
});

test('Auth Form State: Fields start empty with valid autocomplete attributes', () => {
  const loginPageCode = readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

  // Starts empty
  assert.ok(loginPageCode.includes("const [email, setEmail] = useState('')"), 'Email must initialize to empty string');
  assert.ok(loginPageCode.includes("const [password, setPassword] = useState('')"), 'Password must initialize to empty string');

  // Autocomplete attributes for password managers
  assert.ok(loginPageCode.includes('autoComplete="username"'), 'Email input must have autoComplete="username"');
  assert.ok(loginPageCode.includes('autoComplete="current-password"'), 'Password input must have autoComplete="current-password"');
});

test('Auth Error Translator: Translates Supabase errors into uniform Indonesian without revealing user existence', () => {
  // 1. Invalid credentials
  assert.equal(
    translateAuthError('Invalid login credentials'),
    'Email atau kata sandi salah.'
  );

  // 2. User not found (MUST return identical message as wrong password)
  assert.equal(
    translateAuthError({ message: 'User not found' }),
    'Email atau kata sandi salah.'
  );

  assert.equal(
    translateAuthError({ message: 'Invalid password' }),
    'Email atau kata sandi salah.'
  );

  // 3. Unconfirmed email
  assert.equal(
    translateAuthError({ message: 'Email not confirmed' }),
    'Email belum dikonfirmasi. Hubungi admin.'
  );

  // 4. Rate limiting
  assert.equal(
    translateAuthError({ message: 'over_email_send_rate_limit' }),
    'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
  );
  assert.equal(
    translateAuthError({ message: 'Too many requests' }),
    'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.'
  );

  // 5. Network / connection failure
  assert.equal(
    translateAuthError({ message: 'Failed to fetch' }),
    'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  );
  assert.equal(
    translateAuthError('Network error'),
    'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  );
});

test('Auth Redirect Sanitizer: Allows safe internal paths and strictly rejects external URLs', () => {
  // Safe internal paths
  assert.equal(getSafeRedirectUrl('/'), '/');
  assert.equal(getSafeRedirectUrl('/outreach'), '/outreach');
  assert.equal(getSafeRedirectUrl('/sow?filter=overdue'), '/sow?filter=overdue');
  assert.equal(getSafeRedirectUrl('/creators'), '/creators');

  // External URLs (Open Redirect Vulnerability Prevention)
  assert.equal(getSafeRedirectUrl('https://evil.com'), '/');
  assert.equal(getSafeRedirectUrl('http://attacker.com/malicious'), '/');
  assert.equal(getSafeRedirectUrl('//evil.com'), '/');
  assert.equal(getSafeRedirectUrl('/\\evil.com'), '/');
  assert.equal(getSafeRedirectUrl('javascript:alert(1)'), '/');
  assert.equal(getSafeRedirectUrl('data:text/html,<script>alert(1)</script>'), '/');

  // Empty or invalid inputs
  assert.equal(getSafeRedirectUrl(null), '/');
  assert.equal(getSafeRedirectUrl(''), '/');
  assert.equal(getSafeRedirectUrl('   '), '/');
});

test('User Seeding Script Security: Refuses execution when env vars are missing or password < 12 chars', () => {
  const seedScriptCode = readFileSync('scripts/seed-users.mjs', 'utf8');

  // Must check SEED_DINDA_EMAIL, SEED_DINDA_PASSWORD, SEED_SURYA_EMAIL, SEED_SURYA_PASSWORD
  assert.ok(seedScriptCode.includes('SEED_DINDA_EMAIL'));
  assert.ok(seedScriptCode.includes('SEED_DINDA_PASSWORD'));
  assert.ok(seedScriptCode.includes('SEED_SURYA_EMAIL'));
  assert.ok(seedScriptCode.includes('SEED_SURYA_PASSWORD'));

  // Must reject password < 12 characters
  assert.ok(seedScriptCode.includes('.length < 12'), 'Seed script must enforce minimum 12 chars password');

  // Must not contain default embedded password
  assert.ok(!seedScriptCode.includes('DewTheory2026!'), 'Seed script must not contain hardcoded default password');
});
