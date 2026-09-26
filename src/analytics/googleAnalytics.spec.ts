import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MEASUREMENT_ID = 'G-TEST123';
const GTAG_SELECTOR = 'script[src^="https://www.googletagmanager.com/gtag/js"]';

const gtagMock = vi.fn();

const setPath = (pathname: string): void => {
  window.history.pushState({}, '', pathname);
};

const getInjectedScript = (): HTMLScriptElement | null => document.querySelector<HTMLScriptElement>(GTAG_SELECTOR);

const loadAnalytics = () => {
  vi.resetModules();
  return import('./googleAnalytics');
};

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', MEASUREMENT_ID);
  gtagMock.mockClear();
  window.gtag = gtagMock;
  window.dataLayer = [];
  document.querySelectorAll(GTAG_SELECTOR).forEach(script => script.remove());
  setPath('/');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  delete window.gtag;
});

describe('googleAnalytics', () => {
  it('reports configured when a measurement id is present', async () => {
    const analytics = await loadAnalytics();
    expect(analytics.isAnalyticsConfigured()).toBe(true);
  });

  it('does not load GA or track page views before consent is granted', async () => {
    const { trackPageView } = await loadAnalytics();

    trackPageView('/prices/bricks');

    expect(getInjectedScript()).toBeNull();
    expect(gtagMock).not.toHaveBeenCalled();
  });

  it('loads GA with denied defaults then grants and sends a page view on consent', async () => {
    setPath('/prices/bricks');
    const { setAnalyticsConsent } = await loadAnalytics();

    setAnalyticsConsent(true);

    expect(getInjectedScript()?.src).toContain(`id=${MEASUREMENT_ID}`);
    expect(gtagMock).toHaveBeenCalledWith(
      'consent',
      'default',
      expect.objectContaining({ analytics_storage: 'denied' })
    );
    expect(gtagMock).toHaveBeenCalledWith('config', MEASUREMENT_ID, { send_page_view: false });
    expect(gtagMock).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'granted' })
    );
    expect(gtagMock).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({ page_path: '/prices/bricks' })
    );
  });

  it('applies a Consent Mode override when provided', async () => {
    setPath('/prices/bricks');
    const { setAnalyticsConsent } = await loadAnalytics();

    setAnalyticsConsent(true, { analytics_storage: 'granted', ad_storage: 'denied' });

    expect(gtagMock).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
  });

  it('does not load GA or track on internal routes even with consent', async () => {
    setPath('/internal/dashboard');
    const { setAnalyticsConsent, trackPageView } = await loadAnalytics();

    setAnalyticsConsent(true);
    trackPageView('/internal/dashboard');

    expect(getInjectedScript()).toBeNull();
    expect(gtagMock).not.toHaveBeenCalled();
  });

  it('does not load GA or track on the login route even with consent', async () => {
    setPath('/internal/login');
    const { setAnalyticsConsent } = await loadAnalytics();

    setAnalyticsConsent(true);

    expect(getInjectedScript()).toBeNull();
    expect(gtagMock).not.toHaveBeenCalled();
  });

  it('applies consent granted on the login route once a public route loads GA', async () => {
    setPath('/internal/login');
    const analytics = await loadAnalytics();

    analytics.setAnalyticsConsent(true);

    expect(getInjectedScript()).toBeNull();
    expect(gtagMock).not.toHaveBeenCalled();

    setPath('/prices/bricks');
    analytics.trackPageView('/prices/bricks');

    expect(getInjectedScript()?.src).toContain(`id=${MEASUREMENT_ID}`);
    expect(gtagMock).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'granted' })
    );
    expect(gtagMock).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({ page_path: '/prices/bricks' })
    );
  });

  it('suspends tracking until consent is re-applied', async () => {
    setPath('/prices/bricks');
    const { setAnalyticsConsent, suspendAnalytics, trackPageView } = await loadAnalytics();

    setAnalyticsConsent(true);
    suspendAnalytics();
    gtagMock.mockClear();
    trackPageView('/prices/bricks');

    expect(gtagMock).not.toHaveBeenCalled();
  });

  it('emits a search event with the search term when consented on a public page', async () => {
    setPath('/prices/bricks');
    const { setAnalyticsConsent, trackSearch } = await loadAnalytics();

    setAnalyticsConsent(true);
    trackSearch('Тухли', { settlement: 'София' });

    expect(gtagMock).toHaveBeenCalledWith('event', 'search', { search_term: 'Тухли', settlement: 'София' });
  });

  it('does not emit a search event without consent', async () => {
    setPath('/prices/bricks');
    const { trackSearch } = await loadAnalytics();

    trackSearch('Тухли');

    expect(gtagMock).not.toHaveBeenCalled();
  });

  it('emits a button_click event with the button label when consented', async () => {
    setPath('/');
    const { setAnalyticsConsent, trackButtonClick } = await loadAnalytics();

    setAnalyticsConsent(true);
    trackButtonClick('Търсене');

    expect(gtagMock).toHaveBeenCalledWith('event', 'button_click', { button_label: 'Търсене', page_path: '/' });
  });

  it('sends a page_time event on flush after a tracked page view', async () => {
    vi.useFakeTimers();
    setPath('/prices/bricks');
    const { setAnalyticsConsent, flushPageTime } = await loadAnalytics();

    setAnalyticsConsent(true);
    vi.advanceTimersByTime(5000);
    flushPageTime();

    expect(gtagMock).toHaveBeenCalledWith('event', 'page_time', { page_path: '/prices/bricks', engagement_seconds: 5 });
  });

  it('denies analytics storage and stops tracking after consent is revoked', async () => {
    setPath('/prices/bricks');
    const { setAnalyticsConsent, trackSearch } = await loadAnalytics();

    setAnalyticsConsent(true);
    setAnalyticsConsent(false);

    expect(gtagMock).toHaveBeenLastCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'denied' })
    );

    gtagMock.mockClear();
    trackSearch('Тухли');

    expect(gtagMock).not.toHaveBeenCalled();
  });
});
