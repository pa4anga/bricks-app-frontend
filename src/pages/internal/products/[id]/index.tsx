import type { NextPage } from 'next';

import { ProductView } from '@/components';
import { INTERNAL_LOGIN_ROUTE, INTERNAL_PRODUCT_VIEW_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const id = typeof context.params?.id === 'string' ? context.params.id : '';
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_PRODUCT_VIEW_ROUTE(id))}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

const ViewProductPage: NextPage = () => <ProductView />;

export default ViewProductPage;
