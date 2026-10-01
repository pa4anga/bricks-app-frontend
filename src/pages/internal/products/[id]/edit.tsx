import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import { useGetProductsId, usePatchProductsId } from '@/api/endpoints/products/products';
import { PageTemplate, ProductForm, productToFormValues } from '@/components';
import { getProductKindByKind } from '@/constants/productKinds';
import { INTERNAL_PRODUCT_EDIT_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(context =>
  INTERNAL_PRODUCT_EDIT_ROUTE(typeof context.params?.id === 'string' ? context.params.id : '')
);

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
