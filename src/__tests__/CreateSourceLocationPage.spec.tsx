import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import CreateSourceLocationPage, { getServerSideProps } from '@/pages/internal/source-locations/new';

const CAPACITY_REQUIREMENTS = 'Капацитетът трябва да е цяло число, поне 1.';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, dedupingInterval: 0 }}>
      <CreateSourceLocationPage />
    </SWRConfig>
  );

const fillAndSubmit = async (name: string, capacity: string) => {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Име'), name);
  await user.type(screen.getByLabelText('Капацитет на камион (кг)'), capacity);
  await user.click(screen.getByRole('button', { name: 'Създай производствена база' }));
};

const helperTextFor = (label: string) => {
  const input = screen.getByLabelText(label);
  const describedBy = input.getAttribute('aria-describedby');

  return describedBy ? document.getElementById(describedBy) : null;
};

describe('Create source location page', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders the name and truck-capacity fields with the create action', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Създаване на производствена база' })).toBeInTheDocument();
    expect(screen.getByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByLabelText('Капацитет на камион (кг)')).toHaveAttribute('type', 'number');
    expect(screen.getByRole('button', { name: 'Създай производствена база' })).toBeInTheDocument();
  });

  it('blocks submission and reports validation errors when the fields are empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Създай производствена база' }));

    expect(await screen.findByText('Въведете име')).toBeInTheDocument();
    expect(screen.getByText('Въведете капацитет')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('rejects a non-positive capacity before contacting the API', async () => {
    renderPage();

    await fillAndSubmit('София', '0');

    await waitFor(() => expect(helperTextFor('Капацитет на камион (кг)')).toHaveClass('Mui-error'));
    expect(helperTextFor('Капацитет на камион (кг)')).toHaveTextContent(CAPACITY_REQUIREMENTS);
    expect(push).not.toHaveBeenCalled();
  });

  it('creates the source location and redirects to the list on success', async () => {
    server.use(
      http.post('*/source-locations', () =>
        HttpResponse.json({ _id: '1', name: 'София', truckCapacityKg: 20000 }, { status: 201 })
      )
    );

    renderPage();

    await fillAndSubmit('София', '20000');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/source-locations'));
  });

  it('surfaces a duplicate-name error when the API responds with 409', async () => {
    server.use(
      http.post('*/source-locations', () => HttpResponse.json({ message: 'taken', field: 'name' }, { status: 409 }))
    );

    renderPage();

    await fillAndSubmit('София', '20000');

    expect(await screen.findByText('Производствена база с това име вече съществува.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('create source location getServerSideProps', () => {
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

    const result = await getServerSideProps(buildContext('connect.sid=abc'));

    expect(result).toEqual({ props: {} });
  });

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const result = await getServerSideProps(buildContext());

    expect(result).toEqual({
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Fsource-locations%2Fnew', permanent: false },
    });
  });
});
