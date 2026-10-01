import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import AccountsPage, { getServerSideProps } from '@/pages/internal/accounts';

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <AccountsPage username="ivan" />
    </SWRConfig>
  );

describe('Accounts page', () => {
  beforeEach(() => {
    server.use(
      http.get('*/accounts', () =>
        HttpResponse.json(
          [
            { id: '1', username: 'ivan' },
            { id: '2', username: 'petar' },
          ],
          { status: 200 }
        )
      )
    );
  });

  it('lists the accounts returned by the API', async () => {
    renderPage();

    expect(await screen.findByText('petar')).toBeInTheDocument();
    expect(screen.getByText('ivan')).toBeInTheDocument();
  });

  it('links the create button to the placeholder create page', async () => {
    renderPage();
    await screen.findByText('petar');

    expect(screen.getByRole('link', { name: 'Създай акаунт' })).toHaveAttribute('href', '/internal/accounts/new');
  });

  it('hides the delete action for the logged-in user but shows it for others', async () => {
    renderPage();
    await screen.findByText('petar');

    expect(screen.queryByRole('button', { name: 'Действия за ivan' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действия за petar' })).toBeInTheDocument();
  });

  it('removes an account from the table after it is deleted', async () => {
    const store = [
      { id: '1', username: 'ivan' },
      { id: '2', username: 'petar' },
    ];
    server.use(
      http.get('*/accounts', () => HttpResponse.json(store, { status: 200 })),
      http.delete('*/accounts/:id', ({ params }) => {
        const index = store.findIndex(account => account.id === params.id);
        if (index >= 0) {
          store.splice(index, 1);
        }
        return HttpResponse.json({ id: params.id }, { status: 200 });
      })
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Действия за petar' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий petar' }));

    await waitFor(() => expect(screen.queryByText('petar')).not.toBeInTheDocument());
    expect(screen.getByText('ivan')).toBeInTheDocument();
  });
});

describe('accounts getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) => ({ req: { headers: { cookie } } }) as unknown as GetServerSidePropsContext;

  it('forwards the cookie and returns the username when authenticated', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    const result = await getServerSideProps(buildContext('connect.sid=abc'));

    expect(result).toEqual({ props: { username: 'ivan' } });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/me'),
      expect.objectContaining({ headers: { cookie: 'connect.sid=abc', 'x-forwarded-proto': 'https' } })
    );
  });

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const result = await getServerSideProps(buildContext());

    expect(result).toEqual({
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Faccounts', permanent: false },
    });
  });
});
