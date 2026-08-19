import type { Metadata } from 'next';
import { ChatDemo } from '@/components/chat/chat-demo';
export const metadata: Metadata = { title: 'Acolhimento inicial' };
export default function AcolhimentoPage() {
  return (
    <section className="container" style={{ padding: '3rem 0' }}>
      <p className="eyebrow">Demonstração da experiência</p>
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
        Esta interface é apenas visual nesta primeira etapa. Nenhuma mensagem é
        enviada, analisada ou armazenada.
      </p>
      <ChatDemo />
    </section>
  );
}
