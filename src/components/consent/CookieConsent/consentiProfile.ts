import type { ConsentiConfig } from '@consenti/ui';

import { CONSENT_COOKIE_EXPIRY_DAYS, cookieCategories, getCookiesByCategory } from '@/content/legal/cookieRegistry';

type OptInProfileOverride = NonNullable<NonNullable<ConsentiConfig['complianceGroupsOverride']>[string]>;

const describeCategory = (id: 'necessary' | 'analytics'): string => {
  const meta = cookieCategories.find(category => category.id === id);
  const names = getCookiesByCategory(id)
    .map(cookie => cookie.name)
    .join(', ');
  const description = meta?.description ?? '';
  return names ? `${description} Използвани бисквитки: ${names}.` : description;
};

export const buildOptInOverride = (): OptInProfileOverride => ({
  defaultLocale: 'bg',
  expiryDays: CONSENT_COOKIE_EXPIRY_DAYS,
  cookies: {
    necessary: { purpose: 'necessary', listenGpc: false },
    analytics: { purpose: 'analytics', listenGpc: true },
  },
  mainBanner: {
    position: 'bottom',
    heading: 'Ние използваме бисквитки',
    htmlText:
      'Използваме строго необходими бисквитки за работата на сайта и аналитични бисквитки, за да анализираме трафика. Аналитичните бисквитки се активират само след Вашето съгласие.',
    buttons: {
      'accept-all': { text: 'Приемам всички', style: 'primary', action: 'custom', cookies: '*' },
      'reject-optional': { text: 'Отхвърлям незадължителните', style: 'secondary', action: 'custom', cookies: '!' },
      'manage-preferences': { text: 'Управление на предпочитанията', style: 'text', action: 'manage' },
    },
  },
  gpcBanner: {
    position: 'bottom',
    heading: 'Открихме сигнал Global Privacy Control',
    htmlText:
      'Вашият браузър изпраща сигнал Global Privacy Control. Приложихме Вашето предпочитание и няма да задаваме незадължителни бисквитки, освен ако не промените настройките по-долу.',
    buttons: {
      'accept-all': { text: 'Приемам всички', style: 'primary', action: 'custom', cookies: '*' },
      'confirm-settings': { text: 'Потвърждавам настройките', style: 'secondary', action: 'custom', cookies: '!' },
      'manage-preferences': { text: 'Управление на предпочитанията', style: 'text', action: 'manage' },
    },
  },
  preferenceModal: {
    heading: 'Предпочитания за бисквитки',
    subheading: 'Изберете кои бисквитки разрешавате.',
    htmlText:
      'Строго необходимите бисквитки не могат да бъдат изключени. Аналитичните бисквитки можете да включите или изключите по всяко време.',
    position: 'center',
    showClose: true,
    categories: {
      necessary: {
        heading: 'Строго необходими бисквитки',
        htmlText: describeCategory('necessary'),
        legalBasis: 'mandatory',
        cookies: ['necessary'],
      },
      analytics: {
        heading: 'Аналитични бисквитки',
        htmlText: describeCategory('analytics'),
        legalBasis: 'consent',
        cookies: ['analytics'],
      },
    },
    buttons: {
      'accept-all': { text: 'Приемам всички', style: 'primary', action: 'custom', cookies: '*' },
      'save-preferences': { text: 'Запази избора', style: 'primary', action: 'submit' },
      'reject-optional': { text: 'Отхвърлям незадължителните', style: 'text', action: 'custom', cookies: '!' },
    },
  },
});
