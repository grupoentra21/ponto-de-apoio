export const PROFESSIONAL_SEARCH_TOOL = {
  type: 'function' as const,
  name: 'buscar_profissionais',
  description:
    'Consulta profissionais aprovados e publicados. Use quando a pessoa pedir diretamente um psicólogo ou disser que deseja ajuda profissional. Não use antes do protocolo de crise nem force a busca em um relato emocional comum.',
  strict: true,
  parameters: {
    type: 'object',
    properties: {
      service_mode: {
        anyOf: [
          { type: 'string', enum: ['online', 'in_person', 'hybrid'] },
          { type: 'null' },
        ],
        description: 'Modalidade desejada, ou null quando não informada.',
      },
      city: {
        anyOf: [{ type: 'string', maxLength: 120 }, { type: 'null' }],
        description: 'Cidade desejada, ou null quando não informada.',
      },
      state: {
        anyOf: [{ type: 'string', pattern: '^[A-Z]{2}$' }, { type: 'null' }],
        description: 'UF brasileira com duas letras, ou null.',
      },
      context: {
        anyOf: [{ type: 'string', maxLength: 240 }, { type: 'null' }],
        description:
          'Tema curto para correspondência na apresentação profissional, nunca a conversa completa.',
      },
    },
    required: ['service_mode', 'city', 'state', 'context'],
    additionalProperties: false,
  },
};

export type ProfessionalSearchArguments = {
  service_mode: 'online' | 'in_person' | 'hybrid' | null;
  city: string | null;
  state: string | null;
  context: string | null;
};

export function parseSearchArguments(
  value: string,
): ProfessionalSearchArguments {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Argumentos de busca inválidos.');
  }

  const args = parsed as Record<string, unknown>;
  const { service_mode: serviceMode, city, state, context } = args;
  const validModes = ['online', 'in_person', 'hybrid'];

  if (
    (serviceMode !== null &&
      (typeof serviceMode !== 'string' || !validModes.includes(serviceMode))) ||
    (city !== null && (typeof city !== 'string' || city.length > 120)) ||
    (state !== null &&
      (typeof state !== 'string' || !/^[A-Z]{2}$/.test(state))) ||
    (context !== null && (typeof context !== 'string' || context.length > 240))
  ) {
    throw new Error('Filtros de busca inválidos.');
  }

  return {
    service_mode: serviceMode as ProfessionalSearchArguments['service_mode'],
    city: typeof city === 'string' ? city.trim() || null : null,
    state: typeof state === 'string' ? state : null,
    context: typeof context === 'string' ? context.trim() || null : null,
  };
}
