import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Ponto de Apoio', template: '%s | Ponto de Apoio' },
  description:
    'Acolhimento inicial e caminhos para encontrar profissionais de saúde mental.',
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
