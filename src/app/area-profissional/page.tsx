import { requireUser } from '@/lib/auth';
import { signOut } from '@/app/auth/actions';
import { saveProfessional } from './actions';
import type { Professional, Profile } from '@/types/database';
const statusLabel = {
  draft: 'Rascunho',
  pending_review: 'Aguardando verificação',
  approved: 'Aprovado',
  rejected: 'Revisão necessária',
  suspended: 'Suspenso',
};
export default async function ProfessionalArea({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; mensagem?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const [{ data: profileData }, { data: professionalData }] = await Promise.all(
    [
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('professionals')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle(),
    ],
  );
  const profile = profileData as Profile | null;
  const professional = professionalData as Professional | null;
  if (profile?.role === 'admin') {
    const { redirect } = await import('next/navigation');
    redirect('/admin');
  }
  const locked =
    professional?.status === 'approved' || professional?.status === 'suspended';
  return (
    <main className="container dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Área do profissional</p>
          <h1>Olá, {profile?.full_name}</h1>
        </div>
        <form action={signOut}>
          <button className="button secondary">Sair</button>
        </form>
      </div>
      {params.erro && (
        <p className="form-alert error" role="alert">
          {params.erro}
        </p>
      )}
      {params.mensagem && (
        <p className="form-alert success">{params.mensagem}</p>
      )}
      <div className="status-card">
        <strong>Status:</strong>{' '}
        {professional
          ? statusLabel[professional.status]
          : 'Cadastro profissional não preenchido'}
        <p>
          {professional?.status === 'pending_review'
            ? 'Nossa equipe analisará os dados antes da publicação.'
            : professional?.status === 'suspended'
              ? 'O cadastro foi retirado do catálogo. Entre em contato com a administração.'
              : 'Preencha os dados profissionais abaixo.'}
        </p>
      </div>
      <form action={saveProfessional} className="surface professional-form">
        <h2>Dados para verificação</h2>
        <div className="form-grid">
          <label>
            Número do CRP
            <input
              name="registrationNumber"
              required
              defaultValue={professional?.registration_number ?? ''}
              disabled={locked}
              placeholder="123456"
            />
          </label>
          <label>
            Região do CRP
            <input
              name="registrationRegion"
              required
              defaultValue={professional?.registration_region ?? ''}
              disabled={locked}
              placeholder="CRP 12"
              pattern="CRP\\s*[0-9]{2}"
            />
          </label>
          <label>
            Modalidade
            <select
              name="serviceMode"
              defaultValue={professional?.service_mode ?? 'online'}
              disabled={locked}
            >
              <option value="online">Online</option>
              <option value="in_person">Presencial</option>
              <option value="hybrid">Híbrido</option>
            </select>
          </label>
          <label>
            Cidade
            <input
              name="city"
              defaultValue={professional?.city ?? ''}
              disabled={locked}
            />
          </label>
          <label>
            UF
            <input
              name="state"
              maxLength={2}
              defaultValue={professional?.state ?? ''}
              disabled={locked}
            />
          </label>
          <label>
            E-mail profissional
            <input
              name="contactEmail"
              type="email"
              defaultValue={professional?.contact_email ?? user.email ?? ''}
              disabled={locked}
            />
          </label>
        </div>
        <label>
          Apresentação profissional
          <textarea
            name="bio"
            rows={7}
            maxLength={3000}
            defaultValue={professional?.bio ?? ''}
            disabled={locked}
          />
        </label>
        {!locked && (
          <button className="button" type="submit">
            Enviar para verificação
          </button>
        )}
      </form>
    </main>
  );
}
