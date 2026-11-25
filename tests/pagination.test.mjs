import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllPages } from '../src/lib/utils/pagination.ts';

test('fetchAllPages retrieves rows beyond the first page', async () => {
  const rows = Array.from({ length: 1_200 }, (_, id) => ({ id }));
  const ranges = [];

  const result = await fetchAllPages(async (from, to) => {
    ranges.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  }, 500);

  assert.equal(result.length, 1_200);
  assert.deepEqual(ranges, [[0, 499], [500, 999], [1_000, 1_499]]);
});

test('fetchAllPages surfaces page errors', async () => {
  await assert.rejects(
    fetchAllPages(async () => ({ data: null, error: { message: 'query failed' } })),
    /query failed/
  );
});
