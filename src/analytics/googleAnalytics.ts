import { shouldTrackAnalytics } from './shouldTrackAnalytics';

export type ConsentSignal = 'granted' | 'denied';

export interface ConsentModeUpdate {
  analytics_storage: ConsentSignal;
  ad_storage?: ConsentSignal;
  ad_user_data?: ConsentSignal;
  ad_personalization?: ConsentSignal;
}

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const MAX_LABEL_LENGTH = 100;
const GTAG_LIBRARY_SRC = 'https://www.googletagmanager.com/gtag/js';
const CONSENT_UPDATE_WAIT_MS = 500;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let libraryLoaded = false;
let consentModeBootstrapped = false;
let consentGranted = false;
let currentConsentMode: ConsentModeUpdate | null = null;
let timedPathname: string | null = null;
let pageEnteredAt = 0;

export const isAnalyticsConfigured = (): boolean => Boolean(MEASUREMENT_ID);

export const analyticsConsentMode = (granted: boolean): ConsentModeUpdate => ({
  analytics_storage: granted ? 'granted' : 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
});

const getPathname = (): string => (typeof window === 'undefined' ? '' : window.location.pathname);

const getRelativeUrl = (): string =>
  typeof window === 'undefined' ? '' : `${window.location.pathname}${window.location.search}`;

const canTrack = (pathname: string): boolean =>
  Boolean(MEASUREMENT_ID) && consentGranted && shouldTrackAnalytics(pathname);

const ensureGtag = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    window.gtag = function gtag(): void {
      // gtag.js consumes the raw `arguments` object from the dataLayer queue; a rest-parameter
      // array is not an equivalent command shape, so the canonical stub is required here.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
};

const gtag = (...args: unknown[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  ensureGtag();
  window.gtag?.(...args);
};

const setGaDisableFlag = (disabled: boolean): void => {
  if (typeof window === 'undefined' || !MEASUREMENT_ID) {
    return;
  }
  Reflect.set(window, `ga-disable-${MEASUREMENT_ID}`, disabled);
};

const expireGaCookies = (): void => {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie
    .split(';')
    .map(entry => entry.split('=')[0].trim())
    .filter(name => name === '_ga' || name.startsWith('_ga_'))
    .forEach(name => {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    });
};

const bootstrapConsentMode = (): void => {
  if (consentModeBootstrapped) {
    return;
  }
  // Consent Mode v2: default every storage to denied before the library initialises.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: CONSENT_UPDATE_WAIT_MS,
  });
  gtag('js', new Date());
  consentModeBootstrapped = true;
};

const loadLibrary = (): void => {
  if (libraryLoaded || !MEASUREMENT_ID || typeof document === 'undefined') {
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `${GTAG_LIBRARY_SRC}?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
  gtag('config', MEASUREMENT_ID, { send_page_view: false });
  libraryLoaded = true;
};

const ensureInitialized = (): void => {
  if (libraryLoaded || !MEASUREMENT_ID) {
    return;
  }
  bootstrapConsentMode();
  if (currentConsentMode) {
    gtag('consent', 'update', currentConsentMode);
  }
  loadLibrary();
};

const withoutEmptyValues = (params: AnalyticsEventParams): AnalyticsEventParams =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));

export const trackPageView = (url: string): void => {
  const [pathname] = url.split('?');
  if (!canTrack(pathname)) {
    return;
  }
  ensureInitialized();
  gtag('event', 'page_view', {
    page_path: url,
    page_location: typeof window === 'undefined' ? url : window.location.href,
  });
  timedPathname = pathname;
  pageEnteredAt = Date.now();
};

export const trackSearch = (searchTerm: string, params: AnalyticsEventParams = {}): void => {
  const term = searchTerm.trim();
  if (!term || !canTrack(getPathname())) {
    return;
  }
  ensureInitialized();
  gtag('event', 'search', withoutEmptyValues({ search_term: term, ...params }));
};

export const trackButtonClick = (label: string, params: AnalyticsEventParams = {}): void => {
  const buttonLabel = label.trim().slice(0, MAX_LABEL_LENGTH);
  if (!buttonLabel || !canTrack(getPathname())) {
    return;
  }
  ensureInitialized();
  gtag('event', 'button_click', withoutEmptyValues({ button_label: buttonLabel, page_path: getPathname(), ...params }));
};

export const flushPageTime = (): void => {
  if (!timedPathname || !pageEnteredAt) {
    return;
  }
  const pathname = timedPathname;
  const seconds = Math.round((Date.now() - pageEnteredAt) / 1000);
  timedPathname = null;
  pageEnteredAt = 0;
  if (seconds <= 0 || !canTrack(pathname)) {
    return;
  }
  ensureInitialized();
  gtag('event', 'page_time', { page_path: pathname, engagement_seconds: seconds });
};

export const suspendAnalytics = (): void => {
  consentGranted = false;
  timedPathname = null;
  pageEnteredAt = 0;
};

export const setAnalyticsConsent = (granted: boolean, consentMode?: ConsentModeUpdate): void => {
  consentGranted = granted;
  currentConsentMode = consentMode ?? analyticsConsentMode(granted);
  setGaDisableFlag(!granted);

  if (!granted) {
    if (consentModeBootstrapped) {
      gtag('consent', 'update', currentConsentMode);
    }
    expireGaCookies();
    timedPathname = null;
    pageEnteredAt = 0;
    return;
  }

  if (!canTrack(getPathname())) {
    return;
  }
  const wasLoaded = libraryLoaded;
  ensureInitialized();
  if (wasLoaded) {
    gtag('consent', 'update', currentConsentMode);
  }
  trackPageView(getRelativeUrl());
};
