import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import type {
  ProfessionalVerificationDocument,
  VerificationDocumentType,
} from '@/types/database';

const labels: Record<VerificationDocumentType, string> = {
  identity: 'Documento de identidade',
  crp: 'Comprovante do CRP',
  selfie: 'Selfie de verificação',
};

function PrivateDocument({
  document,
  url,
}: {
  document?: ProfessionalVerificationDocument;
  url?: string;
}) {
  if (!document || !url)
    return <p className="verification-missing">Documento não enviado.</p>;
  if (document.mime_type === 'application/pdf')
    return (
      <div className="private-document-file">
        <p>Documento em PDF</p>
        <a
          className="button secondary"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Abrir PDF em nova aba
        </a>
      </div>
    );
  return (
    // A URL temporária do bucket privado não possui dimensões conhecidas no build.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={labels[document.document_type]}
      referrerPolicy="no-referrer"
    />
  );
}

export default async function ProfessionalVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id,registration_number,registration_region,status,profiles!professionals_profile_id_fkey(full_name)',
    )
    .eq('id', id)
    .maybeSingle();
  if (!professional) notFound();

  const { data } = await supabase
    .from('professional_verification_documents')
    .select('*')
    .eq('professional_id', id);
  const documents = (data ?? []) as ProfessionalVerificationDocument[];
  const urls = new Map<string, string>();
  if (documents.length > 0) {
    const { data: signed } = await supabase.storage
      .from('professional-verification')
      .createSignedUrls(
        documents.map((document) => document.storage_path),
        300,
      );
    signed?.forEach((item) => {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    });
  }
  const byType = new Map(
    documents.map((document) => [document.document_type, document]),
  );
  const profile = professional.profiles as unknown as {
    full_name: string;
  } | null;

  function documentOf(type: VerificationDocumentType) {
    return byType.get(type);
  }

  return (
    <main className="container dashboard-page verification-admin-page">
      <Link href="/admin" className="verification-link">
        ← Voltar para profissionais
      </Link>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Verificação confidencial</p>
          <h1>{profile?.full_name ?? 'Profissional'}</h1>
          <p>
            {professional.registration_region}{' '}
            {professional.registration_number}
            {' · '}Status: {professional.status}
          </p>
        </div>
      </div>
      <p className="form-alert">
        Conteúdo privado para comparação exclusivamente manual. As URLs expiram
        em cinco minutos.
      </p>
      <section
        className="identity-comparison"
        aria-label="Comparação de identidade"
      >
        {(['identity', 'selfie'] as const).map((type) => {
          const document = documentOf(type);
          return (
            <article className="surface private-document" key={type}>
              <h2>{labels[type]}</h2>
              <PrivateDocument
                document={document}
                url={document ? urls.get(document.storage_path) : undefined}
              />
              {document && (
                <small>
                  Enviado em{' '}
                  {new Date(document.updated_at).toLocaleString('pt-BR')}
                </small>
              )}
            </article>
          );
        })}
      </section>
      <article className="surface private-document crp-document">
        <h2>{labels.crp}</h2>
        <PrivateDocument
          document={documentOf('crp')}
          url={
            documentOf('crp')
              ? urls.get(documentOf('crp')!.storage_path)
              : undefined
          }
        />
      </article>
    </main>
  );
}
