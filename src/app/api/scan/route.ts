import { NextRequest, NextResponse } from 'next/server';

import { analyzeDocumentImage } from '@/lib/openaiScan';
import type { LanguagePreference } from '@/types/scanAnalysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      imageDataUrl?: string;
      language?: LanguagePreference;
    };

    if (!body.imageDataUrl) {
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 });
    }

    const result = await analyzeDocumentImage(
      body.imageDataUrl,
      body.language ?? 'auto'
    );

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
