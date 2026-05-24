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
        <p>Document not found.</p>
        <Link href="/history" className="text-teal-700">
          Back to history
        </Link>
      </AppShell>
    );
  }

  const locked = doc.isLocked && !isUnlocked(doc.id);

  if (locked) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-2 text-xl font-semibold">{doc.title}</h1>
          <p className="mt-2 text-sm text-amber-900">This document is PIN-protected.</p>
          <button
            type="button"
            onClick={() => setUnlockOpen(true)}
            className="mt-4 rounded-lg bg-teal-600 px-6 py-2 text-white"
          >
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
      <Link href="/history" className="text-sm text-teal-700 hover:underline">
        ← History
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <p className="text-sm text-slate-500">{doc.date}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/editor?id=${doc.id}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white"
          >
            Export / Download
          </button>
        </div>
      </div>

      {doc.uri && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={doc.uri} alt="" className="max-h-80 w-full object-contain bg-slate-100" />
        </div>
      )}

      {doc.scanAnalysis ? (
        <div className="mt-6">
          <FormattedScanOutput analysis={doc.scanAnalysis} />
        </div>
      ) : (
        <p className="mt-6 text-slate-500">No AI analysis on this document.</p>
      )}

      <ExportFormatModal open={exportOpen} document={doc} onClose={() => setExportOpen(false)} />
    </AppShell>
  );
}
