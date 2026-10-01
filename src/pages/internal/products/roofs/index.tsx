import type { NextPage } from 'next';

import { ProductsListView } from '@/components';
import { ROOF_PRODUCT_KIND } from '@/constants/productKinds';
import { INTERNAL_PRODUCT_LIST_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_PRODUCT_LIST_ROUTE(ROOF_PRODUCT_KIND.slug));

const RoofProductsPage: NextPage = () => <ProductsListView productKind={ROOF_PRODUCT_KIND} />;

export default RoofProductsPage;
