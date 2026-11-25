import * as XLSX from 'xlsx';
import { normalizePhoneNumber } from './phone';
import { Category, Creator, PipelineStatus, CurationStatus, Platform, Shipment, SOWRecord } from '@/types';

export interface ParseResult {
  creators: Partial<Creator>[];
  shipments: Partial<Shipment>[];
  sows: Partial<SOWRecord>[];
  duplicatesCount: number;
  missingPhoneCount: number;
  invalidPhoneCount: number;
  validPhoneCount: number;
  sheetNamesFound: string[];
  warnings: string[];
}

export function cleanUsername(val: any): string {
  if (!val) return '';
  let str = String(val).trim().toLowerCase();
  // Strip leading '@' or URL parts like tiktok.com/@
  if (str.includes('tiktok.com/@')) {
    str = str.split('tiktok.com/@')[1].split('/')[0].split('?')[0];
  }
  str = str.replace(/^@+/, '').replace(/\/+$/, '').trim();
  return str;
}

export function parseIndonesianDate(val: any): { dateStr: string | null; warning?: string } {
  if (!val) return { dateStr: null };

  // If already Date object or numeric Excel serial date
  if (val instanceof Date) {
    return { dateStr: val.toISOString().split('T')[0] };
  }
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const year = d.y;
      const month = String(d.m).padStart(2, '0');
      const day = String(d.d).padStart(2, '0');
      return { dateStr: `${year}-${month}-${day}` };
    }
  }

  const str = String(val).trim();
  if (!str) return { dateStr: null };

  // Check ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return { dateStr: str };
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return { dateStr: `${year}-${month}-${day}` };
  }

  // Handle ambiguous cases like 2026-07-12 vs 2026-12-07
  return { dateStr: str, warning: `Format tanggal "${str}" mungkin ambigu` };
}

export function mapCurationDecision(val: any): { curation: CurationStatus; pipeline: PipelineStatus } {
  if (!val) return { curation: 'pending', pipeline: 'pool' };
  const str = String(val).trim().toUpperCase();

  if (str.includes('OKE') || str === 'TRUE' || str === 'APPROVED') {
    return { curation: 'oke', pipeline: 'curated' };
  }
  if (str.includes('SECOND') || str.includes('CADANGAN')) {
    return { curation: 'second_option', pipeline: 'curated' };
  }
  if (str.includes('REJECT') || str === 'FALSE' || str.includes('TOLAK')) {
    return { curation: 'reject', pipeline: 'refuse' };
  }

  return { curation: 'pending', pipeline: 'pool' };
}

export function mapCategory(val: any): Category {
  if (!val) return 'UNASSIGNED';
  const str = String(val).trim().toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(str)) return str as Category;
  const labeledCategory = str.match(/^(?:CATEGORY|KATEGORI|KAT)\s*[-:]?\s*([A-D])(?:\b|$)/);
  if (labeledCategory) return labeledCategory[1] as Category;
  if (str.includes('TONER') && str.includes('LOTION')) return 'D';
  if (str.includes('TONER')) return 'A';
  if (str.includes('LOTION')) return 'B';
  if (str.includes('CLEANSER')) return 'C';
  return 'UNASSIGNED';
}

export function shouldPreserveExistingStatus(existingStatus?: PipelineStatus, incomingStatus?: PipelineStatus): boolean {
  if (!existingStatus) return false;
  if (!incomingStatus) return true;

  // Active progress or decision in app must never be downgraded to 'pool' or initial 'curated'
  const appProgressStatuses: PipelineStatus[] = [
    'contacted', 
    'replied', 
    'form_filled', 
    'join', 
    'sample_sent', 
    'sow_1', 
    'sow_2', 
    'completed', 
    'refuse', 
    'invalid_phone'
  ];

  if (appProgressStatuses.includes(existingStatus)) {
    if (incomingStatus === 'pool' || incomingStatus === 'curated') {
      return true;
    }
  }
  return false;
}

