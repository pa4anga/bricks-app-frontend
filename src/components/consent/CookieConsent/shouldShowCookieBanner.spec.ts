import { describe, expect, it } from 'vitest';

import { shouldShowCookieBanner } from './shouldShowCookieBanner';

describe('shouldShowCookieBanner', () => {
  it.each(['/', '/prices/bricks', '/prices/roof-tiles', '/cookies', '/terms', '/impresum', '/404', '/500'])(
    'shows the banner on the public page %s',
    pathname => {
      expect(shouldShowCookieBanner(pathname)).toBe(true);
    }
  );

  it('shows the banner on the public login page', () => {
    expect(shouldShowCookieBanner('/internal/login')).toBe(true);
  });

  it.each([
    '/internal/dashboard',
    '/internal/accounts',
    '/internal/accounts/new',
    '/internal/products/[id]/edit',
    '/internal/settlements/[name]/edit',
  ])('hides the banner on the authenticated internal page %s', pathname => {
    expect(shouldShowCookieBanner(pathname)).toBe(false);
  });
});
