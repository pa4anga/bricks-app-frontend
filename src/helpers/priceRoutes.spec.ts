import { describe, expect, it } from 'vitest';

import {
  PRICE_SYSTEM_COMPONENTS_ROUTE,
  buildCatalogRestoreHref,
  buildSystemComponentsHref,
  getCatalogRouteForKind,
} from './priceRoutes';

describe('priceRoutes', () => {
  it('maps known product kinds to their catalog route and falls back to home', () => {
    expect(getCatalogRouteForKind('Покриви')).toBe('/prices/roof-tiles');
    expect(getCatalogRouteForKind('Настилки')).toBe('/prices/pavement');
    expect(getCatalogRouteForKind('Тухли')).toBe('/prices/bricks');
    expect(getCatalogRouteForKind('Непознат')).toBe('/');
    expect(getCatalogRouteForKind(undefined)).toBe('/');
  });

  it('builds the system-components href with encoded params', () => {
    expect(buildSystemComponentsHref('p1', 'София')).toBe(
      `${PRICE_SYSTEM_COMPONENTS_ROUTE}?product=p1&settlement=${encodeURIComponent('София')}`
    );
  });

  it('builds a catalog restore href for the product kind', () => {
    expect(buildCatalogRestoreHref('Покриви', 'p1', 'София')).toBe(
      `/prices/roof-tiles?product=p1&settlement=${encodeURIComponent('София')}`
    );
  });
});
