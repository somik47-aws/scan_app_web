import { getRuntimeEnv } from '@/lib/runtimeEnv';

/** Server-side OpenAI key */
export function getOpenAiApiKey(): string | undefined {
  const sources = [getRuntimeEnv('OPENAI_API_KEY'), getRuntimeEnv('OPENAI_KEY')];
  for (const key of sources) {
    if (key?.startsWith('sk-')) return key;
  }
  return undefined;
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

export function requireOpenAiApiKey(): string {
  const key = getOpenAiApiKey();
  if (!key) {
    throw new Error(
      'OpenAI API key is not available on the server. ' +
        'Set OPENAI_API_KEY in Firebase Environment variables and create a new rollout. ' +
        'Check /api/config-check'
    );
  }
  return key;
}
