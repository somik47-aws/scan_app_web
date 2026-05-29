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
      <div className="animate-fade-up mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-1">Archive</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Library
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelected(new Set());
            }}
            className="btn-secondary !py-2 !text-xs"
          >
            {selectionMode ? 'Cancel' : 'Select'}
          </button>
          {selectionMode && selected.size > 0 && (
            <>
              <button
                type="button"
                onClick={() => setLockOpen(true)}
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Lock ({selected.size})
              </button>
              <button
                type="button"
                onClick={() => setLockOpen(true)}
                className="btn-secondary !py-2 !text-xs"
              >
                Unlock
              </button>
            </>
          )}
        </div>
      </div>

      <input
        type="search"
        placeholder="Search by title or tag…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="input-field mb-6 max-w-md"
      />

      <ul className="glass-card divide-y divide-slate-100 overflow-hidden">
        {filtered.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60"
          >
            {selectionMode && (
              <input
                type="checkbox"
                checked={selected.has(doc.id)}
                onChange={() => toggleSelect(doc.id)}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600"
              />
            )}
            <Link href={`/document/${doc.id}`} className="min-w-0 flex-1 group">
              <p className="truncate font-medium tracking-tight text-slate-900 group-hover:text-cyan-700">
                {doc.title}
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-400">{doc.date}</p>
            </Link>
            {doc.isLocked && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                Locked
              </span>
            )}
            <button
              type="button"
              onClick={() => setExportDoc(doc)}
              className="btn-primary !px-4 !py-2 !text-xs"
            >
              Export
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-5 py-16 text-center text-sm text-slate-500">
            No documents found
          </li>
        )}
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
