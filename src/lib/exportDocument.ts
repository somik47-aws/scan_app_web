'use client';

import { Document, Packer, Paragraph, TextRun } from 'docx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import type { DocumentItem } from '@/constants/mockData';
import type { ExportFormatId } from '@/types/export';
import { hasValidExportAuth } from '@/lib/paymentAuth';
import {
  analysisToDocxParagraphs,
  buildCsvExport,
  buildFullExportHtml,
  buildJsonExport,
  buildMarkdown,
  buildPlainText,
  buildWordDocHtml,
  sanitizeFileName,
} from '@/lib/exportContent';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(content: string, filename: string, mimeType: string): void {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

function fileName(document: DocumentItem, ext: string): string {
  return `${sanitizeFileName(document.title)}_${document.id.slice(0, 8)}.${ext}`;
}

export class ExportPaymentRequiredError extends Error {
  constructor() {
    super('UPI payment required before export.');
    this.name = 'ExportPaymentRequiredError';
  }
}

export function assertExportAuthorized(documentId: string): void {
  if (!hasValidExportAuth(documentId)) {
    throw new ExportPaymentRequiredError();
  }
}

async function exportPdf(doc: DocumentItem): Promise<void> {
  const html = buildFullExportHtml(doc);
  const container = window.document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.background = '#fff';
  window.document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 20;

    pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 20;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName(doc, 'pdf'));
  } finally {
    window.document.body.removeChild(container);
  }
}

async function exportDocx(document: DocumentItem): Promise<void> {
  const analysis = document.scanAnalysis;
  if (!analysis) {
    downloadText(buildWordDocHtml(document), fileName(document, 'doc'), 'application/msword');
    return;
  }

  const paragraphs = analysisToDocxParagraphs(analysis).map(
    (item) =>
      new Paragraph({
        children: [
          new TextRun({
            text: item.text,
            bold: item.bold || item.heading,
            size: item.heading ? 32 : 24,
          }),
        ],
        spacing: { after: 120 },
      })
  );

  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, fileName(document, 'docx'));
}

async function exportScanImage(doc: DocumentItem, format: 'jpg' | 'png'): Promise<void> {
  if (!doc.uri) {
    throw new Error('No scan image available.');
  }
  const canvas = window.document.createElement('canvas');
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(
        (b) => {
          if (b) downloadBlob(b, fileName(doc, format));
          resolve();
        },
        format === 'png' ? 'image/png' : 'image/jpeg',
        0.92
      );
    };
    img.onerror = reject;
    img.src = doc.uri!;
  });
}

export async function exportDocument(
  document: DocumentItem,
  format: ExportFormatId
): Promise<void> {
  assertExportAuthorized(document.id);

  switch (format) {
    case 'pdf':
      await exportPdf(document);
      break;
    case 'html':
      downloadText(buildFullExportHtml(document), fileName(document, 'html'), 'text/html');
      break;
    case 'doc':
      downloadText(buildWordDocHtml(document), fileName(document, 'doc'), 'application/msword');
      break;
    case 'docx':
      await exportDocx(document);
      break;
    case 'txt':
      downloadText(buildPlainText(document), fileName(document, 'txt'), 'text/plain');
      break;
    case 'md':
      downloadText(buildMarkdown(document), fileName(document, 'md'), 'text/markdown');
      break;
    case 'json':
      downloadText(buildJsonExport(document), fileName(document, 'json'), 'application/json');
      break;
    case 'csv': {
      const csv = buildCsvExport(document);
      if (!csv) throw new Error('No tabular data for CSV export.');
      downloadText(csv, fileName(document, 'csv'), 'text/csv');
      break;
    }
    case 'jpg':
    case 'png':
      await exportScanImage(document, format);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
