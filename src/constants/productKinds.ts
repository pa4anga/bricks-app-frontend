export interface IProductKind {
  kind: string;
  slug: string;
  label: string;
  showSystem: boolean;
  showVariant: boolean;
  showUnitsPerSquareMeter: boolean;
  showIconLoad: boolean;
  variantLabel?: string;
}

export const BRICK_PRODUCT_KIND: IProductKind = {
  kind: 'Тухли',
  slug: 'bricks',
  label: 'Тухли',
  showSystem: false,
  showVariant: false,
  showUnitsPerSquareMeter: false,
  showIconLoad: false,
};

export const ROOF_PRODUCT_KIND: IProductKind = {
  kind: 'Покриви',
  slug: 'roofs',
  label: 'Покриви',
  showSystem: true,
  showVariant: true,
  showUnitsPerSquareMeter: true,
  showIconLoad: false,
  variantLabel: 'Цвят',
};

export const PAVEMENT_PRODUCT_KIND: IProductKind = {
  kind: 'Настилки',
  slug: 'pavements',
  label: 'Настилки',
  showSystem: true,
  showVariant: true,
  showUnitsPerSquareMeter: true,
  showIconLoad: true,
  variantLabel: 'Вариант',
};

export const PRODUCT_KINDS: IProductKind[] = [BRICK_PRODUCT_KIND, ROOF_PRODUCT_KIND, PAVEMENT_PRODUCT_KIND];

export const getProductKindByKind = (kind: string | undefined): IProductKind | undefined =>
  PRODUCT_KINDS.find(productKind => productKind.kind === kind);
