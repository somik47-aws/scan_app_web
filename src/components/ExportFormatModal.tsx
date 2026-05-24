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
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
        <div className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Export document</h2>
              <p className="text-sm text-slate-500">{document.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          {!hasValidExportAuth(document.id) && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              UPI payment required before download. You will be prompted when you choose a format.
            </p>
          )}

          {hasValidExportAuth(document.id) && (
            <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
              Export unlocked for 30 minutes (this session).
            </p>
          )}

          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {EXPORT_FORMATS.map((fmt) => (
              <li key={fmt.id}>
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => handleSelect(fmt.id)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-teal-300 hover:bg-teal-50/50 disabled:opacity-50"
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
