import { render, screen } from '@testing-library/react';
import type { GetServerSidePropsContext } from 'next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardPage, { getServerSideProps } from '@/pages/internal/dashboard';

describe('Dashboard page', () => {
  it('greets the authenticated user', () => {
    render(<DashboardPage username="ivan" />);

    expect(screen.getByRole('heading', { name: 'Welcome ivan' })).toBeInTheDocument();
  });
});

describe('dashboard getServerSideProps', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildContext = (cookie?: string) => ({ req: { headers: { cookie } } }) as unknown as GetServerSidePropsContext;

  it('forwards the session cookie and returns the username when authenticated', async () => {
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => ({ username: 'ivan' }) });

    const result = await getServerSideProps(buildContext('connect.sid=abc'));

    expect(result).toEqual({ props: { username: 'ivan' } });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/accounts/me'),
      expect.objectContaining({ headers: { cookie: 'connect.sid=abc', 'x-forwarded-proto': 'https' } })
    );
  });

  it('redirects to the login page when the session is missing', async () => {
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const result = await getServerSideProps(buildContext());

    expect(result).toEqual({
      redirect: { destination: '/internal/login?redirect=%2Finternal%2Fdashboard', permanent: false },
    });
  });
});
