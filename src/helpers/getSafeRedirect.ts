import { INTERNAL_ROUTE_PREFIX } from '@/constants/routes';

export const getSafeRedirect = (value: string | string[] | undefined): string | undefined => {
  const path = Array.isArray(value) ? value[0] : value;

  if (!path || !path.startsWith(INTERNAL_ROUTE_PREFIX) || path.includes('\\')) {
    return undefined;
  }

  return path;
};
