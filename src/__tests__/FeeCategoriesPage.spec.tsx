import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import FeeCategoriesPage, { getServerSideProps } from '@/pages/internal/fee-categories';

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <FeeCategoriesPage />
    </SWRConfig>
  );

describe('Fee categories page', () => {
  beforeEach(() => {
    server.use(
      http.get('*/fee-categories', () =>
        HttpResponse.json(
          [
            { _id: '1', name: 'Стандартна', percentage: 20 },
            { _id: '2', name: 'Промоция', percentage: 12.5 },
          ],
          { status: 200 }
        )
      )
    );
  });

  it('lists the fee categories returned by the API with their percentages', async () => {
    renderPage();

    expect(await screen.findByText('Стандартна')).toBeInTheDocument();
    expect(screen.getByText('Промоция')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('links the create button to the create page', async () => {
    renderPage();
    await screen.findByText('Стандартна');

    expect(screen.getByRole('link', { name: 'Създай категория' })).toHaveAttribute(
      'href',
      '/internal/fee-categories/new'
    );
  });

  it('removes a fee category from the table after it is deleted', async () => {
    const store = [
      { _id: '1', name: 'Стандартна', percentage: 20 },
      { _id: '2', name: 'Промоция', percentage: 12.5 },
    ];
    server.use(
      http.get('*/fee-categories', () => HttpResponse.json(store, { status: 200 })),
      http.delete('*/fee-categories/:name', ({ params }) => {
        const index = store.findIndex(category => category.name === params.name);
        if (index >= 0) {
          store.splice(index, 1);
        }
        return HttpResponse.json({ name: params.name }, { status: 200 });
      })
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Действия за Стандартна' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий Стандартна' }));

    await waitFor(() => expect(screen.queryByText('Стандартна')).not.toBeInTheDocument());
    expect(screen.getByText('Промоция')).toBeInTheDocument();
  });
});

describe('fee categories getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) => ({ req: { headers: { cookie } } }) as unknown as GetServerSidePropsContext;

  it('forwards the cookie and lets an authenticated user through', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    const result = await getServerSideProps(buildContext('connect.sid=abc'));

    expect(result).toEqual({ props: {} });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/me'),
      expect.objectContaining({ headers: { cookie: 'connect.sid=abc', 'x-forwarded-proto': 'https' } })
    );
  });

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const result = await getServerSideProps(buildContext());

    expect(result).toEqual({
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Ffee-categories', permanent: false },
    });
  });
});
