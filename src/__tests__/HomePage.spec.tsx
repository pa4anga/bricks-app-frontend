import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomePage from '@/pages/index';

describe('HomePage', () => {
  it('renders the page heading', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Продуктови групи' })).toBeInTheDocument();
  });

  it('links each category card to its prices page', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: 'Тухли и аксесоари' })).toHaveAttribute('href', '/prices/bricks');
    expect(screen.getByRole('link', { name: 'Настилки и аксесоари' })).toHaveAttribute('href', '/prices/pavement');
    expect(screen.getByRole('link', { name: 'Керемиди и аксесоари' })).toHaveAttribute('href', '/prices/roof-tiles');
  });
});
