import test from 'node:test';
import assert from 'node:assert/strict';
import { POST, OPTIONS } from '../src/app/api/curation/route.ts';

// Helper to create mock NextRequest
function createMockRequest(body, headers = {}) {
  const headersObj = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  });

  return {
    headers: headersObj,
    json: async () => body,
  };
}

test('API OPTIONS /api/curation: Returns 204 with CORS headers for Chrome Extension pre-flight', async () => {
  const res = await OPTIONS();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.ok(res.headers.get('Access-Control-Allow-Methods').includes('POST'));
  assert.ok(res.headers.get('Access-Control-Allow-Headers').includes('x-api-key'));
});

test('API POST /api/curation: Returns 401 when API Key is missing or invalid', async () => {
  process.env.CURATION_API_KEY = 'test_secret_key_123';

  // Request without auth
  const reqNoAuth = createMockRequest({ username: 'creator1' });
  const resNoAuth = await POST(reqNoAuth);
  assert.equal(resNoAuth.status, 401);

  // Request with wrong auth
  const reqWrongAuth = createMockRequest(
    { username: 'creator1' },
    { 'x-api-key': 'wrong_key' }
  );
  const resWrongAuth = await POST(reqWrongAuth);
  assert.equal(resWrongAuth.status, 401);
});

test('API POST /api/curation: Returns 400 when username is missing in single mode', async () => {
  process.env.CURATION_API_KEY = 'test_secret_key_123';

  const req = createMockRequest(
    { decision: 'oke', category: 'A' },
    { 'x-api-key': 'test_secret_key_123' }
  );

  const res = await POST(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.ok(json.error.includes('username'));
});

test('API POST /api/curation: Parses diverse decision, category, and phone formats successfully', async () => {
  process.env.CURATION_API_KEY = 'test_secret_key_123';

  const req = createMockRequest(
    {
      user: '@GlowWithDevina',
      decision: 'APPROVED',
      cat: 'Toner',
      wa: '89653991596.0',
      notes: 'Reviewer toner oily skin',
    },
    { 'Authorization': 'Bearer test_secret_key_123' }
  );

  const res = await POST(req);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.username, 'glowwithdevina');
  assert.equal(json.data.curation_status, 'oke');
  assert.equal(json.data.category, 'A');
  assert.equal(json.data.phone_e164, '6289653991596');
  assert.equal(json.data.phone_status, 'valid');
});

test('API POST /api/curation: Supports batch array payload with summary of success, duplicates, and failed', async () => {
  process.env.CURATION_API_KEY = 'test_secret_key_123';

  const batchPayload = [
    { username: 'creator_a', decision: 'oke', category: 'A', wa: '081234567890' },
    { user: 'creator_b', decision: 'second_option', category: 'B' },
    { username: 'creator_a', decision: 'oke', category: 'A' }, // Duplicate in same batch
    { decision: 'reject' }, // Missing username -> fail
  ];

  const req = createMockRequest(batchPayload, {
    'x-api-key': 'test_secret_key_123',
    'x-forwarded-for': '192.168.1.100',
  });

  const res = await POST(req);
  assert.equal(res.status, 200);

  const json = await res.json();
  assert.equal(json.mode, 'batch');
  assert.equal(json.total, 4);
  assert.equal(json.success_count, 2);
  assert.equal(json.duplicate_count, 1);
  assert.equal(json.failed_count, 1);

  // Duplicates list
  assert.equal(json.data.duplicates[0].username, 'creator_a');

  // Failed list
  assert.ok(json.data.failed[0].reason.includes('username'));

  // Success list
  assert.equal(json.data.success[0].username, 'creator_a');
  assert.equal(json.data.success[1].username, 'creator_b');
});

test('API POST /api/curation: Rate limiting triggers 429 when exceeding 120 req/min', async () => {
  process.env.CURATION_API_KEY = 'test_secret_key_123';
  const testIp = '10.0.0.99';

  let lastStatus = 200;
  // Send 121 requests
  for (let i = 0; i < 122; i++) {
    const req = createMockRequest(
      { username: `rate_user_${i}` },
      { 'x-api-key': 'test_secret_key_123', 'x-forwarded-for': testIp }
    );
    const res = await POST(req);
    lastStatus = res.status;
    if (lastStatus === 429) break;
  }

  assert.equal(lastStatus, 429);
});

