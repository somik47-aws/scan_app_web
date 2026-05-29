import { createHmac } from 'crypto';

import { getRuntimeEnv } from '@/lib/runtimeEnv';

const TTL_MS = 15 * 60 * 1000;

function getSecret(): string {
  return getRuntimeEnv('PAYMENT_TOKEN_SECRET') ?? 'dev-secret-change-me';
}

export type UpiPaymentTokenPayload = {
  orderId: string;
  documentId: string;
  amountPaise: number;
  exp: number;
};

export function createUpiPaymentToken(
  orderId: string,
  documentId: string,
  amountPaise: number
): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${orderId}:${documentId}:${amountPaise}:${exp}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyUpiPaymentToken(token: string): UpiPaymentTokenPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 5) return null;
    const sig = parts.pop()!;
    const exp = Number(parts.pop());
    const amountPaise = Number(parts.pop());
    const documentId = parts.pop()!;
    const orderId = parts.join(':');
    if (!orderId || !documentId || !amountPaise) return null;
    if (exp < Date.now()) return null;
    const payload = `${orderId}:${documentId}:${amountPaise}:${exp}`;
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex');
    if (sig !== expected) return null;
    return { orderId, documentId, amountPaise, exp };
  } catch {
    return null;
  }
}
