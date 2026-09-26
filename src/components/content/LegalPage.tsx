import type { ReactNode } from 'react';

import { RichText } from '@/components/content/RichText';
import { InfoLines, Paragraph, Section } from '@/components/content/Section';
import { PageTemplate } from '@/components/layout/PageTemplate';
import type { ILegalContent } from '@/content/legal/types';

export interface ILegalPageProps {
  content: ILegalContent;
  children?: ReactNode;
}

export const LegalPage = ({ content, children }: ILegalPageProps) => (
  <PageTemplate title={content.heading} heading={content.heading}>
    {content.sections.map((section, sectionIndex) => (
      <Section key={sectionIndex} title={section.title}>
        {section.paragraphs?.map((text, paragraphIndex) => (
          <Paragraph key={paragraphIndex}>
            <RichText value={text} />
          </Paragraph>
        ))}
        {section.lines && <InfoLines lines={section.lines} />}
      </Section>
    ))}
    {children}
  </PageTemplate>
);
