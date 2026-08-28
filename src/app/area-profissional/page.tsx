import { requireUser } from '@/lib/auth';
import { signOut } from '@/app/auth/actions';
import { saveProfessional } from './actions';
import { AvatarUpload } from '@/components/professional/avatar-upload';
import type { Professional, Profile } from '@/types/database';
const statusLabel = {
  draft: 'Rascunho',
  pending_review: 'Aguardando verificação',
  approved: 'Aprovado',
  rejected: 'Revisão necessária',
  suspended: 'Suspenso',
};

const crpRegions = [
  ['CRP 01', 'Distrito Federal'],
  ['CRP 02', 'Pernambuco'],
  ['CRP 03', 'Bahia'],
  ['CRP 04', 'Minas Gerais'],
  ['CRP 05', 'Rio de Janeiro'],
  ['CRP 06', 'São Paulo'],
  ['CRP 07', 'Rio Grande do Sul'],
  ['CRP 08', 'Paraná'],
  ['CRP 09', 'Goiás'],
  ['CRP 10', 'Pará e Amapá'],
  ['CRP 11', 'Ceará'],
  ['CRP 12', 'Santa Catarina'],
  ['CRP 13', 'Paraíba'],
  ['CRP 14', 'Mato Grosso do Sul'],
  ['CRP 15', 'Alagoas'],
  ['CRP 16', 'Espírito Santo'],
  ['CRP 17', 'Rio Grande do Norte'],
  ['CRP 18', 'Mato Grosso'],
  ['CRP 19', 'Sergipe'],
  ['CRP 20', 'Amazonas e Roraima'],
  ['CRP 21', 'Piauí'],
  ['CRP 22', 'Maranhão'],
  ['CRP 23', 'Tocantins'],
  ['CRP 24', 'Acre e Rondônia'],
] as const;

const states = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
] as const;

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
  const displayName = profile?.full_name?.trim();
  if (profile?.role === 'admin') {
    const { redirect } = await import('next/navigation');
    redirect('/admin');
  }
  const locked =
    professional?.status === 'approved' || professional?.status === 'suspended';
  let avatarPreviewUrl: string | null = null;
  if (professional?.avatar_path) {
    const { data } = await supabase.storage
      .from('professional-avatars')
      .createSignedUrl(professional.avatar_path, 3600);
    avatarPreviewUrl = data?.signedUrl ?? null;
  }
  return (
    <main className="container dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Área do profissional</p>
          <h1>{displayName ? `Olá, ${displayName}` : 'Olá!'}</h1>
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
        <AvatarUpload
          userId={user.id}
          initialPath={professional?.avatar_path ?? null}
          initialPreviewUrl={avatarPreviewUrl}
          disabled={locked}
        />
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
            <select
              name="registrationRegion"
              required
              defaultValue={professional?.registration_region ?? ''}
              disabled={locked}
            >
              <option value="" disabled>
                Selecione a região
              </option>
              {crpRegions.map(([value, region]) => (
                <option key={value} value={value}>
                  {value} — {region}
                </option>
              ))}
            </select>
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
            <select
              name="state"
              defaultValue={professional?.state ?? ''}
              disabled={locked}
            >
              <option value="">Selecione a UF</option>
              {states.map(([value, state]) => (
                <option key={value} value={value}>
                  {value} — {state}
                </option>
              ))}
            </select>
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
