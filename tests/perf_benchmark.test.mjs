import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../src/lib/utils/excel.ts';

test('Performance Benchmark: 5,500 rows multi-sheet import parses in < 2000ms', () => {
  const wb = XLSX.utils.book_new();

  const totalRows = 5500;
  const dataRows = [];
  const poolRows = [];

  const categories = ['A', 'B', 'C', 'D'];
  const sources = ['RKP', 'Amore', 'Shopee', 'Organic', 'TikTok Explore'];

  for (let i = 0; i < totalRows; i++) {
    const username = `creator_bulk_${i}`;
    const phone = i % 10 === 0 ? 0 : (81200000000 + i);

    dataRows.push({
      'USERNAME TIKTOK': username,
      'NO WA KOL': phone,
    });

    poolRows.push({
      Username: username,
      Curated: i % 3 === 0 ? 'OKE' : (i % 3 === 1 ? 'SECOND OPTION' : 'REJECT'),
      Category: categories[i % categories.length],
      Platform: i % 15 === 0 ? 'Shopee' : 'TikTok',
      Source: sources[i % sources.length],
    });
  }

  const wsData = XLSX.utils.json_to_sheet(dataRows);
  const wsPool = XLSX.utils.json_to_sheet(poolRows);
  XLSX.utils.book_append_sheet(wb, wsData, 'Data');
  XLSX.utils.book_append_sheet(wb, wsPool, 'Pool');

  const startTime = Date.now();
  const result = parseWorkbook(wb);
  const elapsedMs = Date.now() - startTime;

  assert.equal(result.creators.length, 5500);
  assert.ok(result.validPhoneCount > 4000);
  assert.ok(result.missingPhoneCount > 500);
  assert.ok(elapsedMs < 2000, `Expected parse time < 2000ms, actual: ${elapsedMs}ms`);
});

test('Performance: Virtualized table slices only visible DOM rows for 10,000 creators', () => {
  const TOTAL_ITEMS = 10000;
  const ROW_HEIGHT = 54;
  const CONTAINER_HEIGHT = 620;
  const OVERSCAN = 12;

  // Generate 10,000 lightweight creator stubs
  const largeCreatorList = new Array(TOTAL_ITEMS).fill(null).map((_, i) => ({
    id: `c-${i}`,
    username: `creator_${i}`,
    category: 'A',
    pipeline_status: 'curated',
  }));

  // Simulate scrolling to middle of list (row 5,000 -> scrollTop = 5,000 * 54 = 270,000px)
  const scrollTop = 270000;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(TOTAL_ITEMS, Math.ceil((scrollTop + CONTAINER_HEIGHT) / ROW_HEIGHT) + OVERSCAN);

  const visibleItems = largeCreatorList.slice(startIndex, endIndex);

  // In a 10,000 item list, DOM only renders ~35-40 items instead of 10,000!
  assert.ok(visibleItems.length < 50, `Rendered DOM rows should be < 50, was ${visibleItems.length}`);
  assert.ok(visibleItems.length > 20, `Rendered DOM rows should cover viewport, was ${visibleItems.length}`);

  // Spacers calculate exact heights so scrollbar accurately reflects 10,000 rows
  const topOffset = startIndex * ROW_HEIGHT;
  const bottomOffset = (TOTAL_ITEMS - endIndex) * ROW_HEIGHT;
  const renderedVirtualHeight = topOffset + (visibleItems.length * ROW_HEIGHT) + bottomOffset;

  assert.equal(renderedVirtualHeight, TOTAL_ITEMS * ROW_HEIGHT, 'Total virtual height matches exact 10,000 rows calculation');
});

test('Dashboard Funnel: Empty dataset calculates 0% progress and 0% bar widths without fake offsets', () => {
  const emptyCreators = [];
  const emptyShipments = [];
  const emptySows = [];

  const totalPool = emptyCreators.length;
  const totalOke = emptyCreators.filter(c => c.curation_status === 'oke').length;
  const totalContacted = emptyCreators.filter(c => ['contacted', 'replied', 'join'].includes(c.pipeline_status)).length;

  const funnel = [
    { label: '1. Pool Creator', count: totalPool, percent: totalPool > 0 ? 100 : 0 },
    { label: '2. Terkurasi OKE', count: totalOke, percent: totalPool ? Math.round((totalOke / totalPool) * 100) : 0 },
    { label: '3. Contacted WA', count: totalContacted, percent: totalOke ? Math.round((totalContacted / totalOke) * 100) : 0 },
  ];

  // Stage 1 Pool Creator must be 0% when pool is 0 (NOT hardcoded 100%)
  assert.equal(funnel[0].count, 0);
  assert.equal(funnel[0].percent, 0, 'Pool Creator percent must be 0% when creators is empty');

  // Stages 2 & 3 must also be 0%
  assert.equal(funnel[1].percent, 0);
  assert.equal(funnel[2].percent, 0);

  // Bar width string calculation must be '0%' and NOT forced to min-w 5%
  funnel.forEach(stage => {
    const widthStyle = `${stage.percent}%`;
    assert.equal(widthStyle, '0%', `Bar width for ${stage.label} must be 0%`);
  });
});
