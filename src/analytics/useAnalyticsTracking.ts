import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { flushPageTime, isAnalyticsConfigured, trackButtonClick, trackPageView } from './googleAnalytics';

const getButtonLabel = (element: HTMLElement): string => {
  const ariaLabel = element.getAttribute('aria-label');
  const raw = ariaLabel ?? element.textContent ?? '';
  return raw.replace(/\s+/g, ' ').trim();
};

export const useAnalyticsTracking = (): void => {
  const router = useRouter();

  useEffect(() => {
    if (!isAnalyticsConfigured()) {
      return;
    }

    const handleRouteChangeStart = (): void => {
      flushPageTime();
    };

    const handleRouteChangeComplete = (url: string): void => {
      trackPageView(url);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events]);

  useEffect(() => {
    if (!isAnalyticsConfigured()) {
      return;
    }

    const handleClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLElement>('button, [role="button"]');
      if (!button) {
        return;
      }
      const label = getButtonLabel(button);
      if (label) {
        trackButtonClick(label);
      }
    };

    const handlePageHide = (): void => {
      flushPageTime();
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);
};
