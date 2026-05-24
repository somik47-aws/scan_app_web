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
  const [starting, setStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setStarting(true);
    setError(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser.');
      setStarting(false);
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
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('Camera permission denied. Allow camera access in browser settings and try again.');
      } else if (name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not start camera.');
      }
    } finally {
      setStarting(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setError(null);
      return;
    }
    void startCamera();
    return () => stopCamera();
  }, [open, facingMode, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    const maxWidth = 1600;
    const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const toggleCamera = () => {
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
            stopCamera();
            onClose();
          }}
          className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
        >
          Cancel
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        {starting && (
          <p className="absolute z-10 text-sm text-white/80">Starting camera…</p>
        )}
        {error ? (
          <div className="max-w-sm px-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => void startCamera()}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="max-h-full max-w-full object-contain"
          />
        )}

        {!error && !starting && (
          <div
            className="pointer-events-none absolute inset-8 rounded-lg border-2 border-dashed border-white/40"
            aria-hidden
          />
        )}
      </div>

      {!error && (
        <div className="flex items-center justify-center gap-6 bg-black/90 px-4 py-6 pb-8">
          <button
            type="button"
            onClick={toggleCamera}
            className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Flip
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={starting}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white ring-4 ring-white/30 disabled:opacity-50"
            aria-label="Take photo"
          >
            <span className="block h-12 w-12 rounded-full bg-teal-600" />
          </button>
          <div className="w-[72px]" />
        </div>
      )}
    </div>
  );
}
