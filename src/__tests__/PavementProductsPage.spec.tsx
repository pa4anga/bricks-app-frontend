import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import PavementProductsPage, { getServerSideProps } from '@/pages/internal/products/pavements/index';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const products = [
  {
    _id: 'p9',
    name: 'Семмелрок Пастело',
    subtype: 'Павета',
    system: 'Пастело',
    variant: 'Сиена',
    rawUnitPrice: 1.2,
    sourceLocation: 'Бургас',
    feeCategory: 'Стандарт',
    sapNumber: 'SAP-9',
    unitsPerSquareMeter: 40,
  },
];

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <PavementProductsPage />
    </SWRConfig>
  );

describe('Pavement products page', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(
      http.get('*/products/count', () => HttpResponse.json({ total: 1 }, { status: 200 })),
      http.get('*/products/search', () => HttpResponse.json(products, { status: 200 }))
    );
  });

  it('lists pavement products and links to the pavement create page', async () => {
    renderPage();

    expect(await screen.findByRole('cell', { name: 'Семмелрок Пастело' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Създай продукт' })).toHaveAttribute(
      'href',
      '/internal/products/pavements/new'
    );
  });

  it('requests only products of the pavement kind', async () => {
    const kinds: (string | null)[] = [];
    server.use(
      http.get('*/products/search', ({ request }) => {
        kinds.push(new URL(request.url).searchParams.get('kind'));

        return HttpResponse.json(products, { status: 200 });
      })
    );

    renderPage();
    await screen.findByRole('cell', { name: 'Семмелрок Пастело' });

    expect(kinds).toContain('Настилки');
  });
});

describe('pavement products getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) => ({ req: { headers: { cookie } } }) as unknown as GetServerSidePropsContext;

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    expect(await getServerSideProps(buildContext())).toEqual({
      redirect: {
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/pavements')}`,
        permanent: false,
      },
    });
  });
});
