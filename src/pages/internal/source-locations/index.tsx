import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import Link from 'next/link';

import { useGetSourceLocations } from '@/api/endpoints/source-locations/source-locations';
import { PageTemplate, SourceLocationsTable } from '@/components';
import { INTERNAL_SOURCE_LOCATION_CREATE_ROUTE, INTERNAL_SOURCE_LOCATIONS_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_SOURCE_LOCATIONS_ROUTE);

const SourceLocationsPage: NextPage = () => {
  const { data: sourceLocations, error, isLoading, mutate } = useGetSourceLocations();

  const renderContent = () => {
    if (isLoading) {
      return (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress aria-label="Зареждане" />
        </Stack>
      );
    }

    if (error || !sourceLocations) {
      return <Alert severity="error">Неуспешно зареждане на производствените бази.</Alert>;
    }

    if (sourceLocations.length === 0) {
      return <Alert severity="info">Няма производствени бази.</Alert>;
    }

    return (
      <SourceLocationsTable
        sourceLocations={sourceLocations}
        onDeleted={() => {
          void mutate();
        }}
      />
    );
  };

  return (
    <PageTemplate title="Производствени бази" heading="Производствени бази" internal>
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" component={Link} href={INTERNAL_SOURCE_LOCATION_CREATE_ROUTE}>
            Създай производствена база
          </Button>
        </Stack>
        {renderContent()}
      </Stack>
    </PageTemplate>
  );
};

export default SourceLocationsPage;
