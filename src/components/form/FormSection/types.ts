import type { BoxProps } from '@mui/material/Box';
import type { ReactNode } from 'react';

export interface IFormSectionProps {
  title?: string;
  columns?: 1 | 2;
  children: ReactNode;
  sx?: BoxProps['sx'];
}

export interface IFormRowProps {
  children: ReactNode;
  sx?: BoxProps['sx'];
}
