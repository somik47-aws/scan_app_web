/**
 * Copy env.baked.json into Next.js standalone output for Cloud Run runtime.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const src = 'env.baked.json';
if (!existsSync(src)) {
  console.error('[postbuild] env.baked.json not found');
  process.exit(1);
}

const targets = [
  '.next/standalone/env.baked.json',
  join('.next', 'standalone', '.next', 'env.baked.json'),
];

for (const target of targets) {
  try {
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(src, target);
    console.log('[postbuild] Copied env.baked.json →', target);
  } catch (err) {
    console.warn('[postbuild] Skip copy to', target, err.message);
  }
}
