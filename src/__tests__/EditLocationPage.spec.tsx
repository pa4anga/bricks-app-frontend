import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import EditLocationPage, { getServerSideProps } from '@/pages/internal/locations/[id]/edit';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: { id: 'l1' } }),
  default: { push },
}));

const location = {
  _id: 'l1',
  name: 'Бургас',
  municipality: 'Бургас',
  postcode: 8000,
  salesWbRegion: 'WB1',
  sapRegion: 'SAP1',
  coordinates: { type: 'Point', coordinates: [27.47, 42.5] },
  prices: [{ source: 'София', price: 10 }],
};

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <EditLocationPage />
    </SWRConfig>
  );

describe('Edit location page', () => {
  beforeEach(() => {
    push.mockClear();
    server.use(
      http.get('*/source-locations', () =>
        HttpResponse.json(
          [
            { _id: 's1', name: 'София' },
            { _id: 's2', name: 'Пловдив' },
          ],
          { status: 200 }
        )
      ),
      http.get('*/locations/l1', () => HttpResponse.json(location, { status: 200 }))
    );
  });

  it('prefills the form and disables the name field', async () => {
    renderPage();

    const nameField = await screen.findByLabelText('Име');
    expect(nameField).toHaveValue('Бургас');
    expect(nameField).toBeDisabled();
    expect(screen.getByLabelText('Географска ширина')).toHaveValue(42.5);
    expect(screen.getByRole('button', { name: 'Промени локация' })).toBeInTheDocument();
  });

  it('updates the location by id and redirects', async () => {
    const user = userEvent.setup();
    let capturedId: string | undefined;
    let capturedBody: unknown;
    server.use(
      http.patch('*/locations/:id', async ({ params, request }) => {
        capturedId = params.id as string;
        capturedBody = await request.json();

        return HttpResponse.json({ ...location }, { status: 200 });
      })
    );

    renderPage();
    await screen.findByLabelText('Име');

    fireEvent.change(screen.getByLabelText('Търговски регион'), { target: { value: 'WB2' } });
    await user.click(screen.getByRole('button', { name: 'Промени локация' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/locations'));
    expect(capturedId).toBe('l1');
    expect(capturedBody).toEqual({
      name: 'Бургас',
      coordinates: { type: 'Point', coordinates: [27.47, 42.5] },
      postcode: 8000,
      municipality: 'Бургас',
      sapRegion: 'SAP1',
      salesWbRegion: 'WB2',
      prices: [{ source: 'София', price: 10 }],
    });
  });

  it('shows an error when the location fails to load', async () => {
    server.use(http.get('*/locations/l1', () => HttpResponse.json({ message: 'missing' }, { status: 404 })));

    renderPage();

    expect(await screen.findByText('Неуспешно зареждане на локацията.')).toBeInTheDocument();
  });
});

describe('edit location getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) =>
    ({ req: { headers: { cookie } }, params: { id: 'l1' } }) as unknown as GetServerSidePropsContext;

  it('lets an authenticated user through', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    expect(await getServerSideProps(buildContext('connect.sid=abc'))).toEqual({ props: {} });
  });

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    expect(await getServerSideProps(buildContext())).toEqual({
      redirect: {
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/locations/l1/edit')}`,
        permanent: false,
      },
    });
  });
});
