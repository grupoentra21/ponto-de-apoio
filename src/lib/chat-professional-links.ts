export type ChatMessageSegment =
  | { type: 'text'; content: string }
  | { type: 'professional-profile'; href: string };

const PROFESSIONAL_PROFILE_PATH =
  /(^|[\s(])(?:Perfil:\s*)?(\/profissionais\/[^\s<>]+)/gim;

export function isSafeProfessionalProfilePath(value: string) {
  return (
    value.startsWith('/profissionais/') &&
    !value.startsWith('//') &&
    !/^(?:javascript|data|https?):/i.test(value)
  );
}

export function splitProfessionalProfileLinks(
  content: string,
): ChatMessageSegment[] {
  const segments: ChatMessageSegment[] = [];
  let cursor = 0;

  for (const match of content.matchAll(PROFESSIONAL_PROFILE_PATH)) {
    const matchIndex = match.index;
    const prefix = match[1];
    const href = match[2].replace(/[),.;!?]+$/, '');
    const trailingText = match[2].slice(href.length);

    if (matchIndex > cursor) {
      segments.push({ type: 'text', content: content.slice(cursor, matchIndex) });
    }
    if (prefix) segments.push({ type: 'text', content: prefix });

    if (isSafeProfessionalProfilePath(href)) {
      segments.push({ type: 'professional-profile', href });
      if (trailingText) {
        segments.push({ type: 'text', content: trailingText });
      }
    } else {
      segments.push({ type: 'text', content: match[0] });
    }

    cursor = matchIndex + match[0].length;
  }

  if (cursor < content.length) {
    segments.push({ type: 'text', content: content.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content }];
}
