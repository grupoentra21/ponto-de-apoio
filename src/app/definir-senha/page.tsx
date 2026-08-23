import { updatePassword } from '@/app/auth/actions';
import { requireUser } from '@/lib/auth';

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireUser();
  const params = await searchParams;

  return (
    <main className="auth-page">
      <form action={updatePassword} className="surface form-card">
        <h1>Defina sua senha</h1>
        <p>Escolha uma senha exclusiva com pelo menos 8 caracteres.</p>
        {params.erro && (
          <p className="form-alert error" role="alert">
            {params.erro}
          </p>
        )}
        <label>
          Nova senha
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirme a nova senha
          <input
            name="passwordConfirmation"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button className="button" type="submit">
          Salvar senha
        </button>
      </form>
    </main>
  );
}
