import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import { useGetSettlementsName, usePatchSettlementsId } from '@/api/endpoints/settlements/settlements';
import { PageTemplate, SettlementForm } from '@/components';
import { INTERNAL_SETTLEMENT_EDIT_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(context =>
  INTERNAL_SETTLEMENT_EDIT_ROUTE(typeof context.params?.name === 'string' ? context.params.name : '')
);

interface IEditSettlementContentProps {
  name: string;
}

const EditSettlementContent = ({ name }: IEditSettlementContentProps) => {
  const { data, error, isLoading } = useGetSettlementsName(name);
  const settlement = data?.find(item => item.name === name);
  const { trigger, isMutating } = usePatchSettlementsId(settlement?._id ?? '');

  if (!name || isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress aria-label="Зареждане" />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">Неуспешно зареждане на населеното място.</Alert>;
  }

  if (!settlement) {
    return <Alert severity="warning">Населеното място не е намерено.</Alert>;
  }

  const coordinates = settlement.coordinates?.coordinates;

  return (
    <SettlementForm
      submitLabel="Промени населено място"
      submitErrorMessage="Неуспешно обновяване на населено място. Опитайте отново."
      submitting={isMutating}
      submit={input => trigger(input)}
      initialValues={{
        name: settlement.name ?? '',
        latitude: coordinates?.[1] !== undefined ? String(coordinates[1]) : '',
        longitude: coordinates?.[0] !== undefined ? String(coordinates[0]) : '',
      }}
    />
  );
};

const EditSettlementPage: NextPage = () => {
  const router = useRouter();
  const name = typeof router.query.name === 'string' ? router.query.name : '';

  return (
    <PageTemplate title="Промяна на населено място" heading="Промяна на населено място" internal>
      <EditSettlementContent name={name} />
    </PageTemplate>
  );
};

export default EditSettlementPage;
