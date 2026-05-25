/** Server-side OpenAI key (hosting env vars — .env.local is not deployed). */
export function getOpenAiApiKey(): string | undefined {
  const key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_KEY?.trim();
  if (!key || key === 'sk-...') return undefined;
  return key;
}

export function requireOpenAiApiKey(): string {
  const key = getOpenAiApiKey();
  if (!key) {
    throw new Error(
      'OpenAI API key is not configured. Add OPENAI_API_KEY in your hosting dashboard ' +
        '(Vercel / Netlify / server Environment Variables). .env.local only works locally.'
    );
  }
  return key;
}
