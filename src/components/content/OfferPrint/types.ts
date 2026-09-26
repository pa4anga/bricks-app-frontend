import type { Product, ProductPricing } from '@/api/model';

export interface IOfferPrintProps {
  product: Product;
  pricing: ProductPricing;
  settlementName: string;
  issuedAt?: Date;
}
