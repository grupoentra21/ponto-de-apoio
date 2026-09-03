import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import type {
  ProfessionalStatus,
  ServiceMode,
  VerificationDocumentType,
} from '@/types/database';

type ProfessionalDetails = {
  id: string;
  registration_number: string;
  registration_region: string;
  service_mode: ServiceMode;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  bio: string | null;
  avatar_path: string | null;
  status: ProfessionalStatus;
  is_published: boolean;
  created_at: string;
  profiles: { full_name: string } | null;
};

const statusLabels: Record<ProfessionalStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Aguardando verificação',
  approved: 'Aprovado',
  rejected: 'Revisão solicitada',
  suspended: 'Suspenso',
};

const serviceModeLabels: Record<ServiceMode, string> = {
  online: 'Online',
  in_person: 'Presencial',
  hybrid: 'Híbrido',
};

const requiredDocumentTypes: VerificationDocumentType[] = [
  'identity',
  'crp',
  'selfie',
];

export default async function AdminProfessionalDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from('professionals')
    .select(
      'id,registration_number,registration_region,service_mode,city,state,contact_email,bio,avatar_path,status,is_published,created_at,profiles!professionals_profile_id_fkey(full_name)',
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound();

  const professional = data as unknown as ProfessionalDetails;
  const { data: verificationDocuments } = await supabase
    .from('professional_verification_documents')
    .select('document_type')
    .eq('professional_id', id);
  const submittedDocumentTypes = new Set(
    (verificationDocuments ?? []).map((document) => document.document_type),
  );
  const documentsComplete = requiredDocumentTypes.every((type) =>
    submittedDocumentTypes.has(type),
  );

  let avatarUrl: string | null = null;
  if (professional.avatar_path) {
    const { data: signedAvatar } = await supabase.storage
      .from('professional-avatars')
      .createSignedUrl(professional.avatar_path, 3600);
    avatarUrl = signedAvatar?.signedUrl ?? null;
  }

  return (
    <main className="container dashboard-page admin-professional-details-page">
      <Link href="/admin" className="verification-link">
        ← Voltar para profissionais
      </Link>

      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Cadastro profissional</p>
          <h1>{professional.profiles?.full_name ?? 'Profissional sem nome'}</h1>
          <p>Informações fornecidas pelo profissional para análise.</p>
        </div>
      </div>

      <section className="surface admin-professional-details">
        <div className="admin-professional-details-avatar">
          <div
            className={`admin-profile-photo ${avatarUrl ? 'has-photo' : ''}`}
            style={
              avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined
            }
            role="img"
            aria-label={
              avatarUrl
                ? `Foto profissional de ${professional.profiles?.full_name ?? 'profissional'}`
                : 'Foto profissional não informada'
            }
          >
            {!avatarUrl &&
              (professional.profiles?.full_name ?? 'P').slice(0, 1)}
          </div>
        </div>

        <dl className="admin-professional-details-grid">
          <div>
            <dt>Nome completo</dt>
            <dd>{professional.profiles?.full_name ?? 'Não informado'}</dd>
          </div>
          <div>
            <dt>CRP</dt>
            <dd>
              {professional.registration_region}{' '}
              {professional.registration_number}
            </dd>
          </div>
          <div>
            <dt>Região do CRP</dt>
            <dd>{professional.registration_region}</dd>
          </div>
          <div>
            <dt>Modalidade de atendimento</dt>
            <dd>{serviceModeLabels[professional.service_mode]}</dd>
          </div>
          <div>
            <dt>Cidade</dt>
            <dd>{professional.city || 'Não informada'}</dd>
          </div>
          <div>
            <dt>UF</dt>
            <dd>{professional.state || 'Não informada'}</dd>
          </div>
          <div>
            <dt>E-mail profissional</dt>
            <dd>{professional.contact_email || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Status do cadastro</dt>
            <dd>
              <span className={`status-badge status-${professional.status}`}>
                {statusLabels[professional.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt>Data do cadastro</dt>
            <dd>{new Date(professional.created_at).toLocaleString('pt-BR')}</dd>
          </div>
          <div>
            <dt>Situação de publicação</dt>
            <dd>{professional.is_published ? 'Publicado' : 'Não publicado'}</dd>
          </div>
          <div>
            <dt>Documentos de verificação</dt>
            <dd>
              {documentsComplete
                ? 'Documentação completa (3/3)'
                : `Documentação incompleta (${submittedDocumentTypes.size}/3)`}
            </dd>
          </div>
          <div className="admin-professional-details-bio">
            <dt>Apresentação profissional</dt>
            <dd>{professional.bio || 'Não informada'}</dd>
          </div>
        </dl>

        <div className="admin-professional-details-actions">
          <Link
            className="button secondary"
            href={`/admin/profissionais/${professional.id}/verificacao`}
          >
            Ver documentos e verificação
          </Link>
        </div>
      </section>
    </main>
  );
}
