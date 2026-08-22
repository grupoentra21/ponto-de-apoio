import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = { title: 'Profissionais verificados' };
type PublicProfessional = {
  id: string;
  registration_number: string;
  registration_region: string;
  bio: string | null;
  service_mode: string;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  profiles: { full_name: string } | null;
};
export default async function ProfissionaisPage() {
  let rows: PublicProfessional[] = [];
  let unavailable = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionals')
      .select(
        'id,registration_number,registration_region,bio,service_mode,city,state,contact_email,profiles!professionals_profile_id_fkey(full_name)',
      )
      .eq('status', 'approved')
      .eq('is_published', true)
      .order('created_at');
    if (error) unavailable = true;
    else rows = (data ?? []) as unknown as PublicProfessional[];
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
      <div className="catalog-grid">
        {rows.map((p) => (
          <article className="surface professional-card" key={p.id}>
            <div className="avatar" aria-hidden>
              {(p.profiles?.full_name ?? 'P')
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')}
            </div>
            <h2>{p.profiles?.full_name}</h2>
            <p className="muted">
              Psicólogo(a) · {p.registration_region} {p.registration_number}
            </p>
            <p>{p.bio}</p>
            <p className="muted">
              {p.service_mode === 'online'
                ? 'Online'
                : p.service_mode === 'in_person'
                  ? 'Presencial'
                  : 'Online e presencial'}
              {p.city ? ` · ${p.city}/${p.state}` : ''}
            </p>
            {p.contact_email && (
              <a
                className="button secondary"
                href={`mailto:${p.contact_email}`}
              >
                Solicitar contato
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
