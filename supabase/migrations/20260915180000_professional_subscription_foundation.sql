create type public.subscription_status as enum (
  'inactive',
  'active',
  'past_due',
  'canceled'
);

create type public.subscription_activation_source as enum ('admin', 'payment');

create table public.professional_subscriptions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null unique references public.professionals(id) on delete cascade,
  status public.subscription_status not null default 'inactive',
  activation_source public.subscription_activation_source,
  activated_at timestamptz,
  activated_by_admin uuid references public.profiles(id) on delete set null,
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end is null or current_period_start is null or current_period_end >= current_period_start)
);

comment on table public.professional_subscriptions is
  'Assinatura corrente de cada profissional. A publicação do catálogo ainda não depende deste registro.';

alter table public.professional_subscriptions enable row level security;

revoke all on table public.professional_subscriptions from public, anon, authenticated;
grant select on table public.professional_subscriptions to authenticated;

create policy "Professionals read own subscription and admins read all"
on public.professional_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.professionals as professional
    where professional.id = professional_subscriptions.professional_id
      and professional.profile_id = (select auth.uid())
  )
  or (select public.is_admin())
);

alter table public.admin_audit_logs
  drop constraint admin_audit_logs_action_check;

alter table public.admin_audit_logs
  add constraint admin_audit_logs_action_check check (
    action in (
      'approved',
      'rejected',
      'suspended',
      'restored',
      'deleted',
      'subscription_activated',
      'subscription_deactivated'
    )
  );

create function public.admin_activate_professional_subscription(
  p_professional_id uuid,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_admin_id uuid := auth.uid();
  normalized_note text := nullif(trim(p_admin_note), '');
begin
  if current_admin_id is null or not exists (
    select 1
    from public.profiles as profile
    where profile.id = current_admin_id
      and profile.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Acesso administrativo necessário.';
  end if;

  if p_professional_id is null or not exists (
    select 1
    from public.professionals as professional
    where professional.id = p_professional_id
  ) then
    raise exception using errcode = 'P0002', message = 'Profissional não encontrado.';
  end if;

  if normalized_note is not null and char_length(normalized_note) > 1000 then
    raise exception using errcode = '22023', message = 'A nota administrativa deve ter no máximo 1000 caracteres.';
  end if;

  insert into public.professional_subscriptions (
    professional_id,
    status,
    activation_source,
    activated_at,
    activated_by_admin,
    admin_note,
    cancel_at_period_end,
    updated_at
  ) values (
    p_professional_id,
    'active',
    'admin',
    now(),
    current_admin_id,
    normalized_note,
    false,
    now()
  )
  on conflict (professional_id) do update
  set status = 'active',
      activation_source = 'admin',
      activated_at = now(),
      activated_by_admin = current_admin_id,
      admin_note = normalized_note,
      cancel_at_period_end = false,
      updated_at = now();

  insert into public.admin_audit_logs (
    admin_id,
    professional_id,
    action,
    details
  ) values (
    current_admin_id,
    p_professional_id,
    'subscription_activated',
    jsonb_build_object('activation_source', 'admin', 'admin_note', normalized_note)
  );
end;
$$;

create function public.admin_deactivate_professional_subscription(
  p_professional_id uuid,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_admin_id uuid := auth.uid();
  normalized_note text := nullif(trim(p_admin_note), '');
begin
  if current_admin_id is null or not exists (
    select 1
    from public.profiles as profile
    where profile.id = current_admin_id
      and profile.role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Acesso administrativo necessário.';
  end if;

  if p_professional_id is null or not exists (
    select 1
    from public.professionals as professional
    where professional.id = p_professional_id
  ) then
    raise exception using errcode = 'P0002', message = 'Profissional não encontrado.';
  end if;

  if normalized_note is not null and char_length(normalized_note) > 1000 then
    raise exception using errcode = '22023', message = 'A nota administrativa deve ter no máximo 1000 caracteres.';
  end if;

  insert into public.professional_subscriptions (
    professional_id,
    status,
    activation_source,
    activated_at,
    activated_by_admin,
    admin_note,
    cancel_at_period_end,
    updated_at
  ) values (
    p_professional_id,
    'inactive',
    null,
    null,
    null,
    normalized_note,
    false,
    now()
  )
  on conflict (professional_id) do update
  set status = 'inactive',
      activation_source = null,
      activated_at = null,
      activated_by_admin = null,
      admin_note = normalized_note,
      cancel_at_period_end = false,
      updated_at = now();

  insert into public.admin_audit_logs (
    admin_id,
    professional_id,
    action,
    details
  ) values (
    current_admin_id,
    p_professional_id,
    'subscription_deactivated',
    jsonb_build_object('admin_note', normalized_note)
  );
end;
$$;

revoke all on function public.admin_activate_professional_subscription(uuid, text) from public;
revoke all on function public.admin_deactivate_professional_subscription(uuid, text) from public;
grant execute on function public.admin_activate_professional_subscription(uuid, text) to authenticated;
grant execute on function public.admin_deactivate_professional_subscription(uuid, text) to authenticated;

comment on function public.admin_activate_professional_subscription(uuid, text) is
  'Ativa manualmente uma assinatura e registra a ação administrativa de forma atômica.';
comment on function public.admin_deactivate_professional_subscription(uuid, text) is
  'Desativa manualmente uma assinatura e registra a ação administrativa de forma atômica.';
