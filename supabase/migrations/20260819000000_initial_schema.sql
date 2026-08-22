create extension if not exists pgcrypto;
create type public.user_role as enum ('user', 'professional', 'admin');
create type public.service_mode as enum ('online', 'in_person', 'hybrid');
create type public.professional_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role public.user_role not null default 'professional',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  professional_type text not null default 'Psicólogo(a)',
  registration_number text not null, registration_region text not null,
  bio text check (bio is null or char_length(bio) <= 3000),
  service_mode public.service_mode not null, city text, state char(2), contact_email text,
  status public.professional_status not null default 'draft', is_published boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null, reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (registration_number, registration_region), check (not is_published or status = 'approved')
);
create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.profiles(id) on delete restrict,
  professional_id uuid, action text not null check (action in ('approved','rejected','suspended','restored','deleted')),
  details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index professionals_catalog_idx on public.professionals (status, is_published, service_mode);
create index professionals_profile_idx on public.professionals (profile_id);
create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Profissional'), 'professional');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.admin_audit_logs enable row level security;
create policy "Users read own profile and admins read all" on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.is_admin()) or exists (
  select 1 from public.professionals p where p.profile_id = id and p.status = 'approved' and p.is_published = true
));
create policy "Public reads names of published professionals" on public.profiles for select to anon
using (exists (select 1 from public.professionals p where p.profile_id = id and p.status = 'approved' and p.is_published = true));
create policy "Users update own profile and admins update all" on public.profiles for update to authenticated
using ((select auth.uid()) = id or (select public.is_admin())) with check ((select auth.uid()) = id or (select public.is_admin()));
revoke update on public.profiles from authenticated;
grant update (full_name, updated_at) on public.profiles to authenticated;

create policy "Public reads approved published professionals" on public.professionals for select to anon
using (status = 'approved' and is_published = true);
create policy "Professionals read own record and admins read all" on public.professionals for select to authenticated
using ((select auth.uid()) = profile_id or (select public.is_admin()) or (status = 'approved' and is_published = true));
create policy "Professionals create own draft" on public.professionals for insert to authenticated
with check ((select auth.uid()) = profile_id and status in ('draft','pending_review') and is_published = false and reviewed_by is null and reviewed_at is null);
create policy "Professionals update own unapproved record" on public.professionals for update to authenticated
using ((select auth.uid()) = profile_id and status in ('draft','pending_review','rejected'))
with check ((select auth.uid()) = profile_id and status in ('draft','pending_review') and is_published = false and reviewed_by is null and reviewed_at is null);
create policy "Admins update professionals" on public.professionals for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete professional records" on public.professionals for delete to authenticated using ((select public.is_admin()));
create policy "Admins read audit logs" on public.admin_audit_logs for select to authenticated using ((select public.is_admin()));
create policy "Admins create audit logs" on public.admin_audit_logs for insert to authenticated
with check ((select public.is_admin()) and admin_id = (select auth.uid()));
comment on table public.professionals is 'Cadastro profissional separado de qualquer dado de acolhimento ou conversa.';
comment on table public.admin_audit_logs is 'Trilha imutável das decisões administrativas sobre o catálogo.';
