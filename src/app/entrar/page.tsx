import { AuthForm } from '@/components/auth/auth-form';
import { signIn } from '@/app/auth/actions';
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; mensagem?: string }>;
}) {
  const p = await searchParams;
  return (
    <main className="auth-page">
      <AuthForm
        mode="login"
        action={signIn}
        error={p.erro}
        message={p.mensagem}
      />
    </main>
  );
}
