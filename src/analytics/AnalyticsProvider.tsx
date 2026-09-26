import { useAnalyticsTracking } from './useAnalyticsTracking';

export const AnalyticsProvider = (): null => {
  useAnalyticsTracking();

  return null;
};
