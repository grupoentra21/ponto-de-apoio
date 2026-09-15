const PROFESSIONAL_ID_PATTERN =
  /--([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export function slugifyProfessionalName(name: string) {
  return (
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'profissional'
  );
}

export function professionalProfilePath(name: string, id: string) {
  return `/profissionais/${slugifyProfessionalName(name)}--${id}`;
}

export function professionalWhatsAppUrl(phoneNumber: string) {
  if (!/^55[0-9]{10,11}$/.test(phoneNumber)) return null;

  const message =
    'Olá, encontrei seu perfil no Ponto de Apoio e gostaria de saber mais sobre seu atendimento.';

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export function professionalIdFromSlug(slug: string) {
  return slug.match(PROFESSIONAL_ID_PATTERN)?.[1] ?? null;
}

export function isPublicProfessional(
  professional: { status: string; is_published: boolean } | null,
) {
  return (
    professional?.status === 'approved' && professional.is_published === true
  );
}

export function safeProfessionalCatalogReturnPath(value?: string) {
  return value === '/profissionais' || value?.startsWith('/profissionais?')
    ? value
    : '/profissionais';
}
