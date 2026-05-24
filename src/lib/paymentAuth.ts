const STORAGE_PREFIX = 'scan_export_auth_';

export type ExportAuthRecord = {
  token: string;
  documentId: string;
  orderId: string;
  expiresAt: number;
};

export function getExportAuth(documentId: string): ExportAuthRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${documentId}`);
    if (!raw) return null;
    const record = JSON.parse(raw) as ExportAuthRecord;
    if (record.expiresAt < Date.now()) {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${documentId}`);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function setExportAuth(record: ExportAuthRecord): void {
  sessionStorage.setItem(`${STORAGE_PREFIX}${record.documentId}`, JSON.stringify(record));
}

export function clearExportAuth(documentId: string): void {
  sessionStorage.removeItem(`${STORAGE_PREFIX}${documentId}`);
}

export function hasValidExportAuth(documentId: string): boolean {
  return getExportAuth(documentId) !== null;
}
