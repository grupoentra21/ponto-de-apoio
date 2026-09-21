'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { splitProfessionalProfileLinks } from '@/lib/chat-professional-links';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const initialMessage: Message = {
  role: 'assistant',
  content:
    'Olá. Este pode ser um espaço para você organizar o que está sentindo. Você pode compartilhar apenas o que se sentir confortável. Como têm sido seus dias?',
};

const chatStorageKey = 'ponto-de-apoio:alice-chat';

function isMessageHistory(value: unknown): value is Message[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => {
      if (typeof item !== 'object' || item === null) return false;

      const record = item as Record<string, unknown>;
      const keys = Object.keys(record);

      return (
        keys.length === 2 &&
        keys.includes('role') &&
        keys.includes('content') &&
        (record.role === 'user' || record.role === 'assistant') &&
        typeof record.content === 'string'
      );
    })
  );
}

export function ChatDemo({ className = '' }: { className?: string }) {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasRestoredMessages, setHasRestoredMessages] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const skipNextStorageSave = useRef(false);

  useEffect(() => {
    if (!isFullscreen || !chatRef.current) return;

    const chat = chatRef.current;
    const fullscreenButton = fullscreenButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    const background: Array<{ element: HTMLElement; inert: boolean }> = [];
    let current: HTMLElement = chat;

    // Keep keyboard and screen-reader navigation inside the expanded chat.
    while (current.parentElement && current !== document.body) {
      for (const sibling of current.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== current) {
          background.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      current = current.parentElement;
    }
    document.body.style.overflow = 'hidden';
    fullscreenButton?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsFullscreen(false);
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        chat.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      background.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      fullscreenButton?.focus({ preventScroll: true });
    };
  }, [isFullscreen]);

  useEffect(() => {
    let isActive = true;
    let restoredMessages: Message[] = [initialMessage];

    try {
      const storedMessages = window.sessionStorage.getItem(chatStorageKey);

      if (storedMessages) {
        const parsedMessages: unknown = JSON.parse(storedMessages);

        if (isMessageHistory(parsedMessages)) {
          restoredMessages = parsedMessages;
        }
      }
    } catch {
      // Ignore unavailable storage or invalid persisted data.
    }

    queueMicrotask(() => {
      if (!isActive) return;

      setMessages(restoredMessages);
      setHasRestoredMessages(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasRestoredMessages) return;

    if (skipNextStorageSave.current) {
      skipNextStorageSave.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(chatStorageKey, JSON.stringify(messages));
    } catch {
      // Keep the chat usable when session storage is unavailable.
    }
  }, [hasRestoredMessages, messages]);

  useEffect(() => {
    const messagesElement = messagesRef.current;

    if (messagesElement) {
      messagesElement.scrollTo({
        top: messagesElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  function startNewConversation() {
    if (!window.confirm('Deseja apagar esta conversa e começar novamente?')) {
      return;
    }

    skipNextStorageSave.current = true;
    try {
      window.sessionStorage.removeItem(chatStorageKey);
    } catch {
      // Keep the reset usable when session storage is unavailable.
    }
    setMessages([initialMessage]);
    setMessage('');
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = message.trim();
    if (!content || isLoading) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content }];
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
    <div
      ref={chatRef}
      className={`surface chat-shell ${className}${isFullscreen ? ' is-fullscreen' : ''}`}
      role={isFullscreen ? 'dialog' : undefined}
      aria-modal={isFullscreen ? true : undefined}
      aria-label={isFullscreen ? 'Chat com Alice' : undefined}
    >
      <div
        className="chat-header"
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #dce5df',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src="/images/alice-avatar.png"
            alt="Avatar da assistente digital Alice"
            width={52}
            height={52}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid #b8c9c2',
              flexShrink: 0,
            }}
          />
          <div>
            <strong style={{ display: 'block' }}>Alice</strong>
            <span style={{ color: 'var(--muted)', fontSize: '.86rem' }}>
              Sua assistente de acolhimento
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <span
            className="chat-availability"
            style={{ color: 'var(--muted)', fontSize: '.86rem' }}
          >
            <span aria-hidden="true" style={{ color: '#4f8a68' }}>
              ●
            </span>{' '}
            Disponível para conversar
          </span>
          <button
            className="button secondary small"
            type="button"
            onClick={startNewConversation}
            disabled={isLoading}
          >
            Nova conversa
          </button>
          <button
            ref={fullscreenButtonRef}
            className="button secondary chat-fullscreen-button"
            type="button"
            onClick={() => setIsFullscreen((current) => !current)}
            aria-expanded={isFullscreen}
            aria-label={
              isFullscreen ? 'Sair da tela cheia' : 'Abrir chat em tela cheia'
            }
            title={
              isFullscreen
                ? 'Sair da tela cheia (Esc)'
                : 'Abrir chat em tela cheia'
            }
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d={
                  isFullscreen
                    ? 'M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5'
                    : 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'
                }
              />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={messagesRef}
        className="chat-messages"
        style={{
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
              overflowWrap: 'anywhere',
            }}
          >
            {item.role === 'assistant'
              ? splitProfessionalProfileLinks(item.content).map(
                  (segment, segmentIndex) =>
                    segment.type === 'professional-profile' ? (
                      <a
                        className="chat-professional-link"
                        href={segment.href}
                        key={`${segment.href}-${segmentIndex}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver perfil profissional
                      </a>
                    ) : (
                      <span key={`text-${segmentIndex}`}>
                        {segment.content}
                      </span>
                    ),
                )
              : item.content}
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
            onKeyDown={(event) => {
              if (
                event.key !== 'Enter' ||
                event.shiftKey ||
                event.nativeEvent.isComposing
              )
                return;

              event.preventDefault();
              if (isLoading || !message.trim()) return;
              event.currentTarget.form?.requestSubmit();
            }}
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
          style={{
            color: 'var(--muted)',
            margin: '8px 0 0',
            fontSize: '.82rem',
          }}
        >
          Evite compartilhar dados pessoais ou informações sensíveis
          desnecessárias.
        </p>
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
        <p
          style={{
            color: 'var(--muted)',
            margin: '4px 0 0',
            fontSize: '.82rem',
          }}
        >
          Este assistente não substitui atendimento profissional. Em risco
          imediato, procure o SAMU (192), uma emergência local ou o CVV (188).
        </p>
      </form>
    </div>
  );
}
