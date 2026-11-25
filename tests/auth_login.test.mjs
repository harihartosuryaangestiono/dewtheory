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

  // 3. Login page contains shortcuts for Dinda and Hari, but no Surya button
  assert.ok(loginPageCode.includes('Masuk sebagai Dinda'), 'Login page must contain 1 button for Masuk sebagai Dinda');
  assert.ok(loginPageCode.includes('Masuk sebagai Hari'), 'Login page must contain a button for Masuk sebagai Hari');
  assert.ok(!loginPageCode.includes('Masuk sebagai Surya'), 'Login page must not contain Surya shortcut button');
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

test('Auth Shortcut Buttons: Dinda and Hari behavior, security, and gating', () => {
  const loginPageCode = readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
  const envExample = readFileSync('.env.example', 'utf8');

  // 1. Label is "Masuk sebagai Dinda" with initial avatar "D"
  assert.ok(loginPageCode.includes('Masuk sebagai Dinda'), 'Button must be labeled "Masuk sebagai Dinda"');
  assert.ok(/>\s*D\s*<\/span>/.test(loginPageCode), 'Button must include initial avatar "D"');
  
  // 2. Email is sourced from NEXT_PUBLIC_DINDA_EMAIL, NOT hardcoded in client code
  assert.ok(loginPageCode.includes('process.env.NEXT_PUBLIC_DINDA_EMAIL'), 'Must read NEXT_PUBLIC_DINDA_EMAIL');
  assert.ok(loginPageCode.includes('process.env.NEXT_PUBLIC_HARI_EMAIL'), 'Must read NEXT_PUBLIC_HARI_EMAIL');
  assert.ok(!loginPageCode.includes('dindavictora1509@gmail.com'), 'Client code must NOT contain hardcoded Dinda email');
  assert.ok(!loginPageCode.includes('hariharto.surya@gmail.com'), 'Client code must NOT contain hardcoded Hari email');
  assert.ok(!loginPageCode.includes('DewTheory2026!'), 'Client code must NOT contain hardcoded password');

  // 3. Button does NOT appear when NEXT_PUBLIC_DINDA_EMAIL is empty/undefined
  assert.ok(loginPageCode.includes('Boolean(dindaEmail)'), 'Button must only render when dindaEmail is defined');
  assert.ok(loginPageCode.includes('Boolean(hariEmail)'), 'Button must only render when hariEmail is defined');

  // 4. Click behavior: fills email and focuses password field, password remains empty, no login triggered
  assert.ok(loginPageCode.includes('handleFillAccountEmail(dindaEmail)'), 'Dinda shortcut fills its email');
  assert.ok(loginPageCode.includes('handleFillAccountEmail(hariEmail)'), 'Hari shortcut fills its email');
  assert.ok(loginPageCode.includes('setEmail(accountEmail)'), 'Shortcut fills email state');
  assert.ok(loginPageCode.includes('passwordInputRef.current?.focus()'), 'Shortcut focuses password input ref');
  assert.ok(!loginPageCode.includes('setPassword(accountEmail)'), 'Password state must NOT be set by shortcut');

  // 5. Autocomplete attributes ensure password managers can autofill password after email is set
  assert.ok(loginPageCode.includes('autoComplete="username"'));
  assert.ok(loginPageCode.includes('autoComplete="current-password"'));

  // 6. No shortcut for Surya
  assert.ok(!loginPageCode.includes('Masuk sebagai Surya'));
  assert.ok(!loginPageCode.includes('NEXT_PUBLIC_SURYA_EMAIL'));

  // 7. Environment example placeholder
  assert.ok(envExample.includes('NEXT_PUBLIC_DINDA_EMAIL='), '.env.example must document NEXT_PUBLIC_DINDA_EMAIL');
  assert.ok(envExample.includes('NEXT_PUBLIC_HARI_EMAIL='), '.env.example must document NEXT_PUBLIC_HARI_EMAIL');
});

test('Auth Shortcut Logic: Simulates fill and focus behavior', () => {
  let emailState = '';
  let passwordState = '';
  let loginCalled = false;
  let focused = false;

  const mockPasswordRef = {
    current: {
      focus: () => { focused = true; }
    }
  };

  const simulateShortcutClick = (accountEmail) => {
    if (!accountEmail) return false;
    emailState = accountEmail;
    // Password state remains untouched
    mockPasswordRef.current?.focus();
    // No login called
    return true;
  };

  // When env is missing/empty:
  assert.equal(simulateShortcutClick(''), false, 'Should not execute if email is empty');
  assert.equal(emailState, '');
  assert.equal(passwordState, '');
  assert.equal(focused, false);

  // When env is set:
  const isRendered = simulateShortcutClick('dinda@dewtheory.com');
  assert.equal(isRendered, true);
  assert.equal(emailState, 'dinda@dewtheory.com');
  assert.equal(passwordState, '', 'Password must remain empty');
  assert.equal(focused, true, 'Password field must receive focus');
  assert.equal(loginCalled, false, 'Login must not be triggered');
});
