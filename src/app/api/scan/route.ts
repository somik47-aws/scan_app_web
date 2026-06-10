import { NextRequest, NextResponse } from 'next/server';

import { analyzeDocumentImage } from '@/lib/openaiScan';
import { analyzeProductImage } from '@/lib/openaiProductScan';
import type { LanguagePreference } from '@/types/scanAnalysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonWithCors(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers || {}) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      imageDataUrl?: string;
      language?: LanguagePreference;
      mode?: 'document' | 'product';
    };

    if (!body.imageDataUrl) {
      return jsonWithCors({ error: 'imageDataUrl is required' }, { status: 400 });
    }

    const language = body.language ?? 'auto';
    const result =
      body.mode === 'product'
        ? await analyzeProductImage(body.imageDataUrl, language)
        : await analyzeDocumentImage(body.imageDataUrl, language);

    return jsonWithCors({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return jsonWithCors({ error: message }, { status: 500 });
  }
}
