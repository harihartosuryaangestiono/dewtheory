import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pure simulation of PostgreSQL Atomic Claim Lock logic:
 * UPDATE creators 
 * SET locked_by = p_user, locked_until = now + 5min
 * WHERE id = p_id AND (locked_until IS NULL OR locked_until < now OR locked_by = p_user)
 */
function simulateAtomicClaimLock(creator, userName, now = new Date(), lockMinutes = 5) {
  const isAvailable = 
    !creator.locked_until || 
    new Date(creator.locked_until) < now || 
    creator.locked_by === userName;

  if (isAvailable) {
    const newExpiry = new Date(now.getTime() + lockMinutes * 60 * 1000).toISOString();
    return {
      updatedCreator: {
        ...creator,
        locked_by: userName,
        locked_until: newExpiry,
      },
      result: {
        success: true,
        locked_by: userName,
        locked_until: newExpiry,
      },
    };
  } else {
    return {
      updatedCreator: creator,
      result: {
        success: false,
        locked_by: creator.locked_by || 'Pengguna Lain',
        locked_until: creator.locked_until,
      },
    };
  }
}

test('Atomic Claim Lock: User A (Dinda) successfully claims an unlocked creator', () => {
  const creator = {
    id: 'c-test-1',
    username: 'skincarebyrani',
    locked_by: null,
    locked_until: null,
  };

  const now = new Date('2026-11-24T10:00:00Z');
  const { updatedCreator, result } = simulateAtomicClaimLock(creator, 'Dinda', now);

  assert.equal(result.success, true);
  assert.equal(result.locked_by, 'Dinda');
  assert.equal(updatedCreator.locked_by, 'Dinda');
  assert.equal(updatedCreator.locked_until, '2026-11-24T10:05:00.000Z');
});

test('Atomic Claim Lock: User B (Surya) is rejected when claiming a creator actively locked by Dinda', () => {
  const now = new Date('2026-11-24T10:01:00Z'); // 1 minute into Dinda's 5-minute lock
  const lockedCreator = {
    id: 'c-test-1',
    username: 'skincarebyrani',
    locked_by: 'Dinda',
    locked_until: '2026-11-24T10:05:00.000Z',
  };

  const { updatedCreator, result } = simulateAtomicClaimLock(lockedCreator, 'Surya', now);

  assert.equal(result.success, false);
  assert.equal(result.locked_by, 'Dinda');
  assert.equal(updatedCreator.locked_by, 'Dinda'); // Not mutated
});

test('Atomic Claim Lock: User B (Surya) succeeds after 5-minute lock has expired', () => {
  const now = new Date('2026-11-24T10:06:00Z'); // 6 minutes later (expired)
  const expiredCreator = {
    id: 'c-test-1',
    username: 'skincarebyrani',
    locked_by: 'Dinda',
    locked_until: '2026-11-24T10:05:00.000Z',
  };

  const { updatedCreator, result } = simulateAtomicClaimLock(expiredCreator, 'Surya', now);

  assert.equal(result.success, true);
  assert.equal(result.locked_by, 'Surya');
  assert.equal(updatedCreator.locked_by, 'Surya');
  assert.equal(updatedCreator.locked_until, '2026-11-24T10:11:00.000Z');
});

test('Atomic Claim Lock: User A (Dinda) can re-claim and refresh their own active lock (Idempotent)', () => {
  const now = new Date('2026-11-24T10:03:00Z');
  const dindaCreator = {
    id: 'c-test-1',
    username: 'skincarebyrani',
    locked_by: 'Dinda',
    locked_until: '2026-11-24T10:05:00.000Z',
  };

  const { updatedCreator, result } = simulateAtomicClaimLock(dindaCreator, 'Dinda', now);

  assert.equal(result.success, true);
  assert.equal(result.locked_by, 'Dinda');
  assert.equal(updatedCreator.locked_until, '2026-11-24T10:08:00.000Z');
});
