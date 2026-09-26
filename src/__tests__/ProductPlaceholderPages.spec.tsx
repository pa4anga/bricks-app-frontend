import { render, screen } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductPlaceholder } from '@/components/products';
import { getServerSideProps as editProductProps } from '@/pages/internal/products/[id]/edit';
import { getServerSideProps as viewProductProps } from '@/pages/internal/products/[id]/index';
import { getServerSideProps as createRoofProductProps } from '@/pages/internal/products/roofs/new';

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), query: {} }),
  default: { push: vi.fn() },
}));

describe('ProductPlaceholder', () => {
  it('renders the heading and the message', () => {
    render(<ProductPlaceholder title="Преглед" heading="Преглед на продукт" message="Очаквайте скоро" />);

    expect(screen.getByRole('heading', { name: 'Преглед на продукт' })).toBeInTheDocument();
    expect(screen.getByText('Очаквайте скоро')).toBeInTheDocument();
  });
});

describe('product placeholder getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string, id?: string) =>
    ({ req: { headers: { cookie } }, params: id ? { id } : undefined }) as unknown as GetServerSidePropsContext;

  it('lets an authenticated user reach the create placeholder', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    expect(await createRoofProductProps(buildContext('connect.sid=abc'))).toEqual({ props: {} });
  });

  it('redirects the create placeholder to login when unauthenticated', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    expect(await createRoofProductProps(buildContext())).toEqual({
      redirect: {
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/roofs/new')}`,
        permanent: false,
      },
    });
  });

  it('redirects the view placeholder back to the same product after login', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    expect(await viewProductProps(buildContext(undefined, 'p1'))).toEqual({
      redirect: {
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/p1')}`,
        permanent: false,
      },
    });
  });

  it('redirects the edit placeholder back to the same product edit route after login', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    expect(await editProductProps(buildContext(undefined, 'p1'))).toEqual({
      redirect: {
        destination: `/internal/login?redirect=${encodeURIComponent('/internal/products/p1/edit')}`,
        permanent: false,
      },
    });
  });
});
