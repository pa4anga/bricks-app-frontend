import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Footer } from '../Footer';
import { Header } from '../Header';

import { NavDrawerProvider } from './index';

vi.mock('@/hooks/useSingleLineOverflow', () => ({
  useSingleLineOverflow: () => ({ ref: { current: null }, isOverflowing: true }),
}));

const renderNav = () =>
  render(
    <NavDrawerProvider>
      <Header />
      <Footer />
    </NavDrawerProvider>
  );

describe('NavDrawer', () => {
  it('shows the header hamburger and opens the drawer with the nav links', async () => {
    renderNav();

    expect(screen.queryByRole('link', { name: 'Импресум' })).not.toBeInTheDocument();

    const menuButton = screen.getByRole('button', { name: 'Отвори навигацията' });
    await userEvent.click(menuButton);

    const drawerLink = screen.getByRole('link', { name: 'Импресум' });
    expect(drawerLink).toHaveAttribute('href', '/impresum');

    await userEvent.click(drawerLink);

    expect(screen.queryByRole('link', { name: 'Импресум' })).not.toBeInTheDocument();
  });
});
