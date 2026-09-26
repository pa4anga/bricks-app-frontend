import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import CreateSettlementPage, { getServerSideProps } from '@/pages/internal/settlements/new';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, dedupingInterval: 0 }}>
      <CreateSettlementPage />
    </SWRConfig>
  );

const helperTextFor = (label: string) => {
  const input = screen.getByLabelText(label);
  const describedBy = input.getAttribute('aria-describedby');

  return describedBy ? document.getElementById(describedBy) : null;
};

const fillCoordinates = (latitude: string, longitude: string) => {
  fireEvent.change(screen.getByLabelText('Географска ширина'), { target: { value: latitude } });
  fireEvent.change(screen.getByLabelText('Географска дължина'), { target: { value: longitude } });
};

describe('Create settlement page', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders the name, latitude and longitude fields with the create action', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Създаване на населено място' })).toBeInTheDocument();
    expect(screen.getByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByLabelText('Географска ширина')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Географска дължина')).toHaveAttribute('type', 'number');
    expect(screen.getByRole('button', { name: 'Създай населено място' })).toBeInTheDocument();
  });

  it('blocks submission and reports a validation error when the fields are empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Създай населено място' }));

    expect(await screen.findByText('Въведете име')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range latitude before contacting the API', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText('Име'), 'Тест');
    fillCoordinates('95', '23');
    await userEvent.click(screen.getByRole('button', { name: 'Създай населено място' }));

    await waitFor(() => expect(helperTextFor('Географска ширина')).toHaveClass('Mui-error'));
    expect(push).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range longitude before contacting the API', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText('Име'), 'Тест');
    fillCoordinates('42', '200');
    await userEvent.click(screen.getByRole('button', { name: 'Създай населено място' }));

    await waitFor(() => expect(helperTextFor('Географска дължина')).toHaveClass('Mui-error'));
    expect(push).not.toHaveBeenCalled();
  });

  it('creates the settlement with coordinates in [longitude, latitude] order and redirects on success', async () => {
    let captured: unknown;
    server.use(
      http.post('*/settlements', async ({ request }) => {
        captured = await request.json();

        return HttpResponse.json({ _id: '1', name: 'Банкя' }, { status: 201 });
      })
    );

    renderPage();

    await userEvent.type(screen.getByLabelText('Име'), 'Банкя');
    fillCoordinates('42.7', '23.15');
    await userEvent.click(screen.getByRole('button', { name: 'Създай населено място' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/settlements'));
    expect(captured).toEqual({ name: 'Банкя', coordinates: { type: 'Point', coordinates: [23.15, 42.7] } });
  });

  it('surfaces a duplicate-name error when the API responds with 409', async () => {
    server.use(
      http.post('*/settlements', () => HttpResponse.json({ message: 'taken', field: 'name' }, { status: 409 }))
    );

    renderPage();

    await userEvent.type(screen.getByLabelText('Име'), 'Банкя');
    fillCoordinates('42.7', '23.15');
    await userEvent.click(screen.getByRole('button', { name: 'Създай населено място' }));

    expect(await screen.findByText('Населено място с това име вече съществува.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('create settlement getServerSideProps', () => {
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
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Fsettlements%2Fnew', permanent: false },
    });
  });
});
