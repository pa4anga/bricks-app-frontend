import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import { useGetLocationsId, usePatchLocationsId } from '@/api/endpoints/locations/locations';
import { LocationForm, PageTemplate } from '@/components';
import { INTERNAL_LOCATION_EDIT_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(context =>
  INTERNAL_LOCATION_EDIT_ROUTE(typeof context.params?.id === 'string' ? context.params.id : '')
);

interface IEditLocationContentProps {
  id: string;
}

const EditLocationContent = ({ id }: IEditLocationContentProps) => {
  const { data: location, error, isLoading } = useGetLocationsId(id);
  const { trigger, isMutating } = usePatchLocationsId(id);

  if (!id || isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress aria-label="Зареждане" />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">Неуспешно зареждане на локацията.</Alert>;
  }

  if (!location) {
    return <Alert severity="warning">Локацията не е намерена.</Alert>;
  }

  const coordinates = location.coordinates?.coordinates;

  return (
    <LocationForm
      nameDisabled
      submitLabel="Промени локация"
      submitErrorMessage="Неуспешно обновяване на локация. Опитайте отново."
      submitting={isMutating}
      submit={input => trigger(input)}
      initialValues={{
        name: location.name ?? '',
        latitude: coordinates?.[1] !== undefined ? String(coordinates[1]) : '',
        longitude: coordinates?.[0] !== undefined ? String(coordinates[0]) : '',
        postcode: location.postcode !== undefined ? String(location.postcode) : '',
        municipality: location.municipality ?? '',
        sapRegion: location.sapRegion ?? '',
        salesWbRegion: location.salesWbRegion ?? '',
        prices: (location.prices ?? []).map(price => ({ source: price.source, price: String(price.price) })),
      }}
    />
  );
};

const EditLocationPage: NextPage = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';

  return (
    <PageTemplate title="Промяна на локация" heading="Промяна на локация" internal>
      <EditLocationContent id={id} />
    </PageTemplate>
  );
};

export default EditLocationPage;
