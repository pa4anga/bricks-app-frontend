import type { NextPage } from 'next';

import { usePostLocations } from '@/api/endpoints/locations/locations';
import { LocationForm, PageTemplate } from '@/components';
import { INTERNAL_LOCATION_CREATE_ROUTE, INTERNAL_LOGIN_ROUTE } from '@/constants/routes';
import { withApi } from '@/helpers/getServerSideProps/withApi';

export const getServerSideProps = withApi<Record<string, never>>(async (context, { baseUrl }) => {
  const response = await fetch(`${baseUrl}/accounts/me`, {
    headers: { cookie: context.req.headers.cookie ?? '' },
  });

  if (response.status === 401) {
    return {
      redirect: {
        destination: `${INTERNAL_LOGIN_ROUTE}?redirect=${encodeURIComponent(INTERNAL_LOCATION_CREATE_ROUTE)}`,
        permanent: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to load account (${response.status})`);
  }

  return { props: {} };
});

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
