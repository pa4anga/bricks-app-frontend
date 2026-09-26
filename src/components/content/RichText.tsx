import Link from 'next/link';
import type { ReactNode } from 'react';

import type { IInlineNode, IRichText } from '@/content/legal/types';

import styles from './richText.module.scss';

const URL_OR_EMAIL = /(https?:\/\/[^\s]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const TRAILING_PUNCTUATION = /[.,;:)]+$/;

const renderAnchor = (href: string, text: ReactNode, key: number): ReactNode => {
  if (href.startsWith('/')) {
    return (
      <Link key={key} href={href} className={styles.link}>
        {text}
      </Link>
    );
  }

  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a key={key} href={href} className={styles.link}>
        {text}
      </a>
    );
  }

  return (
    <a key={key} href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  );
};

const autoLink = (text: string, keyOffset: number): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = keyOffset;

  for (const match of text.matchAll(URL_OR_EMAIL)) {
    const raw = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const trailing = raw.match(TRAILING_PUNCTUATION)?.[0] ?? '';
    const token = trailing ? raw.slice(0, -trailing.length) : raw;
    const href = token.startsWith('http') ? token : `mailto:${token}`;

    nodes.push(renderAnchor(href, token, key));
    key += 1;

    if (trailing) {
      nodes.push(trailing);
    }

    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

const renderNode = (node: IInlineNode, index: number): ReactNode =>
  typeof node === 'string' ? autoLink(node, index * 100) : renderAnchor(node.href, node.text, index * 100);

export interface IRichTextProps {
  value: IRichText;
}

export const RichText = ({ value }: IRichTextProps) => (
  <>{typeof value === 'string' ? autoLink(value, 0) : value.map((node, index) => renderNode(node, index))}</>
);
