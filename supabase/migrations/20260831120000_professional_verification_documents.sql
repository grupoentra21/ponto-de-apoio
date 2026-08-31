begin;

create table public.professional_verification_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  document_type text not null check (document_type in ('identity', 'crp', 'selfie')),
  storage_path text not null unique check (
    storage_path ~ '^[0-9a-f-]{36}/(identity|crp|selfie)/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$'
  ),
  mime_type text not null check (
    mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  ),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, document_type),
  check (split_part(storage_path, '/', 2) = document_type),
  check (
    (mime_type = 'application/pdf' and storage_path ~ '\.pdf$')
    or (mime_type = 'image/jpeg' and storage_path ~ '\.jpg$')
    or (mime_type = 'image/png' and storage_path ~ '\.png$')
    or (mime_type = 'image/webp' and storage_path ~ '\.webp$')
  ),
  check (document_type <> 'selfie' or mime_type = 'image/webp'),
  check (document_type <> 'selfie' or size_bytes <= 512000),
  check (document_type <> 'selfie' or consent_at is not null)
);

create index professional_verification_documents_professional_idx
  on public.professional_verification_documents (professional_id);

alter table public.professional_verification_documents enable row level security;

create policy "Professionals read own verification documents and admins read all"
on public.professional_verification_documents for select to authenticated
using (
  exists (
    select 1 from public.professionals
    where id = professional_id
      and profile_id = (select auth.uid())
  )
  or (select public.is_admin())
);

create policy "Professionals create own verification documents"
on public.professional_verification_documents for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and split_part(storage_path, '/', 1) = (select auth.uid()::text)
  and exists (
    select 1 from public.professionals
    where id = professional_id
      and profile_id = (select auth.uid())
      and status in ('draft', 'pending_review', 'rejected')
  )
);

create policy "Professionals update own verification documents"
on public.professional_verification_documents for update to authenticated
using (
  exists (
    select 1 from public.professionals
    where id = professional_id
      and profile_id = (select auth.uid())
      and status in ('draft', 'pending_review', 'rejected')
  )
)
with check (
  uploaded_by = (select auth.uid())
  and split_part(storage_path, '/', 1) = (select auth.uid()::text)
  and exists (
    select 1 from public.professionals
    where id = professional_id
      and profile_id = (select auth.uid())
      and status in ('draft', 'pending_review', 'rejected')
  )
);

grant select, insert, update on table public.professional_verification_documents to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'professional-verification',
  'professional-verification',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Professionals upload own verification files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'professional-verification'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and (storage.foldername(name))[2] in ('identity', 'crp', 'selfie')
  and name ~ ('^' || (select auth.uid()::text) || '/(identity|crp|selfie)/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$')
  and exists (
    select 1 from public.professionals
    where profile_id = (select auth.uid())
      and status in ('draft', 'pending_review', 'rejected')
  )
);

create policy "Professionals read own verification files and admins read all"
on storage.objects for select to authenticated
using (
  bucket_id = 'professional-verification'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or (select public.is_admin())
  )
);

create policy "Professionals delete own verification files and admins delete all"
on storage.objects for delete to authenticated
using (
  bucket_id = 'professional-verification'
  and (
    (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      and not exists (
        select 1 from public.professional_verification_documents
        where storage_path = name
      )
      and exists (
        select 1 from public.professionals
        where profile_id = (select auth.uid())
          and status in ('draft', 'pending_review', 'rejected')
      )
    )
    or (select public.is_admin())
  )
);

drop policy if exists "Professionals update own unapproved record"
on public.professionals;

create policy "Professionals update own unapproved record"
on public.professionals for update to authenticated
using (
  (select auth.uid()) = profile_id
  and status in ('draft', 'pending_review', 'rejected', 'approved')
)
with check (
  (select auth.uid()) = profile_id
  and status in ('draft', 'pending_review')
  and is_published = false
  and reviewed_by is null
  and reviewed_at is null
);

create or replace function public.require_complete_professional_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'approved' and new.is_published = true then
    if (
      select count(distinct document.document_type)
      from public.professional_verification_documents as document
      join storage.objects as object
        on object.bucket_id = 'professional-verification'
       and object.name = document.storage_path
      where document.professional_id = new.id
        and document.document_type in ('identity', 'crp', 'selfie')
    ) <> 3 then
      raise exception 'A aprovação exige documento de identidade, comprovante do CRP e selfie.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.require_complete_professional_verification() from public;

create trigger require_complete_professional_verification
before insert or update of status, is_published on public.professionals
for each row execute function public.require_complete_professional_verification();

-- Existing approvals predate document verification. Move them back to review so
-- the catalog cannot contain a professional without the three required items.
update public.professionals
set status = 'pending_review',
    is_published = false,
    reviewed_by = null,
    reviewed_at = null,
    updated_at = now()
where status = 'approved'
  and is_published = true
  and (
    select count(distinct document_type)
    from public.professional_verification_documents
    where professional_id = professionals.id
      and document_type in ('identity', 'crp', 'selfie')
  ) <> 3;

comment on table public.professional_verification_documents is
  'Metadados privados dos documentos usados exclusivamente na verificação manual de profissionais.';

commit;
