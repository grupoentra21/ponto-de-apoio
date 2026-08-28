begin;

alter table public.professionals
  add column avatar_path text
  check (
    avatar_path is null
    or avatar_path ~ '^[0-9a-f-]{36}/avatar\.webp$'
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'professional-avatars',
  'professional-avatars',
  false,
  307200,
  array['image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Professionals upload own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'professional-avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and name = (select auth.uid()::text) || '/avatar.webp'
  and (
    not exists (
      select 1 from public.professionals
      where profile_id = (select auth.uid())
    )
    or exists (
      select 1 from public.professionals
      where profile_id = (select auth.uid())
        and status in ('draft', 'pending_review', 'rejected')
    )
  )
);

create policy "Professionals update own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'professional-avatars'
  and owner_id = (select auth.uid()::text)
  and (
    not exists (
      select 1 from public.professionals
      where profile_id = (select auth.uid())
    )
    or exists (
      select 1 from public.professionals
      where profile_id = (select auth.uid())
        and status in ('draft', 'pending_review', 'rejected')
    )
  )
)
with check (
  bucket_id = 'professional-avatars'
  and owner_id = (select auth.uid()::text)
  and name = (select auth.uid()::text) || '/avatar.webp'
);

create policy "Professionals read own avatar and admins read all"
on storage.objects for select to authenticated
using (
  bucket_id = 'professional-avatars'
  and (
    owner_id = (select auth.uid()::text)
    or (select public.is_admin())
    or exists (
      select 1 from public.professionals
      where avatar_path = name
        and status = 'approved'
        and is_published = true
    )
  )
);

create policy "Public reads published professional avatars"
on storage.objects for select to anon
using (
  bucket_id = 'professional-avatars'
  and exists (
    select 1 from public.professionals
    where avatar_path = name
      and status = 'approved'
      and is_published = true
  )
);

create policy "Professionals delete own avatar and admins delete all"
on storage.objects for delete to authenticated
using (
  bucket_id = 'professional-avatars'
  and (
    (
      owner_id = (select auth.uid()::text)
      and exists (
        select 1 from public.professionals
        where profile_id = (select auth.uid())
          and status in ('draft', 'pending_review', 'rejected')
      )
    )
    or (select public.is_admin())
  )
);

comment on column public.professionals.avatar_path is
  'Caminho privado da foto profissional no bucket professional-avatars.';

commit;
