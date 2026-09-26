import type { Product, ProductPricing } from '@/api/model';

export interface IProductInfoProps {
  product: Product;
  pricing: ProductPricing;
  settlementName: string;
  issuedAt?: Date;
}
