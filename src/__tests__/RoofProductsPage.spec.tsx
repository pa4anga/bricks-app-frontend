import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import RoofProductsPage, { getServerSideProps } from '@/pages/internal/products/roofs/index';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const products = [
  {
    _id: 'p1',
    name: 'Тондах Родон',
    subtype: 'Керемида',
    system: 'Родон',
    variant: 'Натурал',
    rawUnitPrice: 2.5,
    sourceLocation: 'Луковит',
    feeCategory: 'Стандарт',
    sapNumber: 'SAP-1',
    unitsPerSquareMeter: 10,
  },
];

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <RoofProductsPage />
    </SWRConfig>
  );

describe('Roof products page', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(
      http.get('*/products/count', () => HttpResponse.json({ total: 1 }, { status: 200 })),
      http.get('*/products/search', () => HttpResponse.json(products, { status: 200 }))
    );
  });

  it('lists roof products with the subtype column', async () => {
    renderPage();

    expect(await screen.findByRole('columnheader', { name: 'Тип' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Тондах Родон' })).toBeInTheDocument();
  });

  it('links to the create page', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Създай продукт' })).toHaveAttribute(
      'href',
      '/internal/products/roofs/new'
    );
  });

  it('requests only products of the roof kind', async () => {
    const kinds: (string | null)[] = [];
    server.use(
      http.get('*/products/search', ({ request }) => {
        kinds.push(new URL(request.url).searchParams.get('kind'));

        return HttpResponse.json(products, { status: 200 });
      })
    );

    renderPage();
    await screen.findByRole('columnheader', { name: 'Тип' });

    expect(kinds).toContain('Покриви');
  });
});

describe('roof products getServerSideProps', () => {
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
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/roofs')}`,
        permanent: false,
      },
    });
  });
});
