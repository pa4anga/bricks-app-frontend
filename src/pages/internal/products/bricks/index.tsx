import type { NextPage } from 'next';

import { ProductsListView } from '@/components';
import { BRICK_PRODUCT_KIND } from '@/constants/productKinds';
import { INTERNAL_PRODUCT_LIST_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_PRODUCT_LIST_ROUTE(BRICK_PRODUCT_KIND.slug));

const BrickProductsPage: NextPage = () => <ProductsListView productKind={BRICK_PRODUCT_KIND} />;

export default BrickProductsPage;
