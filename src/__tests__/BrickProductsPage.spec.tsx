import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import BrickProductsPage, { getServerSideProps } from '@/pages/internal/products/bricks/index';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const products = [
  {
    _id: 'b1',
    name: 'Wienerberger Porotherm',
    subtype: 'Блок',
    system: 'Porotherm',
    variant: 'Profi',
    rawUnitPrice: 1.8,
    sourceLocation: 'Луковит',
    feeCategory: 'Стандарт',
    sapNumber: 'SAP-B1',
    unitsPerSquareMeter: 16,
  },
];

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <BrickProductsPage />
    </SWRConfig>
  );

describe('Brick products page', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(
      http.get('*/products/count', () => HttpResponse.json({ total: 1 }, { status: 200 })),
      http.get('*/products/search', () => HttpResponse.json(products, { status: 200 }))
    );
  });

  it('lists brick products without the system, variant and units columns', async () => {
    renderPage();

    expect(await screen.findByRole('cell', { name: 'Wienerberger Porotherm' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Тип' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Система' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Вариант' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Бр./кв.м' })).not.toBeInTheDocument();
  });

  it('links to the brick create page', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Създай продукт' })).toHaveAttribute(
      'href',
      '/internal/products/bricks/new'
    );
  });

  it('requests only products of the brick kind', async () => {
    const kinds: (string | null)[] = [];
    server.use(
      http.get('*/products/search', ({ request }) => {
        kinds.push(new URL(request.url).searchParams.get('kind'));

        return HttpResponse.json(products, { status: 200 });
      })
    );

    renderPage();
    await screen.findByRole('cell', { name: 'Wienerberger Porotherm' });

    expect(kinds).toContain('Тухли');
  });
});

describe('brick products getServerSideProps', () => {
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
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/bricks')}`,
        permanent: false,
      },
    });
  });

  it('lets an authenticated user through', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    expect(await getServerSideProps(buildContext('connect.sid=abc'))).toEqual({ props: {} });
  });
});
