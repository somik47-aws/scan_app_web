import type { DocumentScanType } from '@/types/scanAnalysis';

export const DOCUMENT_TYPE_META: Record<
  DocumentScanType,
  { label: string; color: string; description: string }
> = {
  passport: { label: 'Passport', color: '#1D4ED8', description: 'Travel identity document' },
  national_id: { label: 'National ID', color: '#7C3AED', description: 'Government ID card' },
  drivers_license: { label: "Driver's License", color: '#059669', description: 'Driving permit' },
  invoice: { label: 'Invoice', color: '#D97706', description: 'Billing statement' },
  receipt: { label: 'Receipt', color: '#DC2626', description: 'Purchase receipt' },
  business_card: { label: 'Business Card', color: '#4F46E5', description: 'Contact card' },
  letter: { label: 'Letter', color: '#64748B', description: 'Correspondence' },
  form: { label: 'Form', color: '#0D9488', description: 'Structured form' },
  contract: { label: 'Contract', color: '#334155', description: 'Legal agreement' },
  medical: { label: 'Medical', color: '#E11D48', description: 'Health record' },
  other: { label: 'Document', color: '#475569', description: 'General document' },
};
