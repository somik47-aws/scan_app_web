import { v4 as uuidv4 } from 'uuid';

import type { DocumentItem } from '@/constants/mockData';

export function formatScanDate(date: Date = new Date()): string {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function createDocumentItem(
  uri: string,
  options?: { title?: string; type?: DocumentItem['type'] }
): DocumentItem {
  const now = Date.now();
  return {
    id: uuidv4(),
    title: options?.title ?? 'New scan',
    date: formatScanDate(new Date(now)),
    pages: 1,
    type: options?.type ?? 'image',
    uri,
    createdAt: now,
  };
}

export function countScansThisWeek(documents: DocumentItem[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return documents.filter((d) => (d.createdAt ?? 0) >= weekAgo).length;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function resizeImageDataUrl(dataUrl: string, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}
