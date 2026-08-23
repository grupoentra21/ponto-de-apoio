import Link from 'next/link';
import { requestPasswordReset } from '@/app/auth/actions';

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <form action={requestPasswordReset} className="surface form-card">
        <h1>Definir ou recuperar senha</h1>
        <p>
          Enviaremos um link seguro para o e-mail cadastrado. Sua senha nunca
          será enviada por e-mail.
        </p>
        {params.erro && (
          <p className="form-alert error" role="alert">
            {params.erro}
          </p>
        )}
        <label>
          E-mail
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <button className="button" type="submit">
          Enviar link seguro
        </button>
        <p>
          <Link href="/entrar">
            <u>Voltar para entrar</u>
          </Link>
        </p>
      </form>
    </main>
  );
}
