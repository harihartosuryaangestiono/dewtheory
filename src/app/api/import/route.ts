import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key so this route is not subject to RLS policies.
// This route must only be called from authenticated users (cookie is validated below).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const DB_COLS = [
  'id', 'campaign_id', 'username', 'display_name',
  'phone_raw', 'phone_e164', 'phone_status',
  'platform', 'source', 'category',
  'curation_status', 'pipeline_status',
  'notes', 'tags', 'is_favorite',
  'assigned_to', 'locked_by', 'locked_until',
  'contacted_at', 'contacted_by',
  'created_at', 'updated_at',
] as const;

/** Strip any fields not in the creators table schema to avoid Supabase column errors. */
function toDbRow(c: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(DB_COLS.map(k => [k, c[k] ?? null]));
}

export async function POST(req: NextRequest) {
  try {
    // Validate the caller is an authenticated Supabase user via their access token.
    const authHeader = req.headers.get('authorization') || '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized: missing token.' }, { status: 401 });
    }

    // Verify the token belongs to a real user.
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid or expired token.' }, { status: 401 });
    }

    const body = await req.json();
    const rows: Record<string, unknown>[] = Array.isArray(body) ? body : [body];

    if (rows.length === 0) {
      return NextResponse.json({ upserted: 0 });
    }

    const dbRows = rows.map(toDbRow);

    // Upsert in chunks of 500
    const CHUNK = 500;
    let totalUpserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < dbRows.length; i += CHUNK) {
      const chunk = dbRows.slice(i, i + CHUNK);
      const { error, count } = await supabaseAdmin
        .from('creators')
        .upsert(chunk, { onConflict: 'campaign_id,username', ignoreDuplicates: false, count: 'estimated' });

      if (error) {
        errors.push(`chunk ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
      } else {
        totalUpserted += count ?? chunk.length;
      }
    }

    if (errors.length > 0) {
      console.error('[/api/import] Partial errors:', errors);
      return NextResponse.json(
        { upserted: totalUpserted, errors },
        { status: errors.length === Math.ceil(dbRows.length / CHUNK) ? 500 : 207 }
      );
    }

    return NextResponse.json({ upserted: totalUpserted });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/import] Unexpected error:', msg);
    return NextResponse.json({ error: 'Server error: ' + msg }, { status: 500 });
  }
}
