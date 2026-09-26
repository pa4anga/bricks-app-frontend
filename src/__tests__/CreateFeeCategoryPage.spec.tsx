import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import CreateFeeCategoryPage, { getServerSideProps } from '@/pages/internal/fee-categories/new';

const PERCENTAGE_REQUIREMENTS = 'Процентът трябва да е число, поне 0.';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, dedupingInterval: 0 }}>
      <CreateFeeCategoryPage />
    </SWRConfig>
  );

const fillAndSubmit = async (name: string, percentage: string) => {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Име'), name);
  await user.type(screen.getByLabelText('Процент'), percentage);
  await user.click(screen.getByRole('button', { name: 'Създай категория' }));
};

const helperTextFor = (label: string) => {
  const input = screen.getByLabelText(label);
  const describedBy = input.getAttribute('aria-describedby');

  return describedBy ? document.getElementById(describedBy) : null;
};

describe('Create fee category page', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders the name and percentage fields with the create action', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Създаване на категория надценка' })).toBeInTheDocument();
    expect(screen.getByLabelText('Име')).toBeInTheDocument();
    expect(screen.getByLabelText('Процент')).toHaveAttribute('type', 'number');
    expect(screen.getByRole('button', { name: 'Създай категория' })).toBeInTheDocument();
  });

  it('blocks submission and reports validation errors when the fields are empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Създай категория' }));

    expect(await screen.findByText('Въведете име')).toBeInTheDocument();
    expect(screen.getByText('Въведете процент')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('rejects a negative percentage before contacting the API', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText('Име'), 'Стандартна');
    fireEvent.change(screen.getByLabelText('Процент'), { target: { value: '-5' } });
    await userEvent.click(screen.getByRole('button', { name: 'Създай категория' }));

    await waitFor(() => expect(helperTextFor('Процент')).toHaveClass('Mui-error'));
    expect(helperTextFor('Процент')).toHaveTextContent(PERCENTAGE_REQUIREMENTS);
    expect(push).not.toHaveBeenCalled();
  });

  it('creates the fee category and redirects to the list on success', async () => {
    server.use(
      http.post('*/fee-categories', () =>
        HttpResponse.json({ _id: '1', name: 'Стандартна', percentage: 20 }, { status: 201 })
      )
    );

    renderPage();

    await fillAndSubmit('Стандартна', '20');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/fee-categories'));
  });

  it('surfaces a duplicate-name error when the API responds with 409', async () => {
    server.use(
      http.post('*/fee-categories', () => HttpResponse.json({ message: 'taken', field: 'name' }, { status: 409 }))
    );

    renderPage();

    await fillAndSubmit('Стандартна', '20');

    expect(await screen.findByText('Категория надценка с това име вече съществува.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('create fee category getServerSideProps', () => {
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
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Ffee-categories%2Fnew', permanent: false },
    });
  });
});
