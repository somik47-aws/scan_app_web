'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const SessionUnlockContext = createContext<{
  unlockedIds: Set<string>;
  unlock: (id: string) => void;
  isUnlocked: (id: string) => boolean;
  lockSession: (id: string) => void;
} | null>(null);

export function SessionUnlockProvider({ children }: { children: ReactNode }) {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  const unlock = useCallback((id: string) => {
    setUnlockedIds((prev) => new Set(prev).add(id));
  }, []);

  const lockSession = useCallback((id: string) => {
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isUnlocked = useCallback((id: string) => unlockedIds.has(id), [unlockedIds]);

  const value = useMemo(
    () => ({ unlockedIds, unlock, isUnlocked, lockSession }),
    [unlockedIds, unlock, isUnlocked, lockSession]
  );

  return (
    <SessionUnlockContext.Provider value={value}>{children}</SessionUnlockContext.Provider>
  );
}

export function useSessionUnlock() {
  const ctx = useContext(SessionUnlockContext);
  if (!ctx) throw new Error('useSessionUnlock must be used within SessionUnlockProvider');
  return ctx;
}
