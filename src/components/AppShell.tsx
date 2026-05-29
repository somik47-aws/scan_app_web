'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/history', label: 'Library' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-full bg-scan-grid">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-slate-400/6 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-white shadow-sm">
              <span className="absolute inset-x-0 h-px animate-scan-sweep bg-cyan-400/80" />
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="relative z-10 text-cyan-300"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M7 8h10M7 12h6" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Scan<span className="text-cyan-600">.</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-sm">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        {children}
      </main>

      <footer className="relative border-t border-slate-200/60 py-8 text-center">
        <p className="font-mono text-xs tracking-wide text-slate-400">
          AI-powered document intelligence
        </p>
      </footer>
    </div>
  );
}
