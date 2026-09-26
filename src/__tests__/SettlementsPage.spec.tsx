import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import SettlementsPage, { getServerSideProps } from '@/pages/internal/settlements';

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <SettlementsPage />
    </SWRConfig>
  );

const settlementFor = (page: string) => ({
  _id: `id-${page}`,
  name: `Населено място стр. ${page}`,
  coordinates: { type: 'Point', coordinates: [23, 42] },
});

describe('Settlements page', () => {
  const requestedPages: string[] = [];

  beforeEach(() => {
    requestedPages.length = 0;
    server.use(
      http.get('*/settlements/count', () => HttpResponse.json({ total: 300 }, { status: 200 })),
      http.get('*/settlements', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        requestedPages.push(page);

        return HttpResponse.json([settlementFor(page)], { status: 200 });
      })
    );
  });

  it('lists the settlements returned by the API', async () => {
    renderPage();

    expect(await screen.findByText('Населено място стр. 1')).toBeInTheDocument();
  });

  it('links the create button to the create page', async () => {
    renderPage();
    await screen.findByText('Населено място стр. 1');

    expect(screen.getByRole('link', { name: 'Създай населено място' })).toHaveAttribute(
      'href',
      '/internal/settlements/new'
    );
  });

  it('derives ten page buttons from the count endpoint', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: 'Страница 10' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Страница 11' })).not.toBeInTheDocument();
  });

  it('requests the selected page when a page button is clicked', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'Страница 2' });

    await userEvent.click(screen.getByRole('button', { name: 'Страница 2' }));

    expect(await screen.findByText('Населено място стр. 2')).toBeInTheDocument();
    expect(requestedPages).toContain('2');
  });

  it('jumps to a specific page through the jump field', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'Страница 10' });

    fireEvent.change(screen.getByLabelText('Към страница'), { target: { value: '7' } });
    await userEvent.click(screen.getByRole('button', { name: 'Отиди' }));

    expect(await screen.findByText('Населено място стр. 7')).toBeInTheDocument();
  });

  it('goes to the last page via the end button', async () => {
    renderPage();
    await screen.findByRole('button', { name: 'Страница 10' });

    await userEvent.click(screen.getByRole('button', { name: 'Последна страница' }));

    expect(await screen.findByText('Населено място стр. 10')).toBeInTheDocument();
  });
});

describe('settlements getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) => ({ req: { headers: { cookie } } }) as unknown as GetServerSidePropsContext;

  it('forwards the cookie and lets an authenticated user through', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    const result = await getServerSideProps(buildContext('connect.sid=abc'));

    expect(result).toEqual({ props: {} });
  });

  it('redirects to login when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const result = await getServerSideProps(buildContext());

    expect(result).toEqual({
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Fsettlements', permanent: false },
    });
  });
});
