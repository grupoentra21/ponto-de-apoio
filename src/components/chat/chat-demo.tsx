'use client';
import { FormEvent, useState } from 'react';
export function ChatDemo() {
  const [notice, setNotice] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('Demonstração: o envio será conectado em uma etapa futura.');
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
          ● Demonstração — sem IA conectada
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
        <div
          style={{
            maxWidth: 620,
            padding: '1rem 1.2rem',
            borderRadius: '20px 20px 20px 4px',
            background: 'var(--sage)',
          }}
        >
          <strong>
            Olá. Este pode ser um espaço para você organizar o que está
            sentindo.
          </strong>
          <p style={{ marginBottom: 0 }}>
            Você pode compartilhar apenas o que se sentir confortável. Como têm
            sido seus dias?
          </p>
        </div>
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: 540,
            padding: '1rem 1.2rem',
            borderRadius: '20px 20px 4px 20px',
            background: '#f2ddcf',
          }}
        >
          Exemplo de resposta do usuário. Este conteúdo é apenas ilustrativo.
        </div>
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
          <button className="button" type="submit">
            Enviar
          </button>
        </div>
        <p
          aria-live="polite"
          style={{
            color: 'var(--green)',
            minHeight: 24,
            margin: '8px 0 0',
            fontSize: '.9rem',
          }}
        >
          {notice}
        </p>
      </form>
    </div>
  );
}
