import type { ReactNode } from 'react';

export interface IPageTemplateProps {
  title?: string;
  heading?: ReactNode;
  children?: ReactNode;
  internal?: boolean;
  bare?: boolean;
}
