import Box from '@mui/material/Box';

import { SubmitResetButton } from '@/components/form/SubmitResetButton';

import { SearchFields } from './SearchFields';
import { SearchFormContext } from './searchFormContext';
import type { ISearchFormProps } from './types';
import { useSearchForm } from './useSearchForm';

export const SearchForm = ({
  products,
  settlements,
  cascade,
  productLabel = 'Изберете Продукт',
  getProductLabel,
  initialSelection,
  children,
}: ISearchFormProps) => {
  const search = useSearchForm(products, settlements, cascade, getProductLabel, initialSelection);

  return (
    <SearchFormContext.Provider value={search}>
      <Box component="form" onSubmit={search.submit} noValidate sx={{ mt: 5 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            justifyContent: 'center',
            alignItems: 'start',
            gridTemplateColumns: 'minmax(0, 1fr)',
            '@media (min-width: 1024px)': {
              gridTemplateColumns: 'auto auto',
            },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'minmax(0, 1fr)',
              '@media (min-width: 600px)': {
                gridTemplateColumns: 'repeat(2, auto)',
              },
            }}
          >
            <SearchFields search={search} cascade={cascade} productLabel={productLabel} />
          </Box>
          <Box sx={{ '@media (min-width: 1024px)': { width: 220 } }}>
            <SubmitResetButton
              onReset={search.reset}
              resetAriaLabel="Изчистване на филтрите"
              disabled={!search.allSelected}
            >
              Търсене
            </SubmitResetButton>
          </Box>
        </Box>
      </Box>
      {children}
    </SearchFormContext.Provider>
  );
};
