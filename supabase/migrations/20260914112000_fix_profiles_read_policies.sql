drop policy if exists "Users read own profile and admins read all" on public.profiles;

create policy "Users read own profile and admins read all"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = profiles.id
  or (select public.is_admin())
  or exists (
    select 1
    from public.professionals as professional
    where professional.profile_id = profiles.id
      and professional.status = 'approved'
      and professional.is_published = true
  )
);

drop policy if exists "Public reads names of published professionals" on public.profiles;

create policy "Public reads names of published professionals"
on public.profiles
for select
to anon
using (
  exists (
    select 1
    from public.professionals as professional
    where professional.profile_id = profiles.id
      and professional.status = 'approved'
      and professional.is_published = true
  )
);
