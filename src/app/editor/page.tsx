'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { useScans } from '@/context/ScansContext';
import { analysisToEditorHtml, htmlToPlainText } from '@/lib/editorHtml';
import type { ScanAnalysisResult } from '@/types/scanAnalysis';

function EditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const docId = params.get('id');
  const mode = params.get('mode');
  const { getDocument, updateDocument } = useScans();

  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [analysis, setAnalysis] = useState<ScanAnalysisResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (docId) {
      const doc = getDocument(docId);
      if (!doc?.scanAnalysis) {
        router.replace(`/document/${docId}`);
        return;
      }
      setAnalysis(doc.scanAnalysis);
      setTitle(doc.title);
      setHtml(analysisToEditorHtml(doc.scanAnalysis));
      setImage(doc.uri ?? null);
      return;
    }

    if (mode === 'preview') {
      const raw = sessionStorage.getItem('scan_editor_draft');
      if (!raw) {
        router.replace('/');
        return;
      }
      const draft = JSON.parse(raw) as { analysis: ScanAnalysisResult; image: string };
      setAnalysis(draft.analysis);
      setTitle(draft.analysis.title);
      const body = analysisToEditorHtml(draft.analysis);
      setHtml(body);
      setImage(draft.image);
      requestAnimationFrame(() => {
        if (editorRef.current) editorRef.current.innerHTML = body;
      });
    }
  }, [docId, mode, getDocument, router]);

  useEffect(() => {
    if (editorRef.current && html && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
  }, [analysis]);

  const save = async () => {
    if (!analysis) return;
    const updated: ScanAnalysisResult = {
      ...analysis,
      title,
      editorHtml: html,
      rawText: htmlToPlainText(html),
    };

    setSaving(true);
    try {
      if (docId) {
        await updateDocument(docId, { title, scanAnalysis: updated });
        router.push(`/document/${docId}`);
      } else {
        sessionStorage.setItem(
          'scan_editor_draft',
          JSON.stringify({ analysis: updated, image })
        );
        router.push('/scan-preview');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!analysis) {
    return <p className="text-slate-500">Loading editor…</p>;
  }

  return (
    <div className="animate-fade-up">
      <Link
        href={docId ? `/document/${docId}` : '/scan-preview'}
        className="inline-flex text-sm font-medium text-slate-500 hover:text-cyan-700"
      >
        ← Back
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-1">Editor</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Refine document</h1>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input-field mt-6 text-lg font-medium"
        placeholder="Document title"
      />

      <div
        ref={editorRef}
        className="prose prose-sm mt-4 min-h-[360px] max-w-none rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setHtml(e.currentTarget.innerHTML)}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <EditorContent />
      </Suspense>
    </AppShell>
  );
}
