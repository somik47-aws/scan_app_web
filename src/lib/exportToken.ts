import { createHmac, randomBytes } from 'crypto';

import { getRuntimeEnv } from '@/lib/runtimeEnv';

const TOKEN_TTL_MS = 30 * 60 * 1000;

/** @deprecated Use getExportPriceInrPaise from paymentConfig */
export function getExportPricePaise(): number {
  return Number(process.env.EXPORT_PRICE_PAISE ?? 1000); // 1000 paise = ₹10
}

export function createExportToken(documentId: string, orderId: string): {
  token: string;
  expiresAt: number;
} {
  const secret = getRuntimeEnv('PAYMENT_TOKEN_SECRET') ?? 'dev-secret-change-me';
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${documentId}:${orderId}:${expiresAt}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');
  return { token, expiresAt };
}

export function verifyExportToken(
  token: string,
  documentId: string,
  orderId: string
): boolean {
  try {
    const secret = getRuntimeEnv('PAYMENT_TOKEN_SECRET') ?? 'dev-secret-change-me';
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 4) return false;
    const sig = parts.pop()!;
    const exp = Number(parts.pop());
    const oid = parts.pop()!;
    const docId = parts.join(':');
    if (docId !== documentId || oid !== orderId) return false;
    if (exp < Date.now()) return false;
    const payload = `${docId}:${oid}:${exp}`;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    return sig === expected;
  } catch {
    return false;
  }
}

export function createMockOrderId(): string {
  return `mock_order_${randomBytes(8).toString('hex')}`;
}
