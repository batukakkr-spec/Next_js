drop policy if exists "Users insert own user_quests" on public.user_quests;
drop policy if exists "Users update own user_quests" on public.user_quests;
drop policy if exists "Users delete own user_quests" on public.user_quests;
drop policy if exists "Users insert own xp_logs" on public.xp_logs;
drop policy if exists "Users insert own achievements" on public.user_achievements;

revoke execute on function public.bootstrap_first_admin() from public, anon, authenticated;
revoke execute on function public.award_xp(uuid, int, text, uuid) from public, anon, authenticated;

create unique index if not exists idx_user_quests_user_quest_active_unique
  on public.user_quests(user_id, quest_id)
  where status = 'active';

create or replace function public.grant_achievement(_user_id uuid, _achievement_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _achievement_id uuid;
  _achievement_title text;
  _achievement_xp int;
begin
  select id, title, xp_reward
    into _achievement_id, _achievement_title, _achievement_xp
  from public.achievements
  where code = _achievement_code;

  if _achievement_id is null then
    return false;
  end if;

  insert into public.user_achievements (user_id, achievement_id)
  values (_user_id, _achievement_id)
  on conflict (user_id, achievement_id) do nothing;

  if not found then
    return false;
  end if;

  perform public.award_xp(
    _user_id,
    _achievement_xp,
    concat('Achievement: ', _achievement_title),
    null
  );

  return true;
end;
$$;

revoke execute on function public.grant_achievement(uuid, text) from public, anon, authenticated;

create or replace function public.evaluate_achievements(_user_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  _completed_quests int := 0;
  _level int := 1;
  _streak int := 0;
  _unlocked text[] := array[]::text[];
begin
  select count(*)
    into _completed_quests
  from public.user_quests
  where user_id = _user_id
    and status = 'completed';

  select level, streak_days
    into _level, _streak
  from public.profiles
  where user_id = _user_id;

  if _completed_quests >= 1 and public.grant_achievement(_user_id, 'first_quest') then
    _unlocked := array_append(_unlocked, 'first_quest');
  end if;

  if _completed_quests >= 25 and public.grant_achievement(_user_id, 'quest_master') then
    _unlocked := array_append(_unlocked, 'quest_master');
  end if;

  if _streak >= 3 and public.grant_achievement(_user_id, 'streak_3') then
    _unlocked := array_append(_unlocked, 'streak_3');
  end if;

  if _streak >= 7 and public.grant_achievement(_user_id, 'streak_7') then
    _unlocked := array_append(_unlocked, 'streak_7');
  end if;

  if _level >= 5 and public.grant_achievement(_user_id, 'level_5') then
    _unlocked := array_append(_unlocked, 'level_5');
  end if;

  if _level >= 10 and public.grant_achievement(_user_id, 'level_10') then
    _unlocked := array_append(_unlocked, 'level_10');
  end if;

  return _unlocked;
end;
$$;

revoke execute on function public.evaluate_achievements(uuid) from public, anon, authenticated;

create or replace function public.accept_quest(_quest_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _user_quest_id uuid;
begin
  if _user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.quests
    where id = _quest_id
      and is_active = true
  ) then
    raise exception 'Quest is unavailable';
  end if;

  begin
    insert into public.user_quests (user_id, quest_id)
    values (_user_id, _quest_id)
    returning id into _user_quest_id;
  exception
    when unique_violation then
      select id
        into _user_quest_id
      from public.user_quests
      where user_id = _user_id
        and quest_id = _quest_id
        and status = 'active'
      order by created_at desc
      limit 1;

      raise exception 'Quest is already active';
  end;

  return _user_quest_id;
end;
$$;

grant execute on function public.accept_quest(uuid) to authenticated;

create or replace function public.complete_quest(_user_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _quest_title text;
  _quest_id uuid;
  _xp_reward int;
  _target_value int;
  _unlocked text[] := array[]::text[];
begin
  if _user_id is null then
    raise exception 'Authentication required';
  end if;

  select q.title, q.id, q.xp_reward, q.target_value
    into _quest_title, _quest_id, _xp_reward, _target_value
  from public.user_quests uq
  join public.quests q on q.id = uq.quest_id
  where uq.id = _user_quest_id
    and uq.user_id = _user_id
    and uq.status = 'active'
  for update of uq;

  if _quest_id is null then
    raise exception 'Active quest not found';
  end if;

  update public.user_quests
    set status = 'completed',
        progress = _target_value,
        completed_at = now()
  where id = _user_quest_id;

  perform public.award_xp(
    _user_id,
    _xp_reward,
    concat('Quest: ', _quest_title),
    _quest_id
  );

  _unlocked := public.evaluate_achievements(_user_id);

  return jsonb_build_object(
    'quest_id', _quest_id,
    'xp_awarded', _xp_reward,
    'unlocked', to_jsonb(coalesce(_unlocked, array[]::text[]))
  );
end;
$$;

grant execute on function public.complete_quest(uuid) to authenticated;

create or replace function public.wipe_my_progress()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
begin
  if _user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.user_achievements where user_id = _user_id;
  delete from public.xp_logs where user_id = _user_id;
  delete from public.user_quests where user_id = _user_id;

  update public.profiles
    set level = 1,
        xp = 0,
        xp_to_next = 100,
        streak_days = 0,
        last_activity_at = null
  where user_id = _user_id;
end;
$$;

grant execute on function public.wipe_my_progress() to authenticated;
