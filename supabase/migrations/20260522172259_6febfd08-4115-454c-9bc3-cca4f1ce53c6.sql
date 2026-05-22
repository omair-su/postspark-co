create table if not exists public.analytics_events (
  id bigserial primary key,
  event text not null,
  user_id uuid,
  session_id text,
  path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  props jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_event_idx on public.analytics_events(event, created_at desc);
create index if not exists analytics_events_user_idx on public.analytics_events(user_id, created_at desc);
alter table public.analytics_events enable row level security;

create table if not exists public.demo_uses (
  id bigserial primary key,
  ip_hash text not null,
  input_chars int,
  created_at timestamptz not null default now()
);
create index if not exists demo_uses_ip_day_idx on public.demo_uses(ip_hash, created_at desc);
alter table public.demo_uses enable row level security;