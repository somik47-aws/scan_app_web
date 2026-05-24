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
    <>
      <Link
        href={docId ? `/document/${docId}` : '/scan-preview'}
        className="text-sm text-teal-700 hover:underline"
      >
        ← Back
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Document editor</h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 font-medium"
      />

      <div
        ref={editorRef}
        className="prose prose-sm mt-4 min-h-[320px] max-w-none rounded-xl border border-slate-200 bg-white p-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => setHtml(e.currentTarget.innerHTML)}
      />

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="mt-4 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </>
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
