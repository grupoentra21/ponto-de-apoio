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
    (await headers()).get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
