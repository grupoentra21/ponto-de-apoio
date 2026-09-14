import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import {
  isPublicProfessional,
  professionalIdFromSlug,
  safeProfessionalCatalogReturnPath,
} from '@/lib/professional-public-profile';
import { createClient } from '@/lib/supabase/server';

type PublicProfessional = {
  id: string;
  registration_number: string;
  registration_region: string;
  bio: string | null;
  service_mode: 'online' | 'in_person' | 'hybrid';
  city: string | null;
  state: string | null;
  contact_email: string | null;
  avatar_path: string | null;
  status: string;
  is_published: boolean;
  profiles: { full_name: string } | null;
};

const getPublicProfessional = cache(async (slug: string) => {
  const id = professionalIdFromSlug(slug);
  if (!id) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('professionals')
    .select(
      'id,registration_number,registration_region,bio,service_mode,city,state,contact_email,avatar_path,status,is_published,profiles!professionals_profile_id_fkey(full_name)',
    )
    .eq('id', id)
    .eq('status', 'approved')
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  const professional = data as unknown as PublicProfessional;
  if (!isPublicProfessional(professional)) return null;
  let avatarUrl: string | null = null;

  if (professional.avatar_path) {
    const { data: signedAvatar } = await supabase.storage
      .from('professional-avatars')
      .createSignedUrl(professional.avatar_path, 3600);
    avatarUrl = signedAvatar?.signedUrl ?? null;
  }

  return {
    name: professional.profiles?.full_name ?? 'Profissional',
    registrationNumber: professional.registration_number,
    registrationRegion: professional.registration_region,
    bio: professional.bio,
    serviceMode: professional.service_mode,
    city: professional.city,
    state: professional.state,
    contactEmail: professional.contact_email,
    avatarUrl,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const professional = await getPublicProfessional(slug);
  if (!professional) return { title: 'Profissional não encontrado' };

  return {
    title: professional.name,
    description:
      professional.bio?.replace(/\s+/g, ' ').trim().slice(0, 160) ||
      `Perfil profissional de ${professional.name} no Ponto de Apoio.`,
  };
}

export default async function ProfessionalProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const professional = await getPublicProfessional(slug);
  if (!professional) notFound();

  const serviceMode =
    professional.serviceMode === 'online'
      ? 'Online'
      : professional.serviceMode === 'in_person'
        ? 'Presencial'
        : 'Online e presencial';

  return (
    <section className="container professional-profile-page">
      <Link
        className="professional-profile-back"
        href={safeProfessionalCatalogReturnPath(from)}
      >
        ← Voltar para profissionais
      </Link>

      <article className="surface professional-profile">
        <div className="professional-profile-heading">
          <div
            className={`avatar professional-profile-avatar ${professional.avatarUrl ? 'has-photo' : ''}`}
            style={
              professional.avatarUrl
                ? { backgroundImage: `url("${professional.avatarUrl}")` }
                : undefined
            }
            role={professional.avatarUrl ? 'img' : undefined}
            aria-label={
              professional.avatarUrl
                ? `Foto de ${professional.name}`
                : undefined
            }
            aria-hidden={professional.avatarUrl ? undefined : true}
          >
            {!professional.avatarUrl &&
              professional.name
                .split(' ')
                .slice(0, 2)
                .map((name) => name[0])
                .join('')}
          </div>
          <div>
            <p className="eyebrow">Perfil profissional verificado</p>
            <h1>{professional.name}</h1>
            <p className="muted">
              Psicólogo(a) · {professional.registrationRegion}{' '}
              {professional.registrationNumber}
            </p>
          </div>
        </div>

        <div className="professional-profile-details">
          <p>
            <strong>Modalidade:</strong> {serviceMode}
          </p>
          {(professional.city || professional.state) && (
            <p>
              <strong>Localização:</strong>{' '}
              {[professional.city, professional.state]
                .filter(Boolean)
                .join('/')}
            </p>
          )}
        </div>

        {professional.bio && (
          <div className="professional-profile-bio">
            <h2>Apresentação profissional</h2>
            <p>{professional.bio}</p>
          </div>
        )}

        {professional.contactEmail && (
          <a
            className="button secondary"
            href={`mailto:${professional.contactEmail}`}
          >
            Solicitar contato
          </a>
        )}

        <p className="professional-profile-notice">
          Este perfil passou pela verificação administrativa da plataforma.
          Confirme sempre a situação atual do registro junto ao Conselho
          Regional de Psicologia.
        </p>
      </article>
    </section>
  );
}
