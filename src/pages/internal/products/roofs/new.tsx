import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import { useGetProductsId, usePostProducts } from '@/api/endpoints/products/products';
import { PageTemplate, ProductForm, productToFormValues } from '@/components';
import { ROOF_PRODUCT_KIND } from '@/constants/productKinds';
import { INTERNAL_PRODUCT_CREATE_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_PRODUCT_CREATE_ROUTE(ROOF_PRODUCT_KIND.slug));

const CreateRoofProductContent = () => {
  const router = useRouter();
  const from = typeof router.query.from === 'string' ? router.query.from : '';
  const { trigger, isMutating } = usePostProducts();
  const { data: source, error, isLoading } = useGetProductsId(from);

  if (from && (!router.isReady || isLoading)) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress aria-label="Зареждане на продукта" />
      </Stack>
    );
  }

  if (from && error) {
    return <Alert severity="error">Неуспешно зареждане на продукта.</Alert>;
  }

  if (from && !source) {
    return <Alert severity="warning">Продуктът не е намерен.</Alert>;
  }

  return (
    <ProductForm
      productKind={ROOF_PRODUCT_KIND}
      submitLabel="Създай продукт"
      submitErrorMessage="Неуспешно създаване на продукт. Опитайте отново."
      submitting={isMutating}
      submit={input => trigger(input)}
      initialValues={source ? productToFormValues(source) : undefined}
    />
  );
};

const CreateRoofProductPage: NextPage = () => (
  <PageTemplate title="Създаване на продукт" heading="Създаване на продукт" internal>
    <CreateRoofProductContent />
  </PageTemplate>
);

export default CreateRoofProductPage;
