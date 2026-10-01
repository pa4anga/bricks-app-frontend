import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import Link from 'next/link';

import { useGetFeeCategories } from '@/api/endpoints/fee-categories/fee-categories';
import { FeeCategoriesTable, PageTemplate } from '@/components';
import { INTERNAL_FEE_CATEGORIES_ROUTE, INTERNAL_FEE_CATEGORY_CREATE_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_FEE_CATEGORIES_ROUTE);

const FeeCategoriesPage: NextPage = () => {
  const { data: feeCategories, error, isLoading, mutate } = useGetFeeCategories();

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане" />
        </Stack>
      );
    }

    if (error || !feeCategories) {
      return <Alert severity="error">Неуспешно зареждане на категориите надценка.</Alert>;
    }

    if (feeCategories.length === 0) {
      return <Alert severity="info">Няма категории надценка.</Alert>;
    }

    return (
      <FeeCategoriesTable
        feeCategories={feeCategories}
        onDeleted={() => {
          void mutate();
        }}
      />
    );
  };

  return (
    <PageTemplate title="Категории надценка" heading="Категории надценка" internal>
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" component={Link} href={INTERNAL_FEE_CATEGORY_CREATE_ROUTE}>
            Създай категория
          </Button>
        </Stack>
        {renderContent()}
      </Stack>
    </PageTemplate>
  );
};

export default FeeCategoriesPage;
