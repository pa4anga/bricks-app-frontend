export interface ICsvImportResult {
  created: number;
  updated: number;
  total: number;
}

export interface ICsvImportFormProps {
  title: string;
  inputId: string;
  pickerLabel: string;
  onImport: (file: File) => Promise<ICsvImportResult>;
}
