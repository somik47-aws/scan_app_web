'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { CameraCaptureModal } from '@/components/CameraCaptureModal';
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
  const uploadRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const goToPreview = async (dataUrl: string) => {
    setBusy(true);
    try {
      const resized = await resizeImageDataUrl(dataUrl);
      setPendingScanImage(resized);
      router.push('/scan-preview');
    } finally {
      setBusy(false);
    }
  };

  const processUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    await goToPreview(dataUrl);
  };

  return (
    <>
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(dataUrl) => void goToPreview(dataUrl)}
      />

      <div className="flex flex-wrap gap-3">
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void processUpload(f);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          disabled={busy}
          onClick={() => setCameraOpen(true)}
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-sm hover:bg-teal-50 disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Capture'}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => uploadRef.current?.click()}
          className="rounded-xl border-2 border-white/80 bg-transparent px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
        >
          Upload
        </button>
      </div>

      <p className="mt-3 text-xs text-teal-100/90">
        Capture uses your device camera. Upload picks an image from your gallery or files.
      </p>
    </>
  );
}
