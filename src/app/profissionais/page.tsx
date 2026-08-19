import type { Metadata } from 'next';
import { mockProfessionals } from '@/lib/mocks/professionals';
export const metadata: Metadata = { title: 'Profissionais' };
export default function ProfissionaisPage() {
  return (
    <section className="container" style={{ padding: '3rem 0' }}>
      <p className="eyebrow">Catálogo inicial</p>
      <h1
        style={{
          fontFamily: 'Georgia,serif',
          fontSize: 'clamp(2.2rem,5vw,4rem)',
          margin: '.5rem 0',
        }}
      >
        Encontre apoio profissional
      </h1>
      <div
        role="note"
        style={{
          padding: '1rem 1.2rem',
          margin: '1.5rem 0 2rem',
          borderRadius: 14,
          background: '#f2ddcf',
          color: '#653b2d',
        }}
      >
        <strong>Perfis demonstrativos:</strong> nomes, registros e informações
        abaixo são fictícios e não representam profissionais reais.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: 20,
        }}
      >
        {mockProfessionals.map((p) => (
          <article className="surface" key={p.id} style={{ padding: 24 }}>
            <div
              aria-hidden="true"
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'var(--sage)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'Georgia,serif',
                fontSize: '1.4rem',
              }}
            >
              {p.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </div>
            <h2 style={{ fontFamily: 'Georgia,serif', marginBottom: 0 }}>
              {p.name}
            </h2>
            <p style={{ color: 'var(--muted)', marginTop: 2 }}>
              {p.profession} · {p.registration}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                margin: '1rem 0',
              }}
            >
              {p.specialties.map((s) => (
                <span
                  key={s}
                  style={{
                    padding: '.3rem .65rem',
                    background: 'var(--sage)',
                    borderRadius: 999,
                    fontSize: '.82rem',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
            <p>{p.bio}</p>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
              {p.serviceMode} · {p.city}
            </p>
            <button className="button secondary" type="button" disabled>
              Ver perfil em breve
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
