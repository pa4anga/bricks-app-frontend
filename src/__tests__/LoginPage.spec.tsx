import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import LoginPage from '@/pages/internal/login';

const { replace, routerState } = vi.hoisted(() => ({
  replace: vi.fn(),
  routerState: { query: {} as Record<string, string | string[]> },
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ replace, push: vi.fn(), query: routerState.query }),
  default: { push: vi.fn() },
}));

const loggedOut = () =>
  http.get('*/accounts/me', () => HttpResponse.json({ message: 'unauthorized' }, { status: 401 }));
const loggedIn = () => http.get('*/accounts/me', () => HttpResponse.json({ username: 'ivan' }, { status: 200 }));

const renderLogin = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, dedupingInterval: 0 }}>
      <LoginPage />
    </SWRConfig>
  );

const fillAndSubmit = async () => {
  await userEvent.type(await screen.findByLabelText('Потребителско име'), 'admin');
  await userEvent.type(screen.getByLabelText('Парола'), 'secret');
  await userEvent.click(screen.getByRole('button', { name: 'Вход' }));
};

describe('Login page', () => {
  beforeEach(() => {
    routerState.query = {};
    replace.mockClear();
    server.use(loggedOut());
  });

  it('renders the login form for an unauthenticated visitor', async () => {
    renderLogin();

    expect(await screen.findByLabelText('Потребителско име')).toBeInTheDocument();
    expect(screen.getByLabelText('Парола')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Вход' })).toBeInTheDocument();
  });

  it('redirects an already-authenticated visitor to the dashboard', async () => {
    server.use(loggedIn());

    renderLogin();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/internal/dashboard'));
    expect(screen.queryByLabelText('Потребителско име')).not.toBeInTheDocument();
  });

  it('logs in and redirects to the safe target from the redirect query param', async () => {
    routerState.query = { redirect: '/internal/accounts' };
    server.use(http.post('*/login', () => new HttpResponse(null, { status: 200 })));

    renderLogin();
    await fillAndSubmit();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/internal/accounts'));
  });

  it('ignores a same-origin redirect outside the internal area and uses the dashboard', async () => {
    routerState.query = { redirect: '/prices/bricks' };
    server.use(http.post('*/login', () => new HttpResponse(null, { status: 200 })));

    renderLogin();
    await fillAndSubmit();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/internal/dashboard'));
  });

  it('redirects to the dashboard when no redirect param is present', async () => {
    server.use(http.post('*/login', () => new HttpResponse(null, { status: 200 })));

    renderLogin();
    await fillAndSubmit();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/internal/dashboard'));
  });

  it('ignores an unsafe redirect target and uses the dashboard', async () => {
    routerState.query = { redirect: '//evil.com' };
    server.use(http.post('*/login', () => new HttpResponse(null, { status: 200 })));

    renderLogin();
    await fillAndSubmit();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/internal/dashboard'));
  });

  it('shows an error and does not navigate when credentials are rejected', async () => {
    server.use(http.post('*/login', () => HttpResponse.json({ message: 'bad' }, { status: 401 })));

    renderLogin();
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
