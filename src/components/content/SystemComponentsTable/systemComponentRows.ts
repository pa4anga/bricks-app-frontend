import type { Product, ProductPricing } from '@/api/model';
import { formatEuro } from '@/components/content/ProductInfo/productFields';

import type { ISystemComponentGroup, ISystemComponentRow } from './types';

const ROOF_TILES_KIND = 'Покриви';
const FALLBACK_PRODUCT_GROUP = 'Продукт';
const FALLBACK_COMPONENT_GROUP = 'Други';

export const MISSING_PRICE = '—';

const formatOptionalEuro = (price: number | undefined): string | undefined =>
  price !== undefined ? formatEuro(price) : undefined;

export const formatRowLabel = (
  name: string | undefined,
  variant: string | undefined,
  kind: string | undefined
): string => {
  const base = name ?? '';
  if (!variant) {
    return base;
  }
  return kind === ROOF_TILES_KIND ? `${base} (цвят: ${variant})` : `${base} ${variant}`;
};

export const buildSystemComponentGroups = (product: Product, pricing: ProductPricing): ISystemComponentGroup[] => {
  const pricingByName = new Map(pricing.systemComponents.map(component => [component.name, component]));

  const groups: ISystemComponentGroup[] = [];
  const groupIndexByLabel = new Map<string, number>();

  const addRow = (groupLabel: string, row: ISystemComponentRow) => {
    const existingIndex = groupIndexByLabel.get(groupLabel);
    if (existingIndex !== undefined) {
      groups[existingIndex].rows.push(row);
      return;
    }
    groupIndexByLabel.set(groupLabel, groups.length);
    groups.push({ label: groupLabel, rows: [row] });
  };

  addRow(product.subtype || FALLBACK_PRODUCT_GROUP, {
    label: formatRowLabel(product.name, product.variant, product.kind),
    pricePerUnit: formatOptionalEuro(pricing.pricePerUnit),
    pricePerSquareMeter: formatOptionalEuro(pricing.pricePerSquareMeter),
  });

  for (const component of product.systemComponents ?? []) {
    const componentPricing = component.name !== undefined ? pricingByName.get(component.name) : undefined;
    addRow(component.kind || FALLBACK_COMPONENT_GROUP, {
      label: formatRowLabel(component.name, product.variant, product.kind),
      pricePerUnit: formatOptionalEuro(componentPricing?.pricePerUnit),
      pricePerSquareMeter: formatOptionalEuro(componentPricing?.pricePerSquareMeter),
    });
  }

  return groups;
};

export interface IPriceColumnVisibility {
  showPricePerUnit: boolean;
  showPricePerSquareMeter: boolean;
}

export const getPriceColumnVisibility = (groups: ISystemComponentGroup[]): IPriceColumnVisibility => ({
  showPricePerUnit: groups.some(group => group.rows.some(row => row.pricePerUnit !== undefined)),
  showPricePerSquareMeter: groups.some(group => group.rows.some(row => row.pricePerSquareMeter !== undefined)),
});
