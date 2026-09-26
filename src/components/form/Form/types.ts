import type { StackProps } from '@mui/material/Stack';
import type { ReactNode } from 'react';
import type { z } from 'zod';

export interface IFormProps<TSchema extends z.ZodType> {
  schema: TSchema;
  onSubmit: (values: z.infer<TSchema>) => void | Promise<void>;
  initialValues?: Partial<z.infer<TSchema>>;
  spacing?: number;
  direction?: StackProps['direction'];
  className?: string;
  children: ReactNode;
}

export interface IFormContextValue {
  getFieldValue: (name: string) => unknown;
  getFieldError: (name: string) => string | undefined;
  registerField: (name: string) => void;
  setFieldValue: (name: string, value: unknown) => void;
  setFieldTouched: (name: string) => void;
}
