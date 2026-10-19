create table if not exists public.portfolio_state (
  id text primary key check (id = 'current'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_state enable row level security;
revoke all on table public.portfolio_state from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-pdfs',
  'portfolio-pdfs',
  true,
  52428800,
  array['application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
