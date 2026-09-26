import { ConsentiSetup } from '@consenti/ui';
import type { ConsentiConfig } from '@consenti/ui';
import { setConsentiWidget } from '@consenti/ui/react';

import { API_BASE_URL } from '@/api/axiosInstance';
import { CONSENT_COOKIE_NAME } from '@/content/legal/cookieRegistry';

import { buildOptInOverride } from './consentiProfile';

const TENANT_ID = 'default';
const COMPLIANCE_GROUP = 'opt-in';

export const buildConsentiConfig = (): ConsentiConfig => ({
  core: {
    locale: 'bg',
    storage: 'cookie',
    cookieName: CONSENT_COOKIE_NAME,
    usePrebuiltProfiles: 'all',
    theme: {
      colorPrimary: '#b30000',
      colorPrimaryText: '#ffffff',
      fontFamily: '"Noto Sans", sans-serif',
    },
  },
  api: {
    enabled: true,
    baseUrl: API_BASE_URL,
    tenantId: TENANT_ID,
    complianceGroup: COMPLIANCE_GROUP,
  },
  complianceGroupsOverride: {
    [COMPLIANCE_GROUP]: buildOptInOverride(),
  },
  hidePoweredBy: true,
});

let widget: ConsentiSetup | null = null;

const registerWidget = (instance: ConsentiSetup): void => {
  // @consenti/ui and @consenti/ui/react ship separate, structurally identical declarations of
  // ConsentiSetup (distinct private fields), so bridge that nominal mismatch in this one place.
  setConsentiWidget(instance as unknown as Parameters<typeof setConsentiWidget>[0]);
};

export const initConsentiWidget = (): ConsentiSetup => {
  widget ??= new ConsentiSetup(buildConsentiConfig());
  registerWidget(widget);
  return widget;
};

export const destroyConsentiWidget = (): void => {
  widget?.destroy();
  widget = null;
};
