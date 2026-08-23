import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: { default: 'Ponto de Apoio', template: '%s | Ponto de Apoio' },
  description:
    'Acolhimento inicial e caminhos para encontrar profissionais de saúde mental.',
  icons: {
    icon: '/brand/ponto-de-apoio-symbol.png',
    apple: '/brand/ponto-de-apoio-symbol.png',
  },
  openGraph: {
    title: 'Ponto de Apoio',
    description:
      'Acolhimento inicial e caminhos para encontrar profissionais de saúde mental.',
    images: ['/brand/ponto-de-apoio-logo-green.png'],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
