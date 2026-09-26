import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';

import { Navbar } from './Navbar';

const { push, overflow } = vi.hoisted(() => ({ push: vi.fn(), overflow: { current: false } }));

vi.mock('next/router', () => ({
  default: { push },
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
}));

vi.mock('@/hooks/useSingleLineOverflow', () => ({
  useSingleLineOverflow: () => ({ ref: { current: null }, isOverflowing: overflow.current }),
}));

const openDropdown = (name: string) => {
  fireEvent.mouseOver(screen.getByRole('button', { name }));
};

describe('Navbar', () => {
  beforeEach(() => {
    push.mockClear();
    overflow.current = false;
  });

  it('renders the three merged top-level dropdowns', () => {
    render(<Navbar />);

    expect(screen.getByRole('button', { name: 'Продуктов каталог' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Локации' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Настройки' })).toBeInTheDocument();
  });

  it('renders Табло as a standalone dashboard link rather than a dropdown', () => {
    render(<Navbar />);

    const dashboard = screen.getByRole('link', { name: 'Табло' });
    expect(dashboard).toHaveAttribute('href', '/internal/dashboard');
    expect(dashboard).not.toHaveAttribute('aria-haspopup');
  });

  it('merges Локации, Производствени бази and Населени места under one Локации dropdown', () => {
    render(<Navbar />);

    openDropdown('Локации');

    expect(screen.getByText('Производствени бази')).toBeInTheDocument();
    expect(screen.getByText('Населени места')).toBeInTheDocument();
    expect(screen.getByText('Всички локации', { selector: 'a' })).toHaveAttribute('href', '/internal/locations');
    expect(screen.getByText('Всички производствени бази', { selector: 'a' })).toHaveAttribute(
      'href',
      '/internal/source-locations'
    );
  });

  it('merges accounts, fee categories and data under the Настройки dropdown', () => {
    render(<Navbar />);

    openDropdown('Настройки');

    expect(screen.getByText('Акаунти')).toBeInTheDocument();
    expect(screen.queryByText('Компания')).not.toBeInTheDocument();
    expect(screen.getByText('Категории надценка')).toBeInTheDocument();
    expect(screen.getByText('Данни')).toBeInTheDocument();
    expect(screen.getByText('Всички акаунти', { selector: 'a' })).toHaveAttribute('href', '/internal/accounts');
    expect(screen.getByText('Настройки', { selector: 'a' })).toHaveAttribute('href', '/internal/config');
    expect(screen.getByText('Всички категории надценка', { selector: 'a' })).toHaveAttribute(
      'href',
      '/internal/fee-categories'
    );
  });

  it('does not expose links to non-internal pages', () => {
    render(<Navbar />);

    expect(screen.queryByRole('button', { name: 'Продукти' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ресурси' })).not.toBeInTheDocument();
    expect(screen.queryByText('Тухли и блокове')).not.toBeInTheDocument();
  });

  it('logs out through the account logout endpoint and returns to the login page', async () => {
    server.use(http.post('*/accounts/logout', () => new HttpResponse(null, { status: 200 })));
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: 'Изход' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/login'));
  });

  it('collapses into a hamburger drawer when the row does not fit on one line', async () => {
    overflow.current = true;
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: 'Отвори навигацията' }));

    expect(screen.getByRole('link', { name: 'Табло' })).toHaveAttribute('href', '/internal/dashboard');
    expect(screen.getByText('Категории надценка')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Изход' })).toBeInTheDocument();
  });
});
