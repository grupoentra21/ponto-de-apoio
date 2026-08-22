import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('professionals')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('Falha na verificação do Supabase:', error.code);

      return NextResponse.json({ status: 'unavailable' }, { status: 503 });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error(
      'Falha na configuração do Supabase:',
      error instanceof Error ? error.message : 'erro desconhecido',
    );

    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}
