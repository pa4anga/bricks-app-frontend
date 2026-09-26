import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import CreateRoofProductPage, { getServerSideProps } from '@/pages/internal/products/roofs/new';

const { query } = vi.hoisted(() => ({ query: {} as Record<string, string> }));

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    query,
    pathname: '/internal/products/roofs/new',
    asPath: '/internal/products/roofs/new',
    isReady: true,
    events: { on: vi.fn(), off: vi.fn() },
  }),
  default: { push: vi.fn() },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <CreateRoofProductPage />
    </SWRConfig>
  );

describe('Create roof product page', () => {
  beforeEach(() => {
    for (const key of Object.keys(query)) {
      delete query[key];
    }

    server.use(
      http.get('*/source-locations', () => HttpResponse.json([{ _id: 's1', name: 'София' }], { status: 200 })),
      http.get('*/fee-categories', () => HttpResponse.json([{ _id: 'f1', name: 'Стандартна' }], { status: 200 }))
    );
  });

  it('renders the roof form with system, variant and units but without the pavement icon field', async () => {
    renderPage();

    expect(await screen.findByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByLabelText('Система')).toBeInTheDocument();
    expect(screen.getByLabelText('Цвят')).toBeInTheDocument();
    expect(screen.getByLabelText('Брой на м²')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добави компонент' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Икона (Натоварване)')).not.toBeInTheDocument();
  });

  it('prefills the form and its system components from an existing product when ?from= is set', async () => {
    query.from = 'p1';
    server.use(
      http.get('*/products/p1', () =>
        HttpResponse.json(
          {
            _id: 'p1',
            name: 'Тондах Родон',
            kind: 'Покриви',
            system: 'Родон',
            variant: 'Червен',
            sapNumber: 'SAP-7',
            systemComponents: [
              {
                name: 'Било',
                kind: 'Аксесоар',
                rawUnitPrice: 5.5,
                unitsPerSquareMeter: 3,
                palletWeightKg: 250,
                countPerPallet: 30,
                minimumOrderUnits: 1,
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

    await waitFor(() => expect(container.querySelector('#name')).toHaveValue('Тондах Родон'));
    expect(screen.getByLabelText('Цвят')).toHaveValue('Червен');
    expect(container.querySelector('#systemComponent-0-name')).toHaveValue('Било');
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
          destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/roofs/new')}`,
          permanent: false,
        },
      });
    });
  });
});
