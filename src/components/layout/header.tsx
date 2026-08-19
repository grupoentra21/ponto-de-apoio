import Link from 'next/link';
export function Header() {
  return (
    <header
      style={{
        borderBottom: '1px solid #dce5df',
        background: '#f8f5edf2',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="container"
        style={{
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <Link
          href="/"
          aria-label="Ponto de Apoio — início"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 850,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--green)',
              color: 'white',
            }}
          >
            ⌂
          </span>
          Ponto de Apoio
        </Link>
        <nav
          className="desktop-nav"
          aria-label="Navegação principal"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            fontWeight: 650,
          }}
        >
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/profissionais">Profissionais</Link>
          <Link className="button" href="/acolhimento">
            Conversar agora
          </Link>
        </nav>
      </div>
    </header>
  );
}
