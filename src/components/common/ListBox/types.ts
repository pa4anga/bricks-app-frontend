import type { PaperProps } from '@mui/material/Paper';
import type { Key, ReactNode } from 'react';

export interface IListBoxProps<T> extends Omit<PaperProps, 'onClick' | 'children'> {
  items: T[];
  onItemClick: (item: T) => void;
  getLabel?: (item: T) => string;
  getKey?: (item: T, index: number) => Key;
  selectedItem?: T;
  isItemSelected?: (item: T, selectedItem: T) => boolean;
  disableItem?: (item: T) => boolean;
  emptyLabel?: ReactNode;
  maxHeight?: number | string;
}
