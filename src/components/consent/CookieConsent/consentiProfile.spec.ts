import { describe, expect, it } from 'vitest';

import { buildOptInOverride } from './consentiProfile';

describe('buildOptInOverride', () => {
  it('offers only necessary and analytics categories in the preference modal', () => {
    const categories = buildOptInOverride().preferenceModal?.categories ?? {};

    expect(Object.keys(categories).sort()).toEqual(['analytics', 'necessary']);
  });

  it('keeps necessary cookies mandatory and analytics consent-based', () => {
    const categories = buildOptInOverride().preferenceModal?.categories;

    expect(categories?.necessary?.legalBasis).toBe('mandatory');
    expect(categories?.analytics?.legalBasis).toBe('consent');
  });

  it('marks analytics as GPC-aware so it stays denied until consent', () => {
    const cookies = buildOptInOverride().cookies;

    expect(cookies?.necessary?.purpose).toBe('necessary');
    expect(cookies?.analytics?.purpose).toBe('analytics');
    expect(cookies?.analytics?.listenGpc).toBe(true);
  });

  it('uses the canonical Consenti button ids on every surface so overrides patch instead of duplicate', () => {
    const override = buildOptInOverride();
    const canonicalConsentiButtonIds = {
      mainBanner: ['accept-all', 'manage-preferences', 'reject-optional'],
      preferenceModal: ['accept-all', 'reject-optional', 'save-preferences'],
      gpcBanner: ['accept-all', 'confirm-settings', 'manage-preferences'],
    };

    expect(Object.keys(override.mainBanner?.buttons ?? {}).sort()).toEqual(canonicalConsentiButtonIds.mainBanner);
    expect(Object.keys(override.preferenceModal?.buttons ?? {}).sort()).toEqual(
      canonicalConsentiButtonIds.preferenceModal
    );
    expect(Object.keys(override.gpcBanner?.buttons ?? {}).sort()).toEqual(canonicalConsentiButtonIds.gpcBanner);
  });

  it('localizes every override button to Bulgarian so no English text leaks from our config', () => {
    const override = buildOptInOverride();
    const buttonTexts = [override.mainBanner?.buttons, override.gpcBanner?.buttons, override.preferenceModal?.buttons]
      .flatMap(buttons => Object.values(buttons ?? {}))
      .map(button => button?.text ?? '');

    expect(buttonTexts).toHaveLength(9);
    buttonTexts.forEach(text => expect(text).toMatch(/[\u0400-\u04ff]/));
  });
});
