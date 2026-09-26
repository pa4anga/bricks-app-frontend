import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { useGetProductsSearch } from '@/api/endpoints/products/products';
import { useGetSettlements } from '@/api/endpoints/settlements/settlements';
import { InlineSearchForm, PageTemplate, SearchResults } from '@/components';
import type { ICascadeLevel } from '@/components/form/SearchForm';

const CASCADE: ICascadeLevel[] = [{ field: 'subtype', label: 'Изберете Категория' }];

const BricksPricesPage: NextPage = () => {
  const router = useRouter();
  const initialSelection = useMemo(
    () =>
      typeof router.query.product === 'string' && typeof router.query.settlement === 'string'
        ? { productId: router.query.product, settlement: router.query.settlement }
        : undefined,
    [router.query.product, router.query.settlement]
  );

  const { data: products, error: productsError, isLoading: productsLoading } = useGetProductsSearch({ kind: 'Тухли' });
  const { data: settlements, error: settlementsError, isLoading: settlementsLoading } = useGetSettlements();

  const isLoading = productsLoading || settlementsLoading;
  const hasError = Boolean(productsError || settlementsError);

  return (
    <PageTemplate title="Брутни регионални цени" heading="Брутни регионални цени">
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане на цените" />
        </Stack>
      ) : hasError || !products || !settlements ? (
        <Alert severity="error">Възникна грешка при зареждането на данните.</Alert>
      ) : (
        <InlineSearchForm
          products={products}
          settlements={settlements}
          cascade={CASCADE}
          initialSelection={initialSelection}
        >
          <SearchResults />
        </InlineSearchForm>
      )}
    </PageTemplate>
  );
};

export default BricksPricesPage;
