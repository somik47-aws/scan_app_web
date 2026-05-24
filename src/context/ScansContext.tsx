'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { DocumentItem } from '@/constants/mockData';
import { RECENT_DOCUMENTS } from '@/constants/mockData';
import type { ScanAnalysisResult } from '@/types/scanAnalysis';
import { countScansThisWeek, createDocumentItem } from '@/lib/scanHelpers';
import { hashDocumentPin, verifyDocumentPin as verifyPin } from '@/lib/pinSecurity';

const STORAGE_KEY = 'scan_app_web/documents';

type ScansContextValue = {
  documents: DocumentItem[];
  isLoading: boolean;
  totalScans: number;
  scansThisWeek: number;
  recentScans: DocumentItem[];
  addScan: (
    uri: string,
    options?: {
      title?: string;
      type?: DocumentItem['type'];
      tag?: string;
      scanAnalysis?: ScanAnalysisResult;
    }
  ) => Promise<DocumentItem>;
  updateDocument: (
    id: string,
    updates: {
      title?: string;
      tag?: string;
      scanAnalysis?: ScanAnalysisResult;
      isLocked?: boolean;
      pinHash?: string | null;
    }
  ) => Promise<DocumentItem | null>;
  lockDocumentsWithPin: (documentIds: string[], pin: string) => Promise<void>;
  removeLockFromDocuments: (documentIds: string[], pin: string) => Promise<boolean>;
  verifyDocumentPin: (documentId: string, pin: string) => Promise<boolean>;
  getDocument: (id: string) => DocumentItem | undefined;
};

const ScansContext = createContext<ScansContextValue | null>(null);

export function ScansProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDocuments(JSON.parse(stored) as DocumentItem[]);
      } else {
        setDocuments(RECENT_DOCUMENTS);
      }
    } catch {
      setDocuments(RECENT_DOCUMENTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistDocuments = useCallback((next: DocumentItem[]) => {
    setDocuments(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota exceeded — keep in memory */
    }
  }, []);

  const addScan = useCallback(
    async (
      uri: string,
      options?: {
        title?: string;
        type?: DocumentItem['type'];
        tag?: string;
        scanAnalysis?: ScanAnalysisResult;
      }
    ) => {
      const draft = createDocumentItem(uri, {
        title: options?.title,
        type: options?.type,
      });
      const item: DocumentItem = {
        ...draft,
        tag: options?.tag ?? options?.scanAnalysis?.tags?.[0],
        scanAnalysis: options?.scanAnalysis,
        pages: options?.scanAnalysis ? 1 : draft.pages,
      };
      const next = [item, ...documents];
      persistDocuments(next);
      return item;
    },
    [documents, persistDocuments]
  );

  const updateDocument = useCallback(
    async (
      id: string,
      updates: {
        title?: string;
        tag?: string;
        scanAnalysis?: ScanAnalysisResult;
        isLocked?: boolean;
        pinHash?: string | null;
      }
    ) => {
      let updated: DocumentItem | null = null;
      const next = documents.map((d) => {
        if (d.id !== id) return d;
        updated = {
          ...d,
          ...updates,
          pinHash: updates.pinHash === null ? undefined : (updates.pinHash ?? d.pinHash),
        };
        return updated;
      });
      if (!updated) return null;
      persistDocuments(next);
      return updated;
    },
    [documents, persistDocuments]
  );

  const lockDocumentsWithPin = useCallback(
    async (documentIds: string[], pin: string) => {
      const hashes = await Promise.all(
        documentIds.map((id) => hashDocumentPin(pin, id))
      );
      const hashById = Object.fromEntries(documentIds.map((id, i) => [id, hashes[i]]));
      const next = documents.map((d) =>
        documentIds.includes(d.id)
          ? { ...d, isLocked: true, pinHash: hashById[d.id] }
          : d
      );
      persistDocuments(next);
    },
    [documents, persistDocuments]
  );

  const removeLockFromDocuments = useCallback(
    async (documentIds: string[], pin: string) => {
      for (const id of documentIds) {
        const doc = documents.find((d) => d.id === id);
        if (!doc?.pinHash) continue;
        const ok = await verifyPin(pin, id, doc.pinHash);
        if (!ok) return false;
      }
      const next = documents.map((d) =>
        documentIds.includes(d.id) ? { ...d, isLocked: false, pinHash: undefined } : d
      );
      persistDocuments(next);
      return true;
    },
    [documents, persistDocuments]
  );

  const verifyDocumentPin = useCallback(
    async (documentId: string, pin: string) => {
      const doc = documents.find((d) => d.id === documentId);
      if (!doc?.pinHash) return true;
      return verifyPin(pin, documentId, doc.pinHash);
    },
    [documents]
  );

  const getDocument = useCallback(
    (id: string) => documents.find((d) => d.id === id),
    [documents]
  );

  const value = useMemo(
    () => ({
      documents,
      isLoading,
      totalScans: documents.length,
      scansThisWeek: countScansThisWeek(documents),
      recentScans: documents.slice(0, 5),
      addScan,
      updateDocument,
      lockDocumentsWithPin,
      removeLockFromDocuments,
      verifyDocumentPin,
      getDocument,
    }),
    [
      documents,
      isLoading,
      addScan,
      updateDocument,
      lockDocumentsWithPin,
      removeLockFromDocuments,
      verifyDocumentPin,
      getDocument,
    ]
  );

  return <ScansContext.Provider value={value}>{children}</ScansContext.Provider>;
}

export function useScans() {
  const ctx = useContext(ScansContext);
  if (!ctx) throw new Error('useScans must be used within ScansProvider');
  return ctx;
}
