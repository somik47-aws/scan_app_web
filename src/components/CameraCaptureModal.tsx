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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80">
            Capture
          </p>
          <h2 className="text-lg font-semibold tracking-tight">Scan document</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm hover:bg-white/10"
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
          <p className="absolute text-sm text-white/70">Starting camera…</p>
        )}
        {error && (
          <div className="absolute inset-x-4 rounded-2xl border border-red-500/30 bg-red-950/90 p-4 text-center text-sm text-red-100">
            {error}
          </div>
        )}
        {ready && (
          <>
            <div
              className="pointer-events-none absolute inset-10 rounded-xl border border-cyan-400/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-10 overflow-hidden rounded-xl" aria-hidden>
              <div className="animate-scan-sweep pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
            </div>
            <div className="pointer-events-none absolute inset-10 rounded-xl border-2 border-dashed border-white/20" aria-hidden />
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 border-t border-white/10 px-4 py-8">
        <button
          type="button"
          onClick={switchCamera}
          disabled={!ready}
          className="rounded-full border border-white/25 px-5 py-2.5 text-sm text-white/90 hover:bg-white/10 disabled:opacity-40"
        >
          Flip
        </button>
        <button
          type="button"
          onClick={handleCapture}
          disabled={!ready}
          className="group relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/95 shadow-[0_0_40px_rgba(34,211,238,0.35)] disabled:opacity-40"
          aria-label="Take photo"
        >
          <span className="h-14 w-14 rounded-full border-[3px] border-slate-900 transition group-hover:scale-95" />
        </button>
      </div>
    </div>
  );
}
