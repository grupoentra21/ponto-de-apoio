import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const requestedNext = url.searchParams.get('next') || '/area-profissional';
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/area-profissional';

  if (tokenHash && type === 'recovery') {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });

    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  if (tokenHash && type === 'email') {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    });

    if (!error) {
      const destination = data.session
        ? next
        : '/entrar?mensagem=E-mail confirmado com sucesso. Você já pode entrar.';
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(
    new URL('/entrar?erro=Não foi possível confirmar o acesso.', url.origin),
  );
}
