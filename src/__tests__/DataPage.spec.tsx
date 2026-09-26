import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import DataPage, { getServerSideProps } from '@/pages/internal/data';

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    query: {},
    pathname: '/internal/data',
    asPath: '/internal/data',
    isReady: true,
    events: { on: vi.fn(), off: vi.fn() },
  }),
  default: { push: vi.fn() },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <DataPage />
    </SWRConfig>
  );

const uploadTo = async (labelText: string) => {
  await userEvent.upload(screen.getByLabelText(labelText), new File(['name\nSofia'], 'data.csv', { type: 'text/csv' }));
};

describe('Data import/export page', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:csv');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the warning, import forms and export buttons', () => {
    renderPage();

    expect(screen.getByText(/Не затваряйте и не опреснявайте страницата/)).toBeInTheDocument();
    expect(screen.getByLabelText('Изберете CSV файл с локации')).toBeInTheDocument();
    expect(screen.getByLabelText('Изберете CSV файл с продукти')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Експорт на локации' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Експорт на продукти' })).toBeInTheDocument();
  });

  it('imports locations and shows a summary', async () => {
    server.use(
      http.post('*/locations/import', () => HttpResponse.json({ created: 3, updated: 1, total: 4 }, { status: 200 }))
    );

    renderPage();

    await uploadTo('Изберете CSV файл с локации');
    await userEvent.click(screen.getAllByRole('button', { name: 'Импортирай' })[0]);

    expect(await screen.findByText('Готово. Създадени: 3, обновени: 1, общо: 4.')).toBeInTheDocument();
  });

  it('imports products from the file text and shows a summary', async () => {
    server.use(
      http.post('*/products/import', () => HttpResponse.json({ created: 5, updated: 0, total: 5 }, { status: 200 }))
    );

    renderPage();

    await uploadTo('Изберете CSV файл с продукти');
    await userEvent.click(screen.getAllByRole('button', { name: 'Импортирай' })[1]);

    expect(await screen.findByText('Готово. Създадени: 5, обновени: 0, общо: 5.')).toBeInTheDocument();
  });

  it('exports locations to a downloaded CSV file', async () => {
    server.use(
      http.get(
        '*/locations/export',
        () => new HttpResponse('name\nSofia', { status: 200, headers: { 'Content-Type': 'text/csv' } })
      )
    );

    let downloadedName: string | undefined;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadedName = this.download;
    });

    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Експорт на локации' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    expect(downloadedName).toBe('locations.csv');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
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

    it('lets an authenticated user reach the page', async () => {
      fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

      expect(await getServerSideProps(buildContext('connect.sid=abc'))).toEqual({ props: {} });
    });

    it('redirects to login when unauthenticated', async () => {
      fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

      expect(await getServerSideProps(buildContext())).toEqual({
        redirect: {
          destination: `/internal/login?redirect=${encodeURIComponent('/internal/data')}`,
          permanent: false,
        },
      });
    });
  });
});
