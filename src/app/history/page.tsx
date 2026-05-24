'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { ExportFormatModal } from '@/components/ExportFormatModal';
import { LockModal } from '@/components/LockModal';
import { useScans } from '@/context/ScansContext';
import type { DocumentItem } from '@/constants/mockData';

export default function HistoryPage() {
  const { documents, lockDocumentsWithPin, removeLockFromDocuments } = useScans();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [exportDoc, setExportDoc] = useState<DocumentItem | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.tag?.toLowerCase().includes(q)
    );
  }, [documents, filter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelected(new Set());
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            {selectionMode ? 'Cancel' : 'Select'}
          </button>
          {selectionMode && selected.size > 0 && (
            <>
              <button
                type="button"
                onClick={() => setLockOpen(true)}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white"
              >
                Lock ({selected.size})
              </button>
              <button
                type="button"
                onClick={() => setLockOpen(true)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
              >
                Unlock
              </button>
            </>
          )}
        </div>
      </div>

      <input
        type="search"
        placeholder="Search documents…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
      />

      <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {filtered.map((doc) => (
          <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
            {selectionMode && (
              <input
                type="checkbox"
                checked={selected.has(doc.id)}
                onChange={() => toggleSelect(doc.id)}
              />
            )}
            <Link href={`/document/${doc.id}`} className="min-w-0 flex-1 hover:opacity-80">
              <p className="truncate font-medium">{doc.title}</p>
              <p className="text-sm text-slate-500">{doc.date}</p>
            </Link>
            <button
              type="button"
              onClick={() => setExportDoc(doc)}
              className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Export
            </button>
          </li>
        ))}
      </ul>

      <LockModal
        open={lockOpen}
        title={selected.size ? 'Set or verify PIN' : 'PIN'}
        onClose={() => setLockOpen(false)}
        onSubmit={async (pin) => {
          const ids = [...selected];
          const anyLocked = ids.some((id) => documents.find((d) => d.id === id)?.isLocked);
          if (anyLocked) {
            return removeLockFromDocuments(ids, pin);
          }
          await lockDocumentsWithPin(ids, pin);
          setSelectionMode(false);
          setSelected(new Set());
          return true;
        }}
      />

      <ExportFormatModal
        open={!!exportDoc}
        document={exportDoc}
        onClose={() => setExportDoc(null)}
      />
    </AppShell>
  );
}
