begin;

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
  and status = 'pending_review'
  and is_published = false
  and reviewed_by is null
  and reviewed_at is null
);

commit;
