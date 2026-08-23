-- RLS policies only run after the API role has the corresponding table grant.
-- Keep grants minimal; row visibility and ownership remain enforced by RLS.
grant usage on schema public to anon, authenticated;

grant select on table public.profiles to anon, authenticated;
grant select on table public.professionals to anon, authenticated;
grant insert, update, delete on table public.professionals to authenticated;
grant select, insert on table public.admin_audit_logs to authenticated;
grant usage, select on sequence public.admin_audit_logs_id_seq to authenticated;
