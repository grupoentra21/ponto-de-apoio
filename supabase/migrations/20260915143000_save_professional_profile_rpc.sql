create or replace function public.save_own_professional_profile(
  p_full_name text,
  p_registration_number text,
  p_registration_region text,
  p_bio text,
  p_service_mode text,
  p_city text,
  p_state text,
  p_contact_email text,
  p_phone_number text,
  p_avatar_path text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_professional public.professionals%rowtype;
  normalized_full_name text := trim(coalesce(p_full_name, ''));
  normalized_registration_region text := upper(regexp_replace(trim(p_registration_region), '\s+', ' ', 'g'));
  normalized_state text := nullif(upper(trim(p_state)), '');
  next_status public.professional_status;
  current_timestamp_value timestamptz := now();
  profile_rows_updated integer;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Usuário não autenticado.';
  end if;

  if char_length(normalized_full_name) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Nome completo deve ter entre 2 e 120 caracteres.';
  end if;

  if p_registration_number !~ '^[0-9]+$'
    or normalized_registration_region !~ '^CRP\s*[0-9]{2}$'
    or p_service_mode not in ('online', 'in_person', 'hybrid')
    or (normalized_state is not null and normalized_state !~ '^[A-Z]{2}$') then
    raise exception using errcode = '22023', message = 'Revise o CRP, modalidade e UF.';
  end if;

  if p_phone_number is not null and p_phone_number !~ '^55[0-9]{10,11}$' then
    raise exception using errcode = '22023', message = 'Informe um celular válido com DDD.';
  end if;

  if p_avatar_path is not null
    and p_avatar_path <> (current_user_id::text || '/avatar.webp') then
    raise exception using errcode = '22023', message = 'Caminho de avatar inválido.';
  end if;

  select *
  into current_professional
  from public.professionals
  where profile_id = current_user_id
  for update;

  if current_professional.id is not null
    and current_professional.status = 'suspended' then
    raise exception using errcode = '42501', message = 'Este perfil está bloqueado para edição. Fale com a administração.';
  end if;

  next_status := case
    when current_professional.id is not null
      and current_professional.status in ('approved', 'pending_review')
      then 'pending_review'::public.professional_status
    else 'draft'::public.professional_status
  end;

  update public.profiles
  set full_name = normalized_full_name,
      updated_at = current_timestamp_value
  where id = current_user_id;

  get diagnostics profile_rows_updated = row_count;

  if profile_rows_updated <> 1 then
    raise exception using errcode = 'P0002', message = 'Perfil do usuário não encontrado.';
  end if;

  if current_professional.id is null then
    insert into public.professionals (
      profile_id,
      professional_type,
      registration_number,
      registration_region,
      bio,
      service_mode,
      city,
      state,
      contact_email,
      phone_number,
      avatar_path,
      status,
      is_published,
      reviewed_by,
      reviewed_at,
      updated_at
    ) values (
      current_user_id,
      'Psicólogo(a)',
      p_registration_number,
      normalized_registration_region,
      nullif(trim(p_bio), ''),
      p_service_mode::public.service_mode,
      nullif(trim(p_city), ''),
      normalized_state,
      nullif(trim(p_contact_email), ''),
      p_phone_number,
      p_avatar_path,
      next_status,
      false,
      null,
      null,
      current_timestamp_value
    );
  else
    update public.professionals
    set professional_type = 'Psicólogo(a)',
        registration_number = p_registration_number,
        registration_region = normalized_registration_region,
        bio = nullif(trim(p_bio), ''),
        service_mode = p_service_mode::public.service_mode,
        city = nullif(trim(p_city), ''),
        state = normalized_state,
        contact_email = nullif(trim(p_contact_email), ''),
        phone_number = p_phone_number,
        avatar_path = p_avatar_path,
        status = next_status,
        is_published = false,
        reviewed_by = null,
        reviewed_at = null,
        updated_at = current_timestamp_value
    where id = current_professional.id;
  end if;
end;
$$;

revoke all on function public.save_own_professional_profile(
  text, text, text, text, text, text, text, text, text, text
) from public;

grant execute on function public.save_own_professional_profile(
  text, text, text, text, text, text, text, text, text, text
) to authenticated;

comment on function public.save_own_professional_profile(
  text, text, text, text, text, text, text, text, text, text
) is 'Salva atomicamente o nome e os dados editáveis do profissional autenticado, enviando alterações relevantes para nova revisão.';
