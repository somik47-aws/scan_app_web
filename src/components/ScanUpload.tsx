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

export function ScanUpload({ variant = 'hero' }: { variant?: 'hero' | 'compact' }) {
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

  const isHero = variant === 'hero';

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

      <div className={`flex flex-wrap gap-3 ${isHero ? '' : 'justify-center'}`}>
        <button
          type="button"
          disabled={busy}
          onClick={() => setCameraOpen(true)}
          className="btn-primary min-w-[140px]"
        >
          <CameraIcon />
          {busy ? 'Processing…' : 'Capture'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => uploadRef.current?.click()}
          className="btn-secondary min-w-[140px]"
        >
          <UploadIcon />
          Upload
        </button>
      </div>

      {isHero && (
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
          Point your camera at any document or upload from files. AI extracts
          structured text in seconds.
        </p>
      )}
    </>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
