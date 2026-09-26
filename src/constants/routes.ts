export const INTERNAL_ROUTE_PREFIX = '/internal/';
export const INTERNAL_LOGIN_ROUTE = '/internal/login';
export const INTERNAL_DASHBOARD_ROUTE = '/internal/dashboard';
export const INTERNAL_ACCOUNTS_ROUTE = '/internal/accounts';
export const INTERNAL_ACCOUNT_CREATE_ROUTE = '/internal/accounts/new';
export const INTERNAL_SOURCE_LOCATIONS_ROUTE = '/internal/source-locations';
export const INTERNAL_SOURCE_LOCATION_CREATE_ROUTE = '/internal/source-locations/new';
export const INTERNAL_SOURCE_LOCATION_EDIT_ROUTE = (name: string) =>
  `/internal/source-locations/${encodeURIComponent(name)}/edit`;
export const INTERNAL_FEE_CATEGORIES_ROUTE = '/internal/fee-categories';
export const INTERNAL_FEE_CATEGORY_CREATE_ROUTE = '/internal/fee-categories/new';
export const INTERNAL_FEE_CATEGORY_EDIT_ROUTE = (name: string) =>
  `/internal/fee-categories/${encodeURIComponent(name)}/edit`;
export const INTERNAL_SETTLEMENTS_ROUTE = '/internal/settlements';
export const INTERNAL_SETTLEMENT_CREATE_ROUTE = '/internal/settlements/new';
export const INTERNAL_SETTLEMENT_EDIT_ROUTE = (name: string) =>
  `/internal/settlements/${encodeURIComponent(name)}/edit`;
export const INTERNAL_LOCATIONS_ROUTE = '/internal/locations';
export const INTERNAL_LOCATION_CREATE_ROUTE = '/internal/locations/new';
export const INTERNAL_LOCATION_EDIT_ROUTE = (id: string) => `/internal/locations/${encodeURIComponent(id)}/edit`;
export const INTERNAL_PRODUCTS_ROUTE = '/internal/products';
export const INTERNAL_PRODUCT_LIST_ROUTE = (slug: string) => `/internal/products/${slug}`;
export const INTERNAL_PRODUCT_CREATE_ROUTE = (slug: string) => `/internal/products/${slug}/new`;
export const INTERNAL_PRODUCT_CREATE_VARIANT_ROUTE = (slug: string, id: string) =>
  `/internal/products/${slug}/new?from=${encodeURIComponent(id)}`;
export const INTERNAL_PRODUCT_VIEW_ROUTE = (id: string) => `/internal/products/${encodeURIComponent(id)}`;
export const INTERNAL_PRODUCT_EDIT_ROUTE = (id: string) => `/internal/products/${encodeURIComponent(id)}/edit`;
export const INTERNAL_CONFIG_ROUTE = '/internal/config';
export const INTERNAL_DATA_ROUTE = '/internal/data';
export const INTERNAL_IMAGE_UPLOAD_ROUTE = '/internal/images/upload';
