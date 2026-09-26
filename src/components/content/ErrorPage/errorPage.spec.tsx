import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrorPage } from '@/components/content/ErrorPage';

describe('ErrorPage', () => {
  it('renders the mapped status code, title, and a link home for a known error', () => {
    render(<ErrorPage statusCode={404} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Страницата не е намерена' })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Към началната страница' })).toHaveAttribute('href', '/');
  });

  it('falls back to a generic message but keeps the real status code for unmapped errors', () => {
    render(<ErrorPage statusCode={418} />);

    expect(screen.getByText('418')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Възникна грешка' })).toBeInTheDocument();
  });
});
