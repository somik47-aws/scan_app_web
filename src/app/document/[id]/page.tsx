'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { ExportFormatModal } from '@/components/ExportFormatModal';
import { FormattedScanOutput } from '@/components/FormattedScanOutput';
import { LockModal } from '@/components/LockModal';
import { useScans } from '@/context/ScansContext';
import { useSessionUnlock } from '@/context/SessionUnlockContext';

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { getDocument, verifyDocumentPin } = useScans();
  const { isUnlocked, unlock } = useSessionUnlock();
  const doc = getDocument(id);

  const [exportOpen, setExportOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  if (!doc) {
    return (
      <AppShell>
        <p className="text-slate-500">Document not found.</p>
        <Link href="/history" className="mt-2 inline-block text-sm text-cyan-700">
          ← Library
        </Link>
      </AppShell>
    );
  }

  const locked = doc.isLocked && !isUnlocked(doc.id);

  if (locked) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md animate-fade-up glass-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
            🔒
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">{doc.title}</h1>
          <p className="mt-2 text-sm text-slate-500">PIN-protected document</p>
          <button type="button" onClick={() => setUnlockOpen(true)} className="btn-primary mt-6">
            Unlock
          </button>
        </div>
        <LockModal
          open={unlockOpen}
          title="Enter PIN"
          onClose={() => setUnlockOpen(false)}
          onSubmit={async (pin) => {
            const ok = await verifyDocumentPin(doc.id, pin);
            if (ok) unlock(doc.id);
            return ok;
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        href="/history"
        className="inline-flex text-sm font-medium text-slate-500 hover:text-cyan-700"
      >
        ← Library
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4 animate-fade-up">
        <div>
          <p className="section-label mb-1">Document</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{doc.title}</h1>
          <p className="mt-1 font-mono text-xs text-slate-400">{doc.date}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/editor?id=${doc.id}`} className="btn-secondary">
            Edit
          </Link>
          <button type="button" onClick={() => setExportOpen(true)} className="btn-primary">
            Export
          </button>
        </div>
      </div>

      {doc.uri && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={doc.uri} alt="" className="max-h-96 w-full object-contain bg-slate-50 p-4" />
        </div>
      )}

      {doc.scanAnalysis ? (
        <div className="mt-8">
          <FormattedScanOutput analysis={doc.scanAnalysis} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-slate-500">No AI analysis on this document.</p>
      )}

      <ExportFormatModal open={exportOpen} document={doc} onClose={() => setExportOpen(false)} />
    </AppShell>
  );
}
