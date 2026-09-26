import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import EditSettlementPage, { getServerSideProps } from '@/pages/internal/settlements/[name]/edit';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: { name: 'София' } }),
  default: { push },
}));

const settlement = { _id: 's1', name: 'София', coordinates: { type: 'Point', coordinates: [23.32, 42.7] } };

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <EditSettlementPage />
    </SWRConfig>
  );

describe('Edit settlement page', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(http.get('*/settlements/:name', () => HttpResponse.json([settlement], { status: 200 })));
  });

  it('prefills the form with the existing settlement data', async () => {
    renderPage();

    expect(await screen.findByDisplayValue('София')).toBeInTheDocument();
    expect(screen.getByLabelText('Географска ширина')).toHaveValue(42.7);
    expect(screen.getByLabelText('Географска дължина')).toHaveValue(23.32);
  });

  it('shows an update action instead of a create action', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: 'Промени населено място' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Създай населено място' })).not.toBeInTheDocument();
  });

  it('updates the settlement by id and redirects on success', async () => {
    let capturedId: string | undefined;
    let capturedBody: unknown;
    server.use(
      http.get('*/settlements/:name', () => HttpResponse.json([settlement], { status: 200 })),
      http.patch('*/settlements/:id', async ({ params, request }) => {
        capturedId = params.id as string;
        capturedBody = await request.json();

        return HttpResponse.json(
          { ...settlement, coordinates: { type: 'Point', coordinates: [23.32, 43] } },
          {
            status: 200,
          }
        );
      })
    );

    renderPage();
    await screen.findByDisplayValue('София');

    fireEvent.change(screen.getByLabelText('Географска ширина'), { target: { value: '43' } });
    await userEvent.click(screen.getByRole('button', { name: 'Промени населено място' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/settlements'));
    expect(capturedId).toBe('s1');
    expect(capturedBody).toEqual({ name: 'София', coordinates: { type: 'Point', coordinates: [23.32, 43] } });
  });

  it('surfaces a not-found message when the settlement does not exist', async () => {
    server.use(http.get('*/settlements/:name', () => HttpResponse.json([], { status: 200 })));

    renderPage();

    expect(await screen.findByText('Населеното място не е намерено.')).toBeInTheDocument();
  });

  it('surfaces a duplicate-name error when the API responds with 409', async () => {
    server.use(
      http.get('*/settlements/:name', () => HttpResponse.json([settlement], { status: 200 })),
      http.patch('*/settlements/:id', () => HttpResponse.json({ message: 'taken', field: 'name' }, { status: 409 }))
    );

    renderPage();
    await screen.findByDisplayValue('София');

    await userEvent.click(screen.getByRole('button', { name: 'Промени населено място' }));

    expect(await screen.findByText('Населено място с това име вече съществува.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('edit settlement getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) =>
    ({ req: { headers: { cookie } }, params: { name: 'София' } }) as unknown as GetServerSidePropsContext;

  it('lets an authenticated user through', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    const result = await getServerSideProps(buildContext('connect.sid=abc'));

    expect(result).toEqual({ props: {} });
  });

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const result = await getServerSideProps(buildContext());
    const expected = `/internal/login?redirect=${encodeURIComponent(`/internal/settlements/${encodeURIComponent('София')}/edit`)}`;

    expect(result).toEqual({ redirect: { destination: expected, permanent: false } });
  });
});
