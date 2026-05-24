export type ExportFormatId =
  | 'pdf'
  | 'jpg'
  | 'png'
  | 'html'
  | 'doc'
  | 'docx'
  | 'txt'
  | 'md'
  | 'json'
  | 'csv';

export type ExportFormatOption = {
  id: ExportFormatId;
  label: string;
  extension: string;
  mimeType: string;
  description: string;
  category: 'document' | 'image' | 'data';
};

export const EXPORT_FORMATS: ExportFormatOption[] = [
  { id: 'pdf', label: 'PDF', extension: 'pdf', mimeType: 'application/pdf', description: 'Print-ready document', category: 'document' },
  { id: 'docx', label: 'Word (DOCX)', extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Microsoft Word format', category: 'document' },
  { id: 'doc', label: 'Word (DOC)', extension: 'doc', mimeType: 'application/msword', description: 'Legacy Word-compatible HTML', category: 'document' },
  { id: 'html', label: 'HTML', extension: 'html', mimeType: 'text/html', description: 'Web page format', category: 'document' },
  { id: 'txt', label: 'Plain Text', extension: 'txt', mimeType: 'text/plain', description: 'Simple text file', category: 'document' },
  { id: 'md', label: 'Markdown', extension: 'md', mimeType: 'text/markdown', description: 'Markdown notes', category: 'document' },
  { id: 'jpg', label: 'JPEG Image', extension: 'jpg', mimeType: 'image/jpeg', description: 'Original scan photo', category: 'image' },
  { id: 'png', label: 'PNG Image', extension: 'png', mimeType: 'image/png', description: 'Lossless scan image', category: 'image' },
  { id: 'json', label: 'JSON', extension: 'json', mimeType: 'application/json', description: 'Full structured data', category: 'data' },
  { id: 'csv', label: 'CSV', extension: 'csv', mimeType: 'text/csv', description: 'Spreadsheet (line items)', category: 'data' },
];
