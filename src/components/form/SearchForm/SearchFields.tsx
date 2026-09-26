import type { Product, Settlement } from '@/api/model';
import { SearchableSelectButton } from '@/components/common/SearchableSelectButton';

import type { ICascadeLevel, ISearchFormState, ISelectOption } from './types';

const getOptionLabel = (option: ISelectOption<unknown>) => option.name;
const getLevelKey = (option: ISelectOption<string>) => option.value;
const getProductKey = (option: ISelectOption<Product>) => option.value._id ?? option.name;
const getSettlementKey = (option: ISelectOption<Settlement>) => option.value._id ?? option.name;

interface ISearchFieldsProps {
  search: ISearchFormState;
  cascade: ICascadeLevel[];
  productLabel: string;
}

export const SearchFields = ({ search, cascade, productLabel }: ISearchFieldsProps) => (
  <>
    {cascade.map((level, index) => (
      <SearchableSelectButton
        key={level.field}
        ref={node => {
          search.levelRefs.current[index] = node;
        }}
        items={search.levelOptions[index]}
        initialLabel={level.label}
        getLabel={getOptionLabel}
        getKey={getLevelKey}
        onSet={option => search.selectLevel(index, option)}
        disabled={index > 0 && !search.selections[index - 1]}
      />
    ))}
    <SearchableSelectButton
      ref={search.productRef}
      items={search.productOptions}
      initialLabel={productLabel}
      getLabel={getOptionLabel}
      getKey={getProductKey}
      onSet={search.selectProduct}
      disabled={!search.allLevelsSelected}
    />
    <SearchableSelectButton
      ref={search.settlementRef}
      items={search.settlementOptions}
      initialLabel="Изберете населено място"
      getLabel={getOptionLabel}
      minSearchLength={2}
      getKey={getSettlementKey}
      onSet={search.selectSettlement}
      disabled={!search.product}
    />
  </>
);
