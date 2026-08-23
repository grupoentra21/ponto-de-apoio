import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/entrar');
  return { supabase, user: data.user };
}

export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  const profile = data as Profile | null;
  if (!profile || profile.role !== 'admin') redirect('/area-profissional');
  return { supabase, user, profile };
}
