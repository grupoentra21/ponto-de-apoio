export type ChatRecommendation = { id: string; name: string; reason: string };

export type ChatProfessional = {
  id: string;
  name: string;
  crp: string;
  bio: string | null;
  serviceMode: 'online' | 'in_person' | 'hybrid';
  city: string | null;
  state: string | null;
  contactEmail: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
};

export const professionalIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isChatRecommendations(
  value: unknown,
): value is ChatRecommendation[] {
  return (
    Array.isArray(value) &&
    value.length <= 8 &&
    value.every((item) => {
      if (!item || typeof item !== 'object') return false;
      return (
        typeof item.id === 'string' &&
        professionalIdPattern.test(item.id) &&
        typeof item.name === 'string' &&
        item.name.length <= 200 &&
        typeof item.reason === 'string' &&
        item.reason.length <= 1500
      );
    })
  );
}

export function serviceModeLabel(mode: ChatProfessional['serviceMode']) {
  return mode === 'online'
    ? 'Online'
    : mode === 'in_person'
      ? 'Presencial'
      : 'Online e presencial';
}
