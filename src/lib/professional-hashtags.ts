export function normalizeHashtag(value: string) {
  return value
    .trim()
    .replace(/^#/, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Only use tags explicitly written by the professional, never inferred qualifications. */
export function professionalHashtags(bio: string | null) {
  const tags = new Map<string, string>();
  for (const match of (bio ?? '').matchAll(
    /(?:^|[\s(])#([\p{L}\p{N}][\p{L}\p{N}_-]{0,39})(?![\p{L}\p{N}_-])/gu,
  )) {
    const tag = match[1];
    const key = normalizeHashtag(tag);
    if (!tags.has(key)) tags.set(key, tag);
    if (tags.size === 12) break;
  }
  return [...tags.values()];
}
