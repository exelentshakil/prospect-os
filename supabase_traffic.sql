-- Prospect OS — persistence layer.
-- Everything below is optional: the demo runs end to end with no Supabase
-- project at all, and every read degrades to an empty result rather than an
-- error if these tables are missing.

create table if not exists traffic_logs (
  id bigserial primary key,
  path text not null default '/',
  ip text,
  city text,
  region text,
  country text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists traffic_logs_created_at_idx on traffic_logs (created_at desc);
create index if not exists traffic_logs_path_idx on traffic_logs (path);

create table if not exists crm_records (
  domain text primary key,
  company text not null,
  stage text not null default 'sourced',
  score numeric,
  tier text,
  owner text,
  updated_at timestamptz not null default now()
);

create table if not exists crm_activity (
  id bigserial primary key,
  domain text not null,
  verb text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists crm_activity_domain_idx on crm_activity (domain, created_at desc);

create table if not exists calls (
  id bigserial primary key,
  domain text not null,
  company text,
  contact text,
  slot_start timestamptz not null,
  agenda jsonb,
  created_at timestamptz not null default now()
);

-- Writes happen only from server-side API routes using the service role key,
-- so row level security stays on with no public policies.
alter table traffic_logs enable row level security;
alter table crm_records enable row level security;
alter table crm_activity enable row level security;
alter table calls enable row level security;
