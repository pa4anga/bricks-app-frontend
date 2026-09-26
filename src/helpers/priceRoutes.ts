export const PRICE_SYSTEM_COMPONENTS_ROUTE = '/prices/system-components';

const CATALOG_ROUTE_BY_KIND: Record<string, string> = {
  Покриви: '/prices/roof-tiles',
  Настилки: '/prices/pavement',
  Тухли: '/prices/bricks',
};

export const getCatalogRouteForKind = (kind?: string): string =>
  (kind ? CATALOG_ROUTE_BY_KIND[kind] : undefined) ?? '/';

const buildPriceQuery = (productId: string, settlement: string): string =>
  `product=${encodeURIComponent(productId)}&settlement=${encodeURIComponent(settlement)}`;

export const buildSystemComponentsHref = (productId: string, settlement: string): string =>
  `${PRICE_SYSTEM_COMPONENTS_ROUTE}?${buildPriceQuery(productId, settlement)}`;

export const buildCatalogRestoreHref = (kind: string | undefined, productId: string, settlement: string): string =>
  `${getCatalogRouteForKind(kind)}?${buildPriceQuery(productId, settlement)}`;
