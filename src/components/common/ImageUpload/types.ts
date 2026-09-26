import type { Ref } from 'react';

export interface IImageUploadHandle {
  upload: () => Promise<string | null>;
  validate: () => boolean;
  clear: () => void;
  getFile: () => File | null;
}

export interface IImageUploadProps {
  ref?: Ref<IImageUploadHandle>;
  label?: string;
  hint?: string;
  error?: string;
  initialPreviewUrl?: string;
  accept?: string;
  maxSizeBytes?: number;
  required?: boolean;
  disabled?: boolean;
  requiredMessage?: string;
  uploadErrorMessage?: string;
  onFileChange?: (file: File | null) => void;
  onUploaded?: (id: string) => void;
  width?: number | string;
  height?: number | string;
  className?: string;
}
