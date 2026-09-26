import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useGetProductsCount, useGetProductsSearch } from '@/api/endpoints/products/products';
import { PageTemplate } from '@/components/layout/PageTemplate';
import type { IProductKind } from '@/constants/productKinds';
import { INTERNAL_PRODUCT_CREATE_ROUTE } from '@/constants/routes';

import { ProductsTable } from './ProductsTable';

const PAGE_SIZE = 30;

interface IProductsListViewProps {
  productKind: IProductKind;
}

export const ProductsListView = ({ productKind }: IProductsListViewProps) => {
  const [page, setPage] = useState(1);
  const {
    data: products,
    error,
    isLoading,
    mutate,
  } = useGetProductsSearch({ kind: productKind.kind, page, pageSize: PAGE_SIZE }, { swr: { keepPreviousData: true } });
  const { data: count, mutate: mutateCount } = useGetProductsCount({ kind: productKind.kind });

  const total = count?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане" />
        </Stack>
      );
    }

    if (error || !products) {
      return <Alert severity="error">Неуспешно зареждане на продуктите.</Alert>;
    }

    if (products.length === 0) {
      return <Alert severity="info">Няма продукти.</Alert>;
    }

    return (
      <ProductsTable
        products={products}
        productKind={productKind}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        onDeleted={() => {
          void mutate();
          void mutateCount();
        }}
      />
    );
  };

  return (
    <PageTemplate title={productKind.label} heading={productKind.label} internal>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="flex-end">
          <Button component={Link} href={INTERNAL_PRODUCT_CREATE_ROUTE(productKind.slug)} variant="contained">
            Създай продукт
          </Button>
        </Stack>
        {renderContent()}
      </Stack>
    </PageTemplate>
  );
};
