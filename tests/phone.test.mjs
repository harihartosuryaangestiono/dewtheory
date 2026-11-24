import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhoneNumber } from '../src/lib/utils/phone.ts';

test('Phone Normalization: Handles decimal numbers from Excel (.0)', () => {
  const result = normalizePhoneNumber('89653991596.0');
  assert.equal(result.e164, '6289653991596');
  assert.equal(result.status, 'valid');
  assert.equal(result.formatted, '+62 896-5399-1596');
});

test('Phone Normalization: Handles hyphenated numbers without leading 0', () => {
  const result = normalizePhoneNumber('853-3781-7052');
  assert.equal(result.e164, '6285337817052');
  assert.equal(result.status, 'valid');
  assert.equal(result.formatted, '+62 853-3781-7052');
});

test('Phone Normalization: Handles Indonesian local format starting with 08...', () => {
  const result = normalizePhoneNumber('081299881122');
  assert.equal(result.e164, '6281299881122');
  assert.equal(result.status, 'valid');
  assert.equal(result.formatted, '+62 812-9988-1122');
});

test('Phone Normalization: Handles international format +62...', () => {
  const result = normalizePhoneNumber('+62 812-3456-7890');
  assert.equal(result.e164, '6281234567890');
  assert.equal(result.status, 'valid');
});

test('Phone Normalization: Handles zero value "0" as missing phone', () => {
  const result = normalizePhoneNumber('0');
  assert.equal(result.e164, '');
  assert.equal(result.status, 'missing');
  assert.equal(result.formatted, 'Tidak ada nomor');
});

test('Phone Normalization: Handles decimal zero "0.0" as missing phone', () => {
  const result = normalizePhoneNumber('0.0');
  assert.equal(result.e164, '');
  assert.equal(result.status, 'missing');
});

test('Phone Normalization: Handles empty string, null, and undefined as missing phone', () => {
  assert.equal(normalizePhoneNumber('').status, 'missing');
  assert.equal(normalizePhoneNumber('   ').status, 'missing');
  assert.equal(normalizePhoneNumber(null).status, 'missing');
  assert.equal(normalizePhoneNumber(undefined).status, 'missing');
});

test('Phone Normalization: Flags too short or non-mobile numbers as invalid', () => {
  const result = normalizePhoneNumber('1234567');
  assert.equal(result.status, 'invalid');
});
