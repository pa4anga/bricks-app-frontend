import { http, HttpResponse } from 'msw';
import Router from 'next/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/mocks/server';

import { AXIOS_INSTANCE, shouldRedirectToLogin } from './axiosInstance';

vi.mock('next/router', () => ({ default: { push: vi.fn() } }));

describe('shouldRedirectToLogin', () => {
  it('is true for a 401 on a non-login request while not on the login page', () => {
    expect(shouldRedirectToLogin(401, '/products/search', '/prices/bricks')).toBe(true);
  });

  it('is false when the failing request is the login call', () => {
    expect(shouldRedirectToLogin(401, '/login', '/prices/bricks')).toBe(false);
  });

  it('is false when already on the login page', () => {
    expect(shouldRedirectToLogin(401, '/products/search', '/internal/login')).toBe(false);
  });

  it('is false for non-401 statuses', () => {
    expect(shouldRedirectToLogin(400, '/products/search', '/prices/bricks')).toBe(false);
    expect(shouldRedirectToLogin(500, '/products/search', '/prices/bricks')).toBe(false);
    expect(shouldRedirectToLogin(undefined, '/products/search', '/prices/bricks')).toBe(false);
  });
});

describe('AXIOS_INSTANCE 401 interceptor', () => {
  beforeEach(() => {
    vi.mocked(Router.push).mockClear();
  });

  it('redirects to /internal/login with the current path on a 401 from a non-login request', async () => {
    server.use(http.get('*/boom', () => HttpResponse.json({ message: 'unauthorized' }, { status: 401 })));

    await expect(AXIOS_INSTANCE.get('/boom')).rejects.toBeDefined();

    expect(Router.push).toHaveBeenCalledTimes(1);
    expect(vi.mocked(Router.push).mock.calls[0][0]).toContain('/internal/login?redirect=');
  });

  it('does not redirect when the login request itself returns 401', async () => {
    server.use(http.post('*/login', () => HttpResponse.json({ message: 'bad' }, { status: 401 })));

    await expect(AXIOS_INSTANCE.post('/login', { username: 'x', password: 'y' })).rejects.toBeDefined();

    expect(Router.push).not.toHaveBeenCalled();
  });

  it('does not redirect on non-401 errors', async () => {
    server.use(http.get('*/kaboom', () => HttpResponse.json({ message: 'bad request' }, { status: 400 })));

    await expect(AXIOS_INSTANCE.get('/kaboom')).rejects.toBeDefined();

    expect(Router.push).not.toHaveBeenCalled();
  });
});
