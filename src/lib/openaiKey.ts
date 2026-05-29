/** Server-side OpenAI key — set in Firebase Hosting → Environment variables, then redeploy */
export function getOpenAiApiKey(): string | undefined {
  const sources = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_KEY,
  ];

  for (const raw of sources) {
    const key = raw?.trim().replace(/^['"]|['"]$/g, '');
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
        'Firebase: save OPENAI_API_KEY under Hosting → Environment variables, ' +
        'then create a NEW rollout (see HOSTING_FIX.md). ' +
        'Check: /api/config-check'
    );
  }
  return key;
}
