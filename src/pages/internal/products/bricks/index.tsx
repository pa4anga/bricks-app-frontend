import type { NextPage } from 'next';

import { ProductsListView } from '@/components';
import { BRICK_PRODUCT_KIND } from '@/constants/productKinds';
import { INTERNAL_LOGIN_ROUTE, INTERNAL_PRODUCT_LIST_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_PRODUCT_LIST_ROUTE(BRICK_PRODUCT_KIND.slug))}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

const BrickProductsPage: NextPage = () => <ProductsListView productKind={BRICK_PRODUCT_KIND} />;

export default BrickProductsPage;
