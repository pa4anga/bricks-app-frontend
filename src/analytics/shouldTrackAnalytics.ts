import { INTERNAL_ROUTE_PREFIX } from '@/constants/routes';

export const shouldTrackAnalytics = (pathname: string): boolean => !pathname.startsWith(INTERNAL_ROUTE_PREFIX);
