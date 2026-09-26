import type { ConsentiSetup } from '@consenti/ui';

import { analyticsConsentMode, setAnalyticsConsent, suspendAnalytics } from '@/analytics';

const isAnalyticsGranted = (widget: ConsentiSetup): boolean => widget.getConsent('purpose')?.analytics === 'granted';

export const syncAnalyticsConsent = (widget: ConsentiSetup): (() => void) => {
  let active = true;

  const apply = (): void => {
    if (!active) {
      return;
    }
    const granted = isAnalyticsGranted(widget);
    setAnalyticsConsent(granted, analyticsConsentMode(granted));
  };

  widget.onReady(apply);
  widget.on('consentSubmitted', apply);

  return () => {
    active = false;
    widget.off('consentSubmitted', apply);
    suspendAnalytics();
  };
};
