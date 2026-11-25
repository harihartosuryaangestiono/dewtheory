import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parseWorkbook, shouldPreserveExistingStatus, parseIndonesianDate } from '../src/lib/utils/excel.ts';

/**
 * Build a realistic multi-sheet Excel workbook fixture
 * mimicking client structure:
 * - Data (KOL WA)
 * - Pool (Kurasi, Kategori, Platform, Sumber)
 * - Final Status (Status kontak / join)
 * - Seeding Sample (Penerima, Alamat, Resi)
 * - SOW Report (SOW 1 & SOW 2 links & dates)
 */
function createSampleWorkbook() {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 'Data'
  const dataRows = [
    { 'USERNAME TIKTOK': 'creator_decimal', 'NO WA KOL': 89653991596.0 },
    { 'USERNAME TIKTOK': 'creator_hyphen', 'NO WA KOL': '853-3781-7052' },
    { 'USERNAME TIKTOK': 'creator_zero_phone', 'NO WA KOL': 0 },
    { 'USERNAME TIKTOK': 'creator_dupe', 'NO WA KOL': '081234567890' },
    { 'USERNAME TIKTOK': 'creator_dupe', 'NO WA KOL': '081234567890' }, // Duplicate row
    { 'USERNAME TIKTOK': 'creator_contacted_app', 'NO WA KOL': '081987654321' },
  ];
  const wsData = XLSX.utils.json_to_sheet(dataRows);
  XLSX.utils.book_append_sheet(wb, wsData, 'Data');

  // 2. Sheet 'Pool'
  const poolRows = [
    { Username: 'creator_decimal', Curated: 'OKE', Category: 'A', Platform: 'TikTok', Source: 'RKP' },
    { Username: 'creator_hyphen', Curated: 'OKE', Category: 'B', Platform: 'TikTok', Source: 'Amore' },
    { Username: 'creator_zero_phone', Curated: 'OKE', Category: 'C', Platform: 'TikTok', Source: 'RKP' },
    { Username: 'creator_dupe', Curated: 'OKE', Category: 'D', Platform: 'Shopee', Source: 'Organic' },
    { Username: 'creator_contacted_app', Curated: 'OKE', Category: 'A', Platform: 'TikTok', Source: 'Amore' },
  ];
  const wsPool = XLSX.utils.json_to_sheet(poolRows);
  XLSX.utils.book_append_sheet(wb, wsPool, 'Pool');

  // 3. Sheet 'Final Status'
  const finalRows = [
    { Username: 'creator_contacted_app', Status: 'Contacted' },
  ];
  const wsFinal = XLSX.utils.json_to_sheet(finalRows);
  XLSX.utils.book_append_sheet(wb, wsFinal, 'Final Status');

  // 4. Sheet 'Seeding Sample'
  const seedingRows = [
    {
      Username: 'creator_decimal',
      'Nama Penerima': 'Devina Putri',
      'No Telp': '089653991596',
      'Alamat': 'Jl. Melati No. 12, Tebet, Jakarta Selatan, 12810',
      'Produk': 'Dew Bright Toner',
      'Status': 'Sent',
      'Tracking': 'JT88291039',
    },
  ];
  const wsSeeding = XLSX.utils.json_to_sheet(seedingRows);
  XLSX.utils.book_append_sheet(wb, wsSeeding, 'Seeding Sample');

  // 5. Sheet 'SOW Report'
  const sowRows = [
    {
      Username: 'creator_decimal',
      'Posting Date SOW 1': '25/11/2026',
      'Link SOW 1': 'https://www.tiktok.com/@creator_decimal/video/7100000000001',
      'Posting Date SOW 2': '2026-07-12',
      'Link SOW 2': 'https://www.tiktok.com/@creator_decimal/video/7100000000002',
    },
  ];
  const wsSow = XLSX.utils.json_to_sheet(sowRows);
  XLSX.utils.book_append_sheet(wb, wsSow, 'SOW Report');

  return wb;
}

