import type { DocumentItem } from '@/constants/mockData';
import { DOCUMENT_TYPE_META } from '@/constants/documentTypes';
import type { ScanAnalysisResult } from '@/types/scanAnalysis';
import { analysisToEditorHtml, htmlToPlainText } from '@/lib/editorHtml';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizeFileName(title: string): string {
  return (
    title
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 80) || 'document'
  );
}

export function buildFullExportHtml(document: DocumentItem): string {
  const analysis = document.scanAnalysis;
  const body = analysis ? analysisToEditorHtml(analysis) : '<p>No content</p>';
  const meta = analysis ? DOCUMENT_TYPE_META[analysis.documentType] : null;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(document.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 40px 32px; }
    h1 { font-size: 24px; color: #0f766e; margin-bottom: 8px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
    .tag { display: inline-block; background: #ccfbf1; color: #0f766e; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(document.title)}</h1>
  <div class="meta">
    <div>${escapeHtml(document.date)}</div>
    ${meta ? `<div style="margin-top:8px"><span class="tag">${escapeHtml(meta.label)}</span></div>` : ''}
  </div>
  ${body}
</body>
</html>`;
}

export function buildWordDocHtml(document: DocumentItem): string {
  const html = buildFullExportHtml(document);
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(document.title)}</title></head>
<body>${html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html}</body></html>`;
}

export function buildPlainText(document: DocumentItem): string {
  const analysis = document.scanAnalysis;
  if (!analysis) {
    return `${document.title}\n${document.date}\n`;
  }

  const lines: string[] = [
    document.title,
    '='.repeat(Math.min(document.title.length, 40)),
    '',
    `Date: ${document.date}`,
    `Type: ${DOCUMENT_TYPE_META[analysis.documentType].label}`,
    `Languages: ${analysis.detectedLanguages.join(', ')}`,
    '',
    analysis.summary ? `Summary:\n${analysis.summary}\n` : '',
    '---',
    '',
    htmlToPlainText(analysisToEditorHtml(analysis)),
  ];

  return lines.filter(Boolean).join('\n');
}

export function buildMarkdown(document: DocumentItem): string {
  const analysis = document.scanAnalysis;
  if (!analysis) {
    return `# ${document.title}\n\n_${document.date}_\n`;
  }

  const parts: string[] = [
    `# ${document.title}`,
    '',
    `> ${document.date} · ${DOCUMENT_TYPE_META[analysis.documentType].label}`,
    '',
  ];

  if (analysis.summary) {
    parts.push(analysis.summary, '');
  }

  for (const section of analysis.formattedSections) {
    parts.push(`**${section.label}:** ${section.value}`, '');
  }

  if (analysis.rawText) {
    parts.push('## Full text', '', analysis.rawText);
  }

  return parts.join('\n');
}

export function buildJsonExport(document: DocumentItem): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), document }, null, 2);
}

export function buildCsvExport(document: DocumentItem): string | null {
  const analysis = document.scanAnalysis;
  if (!analysis) return null;

  const rows: string[][] = [['Field', 'Value']];
  const add = (field: string, value?: string) => {
    if (value) rows.push([field, value.replace(/"/g, '""')]);
  };

  add('Title', document.title);
  add('Date', document.date);
  add('Type', DOCUMENT_TYPE_META[analysis.documentType].label);
  analysis.formattedSections.forEach((s) => add(s.label, s.value));

  if (rows.length <= 1) return null;
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

export function analysisToDocxParagraphs(
  analysis: ScanAnalysisResult
): { text: string; bold?: boolean; heading?: boolean }[] {
  const items: { text: string; bold?: boolean; heading?: boolean }[] = [
    { text: analysis.title, heading: true },
    { text: DOCUMENT_TYPE_META[analysis.documentType].label },
  ];

  if (analysis.summary) items.push({ text: analysis.summary });

  for (const section of analysis.formattedSections) {
    items.push({ text: `${section.label}: ${section.value}`, bold: section.highlight });
  }

  return items;
}
