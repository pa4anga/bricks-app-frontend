import type { NextPage } from 'next';

import { ProductView } from '@/components';
import { INTERNAL_PRODUCT_VIEW_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(context =>
  INTERNAL_PRODUCT_VIEW_ROUTE(typeof context.params?.id === 'string' ? context.params.id : '')
);

const ViewProductPage: NextPage = () => <ProductView />;

export default ViewProductPage;
