import { NextRequest, NextResponse } from 'next/server';
import { cleanUsername, mapCategory, mapCurationDecision } from '@/lib/utils/excel';
import { normalizePhoneNumber } from '@/lib/utils/phone';

// Standard CORS headers for Chrome Extension cross-origin requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
};

// In-memory sliding window rate limiter (120 requests per minute)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = (rateLimitMap.get(clientIp) || []).filter(ts => ts > windowStart);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  timestamps.push(now);
  rateLimitMap.set(clientIp, timestamps);
  return true;
}

// OPTIONS handler for browser CORS pre-flight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function processCurationItem(body: any): { success: boolean; data?: any; reason?: string } {
  if (!body || typeof body !== 'object') {
    return { success: false, reason: 'Payload item bukan objek valid.' };
  }

  const rawUsername = body.username || body.user || body.kol || body.tiktok_username || body.creator;
  if (!rawUsername) {
    return { success: false, reason: 'Field "username" wajib diisi.' };
  }

  const username = cleanUsername(rawUsername);
  if (!username) {
    return { success: false, reason: 'Username kosong setelah dibersihkan.' };
  }

  const rawDecision = body.decision || body.curation || body.status || body.curated || 'oke';
  const rawCategory = body.category || body.cat || body.kategori;
  const rawPhone = body.phone || body.phone_raw || body.wa || body.telp || body.no_wa || '';
  const source = body.source || 'Chrome Extension';
  const platform = body.platform && /shopee/i.test(body.platform) ? 'Shopee' : 'TikTok';
  const notes = body.notes || body.catatan || body.comment || '';

  const curationResult = mapCurationDecision(rawDecision);
  const category = mapCategory(rawCategory);
  const phoneResult = normalizePhoneNumber(rawPhone);

  const record = {
    username,
    display_name: body.display_name || body.name || username,
    curation_status: curationResult.curation,
    pipeline_status: curationResult.pipeline,
    category,
    source,
    platform,
    phone_raw: phoneResult.raw,
    phone_e164: phoneResult.e164,
    phone_status: phoneResult.status,
    notes,
    updated_at: new Date().toISOString(),
  };

  return { success: true, data: record };
}

export async function POST(req: NextRequest) {
  try {
    const validApiKey = process.env.CURATION_API_KEY;

    if (!validApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: CURATION_API_KEY belum dikonfigurasi di server.' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // 1. Rate Limiting Check
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'client';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit terlampaui. Maksimal 120 permintaan per menit.' },
        { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': '60' } }
      );
    }

    // 2. Authenticate: Header x-api-key or Authorization Bearer
    const customHeader = req.headers.get('x-api-key') || '';
    const authHeader = req.headers.get('authorization') || '';
    const token = customHeader || authHeader.replace(/^Bearer\s+/i, '');

    if (!token || token !== validApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Header x-api-key tidak valid atau tidak disertakan.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 3. Parse Body (supports single object or Array batch)
    const body = await req.json();

    if (Array.isArray(body)) {
      // BATCH MODE
      const success: any[] = [];
      const duplicates: any[] = [];
      const failed: any[] = [];
      const seenUsernames = new Set<string>();

      body.forEach((item, index) => {
        const processed = processCurationItem(item);
        if (!processed.success) {
          failed.push({ index, item, reason: processed.reason });
        } else {
          const u = processed.data.username;
          if (seenUsernames.has(u)) {
            duplicates.push({ index, username: u, reason: 'Duplikat dalam batch payload yang sama' });
          } else {
            seenUsernames.add(u);
            success.push(processed.data);
          }
        }
      });

      return NextResponse.json({
        mode: 'batch',
        total: body.length,
        success_count: success.length,
        duplicate_count: duplicates.length,
        failed_count: failed.length,
        data: {
          success,
          duplicates,
          failed,
        },
      }, { status: 200, headers: CORS_HEADERS });
    } else {
      // SINGLE ITEM MODE
      const processed = processCurationItem(body);

      if (!processed.success) {
        return NextResponse.json(
          { error: processed.reason },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Creator @${processed.data.username} berhasil dikurasi sebagai "${processed.data.curation_status}" (${processed.data.category})`,
        data: processed.data,
      }, { status: 200, headers: CORS_HEADERS });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server: ' + err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: 'POST /api/curation',
    documentation: {
      headers: {
        'x-api-key': '<KUNCI_API_RAHASIA>',
        'Content-Type': 'application/json',
      },
      cors: 'Enabled (Access-Control-Allow-Origin: *)',
      batch_supported: true,
      single_example: {
        username: 'skincarebyrani',
        decision: 'oke', // 'oke' | 'second_option' | 'reject'
        category: 'A', // 'A' | 'B' | 'C' | 'D'
        source: 'Chrome Extension',
        platform: 'TikTok',
        notes: 'Reviewer toner oily skin',
      },
      batch_example: [
        { username: 'creator_a', decision: 'oke', category: 'A' },
        { username: 'creator_b', decision: 'second_option', category: 'B' },
      ],
    },
  }, { headers: CORS_HEADERS });
}
