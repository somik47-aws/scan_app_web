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
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/" className="text-sm text-teal-700 hover:underline">
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Scan preview</h1>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Scan" className="max-h-96 w-full object-contain" />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
            className="mt-4 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing with AI…' : 'Analyze document'}
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {analysis && (
            <div className="mt-6 space-y-4">
              <FormattedScanOutput analysis={analysis} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openEditor}
                  className="rounded-lg border border-teal-200 px-4 py-2 text-sm font-medium text-teal-800"
                >
                  Edit document
                </button>
                <button
                  type="button"
                  onClick={() => void saveDocument()}
                  disabled={saving}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
