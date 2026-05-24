import type { ScanAnalysisResult } from '@/types/scanAnalysis';

export type DocumentItem = {
  id: string;
  title: string;
  date: string;
  pages: number;
  type: 'pdf' | 'image';
  tag?: string;
  /** Data URL or blob URL for scan image */
  uri?: string;
  createdAt?: number;
  scanAnalysis?: ScanAnalysisResult;
  isLocked?: boolean;
  pinHash?: string;
};

export const RECENT_DOCUMENTS: DocumentItem[] = [
  { id: '1', title: 'Invoice — Acme Corp', date: 'Today, 2:14 PM', pages: 2, type: 'pdf', tag: 'Work' },
  { id: '2', title: 'Lease Agreement Draft', date: 'Yesterday', pages: 8, type: 'pdf', tag: 'Personal' },
  { id: '3', title: 'Whiteboard Notes', date: 'May 22, 2026', pages: 1, type: 'image' },
];

export const HISTORY_DOCUMENTS: DocumentItem[] = [
  ...RECENT_DOCUMENTS,
  { id: '4', title: 'Receipt — Coffee Shop', date: 'May 20, 2026', pages: 1, type: 'image', tag: 'Expenses' },
  { id: '5', title: 'Project Proposal v3', date: 'May 18, 2026', pages: 12, type: 'pdf', tag: 'Work' },
  { id: '6', title: 'ID Card Scan', date: 'May 15, 2026', pages: 1, type: 'image' },
  { id: '7', title: 'Meeting Notes — Q2', date: 'May 12, 2026', pages: 4, type: 'pdf', tag: 'Work' },
];
