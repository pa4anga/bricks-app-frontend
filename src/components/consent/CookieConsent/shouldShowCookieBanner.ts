import { INTERNAL_LOGIN_ROUTE, INTERNAL_ROUTE_PREFIX } from '@/constants/routes';

export const shouldShowCookieBanner = (pathname: string): boolean =>
  !pathname.startsWith(INTERNAL_ROUTE_PREFIX) || pathname === INTERNAL_LOGIN_ROUTE;
