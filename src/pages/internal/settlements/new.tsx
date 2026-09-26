import type { NextPage } from 'next';

import { usePostSettlements } from '@/api/endpoints/settlements/settlements';
import { PageTemplate, SettlementForm } from '@/components';
import { INTERNAL_LOGIN_ROUTE, INTERNAL_SETTLEMENT_CREATE_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_SETTLEMENT_CREATE_ROUTE)}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

const CreateSettlementPage: NextPage = () => {
  const { trigger, isMutating } = usePostSettlements();

  return (
    <PageTemplate title="Създаване на населено място" heading="Създаване на населено място" internal>
      <SettlementForm
        submitLabel="Създай населено място"
        submitErrorMessage="Неуспешно създаване на населено място. Опитайте отново."
        submitting={isMutating}
        submit={input => trigger(input)}
      />
    </PageTemplate>
  );
};

export default CreateSettlementPage;
