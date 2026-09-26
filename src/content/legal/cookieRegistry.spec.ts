import { describe, expect, it } from 'vitest';

import {
  CONSENT_COOKIE_EXPIRY_DAYS,
  CONSENT_COOKIE_NAME,
  cookieRegistry,
  getCookiesByCategory,
} from './cookieRegistry';

describe('cookieRegistry', () => {
  it('declares only strictly-necessary and analytics categories', () => {
    const categories = [...new Set(cookieRegistry.map(cookie => cookie.category))].sort();

    expect(categories).toEqual(['analytics', 'necessary']);
  });

  it('registers the consent cookie as strictly necessary', () => {
    const consentCookie = cookieRegistry.find(cookie => cookie.name === CONSENT_COOKIE_NAME);

    expect(consentCookie?.category).toBe('necessary');
  });

  it('registers Google Analytics cookies under the analytics category', () => {
    const analyticsCookies = getCookiesByCategory('analytics');

    expect(analyticsCookies.length).toBeGreaterThan(0);
    expect(analyticsCookies.map(cookie => cookie.name)).toContain('_ga');
    expect(analyticsCookies.every(cookie => cookie.provider.includes('Google'))).toBe(true);
  });

  it('expires the consent decision after one year', () => {
    expect(CONSENT_COOKIE_EXPIRY_DAYS).toBe(365);
  });
});
