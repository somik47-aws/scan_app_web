/**
 * Bakes Firebase/Amplify build-time env into env.baked.json for runtime.
 * Firebase console vars are often available at BUILD but not RUNTIME — this fixes that.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

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

const KEYS = [
  'OPENAI_API_KEY',
  'PAYMENT_TOKEN_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'EXPORT_PRICE_PAISE',
];

const payload = {};
for (const key of KEYS) {
  const value = process.env[key]?.trim();
  if (value) payload[key] = value;
}

const openai = payload.OPENAI_API_KEY;
if (!openai || !openai.startsWith('sk-')) {
  console.error(
    '\n[build] OPENAI_API_KEY missing during build.\n' +
      'Set it in Firebase Hosting → Environment variables, then create a new rollout.\n'
  );
  process.exit(1);
}

writeFileSync('env.baked.json', JSON.stringify(payload, null, 2));
console.log('[build] Wrote env.baked.json with keys:', Object.keys(payload).join(', '));
