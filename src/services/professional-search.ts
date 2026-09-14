import { createHash } from 'node:crypto';
import {
  relevanceScore,
  serviceModesForFilter,
} from '@/ai/professional-relevance';
import type { ProfessionalSearchArguments } from '@/ai/tools';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

type PublicProfessional = {
  id: string;
  registration_number: string;
  registration_region: string;
  bio: string | null;
  service_mode: 'online' | 'in_person' | 'hybrid';
  city: string | null;
  state: string | null;
  profiles: { full_name: string } | null;
};

export async function searchProfessionals(args: ProfessionalSearchArguments) {
  const supabase = await createSupabaseClient();
  let query = supabase
    .from('professionals')
    .select(
      'id,registration_number,registration_region,bio,service_mode,city,state,profiles!professionals_profile_id_fkey(full_name)',
    )
    .eq('status', 'approved')
    .eq('is_published', true)
    .limit(50);

  const serviceModes = serviceModesForFilter(args.service_mode);
  if (serviceModes) query = query.in('service_mode', [...serviceModes]);
  if (args.city) query = query.ilike('city', args.city);
  if (args.state) query = query.eq('state', args.state);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao consultar o catálogo: ${error.message}`);

  const day = new Date().toISOString().slice(0, 10);
  const rows = (data ?? []) as unknown as PublicProfessional[];
  const neutralKey = (professional: PublicProfessional) =>
    createHash('sha256').update(`${day}:${professional.id}`).digest('hex');
  const scored = rows.map((professional) => ({
    professional,
    score: args.context ? relevanceScore(args.context, professional.bio) : 0,
  }));
  const hasRelevantMatches = scored.some(({ score }) => score > 0);
  const professionals = scored
    .sort((a, b) => {
      if (hasRelevantMatches && b.score !== a.score) return b.score - a.score;
      return neutralKey(a.professional).localeCompare(
        neutralKey(b.professional),
      );
    })
    .slice(0, 8)
    .map(({ professional }) => ({
      name: professional.profiles?.full_name ?? 'Profissional',
      crp: `${professional.registration_region} ${professional.registration_number}`,
      bio: professional.bio,
      service_mode: professional.service_mode,
      city: professional.city,
      state: professional.state,
      catalog_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pontodeapoio.social.br'}/profissionais`,
    }));

  return {
    count: professionals.length,
    filters: args,
    ordering: hasRelevantMatches
      ? 'Correspondência textual com a apresentação pública, com desempate neutro; a ordem não representa qualidade ou recomendação clínica.'
      : 'Rotação diária neutra; a ordem não representa qualidade ou recomendação clínica.',
    professionals,
  };
}
