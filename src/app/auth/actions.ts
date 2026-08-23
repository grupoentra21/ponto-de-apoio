'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function text(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim();
}
function fail(path: string, message: string): never {
  redirect(`${path}?erro=${encodeURIComponent(message)}`);
}

export async function signUp(form: FormData) {
  const fullName = text(form, 'fullName');
  const email = text(form, 'email');
  const password = text(form, 'password');
  if (fullName.length < 2 || !email || password.length < 8)
    fail(
      '/cadastro-profissional',
      'Preencha os campos. A senha deve ter pelo menos 8 caracteres.',
    );
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (await headers()).get('origin') ??
    'http://localhost:3000';
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/area-profissional`,
    },
  });
  if (error) fail('/cadastro-profissional', error.message);
  if (data.session) redirect('/area-profissional');
  redirect('/entrar?mensagem=Confira seu e-mail para confirmar o cadastro.');
}

export async function signIn(form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(form, 'email'),
    password: text(form, 'password'),
  });
  if (error) fail('/entrar', 'E-mail ou senha inválidos.');
  redirect('/area-profissional');
}

export async function requestPasswordReset(form: FormData) {
  const email = text(form, 'email');
  if (!email) fail('/recuperar-senha', 'Informe um e-mail válido.');

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (await headers()).get('origin') ??
    'http://localhost:3000';
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/definir-senha`,
  });

  if (error) {
    fail(
      '/recuperar-senha',
      'Não foi possível enviar o link agora. Tente novamente em alguns minutos.',
    );
  }

  redirect(
    '/entrar?mensagem=Se o e-mail estiver cadastrado, você receberá um link seguro para definir a senha.',
  );
}

export async function updatePassword(form: FormData) {
  const password = text(form, 'password');
  const confirmation = text(form, 'passwordConfirmation');

  if (password.length < 8) {
    fail('/definir-senha', 'A senha deve ter pelo menos 8 caracteres.');
  }
  if (password !== confirmation) {
    fail('/definir-senha', 'As senhas informadas não são iguais.');
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    fail(
      '/recuperar-senha',
      'O link expirou ou já foi utilizado. Solicite um novo link.',
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    fail(
      '/definir-senha',
      'Não foi possível definir a senha. Solicite um novo link.',
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  redirect(profile?.role === 'admin' ? '/admin' : '/area-profissional');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