export function parseWorkbook(workbook: XLSX.WorkBook): ParseResult {
  const sheetNames = workbook.SheetNames;
  const warnings: string[] = [];
  let duplicatesCount = 0;

  // Temporary maps indexed by clean username
  const creatorsMap = new Map<string, Partial<Creator>>();
  const shipmentsMap = new Map<string, Partial<Shipment>>();
  const sowsMap = new Map<string, Partial<SOWRecord>[]>();
  const poolSheetName = sheetNames.find(n => /pool/i.test(n));
  const rawPool = poolSheetName
    ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[poolSheetName])
    : [];
  const poolOrderByUsername = new Map<string, number>();
  rawPool.forEach((row, rowIndex) => {
    const userKey = Object.keys(row).find(k => /username/i.test(k));
    const username = userKey ? cleanUsername(row[userKey]) : '';
    if (username && !poolOrderByUsername.has(username)) {
      poolOrderByUsername.set(username, rowIndex);
    }
  });

  // 1. Check & Process Sheet 'Data' (or similar like 'Sheet1', 'Kontak')
  const dataSheetName = sheetNames.find(n => /data/i.test(n));
  if (dataSheetName) {
    const rawData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[dataSheetName]);
    rawData.forEach((row, rowIndex) => {
      // Find username column
      const userColKey = Object.keys(row).find(k => /username/i.test(k));
      const phoneColKey = Object.keys(row).find(k => /no wa|wa|telp|phone|nomor/i.test(k));

      if (userColKey) {
        const u = cleanUsername(row[userColKey]);
        if (u) {
          if (creatorsMap.has(u)) {
            duplicatesCount++;
          }
          const phoneParsed = normalizePhoneNumber(phoneColKey ? row[phoneColKey] : '');
          creatorsMap.set(u, {
            username: u,
            phone_raw: phoneParsed.raw,
            phone_e164: phoneParsed.e164,
            phone_status: phoneParsed.status,
            platform: 'TikTok',
            source: 'Data Sheet',
            curation_status: 'pending',
            pipeline_status: 'pool',
            category: 'UNASSIGNED',
            curation_order: rawPool.length + rowIndex,
          });
        }
      }
    });
  }

  // 2. Check & Process Sheet 'Pool'
  if (poolSheetName) {
    const seenInPool = new Set<string>();
    rawPool.forEach((row, rowIndex) => {
      const userKey = Object.keys(row).find(k => /username/i.test(k));
      if (!userKey) return;
      const u = cleanUsername(row[userKey]);
      if (!u) return;

      if (seenInPool.has(u)) {
        duplicatesCount++;
      } else {
        seenInPool.add(u);
      }

      const catKey = Object.keys(row).find(k => /category|kategori/i.test(k));
      const curatedKey = Object.keys(row).find(k => /curated|kurasi|status/i.test(k));
      const sourceKey = Object.keys(row).find(k => /source|sumber/i.test(k));
      const platformKey = Object.keys(row).find(k => /platform/i.test(k));
      const phoneKey = Object.keys(row).find(k => /no telp|no wa|phone|wa/i.test(k));

      const existing = creatorsMap.get(u) || { username: u };
      const curationDecision = mapCurationDecision(curatedKey ? row[curatedKey] : null);

      let phoneParsed = existing.phone_e164 ? {
        raw: existing.phone_raw || '',
        e164: existing.phone_e164,
        status: existing.phone_status || 'valid'
      } : normalizePhoneNumber(phoneKey ? row[phoneKey] : '');

      creatorsMap.set(u, {
        ...existing,
        username: u,
        category: mapCategory(catKey ? row[catKey] : existing.category),
        curation_status: curationDecision.curation !== 'pending' ? curationDecision.curation : (existing.curation_status || 'pending'),
        pipeline_status: curationDecision.pipeline !== 'pool' ? curationDecision.pipeline : (existing.pipeline_status || 'pool'),
        source: (sourceKey && row[sourceKey]) ? String(row[sourceKey]).trim() : (existing.source || 'Pool'),
        platform: (platformKey && /shopee/i.test(String(row[platformKey]))) ? 'Shopee' : (existing.platform || 'TikTok'),
        phone_raw: phoneParsed.raw || existing.phone_raw || '',
        phone_e164: phoneParsed.e164 || existing.phone_e164 || '',
        phone_status: phoneParsed.status || existing.phone_status || 'missing',
        curation_order: poolOrderByUsername.get(u) ?? rawPool.length + rowIndex,
      });
    });
  }

  // 3. Check & Process Sheet 'Final Status'
  const finalSheetName = sheetNames.find(n => /final status|status final/i.test(n));
  if (finalSheetName) {
    const rawFinal = XLSX.utils.sheet_to_json<any>(workbook.Sheets[finalSheetName]);
    rawFinal.forEach(row => {
      const userKey = Object.keys(row).find(k => /username/i.test(k));
      if (!userKey) return;
      const u = cleanUsername(row[userKey]);
      if (!u) return;

      const statusKey = Object.keys(row).find(k => /status/i.test(k));
      const existing = creatorsMap.get(u) || { username: u };
      const rawStatus = statusKey ? String(row[statusKey]).trim().toLowerCase() : '';

      let pipeStatus: PipelineStatus = existing.pipeline_status || 'pool';
      if (rawStatus.includes('join')) pipeStatus = 'join';
      else if (rawStatus.includes('contacted') || rawStatus.includes('terhubung')) pipeStatus = 'contacted';
      else if (rawStatus.includes('refuse') || rawStatus.includes('tolak')) pipeStatus = 'refuse';

      creatorsMap.set(u, {
        ...existing,
        pipeline_status: pipeStatus,
      });
    });
  }

  // 4. Check & Process Sheet 'Seeding Sample'
  const seedingSheetName = sheetNames.find(n => /seeding|sample/i.test(n));
  if (seedingSheetName) {
    const rawSeeding = XLSX.utils.sheet_to_json<any>(workbook.Sheets[seedingSheetName]);
    rawSeeding.forEach(row => {
      const userKey = Object.keys(row).find(k => /username/i.test(k));
      if (!userKey) return;
      const u = cleanUsername(row[userKey]);
      if (!u) return;

      const nameKey = Object.keys(row).find(k => /nama penerima|recipient|penerima/i.test(k));
      const phoneKey = Object.keys(row).find(k => /no telp|phone|hp/i.test(k));
      const addressKey = Object.keys(row).find(k => /alamat|address/i.test(k));
      const productKey = Object.keys(row).find(k => /produk|product/i.test(k));
      const statusKey = Object.keys(row).find(k => /status/i.test(k));
      const trackingKey = Object.keys(row).find(k => /tracking|resi/i.test(k));

      shipmentsMap.set(u, {
        recipient_name: nameKey ? String(row[nameKey]).trim() : '',
        recipient_phone: phoneKey ? String(row[phoneKey]).trim() : '',
        address: addressKey ? String(row[addressKey]).trim() : '',
        product: productKey ? String(row[productKey]).trim() : 'Dew Theory Product',
        status: statusKey && /sent|kirim|sudah/i.test(String(row[statusKey])) ? 'sent' : 'pending',
        tracking_no: trackingKey ? String(row[trackingKey]).trim() : '',
        courier: 'J&T',
      });

      // Update creator pipeline status if sample sent
      const existing = creatorsMap.get(u);
      if (existing) {
        existing.pipeline_status = 'sample_sent';
      }
    });
  }

  // 5. Check & Process Sheet 'SOW Report'
  const sowSheetName = sheetNames.find(n => /sow/i.test(n));
  if (sowSheetName) {
    const rawSow = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sowSheetName]);
    rawSow.forEach(row => {
      const userKey = Object.keys(row).find(k => /username/i.test(k));
      if (!userKey) return;
      const u = cleanUsername(row[userKey]);
      if (!u) return;

      const sow1DateKey = Object.keys(row).find(k => /posting date sow 1|date sow 1|tanggal sow 1/i.test(k));
      const sow1LinkKey = Object.keys(row).find(k => /link sow 1/i.test(k));
      const sow2DateKey = Object.keys(row).find(k => /posting date sow 2|date sow 2|tanggal sow 2/i.test(k));
      const sow2LinkKey = Object.keys(row).find(k => /link sow 2/i.test(k));

      const sowRecords: Partial<SOWRecord>[] = [];

      if (sow1DateKey || sow1LinkKey) {
        const d1 = parseIndonesianDate(sow1DateKey ? row[sow1DateKey] : null);
        if (d1.warning) warnings.push(`[${u}] SOW 1: ${d1.warning}`);
        sowRecords.push({
          sow_no: 1,
          link: sow1LinkKey ? String(row[sow1LinkKey]).trim() : '',
          posted_at: d1.dateStr,
          status: sow1LinkKey && row[sow1LinkKey] ? 'verified' : 'pending',
        });
      }

      if (sow2DateKey || sow2LinkKey) {
        const d2 = parseIndonesianDate(sow2DateKey ? row[sow2DateKey] : null);
        if (d2.warning) warnings.push(`[${u}] SOW 2: ${d2.warning}`);
        sowRecords.push({
          sow_no: 2,
          link: sow2LinkKey ? String(row[sow2LinkKey]).trim() : '',
          posted_at: d2.dateStr,
          status: sow2LinkKey && row[sow2LinkKey] ? 'verified' : 'pending',
        });
      }

      if (sowRecords.length > 0) {
        sowsMap.set(u, sowRecords);
        const existing = creatorsMap.get(u);
        if (existing) {
          const hasSow2 = sowRecords.find(s => s.sow_no === 2 && s.link);
          const hasSow1 = sowRecords.find(s => s.sow_no === 1 && s.link);
          if (hasSow2) existing.pipeline_status = 'sow_2';
          else if (hasSow1) existing.pipeline_status = 'sow_1';
        }
      }
    });
  }

  // If none of standard sheet names matched, try treating the first sheet as a general Creator import
  if (!dataSheetName && !poolSheetName && sheetNames.length > 0) {
    const defaultSheet = sheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[defaultSheet]);
    rawRows.forEach((row, rowIndex) => {
      const userKey = Object.keys(row).find(k => /username|creator|kol|akun/i.test(k));
      if (!userKey) return;
      const u = cleanUsername(row[userKey]);
      if (!u) return;

      const phoneKey = Object.keys(row).find(k => /wa|telp|phone|hp|nomor/i.test(k));
      const catKey = Object.keys(row).find(k => /cat|kategori/i.test(k));
      const sourceKey = Object.keys(row).find(k => /source|sumber/i.test(k));
      const platformKey = Object.keys(row).find(k => /platform/i.test(k));
      const curatedKey = Object.keys(row).find(k => /curated|kurasi|status/i.test(k));

      const phoneParsed = normalizePhoneNumber(phoneKey ? row[phoneKey] : '');
      const curationDecision = mapCurationDecision(curatedKey ? row[curatedKey] : null);

      creatorsMap.set(u, {
        username: u,
        phone_raw: phoneParsed.raw,
        phone_e164: phoneParsed.e164,
        phone_status: phoneParsed.status,
        category: mapCategory(catKey ? row[catKey] : 'UNASSIGNED'),
        curation_status: curationDecision.curation,
        pipeline_status: curationDecision.pipeline,
        curation_order: rowIndex,
        source: sourceKey && row[sourceKey] ? String(row[sourceKey]).trim() : 'CSV/Excel',
        platform: platformKey && /shopee/i.test(String(row[platformKey])) ? 'Shopee' : 'TikTok',
      });
    });
  }

  const creators = Array.from(creatorsMap.values());
  const shipments = Array.from(shipmentsMap.values());
  const sows: Partial<SOWRecord>[] = [];
  sowsMap.forEach(records => sows.push(...records));

  let validPhoneCount = 0;
  let missingPhoneCount = 0;
  let invalidPhoneCount = 0;

  creators.forEach(c => {
    if (c.phone_status === 'valid') validPhoneCount++;
    else if (c.phone_status === 'missing') missingPhoneCount++;
    else invalidPhoneCount++;
  });

  return {
    creators,
    shipments,
    sows,
    duplicatesCount,
    validPhoneCount,
    missingPhoneCount,
    invalidPhoneCount,
    sheetNamesFound: sheetNames,
    warnings,
  };
}
