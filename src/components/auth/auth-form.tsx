'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

type Props = {
  mode: 'login' | 'signup';
  action: (form: FormData) => Promise<void>;
  error?: string;
  message?: string;
};

function SubmitButton({ signup }: { signup: boolean }) {
  const { pending } = useFormStatus();
  const loginPending = !signup && pending;

  return (
    <button className="button" type="submit" disabled={loginPending}>
      {loginPending ? 'Entrando...' : signup ? 'Criar acesso' : 'Entrar'}
    </button>
  );
}

export function AuthForm({ mode, action, error, message }: Props) {
  const signup = mode === 'signup';
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <form action={action} className="surface form-card">
      <h1>{signup ? 'Cadastro profissional' : 'Entrar'}</h1>
      <p>
        {signup
          ? 'Crie seu acesso. O perfil só será publicado após verificação administrativa.'
          : 'Acesse sua área profissional ou administrativa.'}
      </p>
      {error && (
        <p className="form-alert error" role="alert">
          {error}
        </p>
      )}
      {message && <p className="form-alert success">{message}</p>}
      {signup && (
        <label>
          Nome completo
          <input name="fullName" required minLength={2} autoComplete="name" />
        </label>
      )}
      <label>
        E-mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Senha
        <span style={{ position: 'relative', display: 'block' }}>
          <input
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete={signup ? 'new-password' : 'current-password'}
            style={{ paddingRight: '3.25rem' }}
          />
          <button
            type="button"
            aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
            style={{
              position: 'absolute',
              top: '50%',
              right: '0.55rem',
              transform: 'translateY(-50%)',
              display: 'inline-flex',
              padding: '0.4rem',
              border: 0,
              borderRadius: 8,
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {passwordVisible && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </span>
      </label>
      <SubmitButton signup={signup} />
      <p>
        {signup ? (
          <>
            Já possui cadastro?{' '}
            <Link href="/entrar">
              <u>Entrar</u>
            </Link>
          </>
        ) : (
          <span className="auth-links">
            <Link href="/recuperar-senha">
              <u>Esqueci ou ainda não defini minha senha</u>
            </Link>
            <span>
              É psicólogo(a)?{' '}
              <Link href="/cadastro-profissional">
                <u>Cadastre-se</u>
              </Link>
            </span>
          </span>
        )}
      </p>
    </form>
  );
}
