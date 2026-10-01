import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { InferGetServerSidePropsType, NextPage } from 'next';
import Link from 'next/link';

import { useGetAccounts } from '@/api/endpoints/accounts/accounts';
import { AccountsTable, PageTemplate } from '@/components';
import { INTERNAL_ACCOUNT_CREATE_ROUTE, INTERNAL_ACCOUNTS_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_ACCOUNTS_ROUTE, (_context, { username }) => ({
  props: { username },
}));

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
