import type { FormEvent, ReactNode, RefObject } from 'react';

import type { Product, ProductPricing, Settlement } from '@/api/model';
import type { ISelectButtonHandle } from '@/components/common';

export type ProductCascadeField = 'subtype' | 'system';

export interface ICascadeLevel {
  field: ProductCascadeField;
  label: string;
}

export interface ISelectOption<T> {
  name: string;
  value: T;
}

export interface IInitialSelection {
  productId: string;
  settlement: string;
}

export interface IPriceRequest {
  id: string;
  settlement: string;
  product: ISelectOption<Product>;
}

export interface IPriceResult {
  pricing: ProductPricing;
  product: ISelectOption<Product>;
  settlementName: string;
}

export interface ISearchFormState {
  selections: (ISelectOption<string> | null)[];
  levelOptions: ISelectOption<string>[][];
  levelRefs: RefObject<(ISelectButtonHandle<ISelectOption<string>> | null)[]>;
  product: ISelectOption<Product> | null;
  productRef: RefObject<ISelectButtonHandle<ISelectOption<Product>> | null>;
  productOptions: ISelectOption<Product>[];
  settlementRef: RefObject<ISelectButtonHandle<ISelectOption<Settlement>> | null>;
  settlementOptions: ISelectOption<Settlement>[];
  allLevelsSelected: boolean;
  selectLevel: (index: number, option: ISelectOption<string>) => void;
  selectProduct: (option: ISelectOption<Product>) => void;
  selectSettlement: (option: ISelectOption<Settlement>) => void;
  reset: () => void;
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  result: IPriceResult | null;
  allSelected: boolean;
}

export interface ISearchFormProps {
  products: Product[];
  settlements: Settlement[];
  cascade: ICascadeLevel[];
  productLabel?: string;
  getProductLabel?: (product: Product) => string;
  initialSelection?: IInitialSelection;
  children?: ReactNode;
}
