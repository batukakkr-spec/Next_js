create or replace function public.award_xp(
  _user_id uuid,
  _amount int,
  _reason text,
  _quest_id uuid default null
)
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

  loop
    select xp, level, xp_to_next
      into current_xp, current_level, next_threshold
    from public.profiles
    where user_id = _user_id;

    exit when current_level >= 100 or current_xp < next_threshold;

    update public.profiles
      set level = current_level + 1,
          xp = current_xp - next_threshold,
          xp_to_next = (next_threshold * 1.25)::int
    where user_id = _user_id;
  end loop;

  update public.profiles
    set level = 100,
        xp = xp_to_next,
        last_activity_at = now()
    where user_id = _user_id
      and level >= 100;
end;
$$;

update public.profiles
set level = 100,
    xp = greatest(xp_to_next, 1),
    xp_to_next = greatest(xp_to_next, 1)
where level > 100;

update public.profiles
set xp = xp_to_next
where level = 100
  and xp < xp_to_next;

