'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import type { ProfessionalStatus } from '@/types/database';
const transitions: Record<
  string,
  { status: ProfessionalStatus; published: boolean; audit: string }
> = {
  approve: { status: 'approved', published: true, audit: 'approved' },
  reject: { status: 'rejected', published: false, audit: 'rejected' },
  suspend: { status: 'suspended', published: false, audit: 'suspended' },
  restore: { status: 'approved', published: true, audit: 'restored' },
};
export async function changeProfessionalStatus(form: FormData) {
  const id = String(form.get('id') ?? '');
  const action = String(form.get('action') ?? '');
  const transition = transitions[action];
  if (!id || !transition) return;
  const { supabase, user } = await requireAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('professionals')
    .update({
      status: transition.status,
      is_published: transition.published,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', id);
  if (!error)
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      professional_id: id,
      action: transition.audit,
      details: { resulting_status: transition.status },
    });
  revalidatePath('/admin');
  revalidatePath('/profissionais');
}
export async function deleteProfessional(form: FormData) {
  const id = String(form.get('id') ?? '');
  if (!id) return;
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase
    .from('professionals')
    .select('registration_number,registration_region,avatar_path')
    .eq('id', id)
    .single();
  const { error } = await supabase.from('professionals').delete().eq('id', id);
  if (!error)
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      professional_id: id,
      action: 'deleted',
      details: data ?? {},
    });
  if (!error && data?.avatar_path)
    await supabase.storage
      .from('professional-avatars')
      .remove([data.avatar_path]);
  revalidatePath('/admin');
  revalidatePath('/profissionais');
}
