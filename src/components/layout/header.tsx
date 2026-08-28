'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/como-funciona', label: 'Como funciona' },
  { href: '/profissionais', label: 'Profissionais' },
  { href: '/sou-psicologo', label: 'Sou psicólogo(a)' },
  { href: '/entrar', label: 'Entrar' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          href="/"
          aria-label="Ponto de Apoio — início"
          className="brand-link"
        >
          <Image
            className="brand-logo"
            src="/brand/ponto-de-apoio-logo-green.png"
            alt="Ponto de Apoio"
            width={2172}
            height={724}
            priority
          />
        </Link>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link"
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="button"
            href="/acolhimento"
            aria-current={pathname === '/acolhimento' ? 'page' : undefined}
          >
            Conversar agora
          </Link>
        </nav>
        <details className="mobile-menu">
          <summary aria-label="Abrir menu de navegação">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </summary>
          <nav aria-label="Navegação principal em dispositivos móveis">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
            <Link className="button" href="/acolhimento">
              Conversar agora
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
