import type { NextPage } from 'next';

import { ProductsListView } from '@/components';
import { PAVEMENT_PRODUCT_KIND } from '@/constants/productKinds';
import { INTERNAL_PRODUCT_LIST_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_PRODUCT_LIST_ROUTE(PAVEMENT_PRODUCT_KIND.slug));

const PavementProductsPage: NextPage = () => <ProductsListView productKind={PAVEMENT_PRODUCT_KIND} />;

export default PavementProductsPage;
