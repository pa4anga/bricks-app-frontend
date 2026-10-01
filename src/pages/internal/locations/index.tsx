import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useGetLocations, useGetLocationsCount } from '@/api/endpoints/locations/locations';
import { LocationsTable, PageTemplate } from '@/components';
import { INTERNAL_LOCATION_CREATE_ROUTE, INTERNAL_LOCATIONS_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_LOCATIONS_ROUTE);

const PAGE_SIZE = 30;

const LocationsPage: NextPage = () => {
  const [page, setPage] = useState(1);
  const {
    data: locations,
    error,
    isLoading,
    mutate,
  } = useGetLocations({ page, pageSize: PAGE_SIZE }, { swr: { keepPreviousData: true } });
  const { data: count, mutate: mutateCount } = useGetLocationsCount();

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

    if (error || !locations) {
      return <Alert severity="error">Неуспешно зареждане на локациите.</Alert>;
    }

    if (locations.length === 0) {
      return <Alert severity="info">Няма локации.</Alert>;
    }

    return (
      <LocationsTable
        locations={locations}
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
    <PageTemplate title="Локации" heading="Локации" internal>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="flex-end">
          <Button component={Link} href={INTERNAL_LOCATION_CREATE_ROUTE} variant="contained">
            Създай локация
          </Button>
        </Stack>
        {renderContent()}
      </Stack>
    </PageTemplate>
  );
};

export default LocationsPage;
