/**
 * Runs during `npm run build` on Firebase/Amplify.
 * Fails early if OPENAI_API_KEY is missing at build time.
 */
import { existsSync, readFileSync } from 'node:fs';

function loadDotEnvLocal() {
  if (!existsSync('.env.local')) return;
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[name]) process.env[name] = value;
  }
}

loadDotEnvLocal();

const key = process.env.OPENAI_API_KEY?.trim();

if (!key || !key.startsWith('sk-')) {
  console.error(
    '\n[build] OPENAI_API_KEY is missing or invalid during build.\n' +
      'Firebase: Hosting → Environment variables → add OPENAI_API_KEY for All branches,\n' +
      'then create a NEW rollout (changes do not apply to existing deployments).\n'
  );
  process.exit(1);
}

console.log('[build] OPENAI_API_KEY is set (length:', key.length, ')');
