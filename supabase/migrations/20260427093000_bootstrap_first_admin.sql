create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _admin_exists boolean;
begin
  if _uid is null then
    raise exception 'Authentication required';
  end if;

  select exists(
    select 1
    from public.user_roles
    where role = 'admin'
  ) into _admin_exists;

  if _admin_exists and not public.has_role(_uid, 'admin') then
    raise exception 'An admin already exists';
  end if;

  insert into public.user_roles (user_id, role)
  values (_uid, 'admin')
  on conflict (user_id, role) do nothing;

  return true;
end;
$$;

grant execute on function public.bootstrap_first_admin() to authenticated;
