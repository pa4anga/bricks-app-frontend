import { describe, expect, it } from 'vitest';

import { shouldTrackAnalytics } from './shouldTrackAnalytics';

describe('shouldTrackAnalytics', () => {
  it.each([
    '/',
    '/prices/bricks',
    '/prices/pavement',
    '/prices/roof-tiles',
    '/prices/system-components',
    '/cookies',
    '/terms',
    '/impresum',
    '/403',
    '/404',
    '/500',
  ])('tracks public route %s', pathname => {
    expect(shouldTrackAnalytics(pathname)).toBe(true);
  });

  it.each([
    '/internal/login',
    '/internal/dashboard',
    '/internal/accounts',
    '/internal/accounts/new',
    '/internal/products/bricks',
    '/internal/config',
  ])('does not track internal route %s', pathname => {
    expect(shouldTrackAnalytics(pathname)).toBe(false);
  });
});
