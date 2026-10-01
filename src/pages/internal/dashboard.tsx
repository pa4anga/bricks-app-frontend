import type { InferGetServerSidePropsType, NextPage } from 'next';

import { useGetFeeCategories } from '@/api/endpoints/fee-categories/fee-categories';
import { useGetLocationsCount } from '@/api/endpoints/locations/locations';
import { useGetProductsCount } from '@/api/endpoints/products/products';
import { useGetSettlementsCount } from '@/api/endpoints/settlements/settlements';
import { PageTemplate, StatCard } from '@/components';
import { BRICK_PRODUCT_KIND, PAVEMENT_PRODUCT_KIND, ROOF_PRODUCT_KIND } from '@/constants/productKinds';
import { INTERNAL_DASHBOARD_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

import styles from './dashboard.module.scss';

export const getServerSideProps = withAuth(INTERNAL_DASHBOARD_ROUTE, (_context, { username }) => ({
  props: { username },
}));

const DashboardPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ username }) => {
  const products = useGetProductsCount();
  const bricks = useGetProductsCount({ kind: BRICK_PRODUCT_KIND.kind });
  const roofs = useGetProductsCount({ kind: ROOF_PRODUCT_KIND.kind });
  const pavements = useGetProductsCount({ kind: PAVEMENT_PRODUCT_KIND.kind });
  const locations = useGetLocationsCount();
  const settlements = useGetSettlementsCount();
  const feeCategories = useGetFeeCategories();

  const stats = [
    {
      key: 'products',
      label: 'Продукти',
      value: products.data?.total,
      isLoading: products.isLoading,
      isError: Boolean(products.error),
    },
    {
      key: 'locations',
      label: 'Локации',
      value: locations.data?.total,
      isLoading: locations.isLoading,
      isError: Boolean(locations.error),
    },
    {
      key: 'fee-categories',
      label: 'Категории надценка',
      value: feeCategories.data?.length,
      isLoading: feeCategories.isLoading,
      isError: Boolean(feeCategories.error),
    },
    {
      key: 'settlements',
      label: 'Населени места',
      value: settlements.data?.total,
      isLoading: settlements.isLoading,
      isError: Boolean(settlements.error),
    },
    {
      key: 'bricks',
      label: BRICK_PRODUCT_KIND.label,
      value: bricks.data?.total,
      isLoading: bricks.isLoading,
      isError: Boolean(bricks.error),
    },
    {
      key: 'roofs',
      label: ROOF_PRODUCT_KIND.label,
      value: roofs.data?.total,
      isLoading: roofs.isLoading,
      isError: Boolean(roofs.error),
    },
    {
      key: 'pavements',
      label: PAVEMENT_PRODUCT_KIND.label,
      value: pavements.data?.total,
      isLoading: pavements.isLoading,
      isError: Boolean(pavements.error),
    },
  ];

  return (
    <PageTemplate title={`Welcome ${username}`} heading={`Welcome ${username}`} internal>
      <div className={styles.grid}>
        {stats.map(stat => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            isLoading={stat.isLoading}
            isError={stat.isError}
          />
        ))}
      </div>
    </PageTemplate>
  );
};

export default DashboardPage;
