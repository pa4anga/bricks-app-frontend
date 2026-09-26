import { useEffect } from 'react';

import { destroyConsentiWidget, initConsentiWidget } from './consentiWidget';
import { syncAnalyticsConsent } from './syncAnalyticsConsent';

export const CookieConsentBanner = () => {
  useEffect(() => {
    const widget = initConsentiWidget();
    const unsubscribe = syncAnalyticsConsent(widget);

    return () => {
      unsubscribe();
      destroyConsentiWidget();
    };
  }, []);

  return null;
};
