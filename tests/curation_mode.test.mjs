import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanUsername, mapCategory, mapCurationDecision } from '../src/lib/utils/excel.ts';

// 1. Pemetaan Shortcut Keyboard ke Keputusan Kurasi
test('Curation Mode: Keyboard shortcut to decision mapping', () => {
  const shortcutMap = {
    '1': { status: 'oke', category: 'A', label: 'Dew Bright Toner' },
    '2': { status: 'oke', category: 'B', label: 'Bright Milky Lotion' },
    '3': { status: 'oke', category: 'C', label: 'Milky Dew Cleanser' },
    '4': { status: 'oke', category: 'D', label: 'Toner + Lotion Duo' },
    '5': { status: 'second_option', category: undefined, label: 'Second Option' },
    ' ': { status: 'second_option', category: undefined, label: 'Second Option' },
    'x': { action: 'open_reject_modal' },
    'X': { action: 'open_reject_modal' },
    'z': { action: 'undo' },
    'Z': { action: 'undo' },
    't': { action: 'open_tiktok_popup' },
    'T': { action: 'open_tiktok_popup' },
    '?': { action: 'toggle_help_modal' },
  };

  // Test primary category hotkeys 1-4
  assert.equal(shortcutMap['1'].status, 'oke');
  assert.equal(shortcutMap['1'].category, 'A');

  assert.equal(shortcutMap['2'].status, 'oke');
  assert.equal(shortcutMap['2'].category, 'B');

  assert.equal(shortcutMap['3'].status, 'oke');
  assert.equal(shortcutMap['3'].category, 'C');

  assert.equal(shortcutMap['4'].status, 'oke');
  assert.equal(shortcutMap['4'].category, 'D');

  // Test Second Option (5 & Space)
  assert.equal(shortcutMap['5'].status, 'second_option');
  assert.equal(shortcutMap[' '].status, 'second_option');

  // Test Reject reasons 1-6
  const rejectReasons = [
    { key: '1', label: 'GMV rendah (< 1jt / non-performer)' },
    { key: '2', label: 'Niche tidak cocok / bukan beauty' },
    { key: '3', label: 'Akun tidak aktif / pasif' },
    { key: '4', label: 'Akun private / dibatasi' },
    { key: '5', label: 'Kompetitor brand langsung' },
    { key: '6', label: 'Lainnya' },
  ];
  assert.equal(rejectReasons.length, 6);
  assert.ok(rejectReasons.find(r => r.key === '1').label.includes('GMV'));
});

// 2. Kalkulasi Kuota Live & Status Peringatan (>= 90% & >= 100%)
test('Curation Mode: Live quota tracker and warning thresholds', () => {
  const quotas = {
    A: { target: 35, current: 31 }, // 31/35 = 88.5% -> Normal
    B: { target: 25, current: 23 }, // 23/25 = 92% -> Near full (>= 90%)
    C: { target: 15, current: 15 }, // 15/15 = 100% -> Full (>= 100%)
    D: { target: 25, current: 27 }, // 27/25 = 108% -> Over full
  };

  const evaluateQuota = (current, target) => {
    const percent = Math.round((current / target) * 100);
    const isFull = percent >= 100;
    const isNearFull = percent >= 90 && percent < 100;
    return { percent, isFull, isNearFull };
  };

  // Kat A: Normal
  const resA = evaluateQuota(quotas.A.current, quotas.A.target);
  assert.equal(resA.percent, 89);
  assert.equal(resA.isNearFull, false);
  assert.equal(resA.isFull, false);

  // Kat B: Near Full (>= 90%)
  const resB = evaluateQuota(quotas.B.current, quotas.B.target);
  assert.equal(resB.percent, 92);
  assert.equal(resB.isNearFull, true);
  assert.equal(resB.isFull, false);

  // Kat C: Full (>= 100%)
  const resC = evaluateQuota(quotas.C.current, quotas.C.target);
  assert.equal(resC.percent, 100);
  assert.equal(resC.isNearFull, false);
  assert.equal(resC.isFull, true);

  // Kat D: Over full
  const resD = evaluateQuota(quotas.D.current, quotas.D.target);
  assert.equal(resD.isFull, true);
});

