import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import CreateLocationPage, { getServerSideProps } from '@/pages/internal/locations/new';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <CreateLocationPage />
    </SWRConfig>
  );

describe('Create location page', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(
      http.get('*/source-locations', () => HttpResponse.json([{ _id: 's1', name: 'София' }], { status: 200 }))
    );
  });

  it('renders the location form', async () => {
    renderPage();

    expect(await screen.findByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Създай локация' })).toBeInTheDocument();
  });
});

describe('create location getServerSideProps', () => {
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
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/locations/new')}`,
        permanent: false,
      },
    });
  });
});
