import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useGetSettlements, useGetSettlementsCount } from '@/api/endpoints/settlements/settlements';
import { PageTemplate, SettlementsTable } from '@/components';
import { INTERNAL_LOGIN_ROUTE, INTERNAL_SETTLEMENT_CREATE_ROUTE, INTERNAL_SETTLEMENTS_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_SETTLEMENTS_ROUTE)}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

const PAGE_SIZE = 30;

const SettlementsPage: NextPage = () => {
  const [page, setPage] = useState(1);
  const {
    data: settlements,
    error,
    isLoading,
    mutate,
  } = useGetSettlements({ page, pageSize: PAGE_SIZE }, { swr: { keepPreviousData: true } });
  const { data: count, mutate: mutateCount } = useGetSettlementsCount();

  const total = count?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане" />
        </Stack>
      );
    }

    if (error || !settlements) {
      return <Alert severity="error">Неуспешно зареждане на населените места.</Alert>;
    }

    if (settlements.length === 0) {
      return <Alert severity="info">Няма населени места.</Alert>;
    }

    return (
      <SettlementsTable
        settlements={settlements}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        onDeleted={() => {
          void mutate();
          void mutateCount();
        }}
      />
    );
  };

  return (
    <PageTemplate title="Населени места" heading="Населени места" internal>
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" component={Link} href={INTERNAL_SETTLEMENT_CREATE_ROUTE}>
            Създай населено място
          </Button>
        </Stack>
        {renderContent()}
      </Stack>
    </PageTemplate>
  );
};

export default SettlementsPage;
