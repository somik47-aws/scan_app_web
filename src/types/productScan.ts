export type ProductScanResult = {
  confidence: number;
  summary: string;
  rawText: string;
  title: string;
  tags: string[];
  searchTerms: string[];
  productKeywords: string[];
  detectedProductName?: string;
  detectedBrand?: string;
  detectedBarcode?: string;
  warnings?: string[];
};
