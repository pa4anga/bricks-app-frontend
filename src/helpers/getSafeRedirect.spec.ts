import { describe, expect, it } from 'vitest';

import { getSafeRedirect } from './getSafeRedirect';

describe('getSafeRedirect', () => {
  it('returns a safe same-origin internal path', () => {
    expect(getSafeRedirect('/internal/accounts')).toBe('/internal/accounts');
    expect(getSafeRedirect('/internal/accounts?foo=1')).toBe('/internal/accounts?foo=1');
  });

  it('uses the first value when given an array', () => {
    expect(getSafeRedirect(['/internal/a', '/internal/b'])).toBe('/internal/a');
  });

  it('rejects protocol-relative, absolute, and backslash paths', () => {
    expect(getSafeRedirect('//evil.com')).toBeUndefined();
    expect(getSafeRedirect('https://evil.com')).toBeUndefined();
    expect(getSafeRedirect('/\\evil.com')).toBeUndefined();
    expect(getSafeRedirect('/internal/\\evil.com')).toBeUndefined();
  });

  it('rejects same-origin paths outside the internal area', () => {
    expect(getSafeRedirect('/prices/bricks')).toBeUndefined();
    expect(getSafeRedirect('/terms')).toBeUndefined();
    expect(getSafeRedirect('/')).toBeUndefined();
    expect(getSafeRedirect('/internal')).toBeUndefined();
    expect(getSafeRedirect('/internalx')).toBeUndefined();
  });

  it('returns undefined for empty or non-relative values', () => {
    expect(getSafeRedirect(undefined)).toBeUndefined();
    expect(getSafeRedirect('')).toBeUndefined();
    expect(getSafeRedirect('relative/path')).toBeUndefined();
  });
});
