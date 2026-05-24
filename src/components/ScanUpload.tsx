'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { fileToDataUrl, resizeImageDataUrl } from '@/lib/scanHelpers';

const PENDING_KEY = 'scan_pending_image';

export function setPendingScanImage(dataUrl: string) {
  sessionStorage.setItem(PENDING_KEY, dataUrl);
}

export function getPendingScanImage(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PENDING_KEY);
}

export function clearPendingScanImage() {
  sessionStorage.removeItem(PENDING_KEY);
}

export function ScanUpload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const processFile = async (file: File) => {
    setBusy(true);
    try {
      let dataUrl = await fileToDataUrl(file);
      dataUrl = await resizeImageDataUrl(dataUrl);
      setPendingScanImage(dataUrl);
      router.push('/scan-preview');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void processFile(f);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
      >
        {busy ? 'Processing…' : 'Upload or capture'}
      </button>
      <label className="cursor-pointer rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-medium text-teal-800 hover:bg-teal-50">
        Choose file
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && f.type.startsWith('image/')) void processFile(f);
          }}
        />
      </label>
    </div>
  );
}
