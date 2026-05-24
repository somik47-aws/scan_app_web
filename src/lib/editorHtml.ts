import type { ScanAnalysisResult, ScanField } from '@/types/scanAnalysis';
import { DOCUMENT_TYPE_META } from '@/constants/documentTypes';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fieldToHtml(label: string, value: string, highlight?: boolean): string {
  const style = highlight ? 'font-weight:bold;color:#0F766E;' : '';
  return `<p><strong>${escapeHtml(label)}</strong><br/><span style="${style}">${escapeHtml(value)}</span></p>`;
}

function buildPassportHtml(analysis: ScanAnalysisResult): string {
  const p = analysis.passport;
  if (!p) return '';
  const parts: string[] = [`<h2>${escapeHtml(DOCUMENT_TYPE_META.passport.label)}</h2>`];
  const entries: [string, string | undefined][] = [
    ['Country', p.countryName ?? p.countryCode],
    ['Surname', p.surname],
    ['Given names', p.givenNames],
    ['Nationality', p.nationality],
    ['Date of birth', p.dateOfBirth],
    ['Place of birth', p.placeOfBirth],
    ['Sex', p.sex],
    ['Passport number', p.passportNumber],
    ['Date of issue', p.dateOfIssue],
    ['Date of expiry', p.dateOfExpiry],
    ['Issuing authority', p.issuingAuthority],
  ];
  for (const [label, value] of entries) {
    if (value) parts.push(fieldToHtml(label, value, label === 'Passport number'));
  }
  if (p.mrzLines?.length) {
    parts.push(`<p><strong>MRZ</strong></p><pre>${escapeHtml(p.mrzLines.join('\n'))}</pre>`);
  }
  return parts.join('');
}

function buildInvoiceHtml(analysis: ScanAnalysisResult): string {
  const inv = analysis.invoice;
  if (!inv) return '';
  const parts: string[] = [`<h2>Invoice</h2>`];
  if (inv.vendor) parts.push(fieldToHtml('Vendor', inv.vendor, true));
  if (inv.invoiceNumber) parts.push(fieldToHtml('Invoice #', inv.invoiceNumber));
  if (inv.invoiceDate) parts.push(fieldToHtml('Date', inv.invoiceDate));
  if (inv.billTo) parts.push(fieldToHtml('Bill to', inv.billTo));
  if (inv.lineItems?.length) {
    parts.push('<ul>');
    inv.lineItems.forEach((li) => {
      parts.push(`<li>${escapeHtml(li.description)} — <strong>${escapeHtml(li.amount)}</strong></li>`);
    });
    parts.push('</ul>');
  }
  if (inv.total) {
    parts.push(`<p><strong>Total:</strong> ${escapeHtml(inv.currency ?? '')} ${escapeHtml(inv.total)}</p>`);
  }
  return parts.join('');
}

function buildReceiptHtml(analysis: ScanAnalysisResult): string {
  const r = analysis.receipt;
  if (!r) return '';
  const parts: string[] = [`<h2 style="text-align:center">Receipt</h2>`];
  if (r.merchant) parts.push(`<h3 style="text-align:center">${escapeHtml(r.merchant)}</h3>`);
  if (r.date || r.time) parts.push(`<p style="text-align:center">${escapeHtml([r.date, r.time].filter(Boolean).join(' · '))}</p>`);
  if (r.items?.length) {
    parts.push('<ul>');
    r.items.forEach((item) => {
      parts.push(`<li>${escapeHtml(item.name)} — ${escapeHtml(item.price)}</li>`);
    });
    parts.push('</ul>');
  }
  if (r.total) parts.push(`<p><strong>Total:</strong> ${escapeHtml(r.currency ?? '')} ${escapeHtml(r.total)}</p>`);
  return parts.join('');
}

function buildIdHtml(analysis: ScanAnalysisResult): string {
  const id = analysis.idCard;
  if (!id) return '';
  const parts: string[] = [`<h2>${escapeHtml(DOCUMENT_TYPE_META[analysis.documentType].label)}</h2>`];
  if (id.fullName) parts.push(`<h3>${escapeHtml(id.fullName)}</h3>`);
  const entries: [string, string | undefined][] = [
    ['Document number', id.documentNumber],
    ['Date of birth', id.dateOfBirth],
    ['Expiry', id.expiryDate],
    ['Nationality', id.nationality],
    ['Address', id.address],
  ];
  for (const [label, value] of entries) {
    if (value) parts.push(fieldToHtml(label, value));
  }
  return parts.join('');
}

function sectionsToHtml(sections: ScanField[]): string {
  return sections.map((s) => fieldToHtml(s.label, s.value, s.highlight)).join('');
}

export function analysisToEditorHtml(analysis: ScanAnalysisResult): string {
  if (analysis.editorHtml?.trim()) {
    return analysis.editorHtml;
  }

  const parts: string[] = [];

  if (analysis.summary) {
    parts.push(`<p><em>${escapeHtml(analysis.summary)}</em></p>`);
  }

  switch (analysis.documentType) {
    case 'passport':
      parts.push(buildPassportHtml(analysis));
      break;
    case 'invoice':
      parts.push(buildInvoiceHtml(analysis));
      break;
    case 'receipt':
      parts.push(buildReceiptHtml(analysis));
      break;
    case 'national_id':
    case 'drivers_license':
      parts.push(buildIdHtml(analysis));
      break;
    default:
      break;
  }

  if (analysis.formattedSections.length > 0) {
    parts.push(sectionsToHtml(analysis.formattedSections));
  }

  if (analysis.rawText && parts.length === 0) {
    const paragraphs = analysis.rawText.split(/\n\n+/).map((p) => `<p>${escapeHtml(p.trim())}</p>`);
    parts.push(paragraphs.join(''));
  }

  return parts.join('') || '<p></p>';
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cloneAnalysis(analysis: ScanAnalysisResult): ScanAnalysisResult {
  return JSON.parse(JSON.stringify(analysis)) as ScanAnalysisResult;
}
