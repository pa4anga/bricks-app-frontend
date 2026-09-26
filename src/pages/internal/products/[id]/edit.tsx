import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import { useGetProductsId, usePatchProductsId } from '@/api/endpoints/products/products';
import { PageTemplate, ProductForm, productToFormValues } from '@/components';
import { getProductKindByKind } from '@/constants/productKinds';
import { INTERNAL_LOGIN_ROUTE, INTERNAL_PRODUCT_EDIT_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const id = typeof context.params?.id === 'string' ? context.params.id : '';
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_PRODUCT_EDIT_ROUTE(id))}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

interface IEditProductContentProps {
  id: string;
}

const EditProductContent = ({ id }: IEditProductContentProps) => {
  const { data: product, error, isLoading } = useGetProductsId(id);
  const { trigger, isMutating } = usePatchProductsId(id);

  if (!id || isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress aria-label="Зареждане на продукта" />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">Неуспешно зареждане на продукта.</Alert>;
  }

  if (!product) {
    return <Alert severity="warning">Продуктът не е намерен.</Alert>;
  }

  const productKind = getProductKindByKind(product.kind);

  if (!productKind) {
    return <Alert severity="error">Неуспешно зареждане на продукта.</Alert>;
  }

  return (
    <ProductForm
      productKind={productKind}
      submitLabel="Запази промените"
      submitErrorMessage="Неуспешно обновяване на продукт. Опитайте отново."
      submitting={isMutating}
      submit={input => trigger(input)}
      initialValues={productToFormValues(product)}
      existingImageId={product.imageId}
    />
  );
};

const EditProductPage: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';

  return (
    <PageTemplate title="Промяна на продукт" heading="Промяна на продукт" internal>
      <EditProductContent id={id} />
    </PageTemplate>
  );
};

export default EditProductPage;
