import type { TextFieldProps } from '@mui/material/TextField';
import type { Ref } from 'react';
import type { z } from 'zod';

export interface IValidatedTextFieldHandle {
  setHint: (hint?: string) => void;
  setError: (error?: string) => void;
  clearError: () => void;
  validate: () => boolean;
}

export type IValidatedTextFieldProps = Omit<TextFieldProps, 'error' | 'helperText' | 'ref'> & {
  hint?: string;
  error?: string;
  schema?: z.ZodType;
  validateOn?: 'change' | 'blur';
  onValueChange?: (value: string) => void;
  ref?: Ref<IValidatedTextFieldHandle>;
};