test('Excel Multi-Sheet Import: Parses multi-sheet workbook, handles numbers and dates', () => {
  const wb = createSampleWorkbook();
  const result = parseWorkbook(wb);

  // 1. All 5 sheets found
  assert.equal(result.sheetNamesFound.length, 5);
  assert.ok(result.sheetNamesFound.includes('Data'));
  assert.ok(result.sheetNamesFound.includes('Pool'));
  assert.ok(result.sheetNamesFound.includes('Final Status'));
  assert.ok(result.sheetNamesFound.includes('Seeding Sample'));
  assert.ok(result.sheetNamesFound.includes('SOW Report'));

  // 2. Count of imported unique creators
  // creator_decimal, creator_hyphen, creator_zero_phone, creator_dupe, creator_contacted_app -> 5 unique creators
  assert.equal(result.creators.length, 5);

  // 3. Duplicate row detected in Data sheet
  assert.ok(result.duplicatesCount >= 1, `Expected duplicates >= 1, got ${result.duplicatesCount}`);

  // 4. Decimal Excel phone (89653991596.0) normalized to E.164 6289653991596
  const decimalCreator = result.creators.find(c => c.username === 'creator_decimal');
  assert.ok(decimalCreator);
  assert.equal(decimalCreator.phone_e164, '6289653991596');
  assert.equal(decimalCreator.phone_status, 'valid');
  assert.equal(decimalCreator.category, 'A');
  assert.equal(decimalCreator.curation_order, 0);

  // 5. Hyphenated phone (853-3781-7052) normalized to E.164 6285337817052
  const hyphenCreator = result.creators.find(c => c.username === 'creator_hyphen');
  assert.ok(hyphenCreator);
  assert.equal(hyphenCreator.phone_e164, '6285337817052');
  assert.equal(hyphenCreator.phone_status, 'valid');
  assert.equal(hyphenCreator.category, 'B');
  assert.equal(hyphenCreator.curation_order, 1);

  // 6. Zero phone (0) identified as 'missing'
  const zeroPhoneCreator = result.creators.find(c => c.username === 'creator_zero_phone');
  assert.ok(zeroPhoneCreator);
  assert.equal(zeroPhoneCreator.phone_status, 'missing');
  assert.equal(zeroPhoneCreator.phone_e164, '');

  // 7. Verify Date Parsing: 25/11/2026 and 2026-07-12
  const dateDmy = parseIndonesianDate('25/11/2026');
  assert.equal(dateDmy.dateStr, '2026-11-25');

  const dateIso = parseIndonesianDate('2026-07-12');
  assert.equal(dateIso.dateStr, '2026-07-12');

  // SOW records attached
  assert.ok(result.sows.length >= 2);
  const sow1 = result.sows.find(s => s.sow_no === 1);
  const sow2 = result.sows.find(s => s.sow_no === 2);
  assert.equal(sow1.posted_at, '2026-11-25');
  assert.equal(sow2.posted_at, '2026-07-12');
});

test('Excel Queue Rule: Zero phone (0) or missing phone creator is strictly excluded from active uncontacted queue', () => {
  const wb = createSampleWorkbook();
  const result = parseWorkbook(wb);

  // Outreach uncontacted queue filter criteria
  const outreachQueue = result.creators.filter(c => {
    return c.curation_status === 'oke' && 
           c.pipeline_status !== 'refuse' && 
           c.pipeline_status !== 'contacted' && 
           c.phone_status === 'valid';
  });

  const excludedZeroPhone = outreachQueue.find(c => c.username === 'creator_zero_phone');
  assert.equal(excludedZeroPhone, undefined, 'Creator with phone "0" must NOT be in the active outreach queue');

  const includedValid = outreachQueue.find(c => c.username === 'creator_decimal');
  assert.ok(includedValid, 'Creator with valid phone must be present in outreach queue');
});

test('Non-Destructive Re-import: App pipeline progress (Contacted, Join, SOW) is NOT overwritten on Excel re-import', () => {
  // Existing state in the app
  const appCreatorInContacted = {
    username: 'creator_test',
    pipeline_status: 'contacted',
    contacted_by: 'Dinda',
    contacted_at: '2026-11-24T10:00:00Z',
  };

  const appCreatorInJoin = {
    username: 'creator_join',
    pipeline_status: 'join',
  };

  // Incoming re-imported row from fresh Excel pool sheet (status 'pool' or 'curated')
  const incomingFromDataSheet = {
    username: 'creator_test',
    pipeline_status: 'pool',
  };

  const incomingFromPoolSheet = {
    username: 'creator_test',
    pipeline_status: 'curated',
  };

  // Test shouldPreserveExistingStatus logic
  assert.equal(
    shouldPreserveExistingStatus(appCreatorInContacted.pipeline_status, incomingFromDataSheet.pipeline_status),
    true,
    'Existing "contacted" status should be preserved when incoming is "pool"'
  );

  assert.equal(
    shouldPreserveExistingStatus(appCreatorInContacted.pipeline_status, incomingFromPoolSheet.pipeline_status),
    true,
    'Existing "contacted" status should be preserved when incoming is "curated"'
  );

  assert.equal(
    shouldPreserveExistingStatus(appCreatorInJoin.pipeline_status, incomingFromPoolSheet.pipeline_status),
    true,
    'Existing "join" status should be preserved when incoming is "curated"'
  );

  // Initial 'pool' incoming into another 'pool' or 'curated' should update normally
  assert.equal(
    shouldPreserveExistingStatus('pool', 'curated'),
    false,
    'Initial "pool" status can be promoted to "curated"'
  );
});
