'use client';

import { DOCUMENT_TYPE_META } from '@/constants/documentTypes';
import type { ScanAnalysisResult } from '@/types/scanAnalysis';
import { analysisToEditorHtml } from '@/lib/editorHtml';

type Props = { analysis: ScanAnalysisResult };

export function FormattedScanOutput({ analysis }: Props) {
  const meta = DOCUMENT_TYPE_META[analysis.documentType];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-sm text-slate-500">
          Confidence {Math.round(analysis.confidence * 100)}%
        </span>
        {analysis.detectedLanguages.length > 0 && (
          <span className="text-sm text-slate-500">
            · {analysis.detectedLanguages.join(', ')}
          </span>
        )}
      </div>

      {analysis.summary && (
        <p className="text-sm italic text-slate-600">{analysis.summary}</p>
      )}

      {analysis.warnings?.length ? (
        <ul className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {analysis.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : null}

      <div
        className="prose prose-sm max-w-none rounded-xl border border-slate-100 bg-white p-4"
        dangerouslySetInnerHTML={{ __html: analysisToEditorHtml(analysis) }}
      />
    </div>
  );
}
