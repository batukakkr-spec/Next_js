-- =========================
-- ENUMS
-- =========================
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.quest_difficulty as enum ('easy', 'medium', 'hard', 'epic');
create type public.quest_category as enum ('fitness', 'mind', 'study', 'work', 'social', 'creative');
create type public.user_quest_status as enum ('active', 'completed', 'failed');

-- =========================
-- updated_at helper
-- =========================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- PROFILES
-- =========================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  level int not null default 1,
  xp int not null default 0,
  xp_to_next int not null default 100,
  streak_days int not null default 0,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = user_id);

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- =========================
-- USER ROLES (separate table to avoid privilege escalation)
-- =========================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins can view all roles"
  on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can manage roles"
  on public.user_roles for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- =========================
-- AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- QUESTS (catalog)
-- =========================
create table public.quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category quest_category not null default 'fitness',
  difficulty quest_difficulty not null default 'easy',
  xp_reward int not null default 10,
  target_value int not null default 1,
  unit text default 'reps',
  is_daily boolean not null default true,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quests enable row level security;

create policy "Quests are viewable by authenticated users"
  on public.quests for select to authenticated using (true);
create policy "Admins can insert quests"
  on public.quests for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));
create policy "Admins can update quests"
  on public.quests for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'moderator'));
create policy "Admins can delete quests"
  on public.quests for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger update_quests_updated_at
before update on public.quests
for each row execute function public.update_updated_at_column();

create index idx_quests_active on public.quests(is_active);
create index idx_quests_category on public.quests(category);

-- =========================
-- USER QUESTS (assignments / progress)
-- =========================
create table public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  status user_quest_status not null default 'active',
  progress int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_quests enable row level security;

create policy "Users view own user_quests"
  on public.user_quests for select using (auth.uid() = user_id);
create policy "Admins view all user_quests"
  on public.user_quests for select using (public.has_role(auth.uid(), 'admin'));
create policy "Users insert own user_quests"
  on public.user_quests for insert with check (auth.uid() = user_id);
create policy "Users update own user_quests"
  on public.user_quests for update using (auth.uid() = user_id);
create policy "Users delete own user_quests"
  on public.user_quests for delete using (auth.uid() = user_id);

create trigger update_user_quests_updated_at
before update on public.user_quests
for each row execute function public.update_updated_at_column();

create index idx_user_quests_user on public.user_quests(user_id);
create index idx_user_quests_status on public.user_quests(status);

-- =========================
-- XP LOGS
-- =========================
create table public.xp_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,
  reason text not null,
  quest_id uuid references public.quests(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.xp_logs enable row level security;

create policy "Users view own xp_logs"
  on public.xp_logs for select using (auth.uid() = user_id);
create policy "Admins view all xp_logs"
  on public.xp_logs for select using (public.has_role(auth.uid(), 'admin'));
create policy "Users insert own xp_logs"
  on public.xp_logs for insert with check (auth.uid() = user_id);

create index idx_xp_logs_user_created on public.xp_logs(user_id, created_at desc);

-- =========================
-- ACHIEVEMENTS
-- =========================
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  icon text,
  xp_reward int not null default 50,
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "Achievements viewable by all authenticated"
  on public.achievements for select to authenticated using (true);
create policy "Admins manage achievements"
  on public.achievements for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "Users view own achievements"
  on public.user_achievements for select using (auth.uid() = user_id);
create policy "Admins view all user_achievements"
  on public.user_achievements for select using (public.has_role(auth.uid(), 'admin'));
create policy "Users insert own achievements"
  on public.user_achievements for insert with check (auth.uid() = user_id);

-- =========================
-- LEVEL UP HELPER (server-side)
-- =========================
create or replace function public.award_xp(_user_id uuid, _amount int, _reason text, _quest_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_xp int;
  current_level int;
  next_threshold int;
begin
  insert into public.xp_logs (user_id, amount, reason, quest_id)
  values (_user_id, _amount, _reason, _quest_id);

  update public.profiles
    set xp = xp + _amount,
        last_activity_at = now()
    where user_id = _user_id;

  -- Level up loop
  loop
    select xp, level, xp_to_next into current_xp, current_level, next_threshold
      from public.profiles where user_id = _user_id;
    exit when current_xp < next_threshold;

    update public.profiles
      set level = current_level + 1,
          xp = current_xp - next_threshold,
          xp_to_next = (next_threshold * 1.25)::int
      where user_id = _user_id;
  end loop;
end;
$$;

-- =========================
-- SEED QUESTS + ACHIEVEMENTS
-- =========================
insert into public.quests (title, description, category, difficulty, xp_reward, target_value, unit) values
  ('Morning Run', 'Run 2 km to start the day strong', 'fitness', 'easy', 30, 2, 'km'),
  ('Strength Training', 'Complete a 30-minute strength session', 'fitness', 'medium', 50, 30, 'min'),
  ('Flexibility Workout', 'Stretch for 15 minutes', 'fitness', 'easy', 20, 15, 'min'),
  ('Focus Session', '25-min deep work pomodoro', 'work', 'easy', 25, 25, 'min'),
  ('Read 20 Pages', 'Read 20 pages of any book', 'mind', 'easy', 20, 20, 'pages'),
  ('Code Practice', 'Solve 1 algorithm problem', 'study', 'medium', 40, 1, 'problem'),
  ('Cold Shower', 'Take a 2-minute cold shower', 'mind', 'hard', 60, 2, 'min'),
  ('Sleep 8 Hours', 'Get a full night of recovery', 'mind', 'medium', 35, 8, 'hours');

insert into public.achievements (code, title, description, icon, xp_reward) values
  ('first_quest', 'First Step', 'Complete your first quest', 'sparkles', 25),
  ('streak_3', '3-Day Streak', 'Stay active for 3 days in a row', 'flame', 50),
  ('streak_7', '7-Day Streak', 'A full week of consistency', 'flame', 150),
  ('level_5', 'Awakened (Lv.5)', 'Reach level 5', 'crown', 100),
  ('level_10', 'Hunter (Lv.10)', 'Reach level 10', 'crown', 250),
  ('quest_master', 'Quest Master', 'Complete 25 quests', 'trophy', 300);