create table public.oauth_registrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint oauth_registrations_pkey primary key (user_id, provider),
  constraint oauth_registrations_provider_check
    check (provider in ('google', 'apple', 'microsoft'))
);

alter table public.oauth_registrations enable row level security;

create policy "Users can view their own oauth registrations"
  on public.oauth_registrations
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own oauth registrations"
  on public.oauth_registrations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own oauth registrations"
  on public.oauth_registrations
  for update
  using (auth.uid() = user_id);

create trigger update_oauth_registrations_updated_at
before update on public.oauth_registrations
for each row execute function public.update_updated_at_column();
