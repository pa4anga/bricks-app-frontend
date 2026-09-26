import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { useGetProductsSearch } from '@/api/endpoints/products/products';
import { useGetSettlements } from '@/api/endpoints/settlements/settlements';
import type { Product } from '@/api/model';
import { PageTemplate, SearchForm, SearchResults } from '@/components';
import type { ICascadeLevel } from '@/components/form/SearchForm';

const CASCADE: ICascadeLevel[] = [
  { field: 'subtype', label: 'Изберете Категория' },
  { field: 'system', label: 'Изберете Система' },
];

const getColorLabel = (product: Product) => product.variant ?? '';

const PavementPricesPage: NextPage = () => {
  const router = useRouter();
  const initialSelection = useMemo(
    () =>
      typeof router.query.product === 'string' && typeof router.query.settlement === 'string'
        ? { productId: router.query.product, settlement: router.query.settlement }
        : undefined,
    [router.query.product, router.query.settlement]
  );

  const {
    data: products,
    error: productsError,
    isLoading: productsLoading,
  } = useGetProductsSearch({
    kind: 'Настилки',
  });
  const { data: settlements, error: settlementsError, isLoading: settlementsLoading } = useGetSettlements();

  const isLoading = productsLoading || settlementsLoading;
  const hasError = Boolean(productsError || settlementsError);

  return (
    <PageTemplate title="Настилки и аксесоари" heading="Настилки и аксесоари">
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане на цените" />
        </Stack>
      ) : hasError || !products || !settlements ? (
        <Alert severity="error">Възникна грешка при зареждането на данните.</Alert>
      ) : (
        <SearchForm
          products={products}
          settlements={settlements}
          cascade={CASCADE}
          productLabel="Изберете Цвят"
          getProductLabel={getColorLabel}
          initialSelection={initialSelection}
        >
          <SearchResults />
        </SearchForm>
      )}
    </PageTemplate>
  );
};

export default PavementPricesPage;
