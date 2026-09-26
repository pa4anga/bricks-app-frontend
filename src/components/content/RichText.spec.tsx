import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichText } from '@/components/content/RichText';

describe('RichText', () => {
  it('auto-links bare emails as mailto and strips trailing punctuation', () => {
    render(
      <p>
        <RichText value="Пишете на office.bg@wienerberger.com." />
      </p>
    );

    expect(screen.getByRole('link', { name: 'office.bg@wienerberger.com' })).toHaveAttribute(
      'href',
      'mailto:office.bg@wienerberger.com'
    );
  });

  it('auto-links bare URLs and opens them in a new tab', () => {
    render(
      <p>
        <RichText value="Вижте https://ceni.wienerberger.bg/ за повече." />
      </p>
    );

    const link = screen.getByRole('link', { name: 'https://ceni.wienerberger.bg/' });
    expect(link).toHaveAttribute('href', 'https://ceni.wienerberger.bg/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders explicit tel links and named external anchors from inline nodes', () => {
    render(
      <p>
        <RichText
          value={[
            'тел ',
            { text: '+359 2 80 66 777', href: 'tel:+35928066777' },
            ' виж ',
            { text: 'Защита на личните данни', href: 'https://wienerberger.bg/zashtita-lichni-danni' },
          ]}
        />
      </p>
    );

    expect(screen.getByRole('link', { name: '+359 2 80 66 777' })).toHaveAttribute('href', 'tel:+35928066777');
    const anchor = screen.getByRole('link', { name: 'Защита на личните данни' });
    expect(anchor).toHaveAttribute('href', 'https://wienerberger.bg/zashtita-lichni-danni');
    expect(anchor).toHaveAttribute('target', '_blank');
  });
});
