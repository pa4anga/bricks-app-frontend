import { describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@/api/axiosInstance';
import { CONSENT_COOKIE_NAME } from '@/content/legal/cookieRegistry';

import { buildConsentiConfig } from './consentiWidget';

describe('buildConsentiConfig', () => {
  it('enables API mode against the default tenant and opt-in group', () => {
    const { api } = buildConsentiConfig();

    expect(api?.enabled).toBe(true);
    expect(api?.tenantId).toBe('default');
    expect(api?.complianceGroup).toBe('opt-in');
  });

  it('targets the same backend base URL as the generated API client', () => {
    expect(buildConsentiConfig().api?.baseUrl).toBe(API_BASE_URL);
  });

  it('preserves the Bulgarian opt-in copy as a compliance-group override', () => {
    const override = buildConsentiConfig().complianceGroupsOverride?.['opt-in'];

    expect(override?.mainBanner?.heading).toBe('Ние използваме бисквитки');
    expect(Object.keys(override?.preferenceModal?.categories ?? {}).sort()).toEqual(['analytics', 'necessary']);
  });

  it('stores consent under the registered cookie name', () => {
    expect(buildConsentiConfig().core?.cookieName).toBe(CONSENT_COOKIE_NAME);
  });
});
