import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import {
  ProfessionalCatalog,
  type CatalogProfessional,
} from '@/components/professional/professional-catalog';
export const metadata: Metadata = { title: 'Profissionais verificados' };
type PublicProfessional = Omit<CatalogProfessional, 'name' | 'avatar_url'> & {
  id: string;
  profile_id: string;
  avatar_path: string | null;
};
export default async function ProfissionaisPage() {
  let rows: PublicProfessional[] = [];
  let unavailable = false;
  const avatarUrls = new Map<string, string>();
  const profileNames = new Map<string, string>();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionals')
      .select(
        'id,profile_id,registration_number,registration_region,bio,service_mode,city,state,contact_email,avatar_path',
      )
      .eq('status', 'approved')
      .eq('is_published', true)
      .order('created_at');
    if (error) unavailable = true;
    else {
      rows = (data ?? []) as unknown as PublicProfessional[];
      const profileIds = rows.map((row) => row.profile_id);
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id,full_name')
          .in('id', profileIds);
        profiles?.forEach((profile) => {
          profileNames.set(profile.id, profile.full_name);
        });
      }
      const paths = rows.flatMap((row) =>
        row.avatar_path ? [row.avatar_path] : [],
      );
      if (paths.length > 0) {
        const { data: signedAvatars } = await supabase.storage
          .from('professional-avatars')
          .createSignedUrls(paths, 3600);
        signedAvatars?.forEach((avatar) => {
          if (avatar.path && avatar.signedUrl)
            avatarUrls.set(avatar.path, avatar.signedUrl);
        });
      }
    }
  } catch {
    unavailable = true;
  }
  return (
    <section className="container" style={{ padding: '3rem 0' }}>
      <p className="eyebrow">Catálogo verificado</p>
      <h1
        style={{
          fontFamily: 'Georgia,serif',
          fontSize: 'clamp(2.2rem,5vw,4rem)',
          margin: '.5rem 0',
        }}
      >
        Encontre apoio profissional
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 720 }}>
        Os perfis abaixo passaram pela verificação administrativa da plataforma.
        Confirme sempre a situação atual do registro junto ao Conselho Regional
        de Psicologia.
      </p>
      {unavailable && (
        <p className="form-alert error">
          O catálogo está temporariamente indisponível.
        </p>
      )}
      {!unavailable && rows.length === 0 && (
        <div className="surface empty-state">
          <h2>Novos profissionais em breve</h2>
          <p>
            A equipe está verificando os primeiros cadastros antes de
            publicá-los.
          </p>
        </div>
      )}
      {!unavailable && rows.length > 0 && (
        <ProfessionalCatalog
          professionals={rows.map((professional) => ({
            id: professional.id,
            name: profileNames.get(professional.profile_id) ?? 'Profissional',
            registration_number: professional.registration_number,
            registration_region: professional.registration_region,
            bio: professional.bio,
            service_mode: professional.service_mode,
            city: professional.city,
            state: professional.state,
            contact_email: professional.contact_email,
            avatar_url: professional.avatar_path
              ? (avatarUrls.get(professional.avatar_path) ?? null)
              : null,
          }))}
        />
      )}
    </section>
  );
}
