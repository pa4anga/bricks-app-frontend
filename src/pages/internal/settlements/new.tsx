import type { NextPage } from 'next';

import { usePostSettlements } from '@/api/endpoints/settlements/settlements';
import { PageTemplate, SettlementForm } from '@/components';
import { INTERNAL_SETTLEMENT_CREATE_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_SETTLEMENT_CREATE_ROUTE);

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
