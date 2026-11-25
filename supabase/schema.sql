-- ==============================================================================
-- DEW THEORY AFFILIATE HUB — SUPABASE DATABASE SCHEMA (DDL)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CAMPAIGNS
create table if not exists public.campaigns (
  id text primary key,
  name text not null,
  is_active boolean default true,
  target_affiliates integer default 100,
  target_samples integer default 100,
  quota_a integer default 35,
  quota_b integer default 25,
  quota_c integer default 15,
  quota_d integer default 25,
  timeline_listing_start date default '2026-11-16',
  timeline_listing_end date default '2026-11-22',
  timeline_seeding_start date default '2026-11-16',
  timeline_seeding_end date default '2026-11-30',
  timeline_sow_start date default '2026-11-25',
  timeline_sow_end date default '2026-12-25',
  deadline_posting date default '2026-12-15',
  created_at timestamptz default now()
);

-- 2. CREATORS
create table if not exists public.creators (
  id uuid primary key default uuid_generate_v4(),
  campaign_id text references public.campaigns(id) on delete cascade default 'desember-2026',
  username text not null,
  display_name text,
  phone_raw text,
  phone_e164 text,
  phone_status text default 'missing' check (phone_status in ('valid', 'missing', 'invalid')),
  platform text default 'TikTok' check (platform in ('TikTok', 'Shopee', 'Instagram')),
  source text default 'Manual',
  category text default 'UNASSIGNED' check (category in ('A', 'B', 'C', 'D', 'UNASSIGNED')),
  curation_order integer,
  curation_status text default 'pending' check (curation_status in ('pending', 'oke', 'second_option', 'reject')),
  pipeline_status text default 'pool' check (pipeline_status in (
    'pool', 'curated', 'queued', 'contacted', 'replied', 'join', 
    'form_filled', 'sample_sent', 'sow_1', 'sow_2', 'completed', 
    'refuse', 'no_response', 'invalid_phone'
  )),
  notes text,
  tags text[] default '{}',
  is_favorite boolean default false,
  assigned_to text,
  locked_by text,
  locked_until timestamptz,
  contacted_at timestamptz,
  contacted_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_creator_campaign_username unique(campaign_id, username)
);

-- 3. MESSAGES LOG
create table if not exists public.messages_log (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade,
  user_name text not null,
  template_type text not null,
  message_body text not null,
  sent_at timestamptz default now()
);

-- 4. SHIPMENTS (SEEDING SAMPLE)
create table if not exists public.shipments (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade unique,
  recipient_name text,
  recipient_phone text,
  address text,
  product text not null,
  status text default 'pending' check (status in ('pending', 'sent', 'delivered')),
  tracking_no text,
  courier text default 'J&T',
  sent_at timestamptz,
  address_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. SOW (STATEMENT OF WORK POSTING)
create table if not exists public.sow (
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references public.creators(id) on delete cascade,
  sow_no integer not null check (sow_no in (1, 2, 3, 4)),
  link text,
  posted_at date,
  status text default 'pending' check (status in ('pending', 'submitted', 'verified', 'overdue')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_creator_sow_no unique(creator_id, sow_no)
);

-- 6. TEMPLATES
create table if not exists public.templates (
  id text primary key,
  title text not null,
  category text,
  platform text default 'TikTok',
  content text not null,
  updated_at timestamptz default now()
);

-- 7. SETTINGS
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- 8. ACTIVITY LOG
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_name text not null,
  creator_id uuid references public.creators(id) on delete set null,
  creator_username text,
  action text not null,
  details text,
  created_at timestamptz default now()
);

-- INDEXES FOR MAXIMUM QUERY SPEED
create index if not exists idx_creators_campaign on public.creators(campaign_id);
create index if not exists idx_creators_username on public.creators(username);
create index if not exists idx_creators_curation on public.creators(curation_status);
create index if not exists idx_creators_pipeline on public.creators(pipeline_status);
create index if not exists idx_creators_category on public.creators(category);
create index if not exists idx_creators_locked on public.creators(locked_until);
create index if not exists idx_shipments_creator on public.shipments(creator_id);
create index if not exists idx_sow_creator on public.sow(creator_id);
create index if not exists idx_activity_created on public.activity_log(created_at desc);

-- REALTIME ENABLEMENT
alter publication supabase_realtime add table public.creators;
alter publication supabase_realtime add table public.messages_log;
alter publication supabase_realtime add table public.shipments;
alter publication supabase_realtime add table public.sow;
alter publication supabase_realtime add table public.activity_log;

-- ROW LEVEL SECURITY (RLS)
alter table public.campaigns enable row level security;
alter table public.creators enable row level security;
alter table public.messages_log enable row level security;
alter table public.shipments enable row level security;
alter table public.sow enable row level security;
alter table public.templates enable row level security;
alter table public.settings enable row level security;
alter table public.activity_log enable row level security;

-- Policy: Allow all operations for authenticated users (team 2 orang)
create policy "Authenticated users full access campaigns" on public.campaigns for all to authenticated using (true);
create policy "Authenticated users full access creators" on public.creators for all to authenticated using (true);
create policy "Authenticated users full access messages" on public.messages_log for all to authenticated using (true);
create policy "Authenticated users full access shipments" on public.shipments for all to authenticated using (true);
create policy "Authenticated users full access sow" on public.sow for all to authenticated using (true);
create policy "Authenticated users full access templates" on public.templates for all to authenticated using (true);
create policy "Authenticated users full access settings" on public.settings for all to authenticated using (true);
create policy "Authenticated users full access activity" on public.activity_log for all to authenticated using (true);

-- Policy: Allow service role full access for API & extension
create policy "Service role full access creators" on public.creators for all to service_role using (true);
create policy "Service role full access activity" on public.activity_log for all to service_role using (true);

-- ATOMIC CLAIM LOCK FUNCTION
create or replace function public.claim_creator_lock(
  p_creator_id uuid,
  p_user_name text,
  p_lock_minutes int default 5
)
returns jsonb as $$
declare
  v_locked_by text;
  v_locked_until timestamptz;
  v_new_expiry timestamptz;
begin
  v_new_expiry := now() + (p_lock_minutes || ' minutes')::interval;

  update public.creators
  set 
    locked_by = p_user_name,
    locked_until = v_new_expiry,
    updated_at = now()
  where id = p_creator_id
    and (locked_until is null or locked_until < now() or locked_by = p_user_name);

  if found then
    return jsonb_build_object(
      'success', true,
      'locked_by', p_user_name,
      'locked_until', v_new_expiry
    );
  else
    select locked_by, locked_until into v_locked_by, v_locked_until
    from public.creators
    where id = p_creator_id;

    return jsonb_build_object(
      'success', false,
      'locked_by', coalesce(v_locked_by, 'Pengguna Lain'),
      'locked_until', v_locked_until
    );
  end if;
end;
$$ language plpgsql security definer;

-- RELEASE CREATOR LOCK FUNCTION
create or replace function public.release_creator_lock(
  p_creator_id uuid,
  p_user_name text
)
returns void as $$
begin
  update public.creators
  set locked_by = null, locked_until = null, updated_at = now()
  where id = p_creator_id and locked_by = p_user_name;
end;
$$ language plpgsql security definer;

grant execute on function public.claim_creator_lock(uuid, text, int) to authenticated;
grant execute on function public.release_creator_lock(uuid, text) to authenticated;


