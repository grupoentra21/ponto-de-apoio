'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
function value(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim();
}
export async function saveProfessional(form: FormData) {
  const { supabase, user } = await requireUser();
  const registrationNumber = value(form, 'registrationNumber');
  const region = value(form, 'registrationRegion').toUpperCase();
  const state = value(form, 'state').toUpperCase();
  const mode = value(form, 'serviceMode');
  if (
    !registrationNumber ||
    !/^CRP\s*\d{2}$/i.test(region) ||
    !['online', 'in_person', 'hybrid'].includes(mode) ||
    (state && !/^[A-Z]{2}$/.test(state))
  )
    redirect('/area-profissional?erro=Revise o CRP, modalidade e UF.');
  const payload = {
    profile_id: user.id,
    professional_type: 'Psicólogo(a)',
    registration_number: registrationNumber,
    registration_region: region.replace(/\s+/g, ' '),
    bio: value(form, 'bio') || null,
    service_mode: mode,
    city: value(form, 'city') || null,
    state: state || null,
    contact_email: value(form, 'contactEmail') || user.email || null,
    status: 'pending_review',
    is_published: false,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  };
  const { data: current } = await supabase
    .from('professionals')
    .select('id,status')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (current && ['approved', 'suspended'].includes(String(current.status)))
    redirect(
      '/area-profissional?erro=Este perfil está bloqueado para edição. Fale com a administração.',
    );
  const result = current
    ? await supabase.from('professionals').update(payload).eq('id', current.id)
    : await supabase.from('professionals').insert(payload);
  if (result.error)
    redirect(
      `/area-profissional?erro=${encodeURIComponent('Não foi possível salvar: ' + result.error.message)}`,
    );
  redirect('/area-profissional?mensagem=Cadastro enviado para verificação.');
}
