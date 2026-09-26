import { API_BASE_URL } from '@/api/axiosInstance';
import type { Product } from '@/api/model';
import { PAVEMENT_PRODUCT_KIND } from '@/constants/productKinds';

export interface IFieldDescriptor {
  key: keyof Product;
  label: string;
  template: string;
  kinds?: string[];
}

const VALUE_PLACEHOLDER = '${value}';

export const FIELD_DESCRIPTORS: IFieldDescriptor[] = [
  { key: 'countPerPallet', label: 'Брой в палет', template: '${value}' },
  { key: 'palletWeightKg', label: 'Тегло на палет', template: '${value} кг' },
  { key: 'unitsPerSquareMeter', label: 'Брой на м²', template: '${value}' },
  { key: 'unitWeightKg', label: 'Тегло за брой', template: '${value} кг' },
  { key: 'weightPerSquareMeter', label: 'Тегло на м²', template: '${value} кг' },
  { key: 'rasterSize', label: 'Размер', template: '${value}' },
  { key: 'iconLoad', label: 'Икона (Натоварване)', template: '${value}', kinds: [PAVEMENT_PRODUCT_KIND.kind] },
  { key: 'classification', label: '* Срок на доставка', template: 'Група ${value}' },
  { key: 'minimumOrderUnits', label: '** Минимално количество на покупка', template: '${value} бр.' },
];

export const getFieldDescriptors = (product: Product): IFieldDescriptor[] =>
  FIELD_DESCRIPTORS.filter(descriptor => !descriptor.kinds || descriptor.kinds.includes(product.kind ?? ''));

const MAX_DECIMAL_PLACES = 3;

const roundToMaxDecimals = (value: number, places: number): number => Number(value.toFixed(places));

export const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    return String(roundToMaxDecimals(value, MAX_DECIMAL_PLACES));
  }
  return String(value);
};

export const applyTemplate = (template: string, value: string): string => template.split(VALUE_PLACEHOLDER).join(value);

export const buildSubtitle = (product: Product): string => {
  const parts: string[] = [];
  const variant = formatValue(product.variant);
  const sapNumber = formatValue(product.sapNumber);
  if (variant) parts.push(`вариант: ${variant}`);
  if (sapNumber) parts.push(`код: ${sapNumber}`);
  return parts.join(', ');
};

export const formatEuro = (price: number): string => `${price.toFixed(2)} €`;

export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getImageUrl = (imageId?: string): string => {
  if (!imageId) return '';
  return `${API_BASE_URL}/images/${imageId}`;
};
