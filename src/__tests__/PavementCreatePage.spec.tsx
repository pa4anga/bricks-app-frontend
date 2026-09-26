import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import CreatePavementProductPage, { getServerSideProps } from '@/pages/internal/products/pavements/new';

const { query } = vi.hoisted(() => ({ query: {} as Record<string, string> }));

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    query,
    pathname: '/internal/products/pavements/new',
    asPath: '/internal/products/pavements/new',
    isReady: true,
    events: { on: vi.fn(), off: vi.fn() },
  }),
  default: { push: vi.fn() },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <CreatePavementProductPage />
    </SWRConfig>
  );

describe('Create pavement product page', () => {
  beforeEach(() => {
    for (const key of Object.keys(query)) {
      delete query[key];
    }

    server.use(
      http.get('*/source-locations', () => HttpResponse.json([{ _id: 's1', name: 'София' }], { status: 200 })),
      http.get('*/fee-categories', () => HttpResponse.json([{ _id: 'f1', name: 'Стандартна' }], { status: 200 }))
    );
  });

  it('renders the pavement form with system, variant, units, iconLoad and system components', async () => {
    renderPage();

    expect(await screen.findByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByLabelText('Система')).toBeInTheDocument();
    expect(screen.getByLabelText('Вариант')).toBeInTheDocument();
    expect(screen.getByLabelText('Брой на м²')).toBeInTheDocument();
    expect(screen.getByLabelText('Икона (Натоварване)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добави компонент' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Създаване на продукт' })).toBeInTheDocument();
  });

  it('prefills the form and its system components from an existing product when ?from= is set', async () => {
    query.from = 'p1';
    server.use(
      http.get('*/products/p1', () =>
        HttpResponse.json(
          {
            _id: 'p1',
            name: 'Настилка Тон',
            kind: 'Настилки',
            system: 'Оптима',
            variant: 'Сив',
            sapNumber: 'SAP-9',
            systemComponents: [
              {
                name: 'Планка',
                kind: 'Аксесоар',
                rawUnitPrice: 2.5,
                unitsPerSquareMeter: 4,
                palletWeightKg: 300,
                countPerPallet: 20,
                minimumOrderUnits: 2,
                sourceLocation: 'София',
                feeCategory: 'Стандартна',
              },
            ],
          },
          { status: 200 }
        )
      )
    );

    const { container } = renderPage();

    await waitFor(() => expect(container.querySelector('#name')).toHaveValue('Настилка Тон'));
    expect(screen.getByLabelText('Система')).toHaveValue('Оптима');
    expect(container.querySelector('#systemComponent-0-name')).toHaveValue('Планка');
  });

  describe('getServerSideProps', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', fetchMock);
      fetchMock.mockReset();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    const buildContext = (cookie?: string) =>
      ({ req: { headers: { cookie } } }) as unknown as GetServerSidePropsContext;

    it('lets an authenticated user reach the create page', async () => {
      fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

      expect(await getServerSideProps(buildContext('connect.sid=abc'))).toEqual({ props: {} });
    });

    it('redirects to login when unauthenticated', async () => {
      fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

      expect(await getServerSideProps(buildContext())).toEqual({
        redirect: {
          destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/pavements/new')}`,
          permanent: false,
        },
      });
    });
  });
});