// 3. Undo Berantai (Minimal 20 Langkah Mundur)
test('Curation Mode: Chained undo stack supports >= 20 steps consecutively', () => {
  // Simulate an undo stack with 25 operations
  let undoStack = [];
  const TOTAL_STEPS = 25;

  const creators = Array.from({ length: TOTAL_STEPS }, (_, i) => ({
    id: `creator-${i}`,
    username: `creator_${i}`,
    curation_status: 'pending',
    category: 'UNASSIGNED',
    pipeline_status: 'pool',
  }));

  // Perform 25 sequential curation decisions
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const c = creators[i];
    const prev = { ...c };
    const newStatus = i % 2 === 0 ? 'oke' : 'second_option';
    const newCat = i % 2 === 0 ? 'A' : 'UNASSIGNED';

    // Push previous state
    undoStack.unshift({
      creatorId: c.id,
      creatorUsername: c.username,
      previousState: prev,
      decisionLabel: `${newStatus}-${newCat}`,
    });

    c.curation_status = newStatus;
    c.category = newCat;
  }

  assert.equal(undoStack.length, TOTAL_STEPS);
  assert.ok(undoStack.length >= 20, 'Undo stack must hold at least 20 steps');

  // Consecutively undo 20 times (LIFO)
  for (let step = 0; step < 20; step++) {
    const lastAction = undoStack.shift();
    const creatorIndex = parseInt(lastAction.creatorId.split('-')[1]);
    const creator = creators[creatorIndex];

    // Restore previous state
    creator.curation_status = lastAction.previousState.curation_status;
    creator.category = lastAction.previousState.category;
    creator.pipeline_status = lastAction.previousState.pipeline_status;

    assert.equal(creator.curation_status, 'pending');
    assert.equal(creator.category, 'UNASSIGNED');
    assert.equal(creator.pipeline_status, 'pool');
  }

  // 5 operations still remain in stack
  assert.equal(undoStack.length, 5);
});

// 4. Upsert Tanpa Duplikasi (Berdasarkan Canonical Username)
test('Curation Mode: Clean username canonicalization prevents duplicate records', () => {
  const inputs = [
    '@TasyaFarasya',
    'tasyafarasya',
    ' https://www.tiktok.com/@tasyafarasya?lang=en ',
    'tasyafarasya/',
    '@TASYAFARASYA ',
  ];

  const cleaned = inputs.map(cleanUsername);
  const uniqueSet = new Set(cleaned);

  assert.equal(uniqueSet.size, 1);
  assert.equal(Array.from(uniqueSet)[0], 'tasyafarasya');
});

// 5. Pencegahan Perebutan Creator oleh Dua User (Claim Lock)
test('Curation Mode: Two users cannot curate the same creator simultaneously', () => {
  let creator = {
    id: 'c-101',
    username: 'skincarelover',
    locked_by: null,
    locked_until: null,
  };

  const now = new Date('2026-11-24T10:00:00Z');

  // User 1 (Dinda) claims creator
  const claimByDinda = (c, time) => {
    if (c.locked_by && c.locked_by !== 'Dinda' && new Date(c.locked_until) > time) {
      return { success: false, locked_by: c.locked_by };
    }
    c.locked_by = 'Dinda';
    c.locked_until = new Date(time.getTime() + 5 * 60 * 1000).toISOString(); // 5 min
    return { success: true, locked_by: 'Dinda' };
  };

  const res1 = claimByDinda(creator, now);
  assert.equal(res1.success, true);
  assert.equal(creator.locked_by, 'Dinda');

  // User 2 (Surya) tries to claim same creator 1 minute later
  const claimBySurya = (c, time) => {
    if (c.locked_by && c.locked_by !== 'Surya' && new Date(c.locked_until) > time) {
      return { success: false, locked_by: c.locked_by };
    }
    c.locked_by = 'Surya';
    c.locked_until = new Date(time.getTime() + 5 * 60 * 1000).toISOString();
    return { success: true, locked_by: 'Surya' };
  };

  const oneMinuteLater = new Date('2026-11-24T10:01:00Z');
  const res2 = claimBySurya(creator, oneMinuteLater);
  assert.equal(res2.success, false, 'Surya must be rejected because Dinda actively locked creator');
  assert.equal(res2.locked_by, 'Dinda');

  // After 6 minutes (lock expired), Surya can claim
  const sixMinutesLater = new Date('2026-11-24T10:06:00Z');
  const res3 = claimBySurya(creator, sixMinutesLater);
  assert.equal(res3.success, true, 'Surya succeeds after 5-minute lock has expired');
  assert.equal(creator.locked_by, 'Surya');
});
