import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CookieUsageTable } from './CookieUsageTable';

describe('CookieUsageTable', () => {
  it('renders both cookie category groups', () => {
    render(<CookieUsageTable />);

    expect(screen.getByText('Строго необходими бисквитки')).toBeInTheDocument();
    expect(screen.getByText('Аналитични бисквитки')).toBeInTheDocument();
  });

  it('lists the Google Analytics cookie', () => {
    render(<CookieUsageTable />);

    expect(screen.getByText('_ga')).toBeInTheDocument();
  });
});
