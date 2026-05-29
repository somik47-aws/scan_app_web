'use client';

import Link from 'next/link';

import { AppShell } from '@/components/AppShell';
import { ScanMockup } from '@/components/ScanMockup';
import { ScanUpload } from '@/components/ScanUpload';
import { useScans } from '@/context/ScansContext';

export default function DashboardPage() {
  const { totalScans, scansThisWeek, recentScans, isLoading } = useScans();

  return (
    <AppShell>
      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="animate-fade-up">
          <p className="section-label mb-4">Document intelligence</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            Scan anything.
            <span className="block text-cyan-600">Understand everything.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-500">
            Minimal, precise OCR powered by AI. Capture passports, invoices,
            receipts — edit, lock, and export with confidence.
          </p>
          <div className="mt-8">
            <ScanUpload variant="hero" />
          </div>
        </div>

        <div className="animate-fade-up-delay-2 flex justify-center lg:justify-end">
          <ScanMockup />
        </div>
      </section>

      {/* Stats */}
      <section className="mt-20 animate-fade-up-delay-3">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total scans"
            value={isLoading ? '—' : String(totalScans)}
            mono
          />
          <StatCard
            label="This week"
            value={isLoading ? '—' : String(scansThisWeek)}
            mono
          />
          <StatCard
            label="Export"
            value="Secure"
            hint="UPI-verified downloads"
          />
        </div>
      </section>

      {/* Recent */}
      <section className="mt-16">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="section-label mb-1">Library</p>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Recent scans
            </h2>
          </div>
          <Link
            href="/history"
            className="text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-800"
          >
            View all →
          </Link>
        </div>

        <ul className="glass-card divide-y divide-slate-100 overflow-hidden">
          {recentScans.map((doc, i) => (
            <li key={doc.id}>
              <Link
                href={`/document/${doc.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-cyan-50 group-hover:text-cyan-600">
                  <DocIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium tracking-tight text-slate-900">
                    {doc.title}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">
                    {doc.date}
                  </p>
                </div>
                {doc.isLocked ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Locked
                  </span>
                ) : (
                  <span className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-500">
                    →
                  </span>
                )}
              </Link>
            </li>
          ))}
          {!isLoading && recentScans.length === 0 && (
            <li className="px-5 py-16 text-center">
              <p className="text-sm text-slate-500">No scans yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Capture or upload your first document above
              </p>
            </li>
          )}
        </ul>
      </section>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="glass-card p-5 transition-shadow hover:shadow-md">
      <p className="section-label">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight text-slate-900 ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
