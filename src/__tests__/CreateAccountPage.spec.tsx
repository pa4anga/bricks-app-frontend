import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import CreateAccountPage, { getServerSideProps } from '@/pages/internal/accounts/new';

const PASSWORD_REQUIREMENTS = 'Паролата трябва да е поне 12 символа и да съдържа поне една главна буква и една цифра.';

const weakPasswords: Array<[string, string]> = [
  ['твърде къса', 'Ab1'],
  ['без цифра', 'Abcdefghijkl'],
  ['без главна буква', 'abcdefghij12'],
];

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/router', () => ({
  useRouter: () => ({ push, replace: vi.fn(), query: {} }),
  default: { push },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false, dedupingInterval: 0 }}>
      <CreateAccountPage />
    </SWRConfig>
  );

const fillAndSubmit = async (username: string, password: string, confirmPassword: string) => {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Потребителско име'), username);
  await user.type(screen.getByLabelText('Парола'), password);
  await user.type(screen.getByLabelText('Потвърждение на паролата'), confirmPassword);
  await user.click(screen.getByRole('button', { name: 'Създай акаунт' }));
};

const helperTextFor = (label: string) => {
  const input = screen.getByLabelText(label);
  const describedBy = input.getAttribute('aria-describedby');

  return describedBy ? document.getElementById(describedBy) : null;
};

describe('Create account page', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders the form with username, two masked password fields, and the password hint under the confirmation box', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Създаване на акаунт' })).toBeInTheDocument();
    expect(screen.getByLabelText('Потребителско име')).toBeInTheDocument();
    expect(screen.getByLabelText('Парола')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Потвърждение на паролата')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Създай акаунт' })).toBeInTheDocument();

    const confirmHint = helperTextFor('Потвърждение на паролата');
    expect(confirmHint).toHaveTextContent(PASSWORD_REQUIREMENTS);
    expect(confirmHint).not.toHaveClass('Mui-error');
  });

  it('blocks submission and reports validation errors when the fields are empty', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Създай акаунт' }));

    expect(await screen.findByText('Въведете потребителско име')).toBeInTheDocument();
    expect(screen.getByText('Въведете парола')).toBeInTheDocument();
    expect(screen.getByText('Потвърдете паролата')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('reports an error when the passwords do not match', async () => {
    renderPage();

    await fillAndSubmit('ana', 'Password1234', 'Password5678');

    expect(await screen.findByText('Паролите не съвпадат')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it.each(weakPasswords)('rejects a weak password (%s) before contacting the API', async (_label, password) => {
    renderPage();

    await fillAndSubmit('ana', password, password);

    await waitFor(() => expect(helperTextFor('Парола')).toHaveClass('Mui-error'));
    expect(helperTextFor('Парола')).toHaveTextContent(PASSWORD_REQUIREMENTS);
    expect(push).not.toHaveBeenCalled();
  });

  it('creates the account and redirects to the accounts list on success', async () => {
    server.use(http.post('*/accounts', () => HttpResponse.json({ id: '1', username: 'ana' }, { status: 201 })));

    renderPage();

    await fillAndSubmit('ana', 'Password1234', 'Password1234');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/internal/accounts'));
  });

  it('surfaces a duplicate-username error when the API responds with 409', async () => {
    server.use(
      http.post('*/accounts', () => HttpResponse.json({ message: 'taken', field: 'username' }, { status: 409 }))
    );

    renderPage();

    await fillAndSubmit('ana', 'Password1234', 'Password1234');

    expect(await screen.findByText('Потребител с това име вече съществува.')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('create account getServerSideProps', () => {
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

  it('redirects to login when unauthenticated', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const result = await getServerSideProps(buildContext());

    expect(result).toEqual({
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Faccounts%2Fnew', permanent: false },
    });
  });
});
