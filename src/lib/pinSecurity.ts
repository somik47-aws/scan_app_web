export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export function normalizePin(pin: string): string {
  return pin.replace(/\D/g, '');
}

export function isValidPinFormat(pin: string): boolean {
  const digits = normalizePin(pin);
  return digits.length >= PIN_MIN_LENGTH && digits.length <= PIN_MAX_LENGTH;
}

export async function hashDocumentPin(pin: string, documentId: string): Promise<string> {
  const normalized = normalizePin(pin);
  const data = new TextEncoder().encode(`scan_app:${documentId}:${normalized}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyDocumentPin(
  pin: string,
  documentId: string,
  storedHash: string
): Promise<boolean> {
  const computed = await hashDocumentPin(pin, documentId);
  return computed === storedHash;
}
