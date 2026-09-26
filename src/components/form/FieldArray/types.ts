import type { ComponentType, Ref } from 'react';
import type { z } from 'zod';

export interface IFieldArrayEntryProps<T> {
  value: T;
  onChange: (value: T) => void;
  index: number;
  error?: string;
}

export interface IFieldArrayHandle {
  validate: () => boolean;
}

export interface IFieldArrayProps<T> {
  value: T[];
  onChange: (value: T[]) => void;
  component: ComponentType<IFieldArrayEntryProps<T>>;
  createEntry: () => T;
  entrySchema?: z.ZodType<T>;
  validateOn?: 'change' | 'submit';
  minEntries?: number;
  maxEntries?: number;
  addAriaLabel?: string;
  removeAriaLabel?: string;
  spacing?: number;
  className?: string;
  ref?: Ref<IFieldArrayHandle>;
}
