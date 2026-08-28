import Link from 'next/link';
import { ChatDemo } from '@/components/chat/chat-demo';
export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow">
              Você não precisa encontrar o caminho sozinho
            </p>
            <h1
              style={{
                fontFamily: 'Georgia,serif',
                fontSize: 'clamp(2.8rem,6vw,5rem)',
                lineHeight: 0.98,
                letterSpacing: '-.045em',
                margin: '1rem 0 1.5rem',
              }}
            >
              Um primeiro passo para encontrar apoio.
            </h1>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '1.15rem',
                maxWidth: 590,
              }}
            >
              Converse, compreenda possibilidades de cuidado e conheça
              profissionais de saúde mental em um ambiente humano e respeitoso.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 30,
              }}
            >
              <Link className="button secondary" href="/profissionais">
                Ver profissionais
              </Link>
            </div>
          </div>
          <ChatDemo className="home-chat" />
        </div>
      </section>
      <section style={{ padding: '5rem 0' }}>
        <div
          className="container surface"
          style={{
            padding: 'clamp(1.5rem,5vw,3.5rem)',
            background: '#18352f',
            color: 'white',
          }}
        >
          <p className="eyebrow" style={{ color: '#bcd8cc' }}>
            Importante
          </p>
          <h2
            style={{
              fontFamily: 'Georgia,serif',
              fontSize: 'clamp(1.8rem,4vw,3rem)',
              marginBottom: 12,
            }}
          >
            A plataforma orienta, mas não diagnostica.
          </h2>
          <p style={{ color: '#d8e4df', maxWidth: 760 }}>
            O assistente não é psicólogo, psiquiatra ou serviço de emergência.
            Em situação de risco imediato, procure o SAMU (192), uma emergência
            local ou o CVV (188).
          </p>
        </div>
      </section>
    </>
  );
}
