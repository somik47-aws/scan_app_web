'use client';

import { DOCUMENT_TYPE_META } from '@/constants/documentTypes';
import type { ScanAnalysisResult } from '@/types/scanAnalysis';
import { analysisToEditorHtml } from '@/lib/editorHtml';

type Props = { analysis: ScanAnalysisResult };

export function FormattedScanOutput({ analysis }: Props) {
  const meta = DOCUMENT_TYPE_META[analysis.documentType];

  return (
    <div className="glass-card space-y-5 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </span>
        <span className="font-mono text-xs text-slate-400">
          {Math.round(analysis.confidence * 100)}% confidence
        </span>
        {analysis.detectedLanguages.length > 0 && (
          <span className="font-mono text-xs text-slate-400">
            · {analysis.detectedLanguages.join(', ')}
          </span>
        )}
      </div>

      {analysis.summary && (
        <p className="text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
      )}

      {analysis.warnings?.length ? (
        <ul className="space-y-1 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          {analysis.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      ) : null}

      <div
        className="prose-scan rounded-xl border border-slate-100 bg-slate-50/50 p-5"
        dangerouslySetInnerHTML={{ __html: analysisToEditorHtml(analysis) }}
      />
    </div>
  );
}
