import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import useSWRMutation from 'swr/mutation';

import { trackSearch } from '@/analytics';
import { getProductsIdPrice } from '@/api/endpoints/products/products';
import type { Product, Settlement } from '@/api/model';
import type { ISelectButtonHandle } from '@/components/common';

import type {
  ICascadeLevel,
  IInitialSelection,
  IPriceRequest,
  ISearchFormState,
  ISelectOption,
  ProductCascadeField,
} from './types';

type CascadeFilters = Partial<Record<ProductCascadeField, string>>;

const matchesFilters = (product: Product, filters: CascadeFilters): boolean =>
  (Object.keys(filters) as ProductCascadeField[]).every(field => product[field] === filters[field]);

const buildFilters = (
  cascade: ICascadeLevel[],
  selections: (ISelectOption<string> | null)[],
  upTo: number
): CascadeFilters => {
  const filters: CascadeFilters = {};

  for (let index = 0; index < upTo; index += 1) {
    const selection = selections[index];
    if (selection) {
      filters[cascade[index].field] = selection.value;
    }
  }

  return filters;
};

const buildLevelOptions = (
  products: Product[],
  field: ProductCascadeField,
  filters: CascadeFilters
): ISelectOption<string>[] => {
  const values = Array.from(
    new Set(
      products.flatMap(product => {
        if (!matchesFilters(product, filters)) {
          return [];
        }
        const value = product[field];
        return value ? [value] : [];
      })
    )
  ).sort((a, b) => a.localeCompare(b));

  return values.map(value => ({ name: value, value }));
};

const defaultProductLabel = (product: Product): string => product.name ?? '';

const buildProductOptions = (
  products: Product[],
  filters: CascadeFilters,
  getProductLabel: (product: Product) => string
): ISelectOption<Product>[] =>
  products.flatMap(product => {
    if (!matchesFilters(product, filters)) {
      return [];
    }
    const label = getProductLabel(product);
    return label ? [{ name: label, value: product }] : [];
  });

const isDeliverableTo = (settlement: Settlement, product: Product): boolean =>
  Boolean(
    settlement.distances?.some(distance => distance.source === product.sourceLocation && distance.distanceKm !== -1)
  );

const buildSettlementOptions = (settlements: Settlement[], product: Product): ISelectOption<Settlement>[] =>
  settlements.flatMap(settlement =>
    settlement.name && isDeliverableTo(settlement, product) ? [{ name: settlement.name, value: settlement }] : []
  );

export const useSearchForm = (
  products: Product[],
  settlements: Settlement[],
  cascade: ICascadeLevel[],
  getProductLabel: (product: Product) => string = defaultProductLabel,
  initialSelection?: IInitialSelection
): ISearchFormState => {
  const [selections, setSelections] = useState<(ISelectOption<string> | null)[]>(() => cascade.map(() => null));
  const [product, setProduct] = useState<ISelectOption<Product> | null>(null);
  const [settlement, setSettlement] = useState<ISelectOption<Settlement> | null>(null);

  const levelRefs = useRef<(ISelectButtonHandle<ISelectOption<string>> | null)[]>([]);
  const productRef = useRef<ISelectButtonHandle<ISelectOption<Product>>>(null);
  const settlementRef = useRef<ISelectButtonHandle<ISelectOption<Settlement>>>(null);

  const price = useSWRMutation('/products/price', (_key: string, { arg }: { arg: IPriceRequest }) =>
    getProductsIdPrice(arg.id, { settlement: arg.settlement }).then(pricing => ({
      pricing,
      product: arg.product,
      settlementName: arg.settlement,
    }))
  );

  const levelOptions = useMemo<ISelectOption<string>[][]>(
    () =>
      cascade.map((level, index) => {
        if (index > 0 && !selections[index - 1]) {
          return [];
        }
        return buildLevelOptions(products, level.field, buildFilters(cascade, selections, index));
      }),
    [products, cascade, selections]
  );

  const allLevelsSelected = cascade.length > 0 && selections.every(Boolean);

  const productOptions = useMemo<ISelectOption<Product>[]>(
    () =>
      allLevelsSelected
        ? buildProductOptions(products, buildFilters(cascade, selections, cascade.length), getProductLabel)
        : [],
    [products, cascade, selections, allLevelsSelected, getProductLabel]
  );

  const settlementOptions = useMemo<ISelectOption<Settlement>[]>(
    () => (product ? buildSettlementOptions(settlements, product.value) : []),
    [settlements, product]
  );

  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current || !initialSelection) {
      return;
    }

    const target = products.find(item => item._id === initialSelection.productId);
    if (!target) {
      return;
    }

    const nextSelections = cascade.map(level => {
      const value = target[level.field];
      return value ? { name: value, value } : null;
    });
    if (nextSelections.some(selection => selection === null)) {
      return;
    }

    const settlementMatch = settlements.find(item => item.name === initialSelection.settlement);
    if (!settlementMatch?.name) {
      return;
    }

    hydratedRef.current = true;

    const productOption: ISelectOption<Product> = { name: getProductLabel(target), value: target };
    const settlementOption: ISelectOption<Settlement> = { name: settlementMatch.name, value: settlementMatch };

    setSelections(nextSelections);
    setProduct(productOption);
    setSettlement(settlementOption);

    nextSelections.forEach((selection, index) => {
      if (selection) {
        levelRefs.current[index]?.showSelection(selection);
      }
    });
    productRef.current?.showSelection(productOption);
    settlementRef.current?.showSelection(settlementOption);

    void price.trigger(
      { id: target._id ?? '', settlement: settlementOption.name, product: productOption },
      { throwOnError: false }
    );
  }, [initialSelection, products, settlements, cascade, getProductLabel, price]);

  const selectLevel = (index: number, option: ISelectOption<string>) => {
    setSelections(prev => {
      const next = [...prev];
      next[index] = option;
      for (let i = index + 1; i < next.length; i += 1) {
        next[i] = null;
      }
      return next;
    });
    setProduct(null);
    for (let i = index + 1; i < cascade.length; i += 1) {
      levelRefs.current[i]?.reset();
    }
    productRef.current?.reset();
  };

  const selectProduct = (option: ISelectOption<Product>) => {
    setProduct(option);
  };

  const selectSettlement = (option: ISelectOption<Settlement>) => {
    setSettlement(option);
  };

  const reset = () => {
    setSelections(cascade.map(() => null));
    setProduct(null);
    setSettlement(null);
    levelRefs.current.forEach(ref => ref?.reset());
    productRef.current?.reset();
    settlementRef.current?.reset();
    price.reset();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!product?.value._id || !settlement) {
      return;
    }

    trackSearch(product.name, {
      settlement: settlement.name,
      filters: selections
        .map(selection => selection?.name)
        .filter((name): name is string => Boolean(name))
        .join(' / '),
    });

    await price.trigger({ id: product.value._id, settlement: settlement.name, product }, { throwOnError: false });
  };

  return {
    selections,
    levelOptions,
    levelRefs,
    product,
    productRef,
    productOptions,
    settlementRef,
    settlementOptions,
    allLevelsSelected,
    selectLevel,
    selectProduct,
    selectSettlement,
    reset,
    submit,
    result: price.data ?? null,
    allSelected: allLevelsSelected && Boolean(product && settlement),
  };
};
