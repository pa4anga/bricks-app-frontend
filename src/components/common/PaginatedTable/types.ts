import type { TableCellProps } from '@mui/material/TableCell';
import type { ReactNode } from 'react';

export interface IPaginatedTableColumn<T> {
  key: string;
  header: ReactNode;
  align?: TableCellProps['align'];
  render: (row: T) => ReactNode;
}

export interface IPaginatedTableProps<T> {
  columns: IPaginatedTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
  windowSize?: number;
}
