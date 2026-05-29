'use client';

import { useState } from 'react';

import type { DocumentItem } from '@/constants/mockData';
import { UpiPaymentModal } from '@/components/UpiPaymentModal';
import { exportDocument, ExportPaymentRequiredError } from '@/lib/exportDocument';
import { hasValidExportAuth } from '@/lib/paymentAuth';
import { EXPORT_FORMATS, type ExportFormatId } from '@/types/export';

type Props = {
  open: boolean;
  document: DocumentItem | null;
  onClose: () => void;
};

export function ExportFormatModal({ open, document, onClose }: Props) {
  const [payOpen, setPayOpen] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<ExportFormatId | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !document) return null;

  const runExport = async (format: ExportFormatId) => {
    setExporting(true);
    setError(null);
    try {
      await exportDocument(document, format);
      onClose();
    } catch (e) {
      if (e instanceof ExportPaymentRequiredError) {
        setPendingFormat(format);
        setPayOpen(true);
      } else {
        setError(e instanceof Error ? e.message : 'Export failed');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleSelect = (format: ExportFormatId) => {
    if (!hasValidExportAuth(document.id)) {
      setPendingFormat(format);
      setPayOpen(true);
      return;
    }
    void runExport(format);
  };

  return (
    <>
      <UpiPaymentModal
        open={payOpen}
        documentId={document.id}
        documentTitle={document.title}
        onClose={() => setPayOpen(false)}
        onSuccess={() => {
          if (pendingFormat) void runExport(pendingFormat);
        }}
      />
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
        <div className="max-h-[85vh] w-full max-w-lg overflow-auto animate-fade-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="section-label mb-1">Export</p>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Choose format</h2>
              <p className="text-sm text-slate-500">{document.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {!hasValidExportAuth(document.id) && (
            <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900">
              UPI payment required before download.
            </p>
          )}

          {hasValidExportAuth(document.id) && (
            <p className="mt-4 rounded-xl border border-cyan-200/80 bg-cyan-50/80 px-3 py-2.5 text-sm text-cyan-900">
              Export unlocked for 30 minutes.
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {EXPORT_FORMATS.map((fmt) => (
              <li key={fmt.id}>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => handleSelect(fmt.id)}
                  className="glass-card w-full px-4 py-3.5 text-left transition hover:border-cyan-300/60 hover:shadow-md disabled:opacity-50"
                >
                  <span className="font-medium text-slate-900">{fmt.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{fmt.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
