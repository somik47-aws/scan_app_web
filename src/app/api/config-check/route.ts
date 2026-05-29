import { NextResponse } from 'next/server';

import { isOpenAiConfigured } from '@/lib/openaiKey';
import { isRazorpayConfigured } from '@/lib/paymentConfig';
import { hasBakedEnvFile, listRuntimeEnvKeyNames } from '@/lib/runtimeEnv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const openaiConfigured = isOpenAiConfigured();
  const keyNames = listRuntimeEnvKeyNames();

  return NextResponse.json({
    openaiConfigured,
    razorpayConfigured: isRazorpayConfigured(),
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    bakedEnvAvailable: hasBakedEnvFile(),
    knownEnvKeys: keyNames,
    hint: openaiConfigured
      ? 'OpenAI is configured correctly.'
      : hasBakedEnvFile()
        ? 'Baked env file exists but OpenAI key invalid — check Firebase env and redeploy.'
        : 'No env at runtime. Push latest code and create a new Firebase rollout (build bakes env.baked.json).',
  });
}
