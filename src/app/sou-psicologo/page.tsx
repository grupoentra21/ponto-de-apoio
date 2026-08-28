import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Sou psicólogo(a)' };

const professionalSteps = [
  [
    '01',
    'Crie seu acesso',
    'Informe seu nome, e-mail e uma senha segura para acessar a área profissional.',
  ],
  [
    '02',
    'Preencha seu perfil',
    'Na área profissional, envie seus dados de registro, modalidade, localização, contato e apresentação.',
  ],
  [
    '03',
    'Aguarde a verificação',
    'A equipe analisa as informações antes de aprovar e publicar o perfil no catálogo.',
  ],
];

export default function SouPsicologoPage() {
  return (
    <>
      <section className="page-hero professional-hero">
        <div className="container narrow">
          <p className="eyebrow">Faça parte da rede</p>
          <h1>Ajude pessoas a encontrar apoio profissional.</h1>
          <p>
            Crie seu acesso, apresente sua atuação e envie seu perfil para
            análise. A publicação acontece somente depois da verificação
            administrativa.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/cadastro-profissional">
              Criar cadastro profissional
            </Link>
            <Link className="button secondary" href="/entrar">
              Já tenho cadastro
            </Link>
          </div>
        </div>
      </section>
      <section className="professional-process">
        <div className="container">
          <p className="eyebrow">Como participar</p>
          <h2 className="section-title">Um processo simples e responsável</h2>
          <div className="steps-grid">
            {professionalSteps.map(([number, title, text]) => (
              <article className="surface step-card" key={number}>
                <span className="eyebrow">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container professional-note">
        <div className="surface note-card">
          <div>
            <p className="eyebrow">Transparência e cuidado</p>
            <h2>Seu perfil só aparece após a aprovação.</h2>
          </div>
          <p>
            O envio do cadastro não gera publicação automática. Enquanto a
            análise estiver em andamento, você poderá acompanhar o status pela
            área profissional. As regras atuais de aprovação e publicação são
            preservadas.
          </p>
        </div>
      </section>
    </>
  );
}
