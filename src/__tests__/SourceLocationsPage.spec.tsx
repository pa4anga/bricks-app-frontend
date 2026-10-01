import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import SourceLocationsPage, { getServerSideProps } from '@/pages/internal/source-locations';

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <SourceLocationsPage />
    </SWRConfig>
  );

describe('Source locations page', () => {
  beforeEach(() => {
    server.use(
      http.get('*/source-locations', () =>
        HttpResponse.json(
          [
            { _id: '1', name: 'София', truckCapacityKg: 20000 },
            { _id: '2', name: 'Пловдив', truckCapacityKg: 15000 },
          ],
          { status: 200 }
        )
      )
    );
  });

  it('lists the source locations returned by the API', async () => {
    renderPage();

    expect(await screen.findByText('София')).toBeInTheDocument();
    expect(screen.getByText('Пловдив')).toBeInTheDocument();
    expect(screen.getByText('20000')).toBeInTheDocument();
  });

  it('links the create button to the create page', async () => {
    renderPage();
    await screen.findByText('София');

    expect(screen.getByRole('link', { name: 'Създай производствена база' })).toHaveAttribute(
      'href',
      '/internal/source-locations/new'
    );
  });

  it('removes a source location from the table after it is deleted', async () => {
    const store = [
      { _id: '1', name: 'София', truckCapacityKg: 20000 },
      { _id: '2', name: 'Пловдив', truckCapacityKg: 15000 },
    ];
    server.use(
      http.get('*/source-locations', () => HttpResponse.json(store, { status: 200 })),
      http.delete('*/source-locations/:name', ({ params }) => {
        const index = store.findIndex(location => location.name === params.name);
        if (index >= 0) {
          store.splice(index, 1);
        }
        return HttpResponse.json({ name: params.name }, { status: 200 });
      })
    );

    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Действия за София' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Изтрий София' }));

    await waitFor(() => expect(screen.queryByText('София')).not.toBeInTheDocument());
    expect(screen.getByText('Пловдив')).toBeInTheDocument();
  });
});

describe('source locations getServerSideProps', () => {
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
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Fsource-locations', permanent: false },
    });
  });
});
