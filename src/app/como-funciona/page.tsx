import type { Metadata } from 'next';
import Link from 'next/link';
import { HowItWorks } from '@/components/marketing/how-it-works';

export const metadata: Metadata = { title: 'Como funciona' };

export default function ComoFuncionaPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container narrow">
          <p className="eyebrow">Um primeiro passo, sem pressa</p>
          <h1>Você encontra acolhimento e caminhos possíveis.</h1>
          <p>
            O Ponto de Apoio ajuda você a organizar o que está sentindo,
            compreender possibilidades de cuidado e conhecer profissionais de
            saúde mental com autonomia.
          </p>
          <Link className="button" href="/acolhimento">
            Conversar agora
          </Link>
        </div>
      </section>
      <section className="how-it-works-page">
        <HowItWorks intro="Você decide quanto quer compartilhar. A conversa oferece orientação geral e pode ajudar a tornar o próximo passo mais claro." />
      </section>
      <section className="container limits-section">
        <div className="surface limits-card">
          <p className="eyebrow">Importante</p>
          <h2>Acolhimento inicial não é atendimento clínico.</h2>
          <p>
            O Ponto de Apoio oferece acolhimento inicial e orientação. Não
            realiza diagnósticos e não substitui atendimento com psicólogo,
            psiquiatra ou outro profissional de saúde.
          </p>
          <p>
            Em situação de risco imediato, procure o SAMU (192), uma emergência
            local ou o CVV (188).
          </p>
        </div>
      </section>
    </>
  );
}
