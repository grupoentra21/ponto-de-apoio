import { createHash } from 'node:crypto';
import {
  relevanceScore,
  serviceModesForFilter,
} from '@/ai/professional-relevance';
import type { ProfessionalSearchArguments } from '@/ai/tools';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { professionalProfilePath } from '@/lib/professional-public-profile';
import type { ChatProfessional } from '@/lib/chat-recommendations';

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
    .map(({ professional }) => {
      const name = professional.profiles?.full_name ?? 'Profissional';
      return {
        id: professional.id,
        reason:
          args.context && relevanceScore(args.context, professional.bio) > 0
            ? `A apresentação pública menciona temas relacionados a “${args.context}”. Confirme com o profissional se sua atuação atende ao que você procura.`
            : 'Este perfil aparece entre as opções disponíveis para sua busca. Não foi identificada uma correspondência específica com o tema; confirme a área de atuação com o profissional.',
        name,
        crp: `${professional.registration_region} ${professional.registration_number}`,
        bio: professional.bio,
        service_mode: professional.service_mode,
        city: professional.city,
        state: professional.state,
        catalog_url: professionalProfilePath(name, professional.id),
      };
    });

  return {
    count: professionals.length,
    filters: args,
    ordering: hasRelevantMatches
      ? 'Correspondência textual com a apresentação pública, com desempate neutro; a ordem não representa qualidade ou recomendação clínica.'
      : 'Rotação diária neutra; a ordem não representa qualidade ou recomendação clínica.',
    professionals,
  };
}

export async function getChatProfessionals(
  ids: string[],
): Promise<ChatProfessional[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('professionals')
    .select(
      'id,registration_number,registration_region,bio,service_mode,city,state,contact_email,phone_number,avatar_path,profiles!professionals_profile_id_fkey(full_name)',
    )
    .in('id', ids)
    .eq('status', 'approved')
    .eq('is_published', true);
  if (error) throw new Error('Não foi possível consultar os perfis públicos.');
  return Promise.all(
    (data ?? []).map(async (row) => {
      const professional = row as unknown as PublicProfessional & {
        contact_email: string | null;
        phone_number: string | null;
        avatar_path: string | null;
      };
      const avatar = professional.avatar_path
        ? await supabase.storage
            .from('professional-avatars')
            .createSignedUrl(professional.avatar_path, 3600)
        : null;
      return {
        id: professional.id,
        name: professional.profiles?.full_name ?? 'Profissional',
        crp: `${professional.registration_region} ${professional.registration_number}`,
        bio: professional.bio,
        serviceMode: professional.service_mode,
        city: professional.city,
        state: professional.state,
        contactEmail: professional.contact_email,
        phoneNumber: professional.phone_number,
        avatarUrl: avatar?.data?.signedUrl ?? null,
      };
    }),
  );
}
