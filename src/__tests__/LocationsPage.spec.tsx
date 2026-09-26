import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import LocationsPage, { getServerSideProps } from '@/pages/internal/locations/index';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const locations = [
  {
    _id: 'l1',
    name: 'Бургас',
    municipality: 'Бургас',
    postcode: 8000,
    salesWbRegion: 'WB1',
    sapRegion: 'SAP1',
    prices: [{ source: 'София', price: 10 }],
  },
];

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <LocationsPage />
    </SWRConfig>
  );

describe('Locations page', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(
      http.get('*/locations/count', () => HttpResponse.json({ total: 1 }, { status: 200 })),
      http.get('*/locations', () => HttpResponse.json(locations, { status: 200 }))
    );
  });

  it('lists locations with a column per price source', async () => {
    renderPage();

    expect(await screen.findByRole('columnheader', { name: 'София' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действия за Бургас' })).toBeInTheDocument();
  });

  it('links to the create page', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Създай локация' })).toHaveAttribute(
      'href',
      '/internal/locations/new'
    );
  });
});

describe('locations getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) => ({ req: { headers: { cookie } } }) as unknown as GetServerSidePropsContext;

  it('lets an authenticated user through', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    expect(await getServerSideProps(buildContext('connect.sid=abc'))).toEqual({ props: {} });
  });

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    expect(await getServerSideProps(buildContext())).toEqual({
      redirect: {
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/locations')}`,
        permanent: false,
      },
    });
  });
});
