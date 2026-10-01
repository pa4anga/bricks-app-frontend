import type { NextPage } from 'next';

import { usePostLocations } from '@/api/endpoints/locations/locations';
import { LocationForm, PageTemplate } from '@/components';
import { INTERNAL_LOCATION_CREATE_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(INTERNAL_LOCATION_CREATE_ROUTE);

const CreateLocationPage: NextPage = () => {
  const { trigger, isMutating } = usePostLocations();

  return (
    <PageTemplate title="Създаване на локация" heading="Създаване на локация" internal>
      <LocationForm
        submitLabel="Създай локация"
        submitErrorMessage="Неуспешно създаване на локация. Опитайте отново."
        submitting={isMutating}
        submit={input => trigger(input)}
      />
    </PageTemplate>
  );
};

export default CreateLocationPage;
