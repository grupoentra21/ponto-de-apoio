const SEARCH_STOPWORDS = new Set([
  'a',
  'as',
  'com',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'esta',
  'estou',
  'eu',
  'me',
  'meu',
  'minha',
  'o',
  'os',
  'para',
  'pela',
  'pelo',
  'por',
  'que',
  'um',
  'uma',
]);

const SEARCH_EQUIVALENTS: Record<string, string[]> = {
  cachorro: ['animal', 'pet'],
  cachorros: ['animal', 'pet'],
  cao: ['animal', 'pet'],
  gato: ['animal', 'pet'],
  gatos: ['animal', 'pet'],
  pet: ['animal'],
  pets: ['animal'],
  luto: ['perda', 'falecimento'],
  perda: ['luto'],
  perdeu: ['luto', 'perda'],
  morreu: ['luto', 'perda', 'falecimento'],
  morte: ['luto', 'perda', 'falecimento'],
  falecimento: ['luto', 'perda'],
  familiar: ['familia'],
  parentes: ['familia'],
  separacao: ['termino', 'relacionamento'],
  termino: ['separacao', 'relacionamento'],
  divorcio: ['separacao', 'relacionamento'],
  ansiedade: ['ansioso', 'ansiosa'],
  ansioso: ['ansiedade'],
  ansiosa: ['ansiedade'],
  estresse: ['stress', 'sobrecarga'],
  stress: ['estresse', 'sobrecarga'],
  burnout: ['trabalho', 'sobrecarga', 'estresse'],
  autoestima: ['autoconfianca'],
  relacionamento: ['relacoes', 'separacao'],
  familia: ['familiar'],
  trabalho: ['carreira', 'burnout'],
  solidao: ['sozinho', 'sozinha', 'isolamento'],
  sozinho: ['solidao'],
  sozinha: ['solidao'],
  tristeza: ['triste'],
  triste: ['tristeza'],
};

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function relevantTerms(value: string) {
  return normalizeSearchText(value)
    .split(' ')
    .filter((term) => term.length > 2 && !SEARCH_STOPWORDS.has(term));
}

export function relevanceScore(context: string, bio: string | null) {
  if (!bio) return 0;
  const normalizedContext = normalizeSearchText(context);
  const normalizedBio = normalizeSearchText(bio);
  const contextTerms = relevantTerms(context);
  const bioTerms = new Set(relevantTerms(bio));
  let score =
    normalizedContext.length >= 8 && normalizedBio.includes(normalizedContext)
      ? 12
      : 0;

  for (const term of contextTerms) {
    if (bioTerms.has(term)) score += 3;
    for (const equivalent of SEARCH_EQUIVALENTS[term] ?? []) {
      if (bioTerms.has(equivalent)) score += 2;
    }
  }
  for (let index = 0; index < contextTerms.length - 1; index += 1) {
    if (
      normalizedBio.includes(
        `${contextTerms[index]} ${contextTerms[index + 1]}`,
      )
    )
      score += 5;
  }
  return score;
}

export function serviceModesForFilter(
  mode: 'online' | 'in_person' | 'hybrid' | null,
) {
  if (mode === 'online') return ['online', 'hybrid'] as const;
  if (mode === 'in_person') return ['in_person', 'hybrid'] as const;
  if (mode === 'hybrid') return ['hybrid'] as const;
  return null;
}
