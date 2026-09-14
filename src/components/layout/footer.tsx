export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid #dce5df',
        padding: '2rem 0',
        marginTop: 64,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 16,
          color: 'var(--muted)',
          fontSize: '.9rem',
        }}
      >
        <span>
          © {new Date().getFullYear()} Ponto de Apoio ·{' '}
          <a
            href="mailto:contato@pontodeapoio.social.br"
            style={{ color: 'inherit' }}
          >
            contato@pontodeapoio.social.br
          </a>
        </span>
        <span>
          Orientação inicial — não substitui atendimento profissional.
        </span>
      </div>
    </footer>
  );
}
