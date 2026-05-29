'use client';

/** Hero product mockup — document frame with animated scan beam */
export function ScanMockup({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[280px] ${className}`}
      aria-hidden
    >
      {/* Device frame */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-3 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.18)]">
        {/* Status bar */}
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="font-mono text-[10px] font-medium tracking-wider text-slate-400">
            SCAN
          </span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] font-medium text-cyan-600">LIVE</span>
          </span>
        </div>

        {/* Document preview area */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100">
          {/* Fake document lines */}
          <div className="absolute inset-4 space-y-2.5 pt-2">
            <div className="h-2 w-3/4 rounded-full bg-slate-200/90" />
            <div className="h-2 w-full rounded-full bg-slate-200/70" />
            <div className="h-2 w-5/6 rounded-full bg-slate-200/70" />
            <div className="mt-4 h-2 w-1/2 rounded-full bg-slate-200/60" />
            <div className="h-2 w-full rounded-full bg-slate-200/50" />
            <div className="h-2 w-4/5 rounded-full bg-slate-200/50" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="h-8 rounded-lg bg-slate-200/40" />
              <div className="h-8 rounded-lg bg-slate-200/40" />
            </div>
          </div>

          {/* Corner brackets — viewfinder */}
          <div className="pointer-events-none absolute inset-3">
            <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-cyan-500/70 rounded-tl-sm" />
            <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-cyan-500/70 rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-cyan-500/70 rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-cyan-500/70 rounded-br-sm" />
          </div>

          {/* Scan beam */}
          <div className="pointer-events-none absolute inset-x-0 h-px animate-scan-sweep bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]" />

          {/* Scan glow trail */}
          <div className="pointer-events-none absolute inset-x-0 h-16 animate-scan-sweep bg-gradient-to-b from-cyan-400/10 to-transparent" />
        </div>

        {/* Bottom bar */}
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="font-mono text-[10px] text-slate-400">AI · OCR</span>
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 font-mono text-[10px] font-medium text-cyan-700">
            98% match
          </span>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-2 top-8 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Detected
        </p>
        <p className="text-sm font-semibold tracking-tight text-slate-900">Invoice</p>
      </div>
    </div>
  );
}
