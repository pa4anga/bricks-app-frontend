import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { InferGetServerSidePropsType, NextPage } from 'next';
import Link from 'next/link';

import { useGetAccounts } from '@/api/endpoints/accounts/accounts';
import type { UsernameResponse } from '@/api/model';
import { AccountsTable, PageTemplate } from '@/components';
import { INTERNAL_ACCOUNT_CREATE_ROUTE, INTERNAL_ACCOUNTS_ROUTE, INTERNAL_LOGIN_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<{ username: string }>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_ACCOUNTS_ROUTE)}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  const { username } = (await response.json()) as UsernameResponse;

  return { props: { username } };
});

const AccountsPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ username }) => {
  const { data: accounts, error, isLoading, mutate } = useGetAccounts();

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане" />
        </Stack>
      );
    }

    if (error || !accounts) {
      return <Alert severity="error">Неуспешно зареждане на акаунтите.</Alert>;
    }

    if (accounts.length === 0) {
      return <Alert severity="info">Няма акаунти.</Alert>;
    }

    return (
      <AccountsTable
        accounts={accounts}
        currentUsername={username}
        onDeleted={() => {
          void mutate();
        }}
      />
    );
  };

  return (
    <PageTemplate title="Акаунти" heading="Акаунти" internal>
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" component={Link} href={INTERNAL_ACCOUNT_CREATE_ROUTE}>
            Създай акаунт
          </Button>
        </Stack>
        {renderContent()}
      </Stack>
    </PageTemplate>
  );
};

export default AccountsPage;
