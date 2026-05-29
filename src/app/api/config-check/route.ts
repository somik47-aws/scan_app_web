import { NextResponse } from 'next/server';

import { isOpenAiConfigured } from '@/lib/openaiKey';
import { isRazorpayConfigured } from '@/lib/paymentConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Safe diagnostics — never exposes secret values */
export async function GET() {
  const openaiConfigured = isOpenAiConfigured();
  const raw = process.env.OPENAI_API_KEY;
  const keyLooksPresent = Boolean(raw?.trim() && raw.trim().startsWith('sk-'));

  return NextResponse.json({
    openaiConfigured,
    razorpayConfigured: isRazorpayConfigured(),
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    /** Helps debug Firebase: is OPENAI_API_KEY visible at runtime (not its value) */
    openaiEnvVarVisible: keyLooksPresent,
    knownEnvKeys: Object.keys(process.env).filter(
      (k) =>
        k.includes('OPENAI') ||
        k.includes('RAZORPAY') ||
        k.includes('PAYMENT') ||
        k.includes('NEXT_PUBLIC_APP')
    ),
    hint: openaiConfigured
      ? 'OpenAI is configured correctly.'
      : keyLooksPresent
        ? 'Key is visible but invalid format — check for extra quotes or spaces.'
        : 'OPENAI_API_KEY not visible at runtime. Use apphosting.yaml + Secret Manager — see FIREBASE_DEPLOY.md',
  });
}
