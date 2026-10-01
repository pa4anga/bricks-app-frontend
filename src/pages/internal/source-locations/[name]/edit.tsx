import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import {
  useGetSourceLocationsName,
  usePatchSourceLocationsName,
} from '@/api/endpoints/source-locations/source-locations';
import type { SourceLocation } from '@/api/model';
import { PageTemplate } from '@/components';
import { Button, FormSection, ValidatedTextField } from '@/components/form';
import { INTERNAL_SOURCE_LOCATION_EDIT_ROUTE, INTERNAL_SOURCE_LOCATIONS_ROUTE } from '@/constants/routes';
import { withAuth } from '@/helpers/getServerSideProps/withAuth';

export const getServerSideProps = withAuth(context =>
  INTERNAL_SOURCE_LOCATION_EDIT_ROUTE(typeof context.params?.name === 'string' ? context.params.name : '')
);

const CAPACITY_REQUIREMENTS = 'Капацитетът трябва да е цяло число, поне 1.';

const schema = z.object({
  truckCapacityKg: z
    .string()
    .min(1, 'Въведете капацитет')
    .regex(/^\d+$/, CAPACITY_REQUIREMENTS)
    .refine(value => Number(value) >= 1, CAPACITY_REQUIREMENTS),
});

type FormValues = z.infer<typeof schema>;
type FieldName = keyof FormValues;

interface IEditSourceLocationFormProps {
  sourceLocation: SourceLocation;
}

const EditSourceLocationForm = ({ sourceLocation }: IEditSourceLocationFormProps) => {
  const router = useRouter();
  const name = sourceLocation.name ?? '';
  const { trigger, isMutating } = usePatchSourceLocationsName(name);
  const [values, setValues] = useState<FormValues>({
    truckCapacityKg: sourceLocation.truckCapacityKg !== undefined ? String(sourceLocation.truckCapacityKg) : '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const handleChange = (field: FieldName) => (value: string) => {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(undefined);

    const result = schema.safeParse(values);

    if (!result.success) {
      const nextErrors: Partial<Record<FieldName, string>> = {};

      for (const issue of result.error.issues) {
        const key = issue.path[0];

        if (typeof key === 'string' && !(key in nextErrors)) {
          nextErrors[key as FieldName] = issue.message;
        }
      }

      setErrors(nextErrors);

      return;
    }

    setErrors({});

    try {
      await trigger({ truckCapacityKg: Number(result.data.truckCapacityKg) });
      await router.push(INTERNAL_SOURCE_LOCATIONS_ROUTE);
    } catch {
      setSubmitError('Неуспешно обновяване на производствена база. Опитайте отново.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 520, mt: 4 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={4}>
          <FormSection title="Данни за базата">
            <ValidatedTextField id="name" name="name" label="Име" value={name} disabled fullWidth />
            <ValidatedTextField
              id="truckCapacityKg"
              name="truckCapacityKg"
              label="Капацитет на камион (кг)"
              type="number"
              value={values.truckCapacityKg}
              onValueChange={handleChange('truckCapacityKg')}
              error={errors.truckCapacityKg}
              hint={CAPACITY_REQUIREMENTS}
              fullWidth
            />
          </FormSection>
          <Box sx={{ maxWidth: { sm: 320 } }}>
            <Button type="submit" disabled={isMutating} fullWidth>
              Промени производствена база
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

interface IEditSourceLocationContentProps {
  name: string;
}

const EditSourceLocationContent = ({ name }: IEditSourceLocationContentProps) => {
  const { data: sourceLocation, error, isLoading } = useGetSourceLocationsName(name);

  if (!name || isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress aria-label="Зареждане" />
      </Stack>
    );
  }

  if (error || !sourceLocation) {
    return <Alert severity="error">Неуспешно зареждане на производствената база.</Alert>;
  }

  return <EditSourceLocationForm sourceLocation={sourceLocation} />;
};

const EditSourceLocationPage: NextPage = () => {
  const router = useRouter();
  const name = typeof router.query.name === 'string' ? router.query.name : '';

  return (
    <PageTemplate title="Промяна на производствена база" heading="Промяна на производствена база" internal>
      <EditSourceLocationContent name={name} />
    </PageTemplate>
  );
};

export default EditSourceLocationPage;
