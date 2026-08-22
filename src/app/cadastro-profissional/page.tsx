import { AuthForm } from '@/components/auth/auth-form';
import { signUp } from '@/app/auth/actions';
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const p = await searchParams;
  return (
    <main className="auth-page">
      <AuthForm mode="signup" action={signUp} error={p.erro} />
    </main>
  );
}
