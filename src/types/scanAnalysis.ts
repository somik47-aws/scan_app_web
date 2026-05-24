export type DocumentScanType =
  | 'passport'
  | 'national_id'
  | 'drivers_license'
  | 'invoice'
  | 'receipt'
  | 'business_card'
  | 'letter'
  | 'form'
  | 'contract'
  | 'medical'
  | 'other';

export type ScanField = {
  label: string;
  value: string;
  highlight?: boolean;
  language?: string;
};

export type PassportData = {
  documentType?: string;
  countryCode?: string;
  countryName?: string;
  surname?: string;
  givenNames?: string;
  nationality?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  sex?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
  passportNumber?: string;
  issuingAuthority?: string;
  mrzLines?: string[];
};

export type InvoiceData = {
  vendor?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: string;
  tax?: string;
  total?: string;
  lineItems?: { description: string; amount: string }[];
  billTo?: string;
};

export type ReceiptData = {
  merchant?: string;
  date?: string;
  time?: string;
  currency?: string;
  total?: string;
  paymentMethod?: string;
  items?: { name: string; price: string }[];
};

export type IdCardData = {
  fullName?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  nationality?: string;
  address?: string;
};

export type ScanAnalysisResult = {
  documentType: DocumentScanType;
  confidence: number;
  detectedLanguages: string[];
  primaryLanguage: string;
  title: string;
  tags: string[];
  summary: string;
  rawText: string;
  editorHtml?: string;
  formattedSections: ScanField[];
  passport?: PassportData;
  invoice?: InvoiceData;
  receipt?: ReceiptData;
  idCard?: IdCardData;
  warnings?: string[];
};

export type LanguagePreference = 'auto' | string;
