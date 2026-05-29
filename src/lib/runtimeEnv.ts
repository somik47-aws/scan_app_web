import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let cache: Record<string, string> | null | undefined;

function loadBakedEnv(): Record<string, string> {
  if (cache !== undefined) return cache ?? {};

  const candidates = [
    join(process.cwd(), 'env.baked.json'),
    join(process.cwd(), '..', 'env.baked.json'),
    join(process.cwd(), '.next', 'env.baked.json'),
  ];

  for (const filePath of candidates) {
    try {
      if (existsSync(filePath)) {
        cache = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, string>;
        return cache;
      }
    } catch {
      /* try next path */
    }
  }

  cache = {};
  return cache;
}

/** Read env from process.env first, then env.baked.json (Firebase build-time bake). */
export function getRuntimeEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim().replace(/^['"]|['"]$/g, '');
  if (fromProcess) return fromProcess;
  const baked = loadBakedEnv()[name]?.trim();
  return baked || undefined;
}

export function hasBakedEnvFile(): boolean {
  return Object.keys(loadBakedEnv()).length > 0;
}

export function listRuntimeEnvKeyNames(): string[] {
  const names = new Set<string>();
  for (const key of Object.keys(process.env)) {
    if (
      key.includes('OPENAI') ||
      key.includes('RAZORPAY') ||
      key.includes('PAYMENT') ||
      key.includes('NEXT_PUBLIC_APP')
    ) {
      names.add(key);
    }
  }
  for (const key of Object.keys(loadBakedEnv())) {
    names.add(key);
  }
  return [...names];
}
