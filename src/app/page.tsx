'use client';

import Link from 'next/link';

import { AppShell } from '@/components/AppShell';
import { ScanUpload } from '@/components/ScanUpload';
import { useScans } from '@/context/ScansContext';

export default function DashboardPage() {
  const { totalScans, scansThisWeek, recentScans, isLoading } = useScans();

  return (
    <AppShell>
      <section className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Document Scanner</h1>
        <p className="mt-1 text-teal-100">
          Scan, edit with AI, and export — UPI payment required for downloads.
        </p>
        <div className="mt-6">
          <ScanUpload />
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total scans" value={isLoading ? '…' : String(totalScans)} />
        <StatCard label="This week" value={isLoading ? '…' : String(scansThisWeek)} />
        <StatCard label="Export" value="UPI gated" hint="Pay per document export" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent scans</h2>
          <Link href="/history" className="text-sm font-medium text-teal-700 hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {recentScans.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/document/${doc.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{doc.title}</p>
                  <p className="text-sm text-slate-500">{doc.date}</p>
                </div>
                {doc.isLocked && (
                  <span className="text-xs font-medium text-amber-700">Locked</span>
                )}
              </Link>
            </li>
          ))}
          {!isLoading && recentScans.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No scans yet. Upload a document to get started.
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
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-teal-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
