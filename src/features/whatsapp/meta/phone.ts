/** Deja solo dígitos y quita el prefijo internacional 00. */
export function digitsOnly(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('00') ? digits.slice(2) : digits;
}

/**
 * Normaliza un teléfono al formato que pide Cloud API: dígitos, con código
 * de país, sin +, espacios ni guiones. Si hay 10 dígitos, antepone el código
 * elegido (México por defecto).
 */
export function normalizeRecipient(input: string, countryCode = '52'): string {
  let digits = digitsOnly(input);
  if (!digits) return '';

  if (countryCode && digits.length === 10) {
    digits = `${countryCode}${digits}`;
  }

  return digits;
}

export function isPlausibleE164(digits: string): boolean {
  return /^\d{8,15}$/.test(digits);
}

export function parseRecipientList(input: string, countryCode: string, limit = 20): string[] {
  const parts = input.split(/[\n,;]+/);
  const unique: string[] = [];

  for (const part of parts) {
    const normalized = normalizeRecipient(part, countryCode);
    if (!normalized || unique.includes(normalized)) continue;
    unique.push(normalized);
    if (unique.length > limit) break;
  }

  return unique;
}

export function maskToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
