import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanUsername, mapCategory, mapCurationDecision } from '../src/lib/utils/excel.ts';

test('Dup Checker & Username Sanitizer: Strips leading @, trims, and lowercases', () => {
  assert.equal(cleanUsername('@skincarebyrani'), 'skincarebyrani');
  assert.equal(cleanUsername('  @GLOWwithDevina  '), 'glowwithdevina');
  assert.equal(cleanUsername('@@@Dr.SkinCare.ID'), 'dr.skincare.id');
});

test('Dup Checker & Username Sanitizer: Extracts username from full TikTok URL', () => {
  assert.equal(
    cleanUsername('https://www.tiktok.com/@beautytips_alya?lang=id'),
    'beautytips_alya'
  );
});

test('Category Mapper: Tolerates various aliases', () => {
  assert.equal(mapCategory('A'), 'A');
  assert.equal(mapCategory('Category A'), 'A');
  assert.equal(mapCategory('Kategori B'), 'B');
  assert.equal(mapCategory('Kat C'), 'C');
  assert.equal(mapCategory('Toner'), 'A');
  assert.equal(mapCategory('Lotion'), 'B');
  assert.equal(mapCategory('Cleanser'), 'C');
  assert.equal(mapCategory('Toner + Lotion Duo'), 'D');
  assert.equal(mapCategory(''), 'UNASSIGNED');
});

test('Curation Decision Mapper: Tolerates diverse decision terms', () => {
  assert.deepEqual(mapCurationDecision('OKE'), { curation: 'oke', pipeline: 'curated' });
  assert.deepEqual(mapCurationDecision('Approved'), { curation: 'oke', pipeline: 'curated' });
  assert.deepEqual(mapCurationDecision('TRUE'), { curation: 'oke', pipeline: 'curated' });

  assert.deepEqual(mapCurationDecision('SECOND OPTION'), { curation: 'second_option', pipeline: 'curated' });
  assert.deepEqual(mapCurationDecision('Cadangan'), { curation: 'second_option', pipeline: 'curated' });

  assert.deepEqual(mapCurationDecision('REJECT'), { curation: 'reject', pipeline: 'refuse' });
  assert.deepEqual(mapCurationDecision('Tolak'), { curation: 'reject', pipeline: 'refuse' });
  assert.deepEqual(mapCurationDecision('FALSE'), { curation: 'reject', pipeline: 'refuse' });

  assert.deepEqual(mapCurationDecision(null), { curation: 'pending', pipeline: 'pool' });
  assert.deepEqual(mapCurationDecision(false), { curation: 'pending', pipeline: 'pool' });
});
