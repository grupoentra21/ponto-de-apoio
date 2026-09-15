export function normalizeProfessionalFullName(input: string) {
  return input.trim();
}

export function isValidProfessionalFullName(input: string) {
  const normalized = normalizeProfessionalFullName(input);
  return normalized.length >= 2 && normalized.length <= 120;
}
