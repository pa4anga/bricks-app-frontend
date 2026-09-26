import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import type { IRichText } from '@/content/legal/types';

import { RichText } from './RichText';

export interface ISectionProps {
  title?: string;
  children: ReactNode;
}

export interface IParagraphProps {
  children: ReactNode;
}

export interface IInfoLinesProps {
  lines: IRichText[];
}

export const Section = ({ title, children }: ISectionProps) => (
  <section>
    {title && (
      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1.5, color: 'text.primary' }}>
        {title}
      </Typography>
    )}
    {children}
  </section>
);

export const Paragraph = ({ children }: IParagraphProps) => (
  <Typography color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
    {children}
  </Typography>
);

export const InfoLines = ({ lines }: IInfoLinesProps) => (
  <>
    {lines.map((line, index) => (
      <Typography key={index} color="text.secondary" sx={{ lineHeight: 1.7 }}>
        <RichText value={line} />
      </Typography>
    ))}
  </>
);
