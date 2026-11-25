alter table public.creators
  add column if not exists curation_order integer;
