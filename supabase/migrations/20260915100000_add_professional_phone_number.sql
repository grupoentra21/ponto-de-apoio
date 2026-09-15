alter table public.professionals
  add column phone_number text;

alter table public.professionals
  add constraint professionals_phone_number_format_check
  check (phone_number is null or phone_number ~ '^55[0-9]{10,11}$');
