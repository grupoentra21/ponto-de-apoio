'use client';

import { FormEvent, useState } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const initialMessage: Message = {
  role: 'assistant',
  content:
    'Olá. Este pode ser um espaço para você organizar o que está sentindo. Você pode compartilhar apenas o que se sentir confortável. Como têm sido seus dias?',
};

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = message.trim();
    if (!content || isLoading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: 'user', content },
    ];
    setMessages(nextMessages);
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        const responseError =
          typeof data === 'object' &&
          data !== null &&
          typeof (data as Record<string, unknown>).error === 'string'
            ? (data as Record<string, string>).error
            : 'Não foi possível responder agora. Tente novamente.';
        throw new Error(responseError);
      }

      if (
        typeof data !== 'object' ||
        data === null ||
        typeof (data as Record<string, unknown>).message !== 'string'
      ) {
        throw new Error('A resposta recebida não é válida.');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: (data as Record<string, string>).message,
        },
      ]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível responder agora. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="surface" style={{ marginTop: 28, overflow: 'hidden' }}>
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #dce5df',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <strong>Assistente de acolhimento</strong>
        <span style={{ color: 'var(--muted)', fontSize: '.86rem' }}>
          ● Conversa com IA
        </span>
      </div>
      <div
        style={{
          minHeight: 360,
          padding: 'clamp(1rem,4vw,2rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          background: '#fdfbf6',
        }}
      >
        {messages.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            style={{
              alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: item.role === 'user' ? 540 : 620,
              padding: '1rem 1.2rem',
              borderRadius:
                item.role === 'user'
                  ? '20px 20px 4px 20px'
                  : '20px 20px 20px 4px',
              background: item.role === 'user' ? '#f2ddcf' : 'var(--sage)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {item.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ color: 'var(--muted)' }} role="status">
            Preparando uma resposta acolhedora…
          </div>
        )}
      </div>
      <form
        onSubmit={submit}
        style={{ borderTop: '1px solid #dce5df', padding: 18 }}
      >
        <label
          htmlFor="message"
          style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}
        >
          Sua mensagem
        </label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isLoading}
            rows={2}
            placeholder="Escreva no seu ritmo…"
            style={{
              flex: 1,
              resize: 'vertical',
              padding: 12,
              border: '1px solid #b8c9c2',
              borderRadius: 14,
              background: 'white',
            }}
          />
          <button
            className="button"
            type="submit"
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <p
          aria-live="polite"
          style={{
            color: '#9d2b2b',
            minHeight: 24,
            margin: '8px 0 0',
            fontSize: '.9rem',
          }}
        >
          {error}
        </p>
        <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: '.82rem' }}>
          Este assistente não substitui atendimento profissional. Em risco
          imediato, procure o SAMU (192), uma emergência local ou o CVV (188).
        </p>
      </form>
    </div>
  );
}
