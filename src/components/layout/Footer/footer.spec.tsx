import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Footer } from './index';

const mockUseNavDrawer = vi.fn();

vi.mock('../navDrawerContext', () => ({
  useNavDrawer: () => mockUseNavDrawer(),
}));

const contextValue = (isOverflowing: boolean) => ({
  listRef: { current: null },
  isOverflowing,
  isOpen: false,
  open: vi.fn(),
  close: vi.fn(),
});

describe('Footer', () => {
  it('renders inline links when there is no overflow', () => {
    mockUseNavDrawer.mockReturnValue(contextValue(false));

    render(<Footer />);

    const impresumLink = screen.getByRole('link', { name: 'Импресум' });
    expect(impresumLink).toBeInTheDocument();
    expect(impresumLink).toHaveAttribute('href', '/impresum');

    const externalLink = screen.getByRole('link', { name: 'Защита на личните данни' });
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('hides the inline links when overflowing', () => {
    mockUseNavDrawer.mockReturnValue(contextValue(true));

    render(<Footer />);

    expect(screen.queryByRole('link', { name: 'Импресум' })).not.toBeInTheDocument();
  });

  it('does not render a cookie settings button', () => {
    mockUseNavDrawer.mockReturnValue(contextValue(false));

    render(<Footer />);

    expect(screen.queryByRole('button', { name: 'Настройки за бисквитки' })).not.toBeInTheDocument();
  });
});
