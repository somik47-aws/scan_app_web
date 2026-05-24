import type { LanguagePreference, ScanAnalysisResult } from '@/types/scanAnalysis';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `You are an expert multilingual OCR and document intelligence engine for a document scanner web app.

Tasks:
1. Read ALL visible text in the image.
2. Detect languages using ISO 639-1 codes.
3. Classify documentType.
4. Produce structured output matching the document type.
5. Set confidence 0-1.
6. Add tags and warnings when needed.

Return ONLY valid JSON (no markdown):
{
  "documentType": "passport|national_id|drivers_license|invoice|receipt|business_card|letter|form|contract|medical|other",
  "confidence": number,
  "detectedLanguages": string[],
  "primaryLanguage": string,
  "title": string,
  "tags": string[],
  "summary": string,
  "rawText": string,
  "formattedSections": [{"label": string, "value": string, "highlight"?: boolean}],
  "passport"?: object,
  "invoice"?: object,
  "receipt"?: object,
  "idCard"?: object,
  "warnings"?: string[]
}`;

function buildUserPrompt(languagePreference: LanguagePreference): string {
  const langHint =
    languagePreference === 'auto'
      ? 'Auto-detect all languages.'
      : `Prioritize language "${languagePreference}".`;
  return `${langHint}\nExtract with maximum fidelity. Populate type-specific objects when applicable.`;
}

function parseAnalysisResponse(content: string): ScanAnalysisResult {
  const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned) as ScanAnalysisResult;

  if (!parsed.documentType || !parsed.title) {
    throw new Error('Invalid analysis response from OpenAI.');
  }

  return {
    ...parsed,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    detectedLanguages: parsed.detectedLanguages ?? [],
    tags: parsed.tags ?? [],
    formattedSections: parsed.formattedSections ?? [],
    rawText: parsed.rawText ?? '',
    summary: parsed.summary ?? '',
    primaryLanguage: parsed.primaryLanguage ?? 'en',
  };
}

export async function analyzeDocumentImage(
  base64DataUrl: string,
  languagePreference: LanguagePreference = 'auto'
): Promise<ScanAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key missing. Set OPENAI_API_KEY in .env.local');
  }

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

  return parseAnalysisResponse(content);
}
