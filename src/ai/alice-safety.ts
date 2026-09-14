function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CLEAR_RISK_PATTERNS = [
  /\bquero me matar\b/,
  /\bvou me matar\b/,
  /\bpretendo me matar\b/,
  /\bestou pensando em me matar\b/,
  /\bpenso em me matar\b/,
  /\btenho pensado em me matar\b/,
  /\bquero morrer\b/,
  /\bnao quero mais viver\b/,
  /\btirar minha vida\b/,
  /\bacabar com minha vida\b/,
  /\bestou pensando em suicidio\b/,
  /\bquero me machucar\b/,
  /\bvou me machucar\b/,
  /\bestou pensando em me machucar\b/,
  /\bpenso em me machucar\b/,
  /\btenho pensado em me machucar\b/,
  /\bquero me ferir\b/,
  /\bestou pensando em me ferir\b/,
  /\bpenso em me ferir\b/,
  /\bquero me cortar\b/,
  /\bestou pensando em me cortar\b/,
  /\bpenso em me cortar\b/,
  /\btenho pensado em me cortar\b/,
  /\bcortar meus pulsos\b/,
  /\bme automutilar\b/,
  /\bestou em perigo imediato\b/,
];

export function hasClearImmediateRisk(message: string) {
  const normalized = normalize(message);
  return CLEAR_RISK_PATTERNS.some((pattern) => pattern.test(normalized));
}

export const IMMEDIATE_RISK_RESPONSE =
  'Sinto muito que você esteja passando por isso. Sua segurança é a prioridade agora. Se houver risco de você se machucar, ligue para o SAMU (192) ou procure uma emergência local imediatamente. Você também pode ligar para o CVV (188). Se puder, chame agora uma pessoa de confiança para ficar com você. Você está em perigo imediato neste momento?';
