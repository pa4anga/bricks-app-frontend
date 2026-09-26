import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import Link from 'next/link';

import { useGetFeeCategories } from '@/api/endpoints/fee-categories/fee-categories';
import { FeeCategoriesTable, PageTemplate } from '@/components';
import {
  INTERNAL_FEE_CATEGORIES_ROUTE,
  INTERNAL_FEE_CATEGORY_CREATE_ROUTE,
  INTERNAL_LOGIN_ROUTE,
} from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_FEE_CATEGORIES_ROUTE)}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

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
