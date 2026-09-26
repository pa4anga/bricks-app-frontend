export interface IFilePickerProps {
  id: string;
  label: string;
  accept?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  noFileText?: string;
}
