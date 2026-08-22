import Link from 'next/link';
type Props = {
  mode: 'login' | 'signup';
  action: (form: FormData) => Promise<void>;
  error?: string;
  message?: string;
};
export function AuthForm({ mode, action, error, message }: Props) {
  const signup = mode === 'signup';
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
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={signup ? 'new-password' : 'current-password'}
        />
      </label>
      <button className="button" type="submit">
        {signup ? 'Criar acesso' : 'Entrar'}
      </button>
      <p>
        {signup ? (
          <>
            Já possui cadastro?{' '}
            <Link href="/entrar">
              <u>Entrar</u>
            </Link>
          </>
        ) : (
          <>
            É psicólogo(a)?{' '}
            <Link href="/cadastro-profissional">
              <u>Cadastre-se</u>
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
