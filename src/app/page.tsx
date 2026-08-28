import Link from 'next/link';
export default function Home() {
  return (
    <>
      <section
        style={{ padding: 'clamp(4rem,9vw,8rem) 0 5rem', overflow: 'hidden' }}
      >
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))',
            alignItems: 'center',
            gap: 'clamp(2rem,7vw,6rem)',
          }}
        >
          <div>
            <p className="eyebrow">
              Você não precisa encontrar o caminho sozinho
            </p>
            <h1
              style={{
                fontFamily: 'Georgia,serif',
                fontSize: 'clamp(2.8rem,7vw,5.6rem)',
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
              <Link className="button" href="/acolhimento">
                Iniciar conversa
              </Link>
              <Link className="button secondary" href="/profissionais">
                Ver profissionais
              </Link>
            </div>
          </div>
          <div
            className="surface"
            aria-label="Mensagem de acolhimento ilustrativa"
            style={{
              padding: 'clamp(1.5rem,4vw,3rem)',
              minHeight: 390,
              display: 'grid',
              alignContent: 'center',
              background: 'linear-gradient(145deg,#dbe8dd,#fffdf8)',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '4rem' }}>
              ◡
            </span>
            <blockquote
              style={{
                fontFamily: 'Georgia,serif',
                fontSize: 'clamp(1.55rem,3vw,2.25rem)',
                lineHeight: 1.25,
                margin: '1rem 0',
              }}
            >
              “Tudo bem não ter todas as palavras agora. Podemos começar
              devagar.”
            </blockquote>
            <p style={{ color: 'var(--muted)' }}>
              Acolhimento sem julgamentos e sem diagnósticos.
            </p>
          </div>
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
