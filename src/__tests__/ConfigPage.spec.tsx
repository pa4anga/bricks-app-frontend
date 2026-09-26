import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import ConfigPage, { getServerSideProps } from '@/pages/internal/config';

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <ConfigPage />
    </SWRConfig>
  );

describe('Config page', () => {
  beforeEach(() => {
    server.use(http.get('*/config', () => HttpResponse.json({ _id: '1', vat: 20 }, { status: 200 })));
  });

  it('loads the current VAT value into the text box', async () => {
    renderPage();

    expect(await screen.findByLabelText('ДДС (%)')).toHaveValue('20');
  });

  it('only allows numeric and fractional characters to be typed into the VAT box', async () => {
    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText('ДДС (%)');
    await user.clear(input);
    await user.type(input, '12.5abc');

    expect(input).toHaveValue('12.5');
  });

  it('sends the entered VAT to the backend and confirms success', async () => {
    let captured: unknown;
    server.use(
      http.patch('*/config', async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ _id: '1', vat: 22.5 }, { status: 200 });
      })
    );

    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText('ДДС (%)');
    await user.clear(input);
    await user.type(input, '22.5');
    await user.click(screen.getByRole('button', { name: 'Приложи' }));

    expect(await screen.findByText('Настройките са запазени.')).toBeInTheDocument();
    expect(captured).toEqual({ vat: 22.5 });
  });

  it('rejects an incomplete number before contacting the backend', async () => {
    const patch = vi.fn();
    server.use(
      http.patch('*/config', () => {
        patch();

        return HttpResponse.json({ _id: '1', vat: 0 }, { status: 200 });
      })
    );

    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText('ДДС (%)');
    await user.clear(input);
    await user.type(input, '.');
    await user.click(screen.getByRole('button', { name: 'Приложи' }));

    expect(await screen.findByText('Въведете валидно число.')).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });

  it('surfaces an error when the backend rejects the update', async () => {
    server.use(http.patch('*/config', () => HttpResponse.json({ message: 'bad' }, { status: 400 })));

    const user = userEvent.setup();
    renderPage();

    const input = await screen.findByLabelText('ДДС (%)');
    await user.clear(input);
    await user.type(input, '25');
    await user.click(screen.getByRole('button', { name: 'Приложи' }));

    expect(await screen.findByText('Неуспешно запазване на настройките.')).toBeInTheDocument();
  });
});

describe('config getServerSideProps', () => {
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
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Fconfig', permanent: false },
    });
  });
});
