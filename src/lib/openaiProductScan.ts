import { requireOpenAiApiKey } from '@/lib/openaiKey';
import type { LanguagePreference } from '@/types/scanAnalysis';
import type { ProductScanResult } from '@/types/productScan';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `You are an expert product recognition engine for an e-commerce store scanner.

Tasks:
1. Read ALL visible text in the image (labels, packaging, receipts, price tags, barcodes as text).
2. Identify product names, brands, SKUs, sizes, colors, and categories.
3. Generate search terms a shopper would use to find matching products in a catalog.
4. Set confidence 0-1.

Return ONLY valid JSON (no markdown):
{
  "confidence": number,
  "summary": string,
  "rawText": string,
  "title": string,
  "tags": string[],
  "searchTerms": string[],
  "productKeywords": string[],
  "detectedProductName": string,
  "detectedBrand": string,
  "detectedBarcode": string,
  "warnings": string[]
}`;

function buildUserPrompt(languagePreference: LanguagePreference): string {
  const langHint =
    languagePreference === 'auto'
      ? 'Auto-detect all languages.'
      : `Prioritize language "${languagePreference}".`;
  return `${langHint}\nExtract product-focused search terms. Prefer specific product names over generic words. Include brand + product type combinations.`;
}

function parseProductResponse(content: string): ProductScanResult {
  const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned) as ProductScanResult;

  return {
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    summary: parsed.summary ?? '',
    rawText: parsed.rawText ?? '',
    title: parsed.title ?? 'Product scan',
    tags: parsed.tags ?? [],
    searchTerms: parsed.searchTerms ?? [],
    productKeywords: parsed.productKeywords ?? [],
    detectedProductName: parsed.detectedProductName,
    detectedBrand: parsed.detectedBrand,
    detectedBarcode: parsed.detectedBarcode,
    warnings: parsed.warnings,
  };
}

export async function analyzeProductImage(
  base64DataUrl: string,
  languagePreference: LanguagePreference = 'auto'
): Promise<ProductScanResult> {
  const apiKey = requireOpenAiApiKey();

  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match?.[1] ?? 'image/jpeg';
  const base64 = match?.[2] ?? base64DataUrl;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: buildUserPrompt(languagePreference) },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid OpenAI API key.');
    }
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No analysis returned from OpenAI.');
  }

  return parseProductResponse(content);
}
