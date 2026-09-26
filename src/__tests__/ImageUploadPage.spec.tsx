import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { GetServerSidePropsContext } from 'next';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';
import ImageUploadPage, { getServerSideProps } from '@/pages/internal/images/upload';

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    query: {},
    pathname: '/internal/images/upload',
    asPath: '/internal/images/upload',
    isReady: true,
    events: { on: vi.fn(), off: vi.fn() },
  }),
  default: { push: vi.fn() },
}));

const renderPage = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>
      <ImageUploadPage />
    </SWRConfig>
  );

const getFileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;

describe('Image upload page', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the image upload form', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Качване на изображение' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Качи' })).toBeInTheDocument();
  });

  it('uploads the selected image and shows the returned id', async () => {
    server.use(http.post('*/images', () => HttpResponse.json({ id: 'img_42' }, { status: 201 })));

    const { container } = renderPage();

    await userEvent.upload(getFileInput(container), new File(['x'], 'photo.png', { type: 'image/png' }));
    await userEvent.click(screen.getByRole('button', { name: 'Качи' }));

    expect(await screen.findByText('img_42')).toBeInTheDocument();
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
          destination: `/internal/login?redirect=${encodeURIComponent('/internal/images/upload')}`,
          permanent: false,
        },
      });
    });
  });
});
