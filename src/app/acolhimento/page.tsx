import type { Metadata } from 'next';
import { ChatDemo } from '@/components/chat/chat-demo';
export const metadata: Metadata = { title: 'Acolhimento inicial' };
export default function AcolhimentoPage() {
  return (
    <section className="container" style={{ padding: '3rem 0' }}>
      <p className="eyebrow">Acolhimento inicial</p>
      <h1
        style={{
          fontFamily: 'Georgia,serif',
          fontSize: 'clamp(2.2rem,5vw,4rem)',
          margin: '.5rem 0',
        }}
      >
        Espaço de acolhimento
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 720 }}>
        Converse no seu ritmo. As mensagens são enviadas à OpenAI para gerar a
        resposta, mas não são armazenadas pelo Ponto de Apoio nesta etapa.
      </p>
      <ChatDemo />
    </section>
  );
}
