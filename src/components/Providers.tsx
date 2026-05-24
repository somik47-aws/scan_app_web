'use client';

import type { ReactNode } from 'react';

import { ScansProvider } from '@/context/ScansContext';
import { SessionUnlockProvider } from '@/context/SessionUnlockContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ScansProvider>
      <SessionUnlockProvider>{children}</SessionUnlockProvider>
    </ScansProvider>
  );
}
