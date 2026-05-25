'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
};

export function CameraCaptureModal({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setError(null);
      setReady(false);
      stopStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setReady(true);
        }
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access in browser settings.'
            : err instanceof DOMException && err.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : 'Could not start camera. Use HTTPS or localhost and allow camera access.';
        setError(msg);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facingMode, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !ready || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.9));
    stopStream();
    onClose();
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <h2 className="text-lg font-semibold">Capture document</h2>
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="rounded-lg px-3 py-1 text-sm hover:bg-white/10"
        >
          Cancel
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="max-h-full max-w-full object-contain"
        />
        {!ready && !error && (
          <p className="absolute text-sm text-white/80">Starting camera…</p>
        )}
        {error && (
          <div className="absolute inset-x-4 rounded-xl bg-red-950/90 p-4 text-center text-sm text-red-100">
            {error}
          </div>
        )}
        {ready && (
          <div
            className="pointer-events-none absolute inset-8 rounded-lg border-2 border-dashed border-white/40"
            aria-hidden
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-white/10 px-4 py-6">
        <button
          type="button"
          onClick={switchCamera}
          disabled={!ready}
          className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-40"
        >
          Flip camera
        </button>
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg disabled:opacity-40"
          aria-label="Take photo"
        >
          <span className="h-12 w-12 rounded-full border-4 border-teal-600" />
        </button>
      </div>
    </div>
  );
}
