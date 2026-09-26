export type CookieCategoryId = 'necessary' | 'analytics';

export interface ICookieCategoryMeta {
  id: CookieCategoryId;
  label: string;
  description: string;
}

export interface ICookieDefinition {
  name: string;
  category: CookieCategoryId;
  provider: string;
  purpose: string;
  duration: string;
}

export const CONSENT_COOKIE_NAME = 'wb_consent';
export const CONSENT_COOKIE_EXPIRY_DAYS = 365;

export const cookieCategories: ICookieCategoryMeta[] = [
  {
    id: 'necessary',
    label: 'Строго необходими бисквитки',
    description:
      'Тези бисквитки са необходими за основното функциониране на сайта и за запазване на Вашия избор за съгласие. Те не могат да бъдат изключени.',
  },
  {
    id: 'analytics',
    label: 'Аналитични бисквитки',
    description:
      'Тези бисквитки ни помагат да разберем как посетителите използват сайта, за да подобряваме съдържанието и неговата работа. Активират се единствено след Вашето изрично съгласие.',
  },
];

export const cookieRegistry: ICookieDefinition[] = [
  {
    name: CONSENT_COOKIE_NAME,
    category: 'necessary',
    provider: 'wienerberger.bg (първа страна)',
    purpose:
      'Съхранява Вашия избор за съгласие за бисквитки, за да не се показва отново банерът при следващите Ви посещения.',
    duration: '1 година',
  },
  {
    name: '_ga',
    category: 'analytics',
    provider: 'Google Analytics (Google Ireland Ltd.)',
    purpose:
      'Регистрира уникален идентификатор, който се използва за генериране на обобщени статистически данни за начина, по който посетителите използват сайта.',
    duration: '2 години',
  },
  {
    name: '_ga_<идентификатор на потока>',
    category: 'analytics',
    provider: 'Google Analytics (Google Ireland Ltd.)',
    purpose: 'Използва се от Google Analytics 4 за запазване и възстановяване на състоянието на сесията.',
    duration: '2 години',
  },
];

export const getCookiesByCategory = (category: CookieCategoryId): ICookieDefinition[] =>
  cookieRegistry.filter(cookie => cookie.category === category);
