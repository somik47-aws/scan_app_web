'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { FormattedScanOutput } from '@/components/FormattedScanOutput';
import { clearPendingScanImage, getPendingScanImage } from '@/components/ScanUpload';
import { useScans } from '@/context/ScansContext';
import { cloneAnalysis } from '@/lib/editorHtml';
import type { ScanAnalysisResult } from '@/types/scanAnalysis';

export default function ScanPreviewPage() {
  const router = useRouter();
  const { addScan } = useScans();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ScanAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('auto');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const img = getPendingScanImage();
    if (!img) {
      router.replace('/');
      return;
    }
    setImage(img);
    const draftRaw = sessionStorage.getItem('scan_editor_draft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as { analysis: ScanAnalysisResult };
        setAnalysis(draft.analysis);
      } catch {
        /* ignore */
      }
    }
  }, [router]);

  const runAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: image, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setAnalysis(data.result as ScanAnalysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!image || !analysis) return;
    setSaving(true);
    try {
      const item = await addScan(image, {
        title: analysis.title,
        scanAnalysis: cloneAnalysis(analysis),
        tag: analysis.tags[0],
      });
      clearPendingScanImage();
      sessionStorage.removeItem('scan_editor_draft');
      router.push(`/document/${item.id}`);
    } finally {
      setSaving(false);
    }
  };

  const openEditor = () => {
    if (!analysis || !image) return;
    sessionStorage.setItem('scan_editor_draft', JSON.stringify({ analysis, image }));
    router.push('/editor?mode=preview');
  };

  if (!image) {
    return (
      <AppShell>
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          Loading scan…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-cyan-700"
      >
        ← Back
      </Link>

      <div className="mt-4 animate-fade-up">
        <p className="section-label mb-1">Preview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Scan analysis
        </h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Image with scan overlay */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="absolute left-4 top-4 z-10 rounded-full bg-slate-900/80 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-cyan-300 backdrop-blur-sm">
            Source
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Scan" className="max-h-[480px] w-full object-contain p-4" />
            {loading && (
              <>
                <div className="pointer-events-none absolute inset-x-8 h-px animate-scan-sweep bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_16px_2px_rgba(34,211,238,0.5)]" />
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                  <span className="rounded-full bg-slate-900 px-4 py-2 font-mono text-xs text-white">
                    Scanning…
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="animate-fade-up-delay-1">
          <label className="section-label mb-2 block">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input-field"
          >
            <option value="auto">Auto-detect</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ar">Arabic</option>
            <option value="zh">Chinese</option>
          </select>

          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={loading}
            className="btn-primary mt-5 w-full"
          >
            {loading ? 'Analyzing with AI…' : 'Run AI analysis'}
          </button>

          {error && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {analysis && (
            <div className="mt-8 space-y-6">
              <FormattedScanOutput analysis={analysis} />
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={openEditor} className="btn-secondary">
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void saveDocument()}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving…' : 'Save to library'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
