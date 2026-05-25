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

  const goToPreview = async (source: string | File) => {
    setBusy(true);
    try {
      let dataUrl =
        typeof source === 'string' ? source : await fileToDataUrl(source);
      dataUrl = await resizeImageDataUrl(dataUrl);
      setPendingScanImage(dataUrl);
      router.push('/scan-preview');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPEG, PNG, etc.).');
      return;
    }
    void goToPreview(file);
  };

  return (
    <>
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(dataUrl) => void goToPreview(dataUrl)}
      />

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleUpload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-3">
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
          className="rounded-xl border-2 border-white/80 bg-teal-700/50 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          Upload
        </button>
      </div>
      <p className="mt-2 text-xs text-teal-100/90">
        Capture uses your device camera. Upload picks a photo from your gallery or files.
      </p>
    </>
  );
}
